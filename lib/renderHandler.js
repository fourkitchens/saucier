var debug = require('debug')('saucier:renderHandler');

module.exports = function render (templateEngine, template) {
  /**
   * Renders the JSON data against the passed template.
   * @param  {object} templateEngine The template engine.
   * @param  {object} template The template.
   * @return {function} The middleware.
   */
  var f = function (req, res, next) {
    var data = req.saucier.cache.body;
    // Attach route parameters and query strings to data.
    data.routeParams = req.params;
    data.routeQuery = req.query;

    if (process.env.SAUCIERRENDER && process.env.SAUCIERRENDER === 'false') {
      debug('Sending JSON');
      req.saucier.response = req.saucier.cache.body;
      next();
    }
    else {
      templateEngine.render(template, data, function (error, html) {
        if (error) {
          debug(error);
          return next(new Error('Something with rendering did not work.'));
        }
        else {
          req.saucier.response = html;
          next();
        }
      });
    }
  };

  return f;

};
