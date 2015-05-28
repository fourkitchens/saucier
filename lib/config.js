var nconf           = require('nconf').argv().env()
                        .file('appconfig','./config/app.config.json')
                        .file('secrets', './config/secrets.json')
                        .file('environments', './config/env.json');

exports.getServerConfigs = function () {
  var nodeEnv       = nconf.get('NODE_ENV') || 'local',
      endpoints     = nconf.get(nodeEnv),
      ttl           = nconf.get('ttl') || endpoints.ttl;

  // add endpoints based on environments
  nconf.set('server:environment', nodeEnv);
  nconf.set('server:api', endpoints.api);
  nconf.set('server:ttl', ttl);

  // add in redis password if available
  if (nconf.get('redis_dev_pass')) {
    endpoints.redis.options = {
      'auth_pass': nconf.get('redis_dev_pass')
    };
  }

  nconf.set('server:redis', endpoints.redis);

  return nconf.get('server');
};
