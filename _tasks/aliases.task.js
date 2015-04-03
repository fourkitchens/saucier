/**
 * @file
 *   Common aliases for tasks
 */

var gulp            = require('gulp'),
    runSequence     = require('run-sequence');

gulp.task('build', 'Builds out assets', function (callback) {
  runSequence('clean', ['dust', 'compass', 'scripts', 'images'], callback);
});
gulp.task('check', 'Checks your code for quality and style', ['lint']);
gulp.task('local', 'Starts a local development instance.', function (callback) {
  runSequence('server', 'watch', callback);
});
gulp.task('default', 'Shows help info.', ['help']);
