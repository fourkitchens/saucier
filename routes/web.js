'use strict';

module.exports = function attach(app) {

  app.routeMulti('/', 'base_template.dust', {
    resource: [],
    processors: [],
    key: 'home'
  });

};
