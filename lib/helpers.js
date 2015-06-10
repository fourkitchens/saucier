var _               = require('lodash'),
    crypto          = require('crypto'),
    debug           = require('debug')('headless:helpers'),
    qs              = require('qs'),
    cacheKey        = function (req, type, customKey) {
      if (customKey && customKey !== '') {
        return customKey;
      }
      else {
        var key = req.path.substr(1).replace(new RegExp('/', 'g'), ':');
        if (type === 'list' || type === 'multi') {
          key += ':' + type + '_type';
        }
        if ((type === 'list' || type === 'multi') && Object.keys(req.query).length !== 0) {
          key += ':' + crypto.createHash('sha1').update(qs.stringify(req.query)).digest('hex');
        }

        return key;
      }
    };

module.exports = {
  /**
   * Creates a config object for the promise chain.
   * @param  {object} options Any options passed when the route was created.
   * @param  {object} config The config object passed from nodeEnv.
   * @param  {object} req The request object.
   * @param  {[string]} template The template this call chain should use.
   * @param  {[object]} templateEngine The rendering engine this project uses.
   * @param  {[object]} httpAgent The httpAgent with keep-alive enbaled.
   * @return {object} The object used in the promise call chain.
   */
  getConfig: function (options, config, req, template, templateEngine, httpAgent) {
    template = template !== null ? template : null;
    templateEngine = templateEngine !== null ? templateEngine : null;
    var response    = {
      'httpAgent': httpAgent,
      'type': options.type,
      'reqType': 'www',
      'config': config,
      'cache': {
        'key': cacheKey(req, options.type, options.key)
      },
      'req': {
        'db': req.db,
        'params': req.params,
        'query': req.query,
        '_parsedUrl': req._parsedUrl,
        'headers': req.headers,
        'route': req.route
      },
      'resource': options.resource,
      'template': template,
      'engine': templateEngine,
      'defaultValue': 100,
      'api': {},
      'apiGet': true,
      'passQuery': options.passQuery || false,
      'processors': options.processors || []
      };

    // If there is a domain passed in, use it.
    response.config.api    = options.domain ? options.domain : response.config.api;

    response.cache.json    = response.cache.key + ':json';
    response.cache.pattern = response.cache.key + '*';

    response.skipRender = req.headers['accept'] && req.headers['accept'] === 'application/json' && config.environment === 'local' ? true : false;

    return response;
  },
  /**
   * Standardized error response creation
   * @param  {number} status The HTTP error code to be sent
   * @param  {array} messages An array of messages to be attached to the response
   * @return {object} The object to be sent to the client.
   */
  createErrorResponse: function (status, messages) {
    return {
      '_status': status,
      '_errors': messages.map(function (element) {
        return {'message': element};
      })
    };
  }
};
