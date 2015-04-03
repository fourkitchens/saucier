/**
 * @file
 *   Tasks for linting and validating code style
 */

var gulp            = require('gulp'),
    plumber         = require('gulp-plumber'),
    jshint          = require('gulp-jshint'),
    jscs            = require('gulp-jscs');

gulp.task('lint', 'Runs JSCS and JSLint on JS files', function () {
  return gulp.src([
    'gulpfile.js',
    'lib/**/*.js',
    'src/**/*.js',
    '_tasks/**/*.js',
    'test/**/*.js',
    '!public/**/*.js'
  ])
  .pipe(plumber())
  .pipe(jshint())
  .pipe(jshint.reporter('default'))
  .pipe(jscs());
});
