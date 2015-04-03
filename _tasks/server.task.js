/**
 * @file
 *   Tasks for running the server
 */

var gulp            = require('gulp-help')(require('gulp')),
    nodemon         = require('gulp-nodemon'),
    gutil           = require('gulp-util'),
    nconf           = require('nconf').argv().env().file('./config/app.config.json');

gulp.task('watch', 'Watches files for changes.', function () {
  gulp.watch(nconf.get('paths:source:sass'), ['compass']);
  gulp.watch(nconf.get('paths:source:dust:templates'), ['dust']);
  gulp.watch(nconf.get('paths:source:images'), ['images']);
  gulp.watch(nconf.get('paths:source:scripts'), ['scripts']);
});

gulp.task('server', 'Starts server via Nodemon for local development.', ['build'], function () {
  var nodemonOpts = {
    ext: 'js, dust',
    ignore: ['_src/sass/**/*', 'public/**/*']
  };

  // turn debug logs on
  process.env.DEBUG = 'headless:*';
  process.env.Q_DEBUG = '1';

  return nodemon(nodemonOpts)
    .on('restart', function () {
      gutil.log(gutil.colors.bgBlue.white.bold(' NODEMON RESTARTED '));
    });
});
