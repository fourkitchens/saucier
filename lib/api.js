var Q               = require('q'),
    urlTemplate     = require('url-template'),
    request         = require('requestretry'),
    debug           = require('debug')('headless:api'),
    nconf           = require('nconf').argv().env().file('./config/secrets.json'),
    helpers         = require('./helpers'),
    _               = require('lodash'),

    /**
     * Makes a request to the API provider with the given URL; handles error responses if they occur
     * @private
     * @param  {object} options The options object.
     * @param  {string} requestUrl The URL we're requesting
     * @return {object} The promise for this function that resolves with the data from the response
     */
    sendRequest     = function (options, requestUrl) {
      var deferred = Q.defer(),
        // prepend API path to resource calls
        fullUrl = options.config.api + '/' + requestUrl,
        requestOptions = {
          url: fullUrl,
          headers: {
            'x-request-type': options.reqType,
            'x-request-secret': options.reqType === 'www' ? nconf.get('wwwSecret') : nconf.get('apiSecret')
          },
          json: true,
          maxAttempts: options.config.maxAttempts,
          retryDelay: options.config.retryDelay,
          retryStrategy: request.RetryStrategies.HTTPOrNetworkError
        },
        handleResponse = function (error, response, body) {
          if (500 <= response.statusCode && response.statusCode < 600 || error || body === '') {
            debug(response.statusCode, error);
            deferred.reject(helpers.createErrorResponse(500, [error]));
          }
          else {
            debug(requestUrl + ':' + response.statusCode);
            deferred.resolve(body);
          }
        };

      request(requestOptions, handleResponse);

      return deferred.promise;
    },
    /**
     * Gets all data from the API Provider.
     * @private
     * @alias  get
     * @param  {object} options Contains config.
     * @return {object} The promise for this function
     */
    apiGet          = function (options) {
      if (!options.apiGet) {
        // Skip the request if we already have cache data.
        debug('Skipping requests to the API server.');
        return Q(options);
      }

      var urlParams = options.req.params,
          query     = '';

      // attach nid if applicable
      if (options.cache && options.cache.nid) {
        urlParams.nid = options.cache.nid;
      }

      // Pass along the query parameters to the API resource.
      if (options.passQuery && options.req._parsedUrl.query) {
        query = options.req._parsedUrl.query;
      }

      // parse through each API resource endpoint, replacing expressions with params
      options.resource = options.resource.map(function (item) {
        // Prepend query string with ? or &.
        if (query) {
          query = item.indexOf('?') === -1 ? '?' + query : '&' + query;
        }
        return urlTemplate.parse(item).expand(urlParams) + query;
      });

      debug(options.resource);
      return Q.
        allSettled(options.resource.map(function (item) {
          return sendRequest(options, item);
        }))
        .then(function (results) {
          options.api.body = [];
          var debugMessage = 'Some requests could not be completed.';

          // check that all results have a 'state' property of 'fulfilled'
          var allRequestsFulfilled = _.every(results, {'state': 'fulfilled'});

          if (!allRequestsFulfilled) {
            debug(debugMessage);
            return Q.reject(helpers.createErrorResponse(500, [debugMessage]));
          }

          // add all the values to the the body of the response
          results.forEach(function (element) {
            options.api.body.push(element.value);
          });

          // remove array if only one request was made
          if (options.api.body.length === 1) {
            options.api.body = options.api.body[0];
          }

          return Q(options);
        });
    };

module.exports = {
  get: apiGet
};
