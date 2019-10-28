'use strict';

const gulp = require('gulp');
const del = require('del');
const util = require('gulp-util');
const sass = require('gulp-sass');
const prefixer = require('gulp-autoprefixer');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const handlebars = require('gulp-compile-handlebars');
const browserSync = require('browser-sync');
const ghPages = require('gulp-gh-pages');
const sassGlob = require('gulp-sass-bulk-import');
const watch = require('gulp-watch');
const babel = require('gulp-babel');
const cssnano = require('gulp-cssnano');
const sourcemaps = require('gulp-sourcemaps');
const imagemin = require('gulp-imagemin');
const htmlmin = require('gulp-htmlmin');
const newer = require('gulp-newer');

var paths = {
  templates: 'views',
  js: 'js',
  cname: 'CNAME',
  css: 'css',
  img: 'img',
  files: 'public',
  src: {},
  dist: {
    root: 'dist'
  },
  init: function () {
    this.src.sass = this.css + '/main.scss';
    this.src.cname = this.cname;
    this.src.csslibs = this.css + '/libs/**/*';
    this.src.templates = this.templates + '/**/*.hbs';
    this.src.javascript = [this.js + '/**/*.js', '!' + this.js + '/libs/*.js'];
    this.src.jslibs = this.js + '/libs/*.{js, map}';
    this.src.images = this.img + '/**/*.{jpg,jpeg,svg,png,gif}';
    this.src.files = this.files + '/**/*';

    this.dist.cname = this.dist.root;
    this.dist.css = this.dist.root + '/css';
    this.dist.csslibs = this.dist.root + '/css/libs';
    this.dist.images = this.dist.root + '/img';
    this.dist.javascript = this.dist.root + '/js';
    this.dist.jslibs = this.dist.root + '/js/libs';
    this.dist.files = this.dist.root + '';

    return this;
  },
}.init();

gulp.task('serve', () => {
  browserSync.init({
    server: paths.dist.root,
    open: false,
  });
});

gulp.task('styles', () => {
  gulp.src([paths.src.sass])
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(paths.dist.css))
    .pipe(cssnano())
    .pipe(rename({
      suffix: '.min',
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.dist.css))
    .pipe(browserSync.reload({
      stream: true
    }));

  gulp.src([paths.src.csslibs])
    .pipe(gulp.dest(paths.dist.csslibs))
    .pipe(browserSync.reload({
      stream: true
    }));
});


/*
 * Compile handlebars/partials into html
 */
gulp.task('templates', () => {
  var opts = {
    ignorePartials: true,
    batch: [paths.templates + '/partials', paths.templates + '/components'],
  };

  gulp.src([paths.src.templates])
    .pipe(handlebars(null, opts))
    .on('error', util.log)
    .pipe(rename({
      extname: '.html',
    }))
    .on('error', util.log)
    .pipe(htmlmin({collapseWhitespace: true, removeComments: true}))
    .pipe(gulp.dest(paths.dist.root))
    .pipe(browserSync.reload({
      stream: true
    }));
});


/*
 * Bundle all javascript files
 */
gulp.task('scripts', () => {
  gulp.src(paths.src.javascript)
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['env']
    }))
    .pipe(gulp.dest(paths.dist.javascript))
    .pipe(uglify())
    .on('error', util.log)
    .pipe(rename({
      suffix: '.min',
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.dist.javascript))
    .pipe(browserSync.reload({
      stream: true
    }));


  gulp.src([paths.src.jslibs])
    .pipe(gulp.dest(paths.dist.jslibs))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('images', () => {
  gulp.src([paths.src.images])
    .pipe(imagemin())
    .pipe(gulp.dest(paths.dist.images));
});

gulp.task('files', () => {
  gulp.src([paths.src.files])
    .pipe(gulp.dest(paths.dist.files));
});

gulp.task('cname', () => {
  gulp.src([paths.src.cname])
    .pipe(gulp.dest(paths.dist.cname));
});

watch(paths.src.images, () => {
  gulp.start('images');
});

watch(paths.src.files, () => {
  gulp.start('files');
});

gulp.task('watch', () => {
  gulp.watch(paths.css + '/**/*.scss', ['styles']);
  gulp.watch(paths.src.javascript, ['scripts']);
  gulp.watch(paths.src.templates, ['templates']);
  gulp.watch(paths.src.cname, ['cname']);
});

gulp.task('deploy', () => {
  return gulp.src([paths.dist.root + '/**/*'])
    .pipe(ghPages());
});

gulp.task('clean', () => {
  return del([
    'dist/**/*'
  ]);
});

gulp.task('default', ['watch', 'serve', 'images', 'files', 'styles', 'scripts', 'templates', 'cname']);