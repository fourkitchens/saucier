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
      debug(options.cache.json, options.cache.key);
      return Q.ninvoke(options.req.db, 'mget', [options.cache.json, options.cache.key])
        .then(function (results) {
          // Returns true if all elements of the array are null.
          options.cache.nid = (options.type === 'list') ? null : results[1];
          options.cacheSet = results[0] === null ? true : false;
          options.apiGet = results[0] === null ? true : false;
          options.api.body = results[0] === null ? {} : JSON.parse(results[0]);

          debug('options.cache.nid', options.cache.nid);
          debug('options.cacheSet', options.cacheSet);
          debug('options.apiGet', options.apiGet);

          if (options.cache.nid === null && options.apiGet && options.type === 'item') {
            debug('Redis found no valid results');
            return Q.reject(helpers.createErrorResponse(500, [':(']));
          }

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
        debug('JSON CACHE: %s', options.cache.json);
        debug('TTL: %s', ttl);
        options.req.db.multi([
          ['set', options.cache.json, JSON.stringify(options.api.body)],
          ['expire', options.cache.json, ttl]
        ]).exec(function (error, replies) {
          if (error) {
            deferred.reject(helpers.createErrorResponse(500, [error]));
          }
          else {
            debug(replies);
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


