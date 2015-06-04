var _ = require('lodash');
var colors = require('colors');
var fs = require('fs');
var gm = require('gm');
var Q = require('q');

var sizes = [
  {name: 'mdpi', multiplier: 1.0},
  {name: 'hdpi', multiplier: 1.5},
  {name: 'xhdpi', multiplier: 2.0},
  {name: 'xxhdpi', multiplier: 3.0},
  {name: 'xxxhdpi', multiplier: 4.0}
];

/**
 * @var {Object} console utils
 */
var display = {
  success: function (str) {
    str = '✓  '.green + str;
    console.log('  ' + str);
  },
  error: function (str) {
    str = '✗  '.red + str;
    console.log('  ' + str);
  },
  header: function (str) {
    console.log('');
    console.log(' ' + str.cyan.underline);
    console.log('');
  }
};

/**
 * Resizes and creates a new image.
 *
 * @param  {string} source filename
 * @param {string} dest filename
 * @param {object} size
 * @param {number} size.width
 * @param {number} size.height
 * @return {Promise}
 */
function createImage(source, dest, size) {
  var deferred = Q.defer();

  gm(source)
    .resize(size.width, size.height)
    .write(dest, function (err) {
      if (err) {
        deferred.reject(err);
      } else {
        display.success(dest + ' created (' + size.width + '×' + size.height + ')');
        deferred.resolve();
      }
    });

  return deferred.promise;
}

/**
 * Generates the images for a particular resource.
 * @param {string} source filename
 * @param {object} options
 * @param {string} options.dest res folder
 * @param {number} options.sourceMultiplier
 * @param {array} [options.destSizes]
 * @returns {Promise}
 */
function generateResource(source, options) {
  var deferred = Q.defer();

  gm(source).size(function (err, currentSize) {

    if (err) {
      deferred.reject(err);
      return;
    }

    var deferreds = [];

    sizes.forEach(function (size) {
      if (!options.destSizes || _.contains(options.destSizes, size.name)) {
        var dest = options.dest + 'drawable-' + size.name + '/' + source;
        var multiplier = size.multiplier / options.sourceMultiplier;

        deferreds.push(createImage(source, dest, {
          width: Math.ceil(currentSize.width * multiplier),
          height: Math.ceil(currentSize.width * multiplier)
        }));
      }
    });

    Q.all(deferreds)
      .catch(function (err) {
        deferred.reject(err);
      })
      .then(function () {
        deferred.resolve();
      });

  });

  return deferred.promise;
}

/**
 * Generates resources.
 * @param {array} sources filenames
 * @param {object} options
 * @param {string} options.dest res folder
 * @param {string} [options.sourceSize=xxxhdpi] (mdpi, hdpi, xhdpi, xxhdpi, or xxxhdpi)
 * @param {string[]} [options.destSizes]
 * @return {Promise}
 */
function generateResources(sources, options) {
  var deferreds = [];
  var sourceSize = _.find(sizes, {name: options.sourceSize}) || _.find(sizes, {name: 'xxxhdpi'});

  display.header('Generating Android resources');

  sources.forEach(function (source) {
    if (!fs.existsSync(source)) {
      display.error(source + ' not found');
      return;
    }

    deferreds.push(generateResource(source, {
      dest: options.dest,
      sourceMultiplier: sourceSize.multiplier,
      destSizes: options.destSizes
    }));
  });

  return Q.all(deferreds);
}

module.exports = generateResources;