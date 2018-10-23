module.exports = function (grunt)
{
    'use strict';

    // Define Sass implmentation (Dart-Sass).
    const Fiber = require('fibers');
    const sass = require('dart-sass');

    // Load all Grunt tasks.
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // Set up paths.
        paths: {
            src: {
                fonts: 'src/assets/fonts/',
                sass: 'src/assets/sass/',
                js: 'src/assets/js/',
                templates: 'src/templates/'
            },
            dest: {
                css: 'public/assets/css/',
                fonts: 'public/assets/fonts/',
                img: 'public/assets/img/',
                js: 'public/assets/js/',
                templates: 'public/themes/textile-lang-com/'
            }
        },

        // Set up timestamp.
        opt : {
            timestamp: '<%= new Date().getTime() %>'
        },

        // Clean distribution directories/files to start afresh.
        clean: [
            '<%= paths.dest.css %>',
            '<%= paths.dest.fonts %>',
            '<%= paths.dest.img %>',
            '<%= paths.dest.js %>',
            '<%= paths.dest.templates %>'
        ],

        // Run some tasks in parallel to speed up the build process.
        concurrent: {
            dist: [
                'copy',
                'css',
                'jshint'
            ]
        },

        // Copy files.
        copy: {
            // Copy fonts.
            fonts: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= paths.src.fonts %>',
                        src: ['**'],
                        dest: '<%= paths.dest.fonts %>'
                    }
                ]
            },
            // Copy Textile branding assets.
            img: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/assets/img/',
                        src: ['**'],
                        dest: '<%= paths.dest.img %>com/'
                    },
                    {
                        expand: true,
                        cwd: 'node_modules/textile-mark/assets/',
                        src: ['**'],
                        dest: '<%= paths.dest.img %>branding/'
                    },
                    {
                        expand: true,
                        cwd: 'node_modules/textile-mark/assets/apple-touch-icon/',
                        src: ['**'],
                        dest: 'public/'
                    },
                    {
                        expand: true,
                        cwd: 'node_modules/textile-mark/assets/favicon/',
                        src: ['**'],
                        dest: 'public/'
                    },
                    {
                        expand: true,
                        cwd: 'node_modules/textile-mark/assets/windows-site-tile/',
                        src: ['**'],
                        dest: 'public/'
                    }
                ]
            }
        },

        // Check code quality of Gruntfile.js and site-specific JavaScript using JSHint.
        jshint: {
            options: {
                bitwise: true,
                browser: true,
                curly: true,
                eqeqeq: true,
                esversion: 6,
                forin: true,
                globals: {
                    define: true,
                    module: true,
                    require: true,
                    autosize: true,
                    Prism: true,
                    i: true
                },
                latedef: true,
                noarg: true,
                nonew: true,
                strict: false,
                undef: true,
                unused: false
            },
            files: [
                'Gruntfile.js',
                '<%= paths.src.js %>*.js',
                '!<%= paths.src.js %>*.min.js'
            ]
        },

        // Add vendor prefixed styles and other post-processing transformations.
        postcss: {
            options: {
                processors: [
                    require('autoprefixer'),
                    require('cssnano')
                ]
            },
            dist: {
                src: '<%= paths.dest.css %>*.css'
            }
        },

        // Generate filename timestamps within templates files.
        replace: {
            theme: {
                options: {
                    patterns: [
                        {
                            match: 'timestamp',
                            replacement: '<%= opt.timestamp %>'
                        }
                    ]
                },
                files: [
                    // Copy Textpattern templates to themes directory.
                    {
                        expand: true,
                        cwd: '<%= paths.src.templates %>',
                        src: '**',
                        dest: '<%= paths.dest.templates %>'
                    }
                ]
            }
        },

        // Sass configuration.
        sass: {
            options: {
                fiber: Fiber,
                implementation: sass,
                outputStyle: 'expanded', // outputStyle = expanded, nested, compact or compressed.
                sourceMap: false
            },
            dist: {
                files: [
                    {'<%= paths.dest.css %>style.css': '<%= paths.src.sass %>style.scss'}
                ]
            }
        },

        // Validate Sass files via sass-lint.
        sasslint: {
            options: {
                configFile: '.sass-lint.yml'
            },
            target: ['<%= paths.src.sass %>**/*.scss']
        },

        // Uglify and copy JavaScript files from `node_modules` and from `src/js/` to `public/assets/js/`.
        uglify: {
            dist: {
                files: [
                    {
                        '<%= paths.dest.js %>app.js': [
                            'node_modules/autosize/dist/autosize.js',
                            // Prism: Core.
                            'node_modules/prismjs/prism.js',
                            // Prism: Plugins.
                            'node_modules/prismjs/plugins/line-numbers/prism-line-numbers.js',
                            // Prism: Additional languages.
                            'node_modules/prismjs/components/prism-markup-templating.js',
                            'node_modules/prismjs/components/prism-bash.js',
                            'node_modules/prismjs/components/prism-php.js',
                            'node_modules/prismjs/components/prism-textile.js',
                            // Site-specific JavaScript.
                            '<%= paths.src.js %>main.js'
                        ]
                    }
                ]
            }
        },

        // Directories watched and tasks performed by invoking `grunt watch`.
        watch: {
            sass: {
                files: '<%= paths.src.sass %>**/*.scss',
                tasks: 'css'
            },
            js: {
                files: '<%= paths.src.js %>*.js',
                tasks: [
                    'jshint',
                    'uglify'
                ]
            },
            html: {
                files: '<%= paths.src.templates %>**',
                tasks: 'replace'
            }
        }

    });

    // Register tasks.
    grunt.registerTask('build', ['clean', 'concurrent', 'replace', 'uglify']);
    grunt.registerTask('css', ['sasslint', 'sass', 'postcss']);
    grunt.registerTask('default', ['watch']);
    grunt.registerTask('travis', ['build']);
};
