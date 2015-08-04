var Q = require('q'),
    debug = require('debug')('saucier:processData');

module.exports = {
  /**
   * Prepare JSON data for render.
   * @private
   * @alias  prepare
   * @param  {object} options Contains config.
   * @return {object} The promise for this function
   */
  prepare: function (req, res, next) {
    var options = req.saucier.routeOptions,
        data = req.saucier.cache.body,
        processorQueue = [],
        deferred = Q.defer(),
        promise;

    // Convert queue into an array of promises.
    Object.keys(options.processors).forEach(function (name) {
      if (typeof options.processors[name] === 'function') {
        debug(name);
        processorQueue.push(options.processors[name]);
      }
    });

    // Run through each valid processor.
    promise = Q(data);
    for (var index = 0; index < processorQueue.length; index++) {
      promise = promise.then(processorQueue[index]);
    }
    promise
      .then(function (result) {
        return next();
      })
      .fail(function (error) {
        debug(error);
        return next(new Error('Some processor died.'));
      });

  }
};
