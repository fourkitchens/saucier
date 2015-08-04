var express = require('express'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    logger = require('morgan'),
    compression = require('compression'),
    helmet = require('helmet'),
    path = require('path'),
    debug = require('debug')('saucier:main'),
    nconf = require('nconf'),
    processData = require('./lib/processData'),
    renderHandler = require('./lib/renderHandler'),
    cluster = require('cluster')
    app = express(),
    webWorkers = {};

/**
 * Saucier
 * @param  {object} saucierGet Handles a series of tasks
 *                             related to fetching items
 *                             from an external API.
 * @param  {object} saucierCache Handles a series of tasks
 *                               related to caching items.
 * @param  {object} templateEngine The template engine.
 * @param  {object} config Saucier configuration
 * @return {object} The Saucier app.
 */
module.exports = function saucier(saucierGet, saucierCache, templateEngine, config){
  var handleGet = function (route, template, options) {
        /**
         * Handle GET responses in a generic way
         * @private
         * @param {(string|regexp)} route The route to match.
         * @param {string} template Template name that will be used to format the response
         * @param {object} options An object that configures the Controller instance
         * @return {object} res The response object
         */
        app.get(
          route,
          function (req, res, next) {
            req.saucier = req.saucier || {};
            req.saucier.routeOptions = options;
            req.saucier.applicationConfig = config;
            req.saucier.environment = process.env.NODE_ENV || 'local';
            next();
          },
          saucierCache.get,
          saucierGet.get(saucierGet.httpAgent),
          saucierCache.set(900),
          processData.prepare,
          renderHandler(templateEngine, template),
          function (req, res) {
           return res.send(req.saucier.response);
          }
        );
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
          return app.listen(3000, function headlessdrupalListen() {
            debug('ENVIRONMENT: %s', 'local');
            debug('SAUCIER is running on port %s.', 3000);
          });
        }
      };

  app
    .use(compression())
    .use(logger(config.logFormat || 'dev'))
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({extended: false}))
    .use(cookieParser())
    .use(helmet())
    .use(express.static(path.join(__dirname, '..', config.staticDir || 'public'), {
      maxAge: config.maxAge || '4d'
    }))
    .use(saucierCache.create())

  app.handleGet = handleGet;
  app.start = handleStart;

  return app;
}
