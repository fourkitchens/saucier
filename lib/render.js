var Q               = require('q'),
    debug           = require('debug')('headless:render'),
    helpers         = require('./helpers'),
    /**
     * Renders the JSON data against the passed template.
     * @private
     * @alias  parse
     * @param  {object} options Contains config.
     * @return {object} The promise for this function
     */
    render          = function (options) {
      // Allow the deletion of the options variable without error.
      /*jshint -W051 */

      var deferred    = Q.defer(),
          data        = options.api ? options.api.body : {};

      // Add routeParams to data.
      data.routeParams = options.req.params;

      if (options.skipRender) {
        debug('Sending JSON');
        deferred.resolve(data);
      }
      else {
        options.engine.render(options.template, data, function (error, html) {
          if (error) {
            debug(error);
            deferred.reject(helpers.createErrorResponse(500, [error]));
          }
          else {
            debug(options.template);

            // Set the options object to NULL
            options = null;
            // Delete the options object.
            delete options;

            deferred.resolve(html);
          }
        });
      }
      return deferred.promise;
    };

module.exports = {
  parse: render
};
