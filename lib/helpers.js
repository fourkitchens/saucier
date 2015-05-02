module.exports = {
  /**
   * Creates a config object for the promise chain.
   * @param  {object} options Any options passed when the route was created.
   * @param  {object} config The config object passed from nodeEnv.
   * @param  {object} req The request object.
   * @param  {[string]} template The template this call chain should use.
   * @param  {[object]} templateEngine The rendering engine this project uses.
   * @return {object} The object used in the promise call chain.
   */
  getConfig: function (options, config, req, template, templateEngine) {
    template = template !== null ? template : null;
    templateEngine = templateEngine !== null ? templateEngine : null;

    var response    = {
          'type'          : options.type,
          'reqType'       : 'www',
          'config'        : config,
          'req'           : req,
          'resource'      : options.resource,
          'template'      : template,
          'engine'        : templateEngine,
          'defaultValue'  : 100,
          'api'           : {},
          'apiGet'        : true,
          'passQuery'     : options.passQuery || false,
          'processors'    : options.processors || []
        };

    response.cacheLookup   = (options.type === 'item' || options.type === 'multi') ? true : false;
    response.cacheSet      = (options.type === 'item' || options.type === 'multi') ? true : false;
    response.sendJSON      = req.headers['content-type'] && req.headers['content-type'] === 'application/json' ? true : false;
    response.cache         = {
      'key' : req.path.substr(1).replace(new RegExp('/', 'g'), ':')
    };
    response.cache.json    = response.cache.key + ':json';
    response.cache.pattern = response.cache.key + '*';

    response.skipRender = req.headers['accept'] && req.headers['accept'] === 'application/json' && (config.environment === 'development' || config.environment === 'local') ? true : false;

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
