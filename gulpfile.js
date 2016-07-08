var gulp = require("gulp");
var print = require("gulp-print");
var bump = require("gulp-bump");
var header = require("gulp-header");

gulp.task("prebuild", function(){
    gulp.src([
        "./bower_components/lodash/dist/lodash.min.js",
        "./bower_components/jquery/dist/jquery.min.js",
        "./bower_components/jquery-ui/jquery-ui.min.js",
        "./bower_components/bootstrap/dist/js/bootstrap.min.js",
        "./bower_components/bootstrap-datepicker/dist/js/bootstrap-datepicker.min.js", 
        ])
        .pipe(print())
        .pipe(gulp.dest("./assets/js"));
     gulp.src([
        "./bower_components/bootstrap/dist/css/bootstrap.min.css",
        "./bower_components/bootstrap-datepicker/dist/css/bootstrap-datepicker.min.css",
        "./bower_components/font-awesome/css/font-awesome.min.css", 
        ])
        .pipe(print())
        .pipe(gulp.dest("./assets/css"));
      gulp.src([
        "./bower_components/font-awesome/fonts/*",
        ])
        .pipe(print())
        .pipe(gulp.dest("./assets/fonts"));
});

gulp.task("bump", function() {
  gulp.src("./app/version.json")
  .pipe(bump())
  .pipe(gulp.dest("./app"));
});

var banner = ['/**',
    ' * Copyright © 2015-2016 Noesys Software Pvt.Ltd. - All Rights Reserved',
    ' * -------------',
    ' * This file is part of Infoveave.',
    ' * Infoveave is dual licensed under Infoveave Commercial License and AGPL v3',
    ' * -------------',
    ' * You should have received a copy of the GNU Affero General Public License v3',
    ' * along with this program (Infoveave)',
    ' * You can be released from the requirements of the license by purchasing',
    ' * a commercial license. Buying such a license is mandatory as soon as you',
    ' * develop commercial activities involving the Infoveave without',
    ' * disclosing the source code of your own applications.',
    ' * -------------',
    ' * Authors: Naresh Jois <naresh@noesyssoftware.com>, et al.',
    ' */',
    ''].join('\n');

gulp.task("header", function () {
    gulp.src(["./build/*.js"])
        .pipe(print())
        .pipe(header(banner))
        .pipe(gulp.dest("./build"));
});
