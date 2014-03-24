module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    lesslint: {
      src: ['assets/less/**/*.less'],
      options: {
        csslint: {
          'qualified-headings': false,
          'unique-headings': false,
          'ids': false
        }
      }
    },

    less: {
      production: {
        options: {
          // cleancss: true,
          // compress: true,
          // report: 'gzip'
        },
        files: {
          "assets/temp/build.css": "assets/less/main.less",
          "assets/temp/build-fontawesome.css": "assets/less/font-awesome/font-awesome.less"
        }
      }
    },

    uncss: {
      dist: {
        files: {
          'assets/temp/fontawesome.css': ['_layouts/main.html','_layouts/archive.html','_layouts/post.html','_includes/share_box.html']
        }
      },
      options: {
        stylesheets: ['../assets/temp/build-fontawesome.css']
      }
    },

    myth: {
        production: {
            files: {
                // 'destination': 'source'
                'assets/temp/main.css': 'assets/temp/build.css'
            }
        }
    },

    concat: {
        css: {
           src: [
                 'assets/temp/fontawesome.css', 
                 'assets/temp/main.css', 
                 'assets/css/normalize.css', 
                 'assets/css/syntax.css'
                ],
            dest: 'assets/css/combined.css'
        }
    },

    cssmin : {
        css:{
            src: 'assets/css/combined.css',
            dest: 'assets/css/combined.min.css'
        }
    },
  });

  grunt.loadNpmTasks('grunt-lesslint')
  grunt.loadNpmTasks('grunt-myth');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-uncss');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('default', 'Log some stuff.', function() {
    grunt.log.write('Logging some stuff...').ok();
  });


  grunt.registerTask('validate-less', ['lesslint']);

  grunt.registerTask('build', ['less', 'uncss', 'myth', 'concat:css', 'cssmin:css'])

};