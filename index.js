var _ = require('lodash');
var fs = require('fs');
var gm = require('gm');
var mkdirp = require('mkdirp');
var path = require('path');
var Q = require('q');

var sizes = [
  {name: 'mdpi', multiplier: 1.0},
  {name: 'hdpi', multiplier: 1.5},
  {name: 'xhdpi', multiplier: 2.0},
  {name: 'xxhdpi', multiplier: 3.0},
  {name: 'xxxhdpi', multiplier: 4.0}
];

/**
 * Resizes and creates a new image.
 *
 * @param  {string} source filename
 * @param {string} dest filename
 * @param {number} width
 * @param {number} height
 * @return {Promise}
 */
function createImage(source, dest, width, height) {
  var deferred = Q.defer();

  mkdirp(path.dirname(dest));

  gm(source)
    .resize(width, height)
    .write(dest, function (err) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve();
      }
    });

  return deferred.promise;
}

/**
 * Generates the images for a particular resource.
 * @param {string} source filename
 * @param {object} options
 * @param {string} [options.sourceSize=xxxhdpi] (mdpi, hdpi, xhdpi, xxhdpi, or xxxhdpi)
 * @param {string} options.dest res folder
 * @param {string[]} [options.destSizes]
 * @returns {Promise}
 */
function generateResource(source, options) {
  var deferred = Q.defer();

  if (!fs.existsSync(source)) {
    deferred.reject(new Error(source + ' not found'));
    return deferred.promise;
  }

  // Get current image dimensions
  gm(source).size(function (err, sourceDimensions) {
    if (err) {
      deferred.reject(err);
      return deferred.promise;
    }

    var promises = [];
    var sourceSize = _.find(sizes, {name: options.sourceSize}) || _.find(sizes, {name: 'xxxhdpi'});

    sizes.forEach(function (size) {
      // Generate image for size if `options.destSizes` is not provided or contains this size
      if (!options.destSizes || _.contains(options.destSizes, size.name)) {
        var dest = options.dest + 'drawable-' + size.name + '/' + path.basename(source);
        var multiplier = size.multiplier / sourceSize.multiplier;
        var width = Math.ceil(sourceDimensions.width * multiplier);
        var height = Math.ceil(sourceDimensions.height * multiplier);

        var createImagePromise = createImage(source, dest, width, height);

        // Notify about each image created
        createImagePromise.then(function () {
          deferred.notify({dest: dest, width: width, height: height});
        });

        promises.push(createImagePromise);
      }
    });

    Q.all(promises)
      .catch(function (err) {
        deferred.reject(err);
      })
      .then(function () {
        deferred.resolve();
      });

  });

  return deferred.promise;
}

module.exports = generateResource;