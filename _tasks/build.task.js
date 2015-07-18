/**
 * @file
 *   Tasks for building assets
 */

var gulp            = require('gulp'),
    dust            = require('gulp-dust'),
    wrap            = require('gulp-wrap'),
    concat          = require('gulp-concat'),
    plumber         = require('gulp-plumber'),
    nconf           = require('nconf').argv().env().file('./config/app.config.json'),
    addsrc          = require('gulp-add-src'),
    del             = require('del');

gulp.task('dust', 'Compiles Dust.JS templates.', function () {
  return gulp.src(nconf.get('paths:source:dust:templates'))
    .pipe(plumber())
    .pipe(dust({
      'preserveWhitespace' : true
    }))
    .pipe(addsrc(nconf.get('paths:source:dust:helpers')))
    .pipe(concat('views.js', {newLine: ' \r\n  '}))
    .pipe(wrap({src: nconf.get('paths:source:dust:utils') + '/wrap.txt'}))
    .pipe(gulp.dest(nconf.get('paths:output:templates')));
});

gulp.task('images', 'Copies images to output folder.', function () {
  return gulp.src(nconf.get('paths:source:images'))
    .pipe(gulp.dest(nconf.get('paths:output:images')));
});

gulp.task('scripts', 'Copies scripts to output folder.', function () {
  return gulp.src(nconf.get('paths:source:scripts'))
    .pipe(gulp.dest(nconf.get('paths:output:scripts')));
});

gulp.task('clean', 'Delete build files so that we have a fresh starting point', function (cb) {
  del([
    nconf.get('paths:output:templates'),
    nconf.get('paths:output:images'),
    nconf.get('paths:output:scripts')
  ], cb);
});
