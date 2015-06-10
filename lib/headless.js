var Q                   = require('q'),
    express             = require('express'),
    app                 = express(),
    path                = require('path'),
    cookieParser        = require('cookie-parser'),
    bodyParser          = require('body-parser'),
    logger              = require('morgan'),
    compression         = require('compression'),
    debug               = require('debug')('headless:headless'),
    helmet              = require('helmet'),
    cluster             = require('cluster'),
    https               = require('https'),
    keepAliveAgent      = new https.Agent({
      keepAlive: true
    }),
    webWorkers          = {},
    cache               = require('./cache'),
    api                 = require('./api'),
    processData         = require('./processData'),
    render              = require('./render'),
    helpers             = require('./helpers'),
    routeCache          = require('./routecache');

module.exports = function headlessdrupal(templateEngine, config) {
  var handleGet         = function (route, template, options) {
        /**
         * Handle GET responses in a generic way
         * @private
         * @param {(string|regexp)} route The route to match.
         * @param {string} template Template name that will be used to format the response
         * @param {object} options An object that configures the Controller instance
         * @return {object} res The response object
         */
        app.get(route, function (req, res, next) {
          var path = req.path;
          path += Object.keys(req.query).length !== 0 ? helpers.serialize(req.query) : '';
          debug('PATH: ' + path);
          debug('ROUTE TYPE: ' + options.type);
          Q(helpers.getConfig(options, config, req, template, templateEngine, keepAliveAgent))
            .then(cache.get)
            .then(api.get)
            .then(cache.set)
            .then(processData.prepare)
            .then(render.parse)
            .then(function (response) {
              return res
                      .set({
                        'Cache-Control': 'max-age=86400',
                        'Expires': new Date(Date.now() + 86400000).toUTCString()
                      })
                      .send(response);

            })
            .fail(function (options) {
              return next(options);
            });
        });
      },
      handleSection     = function (route, template, options) {
        /**
         * Handles routing a Section datatype
         * @alias routeSection
         * @param {(string|regexp)} route The route to match.
         * @param {string} template Template name that will be used to format the response
         * @param {object} options An object that configures the Controller instance
         * @return {object} res The response object
         */
        options         = options || {};
        options.type    = 'list';
        return handleGet(route, template, options);
      },
      handleItem        = function (route, template, options) {
        /**
         * Handles routing for a single item.
         * @alias routeItem
         * @param {(string|regexp)} route The route to match.
         * @param {string} template Template name that will be used to format the response.
         * @param {object} options An object that configures the Controller instance.
         */
        options         = options || {};
        options.type    = 'item';
        return handleGet(route, template, options);
      },
      handleMulti       = function (route, template, options) {
        /**
         * Handles routing for a multi-path request
         * @alias routeMulti
         * @param {(string|regexp)} route The route to match
         * @param {string} template Template name that will be used to format the response
         * @param {object} options An object that configures the Controller instance
         */
        options         = options || {};
        options.type    = 'multi';
        return handleGet(route, template, options);
      },
      handleStatic      = function (route, template, options) {
        /**
         * Handles routing a static datatype
         * @alias routeStatic
         * @param {(string|regexp)} route The route to match
         * @param {string} template Template name that will be used to format the response
         * @param {object} options An object that configures the Controller instance
         * @return {object} res The response object
         */
        options = options || {};
        return app.get(route, function (req, res, next) {
          debug('PATH: ' + req.path);
          render.parse({
              'config'    : config,
              'req'       : req,
              'resource'  : config.api + options.resource + '/',
              'template'  : template,
              'engine'    : templateEngine
            })
            .then(function (html) {
              return res.send(html);
            })
            .fail(function (options) {
              return next(options);
            });
        });
      },
      handleRouteCache    = function (route) {
        /**
         * Handler for clearing and writing to the route cache
         * @param  {(string|regexp)} route The route to match
         * @return {object} res The response object
         */
        return app
          .post(route, function (req, res, next) {
            if (!req.headers['x-request-secret'] ||  req.headers['x-request-secret'] !== config.routeCacheSecret ) {
              return next({'_status' : 403});
            }
            routeCache.debug(req)
              .then(routeCache.del)
              .then(function () {
                var keys = [];
                for (var key in req.body._keys) {
                  if (req.body._keys.hasOwnProperty(key)) {
                    keys.push(['set', key, req.body._keys[key]]);
                  }
                }
                req.db.multi(keys).exec(function () {
                  keys = [];
                  return res
                          .status(200)
                          .send({'_status' : 200});
                });
              })
              .fail(function (options) {
                return next(options);
              });
          })
          .delete(route, function (req, res, next) {
            if (!req.headers['x-request-secret'] ||  req.headers['x-request-secret'] !== config.routeCacheSecret ) {
              return next({'_status' : 403});
            }
            routeCache.debug(req)
              .then(routeCache.del)
              .then(function () {
                return res
                        .send(204);
              })
              .fail(function (options) {
                return next(options);
              });
          });
      },
      handleError       = function (error, req, res, next) {
        /**
         * Handle Errors
         * @param  {object} err Object containing information about the error
         * @param  {object} req Request oject
         * @param  {object} res Response object
         * @return {object} Returning the response to the client
         */
        /* jshint unused: false */
        error._status = error._status || 500;
        if (req.accepts('html')) {
          templateEngine.render('fourofour.dust', {}, function (err, html) {
            return res
                    .status(error._status)
                    .send(html);
          });
        }
        else {
          return res
                  .status(error._status)
                  .send(error);
        }
      },
      spawnWebWorker      = function () {
        var worker = cluster.fork({type: 'webWorker'});
        webWorkers[worker.process.pid] = worker;
        debug('Starting web worker with pid: %d.', worker.process.pid);
        return worker;
      },
      handleStart         = function () {
        /**
         * Start the server
         * @alias start
         */
        var workers   = process.env.WEB_CONCURRENCY || 1,
            port      = process.env.PORT || 3000,
            x;
        if (cluster.isMaster) {
          for (x = 0; x < workers; x++) {
            spawnWebWorker();
          }
          cluster.on('exit', function (worker, code) {
            if (code === 0) {
              return;
            }
            debug('Worker %d died. Spawning a new process', worker.process.pid);
            if (webWorkers[worker.process.pid]) {
              webWorkers[worker.process.pid] = null;
              delete webWorkers[worker.process.pid];
              spawnWebWorker();
            }
          });
        }
        else {
          return app.listen(port, function headlessdrupalListen() {
            debug('ENVIRONMENT: %s', config.environment);
            debug('SAUCIER is running on port %s.', port);
          });
        }
      },
      expressRedis      = require('express-redis')
                          (config.redis.port, config.redis.server, config.redis.options);

  // Attach handlers.
  app.start         = handleStart;
  app.routeStatic   = handleStatic;
  app.routeCache    = handleRouteCache;
  app.routeMulti    = handleMulti;
  app.routeSection  = handleSection;
  app.routeItem     = handleItem;
  app.errorHandler  = handleError;

  app
    .use(expressRedis)
    .use(compression())
    .use(logger(config.logFormat || 'dev'))
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({extended: false}))
    .use(cookieParser())
    .use(helmet())
    .use(express.static(path.join(__dirname, '..', config.staticDir), {
      maxAge: '4d'
    }))
    .disable('x-powered-by')
    .use(function (req, res, next) {
      if (req.url.substr(-1) === '/' && req.url.length > 1) {
        res.redirect(301, req.url.slice(0, -1));
      }
      else {
        next();
      }
    });

  return app;
};
