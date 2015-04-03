/**
 * @file
 * Gulpfile that loads tasks from the _tasks directory
 *
 */

require('gulp-help')(require('gulp'));
require('require-dir')('./_tasks');
