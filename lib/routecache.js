var Q               = require('q'),
    debug           = require('debug')('headless:routecache'),
    helpers         = require('./helpers'),
    /**
     * Debug helper for routecache functions.
     * @private
     * @alias  debug
     * @param  {object} req The request object
     * @return {object} The promise for this function
     */
    routeCachedebug = function (req) {
      var deferred    = Q.defer();
      debug('%s %s', req.method, req.url);
      deferred.resolve(req);
      return deferred.promise;
    },
    /**
     * Deletes an array of keys from Redis
     * @private
     * @alias  del
     * @param  {object} req The request object
     * @return {object} The promise for this function
     */
    keyDel          = function (req) {
      var deferred    = Q.defer(),
          keys        = Array.isArray(req.body._keys) ? req.body._keys : Object.keys(req.body._keys);

      keys = keys
              .map(function (item) {
                return [item, item + ':json'];
              })
              .reduce(function (a, b) {
                return a.concat(b);
              });
      req.db.del(keys, function (err) {
        if (err) {
          debug('Key deletion issue.');
          deferred.reject(helpers.createErrorResponse(503, ['Key deletion issue.']));
        }
        else {
          debug(keys);
          deferred.resolve(req);
        }
      });
      return deferred.promise;
    };

module.exports = {
  debug: routeCachedebug,
  del: keyDel
};
