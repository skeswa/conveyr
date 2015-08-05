'use strict';

module.exports = function(karma) {
    karma.set({
        frameworks: ['mocha', 'browserify'],
        files: [
            'lib/**/*.test.js'
        ],
        reporters: ['dots'],
        preprocessors: {
            'lib/**/*.test.js': ['browserify']
        },
        browsers: ['Chrome', 'Firefox'],
        logLevel: 'LOG_DEBUG',
        singleRun: true,
        autoWatch: false,
        browserify: {
            debug: true,
            transform: ['babelify']
        }
    });
};