/***************************** EXTERNAL IMPORTS ******************************/

var gulp    = require('gulp');
var fs      = require('fs');
var path    = require('path');
var rimraf  = require('rimraf');
var babel   = require('gulp-babel');
var gutil   = require('gulp-util');
var Mocha   = require('mocha');
var glob    = require('glob');

/************************** GULP MODULE CONSTANTS ****************************/

var SRC_FOLDER      = path.join(__dirname, 'src');
var LIB_FOLDER      = path.join(__dirname, 'lib');

/************************** GULP MODULE DEFINITION ***************************/

gulp.task('clean', function() {
    rimraf.sync(LIB_FOLDER);
});

gulp.task('compile', function(done) {
     gulp.src(path.join(SRC_FOLDER, '**', '*.js'))
        .pipe(babel())
        .pipe(gulp.dest(LIB_FOLDER))
        .on('end', function() {
            done();
        });
});

gulp.task('test', ['compile'], function(done) {
    var mocha = new Mocha();
    // Find unit tests and add them to mocha
    glob(path.join(LIB_FOLDER, '**', '*.test.js'), {}, function(err, testFiles) {
        if (err) {
            gutil.log(gutil.colors.red('✗ Could not get tests due to an error:'), err);
            process.exit(1);
        } else {
            // Add the files
            testFiles.sort(function(a, b) {
                if (a.indexOf('integration.test.js') === (a.length - 19)) {
                    return 1;
                } else if (b.indexOf('integration.test.js') === (a.length - 19)) {
                    return -1;
                } else {
                    return 0;
                }
            }).forEach(function(testFile) {
                // Add the file to mocha context
                mocha.addFile(testFile);
                gutil.log('Found test file:\t', gutil.colors.blue(testFile));
            });
            // Run the mocha tests
            mocha.run(function(failures) {
                if (failures > 0) {
                    gutil.log(gutil.colors.red('✗ The tests didn\'t execute successfully.'));
                    process.exit(1);
                } else {
                    gutil.log(gutil.colors.green('✓ All tests executed successfully!'));
                    process.exit(0);
                }
            });
        }
    });
});

gulp.task('default', ['clean', 'compile']);
