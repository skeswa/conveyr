/***************************** EXTERNAL IMPORTS ******************************/

var gulp        = require('gulp');
var fs          = require('fs');
var path        = require('path');
var rimraf      = require('rimraf');
var babel       = require('gulp-babel');
var gutil       = require('gulp-util');
var Mocha       = require('mocha');

/************************** GULP MODULE CONSTANTS ****************************/

var TEST_FOLDER     = path.join(__dirname, 'test');
var TEST_TMP_FOLDER = path.join(TEST_FOLDER, '.compiled-tests');
var SRC_FOLDER      = path.join(__dirname, 'src');
var LIB_FOLDER      = path.join(__dirname, 'lib');

/************************** GULP MODULE DEFINITION ***************************/

gulp.task('clean', function() {
    rimraf.sync(TEST_TMP_FOLDER);
    rimraf.sync(LIB_FOLDER);
});

gulp.task('compile:lib', function(done) {
     gulp.src(path.join(SRC_FOLDER, '**', '*.js'))
        .pipe(babel())
        .pipe(gulp.dest(LIB_FOLDER))
        .on('end', function() {
            done();
        });
});

gulp.task('compile:tests', ['compile:lib'], function(done) {
     gulp.src(path.join(TEST_FOLDER, '*.test.js'))
        .pipe(babel())
        .pipe(gulp.dest(TEST_TMP_FOLDER))
        .on('end', function() {
            done();
        });
});

gulp.task('test', ['compile:tests'], function(done) {
    var mocha = new Mocha();
    // Load the tests from the filesystem
    fs.readdir(TEST_FOLDER, function(err, files) {
        if (err) {
            done(err);
        } else {
            files.filter(function(file) {
                return (file.indexOf('.test.js') === (file.length - 8));
            }).forEach(function(testFile, i, testFiles) {
                // Add the file to mocha context
                mocha.addFile(path.join(TEST_TMP_FOLDER, testFile));
                gutil.log('Found test file:\t', gutil.colors.blue(testFile));
                // Wait for the last last file to be loaded
                if (i >= (testFiles.length - 1)) {
                    gutil.log('Now running the tests...');
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
        }
    });
});

gulp.task('default', ['clean', 'compile:lib']);
