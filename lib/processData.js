var Q               = require('q'),
    debug           = require('debug')('headless:processData'),
    requireDir      = require('require-directory'),
    helpers         = require('./helpers'),
    processors      = requireDir(module, './processors'),
    /**
     * Prepare JSON data for render.
     * @private
     * @alias  prepare
     * @param  {object} options Contains config.
     * @return {object} The promise for this function
     */
    processData         = function (options) {
      var data              = options.api ? options.api.body : {},
          deferred          = Q.defer(),
          defaultProcessors = ['sanitize'],
          routeProcessors   = options.processors,
          queue             = [].concat(defaultProcessors, routeProcessors),
          promise;

      debug(queue);

      // Convert queue into an array of promises.
      queue = queue.filter(function (processor) {
        return typeof processors[processor] === 'function';
      })
        .map(function (processor) {
          return processors[processor];
        });

      // Run through each valid processor.
      promise = queue[0]({data: data, options: options});
      for (var index = 1; index < queue.length; index++) {
        promise = promise.then(queue[index]);
      }
      promise.then(function (result) {
        // We only allow template data to be changed.
        options.api.body = result.data;
        deferred.resolve(options);
      })
        .fail(function (error) {
          debug(error);
          deferred.reject(helpers.createErrorResponse(500, [error]));
        });

      return deferred.promise;
    };

module.exports = {
  prepare: processData
};
