```
                       _           
                      (_)          
  ___  __ _ _   _  ___ _  ___ _ __ 
 / __|/ _` | | | |/ __| |/ _ \ '__|
 \__ \ (_| | |_| | (__| |  __/ |   
 |___/\__,_|\__,_|\___|_|\___|_|   
                                   
                                   
```

# Saucier 

Saucier is a Node.JS framework for helping you build headless Drupal websites.

## Usage

### Setup

There are two additional companion modules you can use when starting out, `saucier-get` and `saucier-cache`. These modules provide functionality that was previously baked directly into Saucier.

```javascript
var env = require('./_config/env.json'),
    https = require('https'),
    saucierGet = require('saucier-get')( new https.Agent({ keepAlive: true}) ),
    saucierCache = require('saucier-cache')(),
    templates = require('./public/templates/views'),
    saucier = require('saucier-core')(saucierGet, saucierCache, templates, {
      logFormat: '\033[1;32m:remote-addr ->\033[m [:date] \033[1;35m:method :url\033[m :http-version \033[1;34m:status\033[m :res[Content-Length]',
      staticDir: 'public',
      maxAge: '4d',
      envConfig: env
    });
```

In this example we are using the default `saucier-get` and `saucier-cache` modules.

Saucier has four required options to function correctly, and API compatible `saucier-get`, `saucier-cache`, a templates function, and an options object. Saucier Get/Cache are explained in their own repositories.

In this instance `templates` is a series of compiled Dust.JS templates. You can technically use any template engine/object as long as it supports a `render()` function.

The following properties are expected when passing in an options object:

- `logFormat` : Log Format is any [Morgan](https://www.npmjs.com/package/morgan) compatible log string. _Default is [dev](https://www.npmjs.com/package/morgan#dev)_.
- `staticDir` : This is where your static assets will be served from. _Default is `public`_.

- `maxAge` : Length of time in which to cache static assets with the client. _Default is `4d`_.
- `envConfig` : **REQUIRED** This is an environmental configuration object.

```json
{
  "local": {
    "environment": "local",
    "api": "https://fakeapi.ssl.dev",
    "ttl": "800",
    "maxAttempts" : 2,
    "retryDelay": 100
  }
}
```

Each primary object should match the environment variable set at `NODE_ENV`. This defaults to `local`.

- `api` : The backend API path.
- `ttl` : The TTL attached to cache keys in Redis.
- `maxAttempts` : The number of attempts to try when requesting data from the backend API. _Default is `2`_.
- `retryDelay` : Delay between retrying requests to the backend API in milliseconds. _Default is `100`_.

### Routes

When creating your routes, Saucier V1 routes are compatible. The only difference is how route processors are handled. Pass the completely created Saucier object to your routes.

Routes are essentially node modules.

```javascript
module.exports = function attach(app) {
  app.handleGet('/', 'example.dust', {
    resource: ['sample'],
    processors: {
      sample: function (data) {
        data.cheese = 'cake';
        return data;
      }
    }
  });
}
```

The function `app.handleGet()` is a wrapper for `app.get()` which supports some additional options.

- `/` : The route pattern you wish to match on. Routes are processed sequentially within the file, and then sequentially in the order that they are required.
- `example.dust` : This is the name of the template. That will be rendered for this route.
- An options object:
  - `resource` : An array of resources to request data from. These _names_ will be merged with the value of `api` from your `env.json`,  `https://fakeapi.ssl.dev/sample`. These resources are are processed asynchronously and will return an object containing JSON from the backend resource. 
  - `processors` : An object of functions that will modify the data. The `data` object is the response from the previously collected resources.


### Extras

- `SAUCIERRENDER` : An environment variable that can be set to return JSON instead of a rendered route. False is the only accepted value, `SAUCIERRENDER=false`
- `DEBUG=saucier:*` : Saucier and each of it's core modules has a debug name space, `saucier:*`. Enable this to get wonderful debug output when developing your application. 
