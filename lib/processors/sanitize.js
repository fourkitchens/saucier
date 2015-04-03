var Q         = require('q'),
    /**
     * Sanitizes API body data for consumption by a templating engine like Dust.
     * @private
     * @param  {object} options Contains all config.
     * @return {object} The promise for this function.
     */
    sanitize  = function (options) {
      var deferred  = Q.defer(),
          inputData = options.data,
          output    = {},
          process   = function (data) {
            var dataIsArray = Array.isArray(data),
                output      = dataIsArray ? [] : {},
                isObject    = function (obj) {
                  return obj !== null && typeof obj === 'object';
                },
                key,
                newKey,
                childOutput;

            // Throw an error if we're trying to process a non-object.
            if (!isObject(data)) {
              throw new Error('Cannot sanitize non-objects.');
            }

            // Process children.
            for (key in data) {
              if (data.hasOwnProperty(key)) {

                // Recursively sanitize objects.
                childOutput = isObject(data[key]) ? process(data[key]) : data[key];

                // Rebuild output.
                if (dataIsArray) {
                  output.push(childOutput);
                }
                else {
                  // Sanitize key.
                  newKey = key.replace(':', '_');
                  output[newKey] = childOutput;
                }
              }
            }

            // If we are not returning an object, something's gone wrong.
            if (!isObject(output)) {
              throw new Error('Sanitization returned a non-object.');
            }

            return output;
          };

      try {
        output = process(inputData);
        options.data = output;
        deferred.resolve(options);
      }
      catch (error) {
        deferred.reject(error);
      }

      return deferred.promise;
    };

module.exports = sanitize;
