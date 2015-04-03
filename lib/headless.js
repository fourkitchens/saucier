module.exports = function headlessdrupal(templateEngine, config) {
  var Q             = require('q'),
      express       = require('express'),
      app           = express(),
      path          = require('path'),
      cookieParser  = require('cookie-parser'),
      bodyParser    = require('body-parser'),
      logger        = require('morgan'),
      compression   = require('compression'),
      debug         = require('debug')('headless:headless'),
      expressRedis  = require('express-redis')
                        (config.redis.port, config.redis.server, config.redis.options),
      helmet        = require('helmet'),
      cache         = require('./cache'),
      api           = require('./api'),
      processData   = require('./processData'),
      render        = require('./render'),
      helpers       = require('./helpers'),
      routeCache    = require('./routecache');

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

  /**
   * Handle GET responses in a generic way
   * @private
   * @param {(string|regexp)} route The route to match.
   * @param {string} template Template name that will be used to format the response
   * @param {object} options An object that configures the Controller instance
   * @return {object} res The response object
   */
  function handleGet(route, template, options) {
    app.get(route, function (req, res, next) {
      debug('PATH: ' + req.path);
      debug('ROUTE TYPE: ' + options.type);

      Q(helpers.getConfig(options, config, req, template, templateEngine))
        .then(cache.get)
        .then(api.get)
        .then(cache.set)
        .then(processData.prepare)
        .then(render.parse)
        .then(function (response) {
          return res
                  .set({
                    'Cache-Control': 'public, max-age=345600',
                    'Expires': new Date(Date.now() + 345600000).toUTCString()
                  })
                  .send(response);

        })
        .fail(function (options) {
          return next(options);
        });
    });
  }

  /**
   * Handles routing a Section datatype
   * @alias routeSection
   * @param {(string|regexp)} route The route to match.
   * @param {string} template Template name that will be used to format the response
   * @param {object} options An object that configures the Controller instance
   * @return {object} res The response object
   */
  function handleSection(route, template, options) {
    options         = options || {};
    options.type    = 'list';
    return handleGet(route, template, options);
  }

  /**
   * Handles routing for a single item.
   * @alias routeItem
   * @param {(string|regexp)} route The route to match.
   * @param {string} template Template name that will be used to format the response.
   * @param {object} options An object that configures the Controller instance.
   */
  function handleItem(route, template, options) {
    options         = options || {};
    options.type    = 'item';
    return handleGet(route, template, options);
  }

  /**
   * Handles routing for a multi-path request
   * @alias routeMulti
   * @param {(string|regexp)} route The route to match
   * @param {string} template Template name that will be used to format the response
   * @param {object} options An object that configures the Controller instance
   */
  function handleMulti(route, template, options) {
    options         = options || {};
    options.type    = 'multi';
    return handleGet(route, template, options);
  }

  /**
   * Handles routing a static datatype
   * @alias routeStatic
   * @param {(string|regexp)} route The route to match
   * @param {string} template Template name that will be used to format the response
   * @param {object} options An object that configures the Controller instance
   * @return {object} res The response object
   */
  function handleStatic(route, template, options) {
    options = options || {};
    app.get(route, function (req, res, next) {
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
  }

  /**
   * Handler for clearing and writing to the route cache
   * @param  {(string|regexp)} route The route to match
   * @return {object} res The response object
   */
  function handleRouteCache(route) {
    app
      .post(route, function (req, res, next) {
        routeCache.debug(req)
          .then(routeCache.del)
          .then(function () {
            for (var key in req.body._keys) {
              if (req.body._keys.hasOwnProperty(key)) {
                req.db.set(key, req.body._keys[key]);
              }
            }
            return res
                    .status(200)
                    .send({'_status' : 200});
          })
          .fail(function (options) {
            return next(options);
          });
      })
      .delete(route, function (req, res, next) {
        routeCache.debug(req)
          .then(routeCache.del)
          .then(function () {
            return res
                    .status(204);
          })
          .fail(function (options) {
            return next(options);
          });
      });
  }

  /**
   * Handler for non-website API consumers
   * @param  {(string|regexp)} route The route to match
   * @param {object} options options An object that configures the Controller instance
   * @return {object} res The response object
   */
  function handleApi (route, options) {
    app.get(route, function (req, res, next) {
      Q(helpers.getConfig(options, config, req, null, null))
        .then(api.auth)
        .then(api.get)
        .then(function (options) {
          return res
                  .send(options.api.body);
        })
        .fail(function (options) {
          return next(options);
        });
    });
  }

  /**
   * Handle Errors
   * @param  {object} err Object containing information about the error
   * @param  {object} req Request oject
   * @param  {object} res Response object
   * @return {object} Returning the response to the client
   */
  function handleError (error, req, res, next) {
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
  }

  /**
   * Start the server
   * @alias start
   */
  function handleStart() {
    var port = process.env.PORT || 3000;
    app.listen(port, function headlessdrupalListen() {
      debug('ENVIRONMENT: %s', config.environment);
      debug('Headless Drupal is running on port %s.', port);
    });
    return app;
  }

  app.start         = handleStart;
  app.handleGet     = handleGet;

  app.routeStatic   = handleStatic;

  app.routeCache    = handleRouteCache;
  app.routeApi      = handleApi;

  app.routeMulti    = handleMulti;
  app.routeSection  = handleSection;
  app.routeItem     = handleItem;

  app.errorHandler  = handleError;

  return app;
};
