var Q               = require('q'),
    debug           = require('debug')('headless:cache'),
    helpers         = require('./helpers'),
    /**
     * Lookup NID and Cache keys from Redis.
     * @private
     * @alias  get
     * @param  {object} options Contains config.
     * @return {object} The promise for this function
     */
    getFromRedis    = function (options) {
      if (options.type !== 'item') {
        return Q(options);
      }

      return Q.ninvoke(options.req.db, 'mget', [options.cache.json, options.cache.key])
        .then(function (results) {
          // Returns true if all elements of the array are null.
          var areAllEmpty = results.every(function (element) {
            return element === null;
          });

          if (areAllEmpty) {
            // If all results from the redis call returned null, we fail the request.
            debug('Redis found no valid results');
            return Q.reject(helpers.createErrorResponse(500, ['Redis found no valid results.']));
          }

          options.cache.nid = results[1];
          options.cacheSet = results[0] === null ? true : false;
          options.apiGet = results[0] === null && results[1] !== null ? true : false;
          options.api.body = results[0] === null ? {} : JSON.parse(results[0]);

          debug('options.cache.nid', options.cache.nid);
          debug('options.cacheSet', options.cacheSet);
          debug('options.apiGet', options.apiGet);

          return Q(options);
        })
        .fail(function () {
          return Q.reject(helpers.createErrorResponse(500, ['Redis failed.']));
        });
    },
    /**
     * Write the JSON cache key, set it's TTL.
     * @param  {object} options Contains config.
     * @return {object} The promise for this function
     */
    set             = function (options) {
      var deferred  = Q.defer();
      if (options.cacheSet) {
        var ttl = options.api.body.hasOwnProperty('_ttl') ? options.api.body._ttl : options.config.ttl;
        debug('Setting JSON cache.');
        options.req.db.set(options.cache.json, JSON.stringify(options.api.body), function (error) {
          if (error) {
            deferred.reject(helpers.createErrorResponse(500, [error]));
          }
          else {
            debug('TTL: %s', ttl);
            options.req.db.expire(options.cache.json, ttl);
            deferred.resolve(options);
          }
        });
      }
      else {
        deferred.resolve(options);
      }
      return deferred.promise;
    };

module.exports = {
  get: getFromRedis,
  set: set
};


