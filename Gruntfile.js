module.exports = function(grunt) {
  grunt.initConfig({
    "angular-builder": {
      options: {
        mainModule: "DocApp",
        externalModules: ["ngRoute"]
      },
      app: {
        src: "./assets/js/**/*.js",
        dest: "./dist/project.js"
      }
    },
    jshint: {
      options: {
        predef: ["document", "console", "firebase", "_"],
        esnext: true,
        globalstrict: true,
        globals: { angular: true }
      },
      files: ["./assets/js/**/*.js"]
    },
    sass: {
      dist: {
        files: {
          "./assets/stylesheets/app.css": "./assets/sass/app.scss"
        }
      }
    },
    watch: {
      javascripts: {
        files: ["./assets/js/**/*.js"],
        tasks: ["jshint", "angular-builder"]
      },
      sass: {
        files: ["./assets/sass/**/*.scss"],
        tasks: ["sass"]
      }
    }
  });

  require("matchdep")
    .filterDev("grunt-*")
    .forEach(grunt.loadNpmTasks);

  grunt.registerTask("default", ["jshint", "sass", "angular-builder", "watch"]);
};
