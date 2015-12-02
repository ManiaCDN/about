
module.exports = function (grunt) {
    "use strict";

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        less: {
            development: {
                options: {
                    sourceMap: true,
                    sourceMapFilename: 'public/stylesheets/dist.css.map',
                    sourceMapURL: '/stylesheets/dist.css.map',
                    sourceMapBasepath: 'public',
                    sourceMapRootpath: '/',
                    paths: ["public/stylesheets"]
                },
                files: {
                    "public/stylesheets/dist.css": "public/stylesheets/dev/main.less"
                }
            },
            production: {
                options: {
                    sourceMap: true,
                    sourceMapFilename: 'public/stylesheets/dist.css.map',
                    sourceMapURL: '/stylesheets/dist.css.map',
                    sourceMapBasepath: 'public',
                    sourceMapRootpath: '/',
                    paths: ["public/stylesheets"]
                },
                files: {
                    "public/stylesheets/dist.css": "public/stylesheets/dev/main.less"
                }
            }
        },


        cssmin: {
            production: {
                files: [{
                    expand: true,
                    cwd: 'public/stylesheets',
                    src: ['dist.css'],
                    dest: 'public/stylesheets',
                    ext: '.min.css'
                }]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.registerTask('default', ['less', 'cssmin']);
};
