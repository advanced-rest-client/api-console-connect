'use strict';

const del = require('del');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const mergeStream = require('merge-stream');
const polymerBuild = require('polymer-build');
const stripComments = require('gulp-strip-comments');
const uglify = require('gulp-uglify');
// const cssSlam = require('css-slam').gulp;
const htmlMinifier = require('gulp-html-minifier');
const through = require('through2');

/**
 * Vulcanizer replaces all `-->` into `\x3e0` which cause JS error.
 * Need to find `-->` and replace it with `-- >`.
 *
 * This should be done for JS files only.
 *
 * https://github.com/Polymer/polymer-bundler/issues/304
 */
function fixJsMinification() {
  var stream = through.obj(function(file, enc, cb) {
    if (file.isBuffer()) {
      file.contents = new Buffer(String(file.contents).replace(/-->/gm, '-- >'));
    }
    this.push(file);
    cb();
  });
  return stream;
}

function setElementPaths() {
  var stream = through.obj(function(file, enc, cb) {
    if (file.isBuffer()) {
      let html = String(file.contents);
      // import path for the enhancer
      html = html.replace(/import-location="\/components\/raml-json-enhance\/"/gm,
      'import-location="/bower_components/raml-json-enhance/"');
      // Code mirror
      html = html.replace(/<code-mirror/gm,
        '<code-mirror import-location="/bower_components/codemirror/"');
      file.contents = new Buffer(html);
    }
    this.push(file);
    cb();
  });
  return stream;
}

// function dumpFile() {
//   var stream = through.obj(function(file, enc, cb) {
//     console.log(file);
//     console.log(String(file.contents));
//     this.push(file);
//     cb();
//   });
//   return stream;
// }

class ACBuilder {

  constructor(opts) {
    opts = this._setDefaultOptions(opts);
    /**
     * Source directory of the application
     */
    this.appSource = opts.src;
    /**
     * Output directory.
     */
    this.buildDir = opts.dest;
    /**
     * Main file name of the build.
     */
    this.mainFile = opts.mainFile;

    this._initializeBuilder();
  }

  _setDefaultOptions(opts) {
    opts = opts || {};
    if (!('src' in opts)) {
      opts.src = './';
    }
    if (!('dest' in opts)) {
      opts.dest = 'build';
    }
    if (!('mainFile' in opts)) {
      opts.mainFile = 'index.html';
    }
    return opts;
  }

  _initializeBuilder() {
    var options = {
      entrypoint: 'index.html',
      shell: 'index.html',
      fragments: [],
      extraDependencies: [
        'bower_components/raml-js-parser/raml-1-parser.js',
        'bower_components/webcomponentsjs/webcomponents-lite.min.js',
        'bower_components/codemirror/mode/javascript/**.js ',
        'bower_components/oauth-authorization/oauth-popup.html',
        'bower_components/xml-viewer/workers/**.js',
        'bower_components/response-body-view/html-preview.html',
        'bower_components/response-body-view/html-preview.js',
        'bower_components/raml-json-enhance/raml-object-worker.js',
        'bower_components/raml-js-parser/polyfills.js',
        'bower_components/raml-json-enhance/polyfills.js',
        'bower_components/raml-json-enhance/browser/*',
        'bower_components/raml-json-enhance/browser/**',
        'bower_components/raml-json-enhance/raml2object.js',
        'bower_components/prism-highlight/workers/**.js',
        'bower_components/prism/*',
        'bower_components/prism/**',
        'bower_components/code-mirror/styles/*'
      ]
    };
    this.polymerProject = new polymerBuild.PolymerProject(options);
  }

  /**
   * Waits for the given ReadableStream
   */
  waitFor(stream) {
    return new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });
  }

  build() {
    return new Promise((resolve) => {
      let sourcesStreamSplitter = new polymerBuild.HtmlSplitter();
      let dependenciesStreamSplitter = new polymerBuild.HtmlSplitter();
      console.log(`Deleting ${this.buildDir} directory...`);
      del([this.buildDir])
      .then(() => {
        let ugly = uglify()
        .on('error', function(err) {
          console.log('Unable to optymize the file.', err);
        });
        let htmlComments = stripComments.html()
        .on('error', function(err) {
          console.log('Unable to remove comments.', err);
        });
        let jsComments = stripComments()
        .on('error', function(err) {
          console.log('Unable to remove comments.', err);
        });
        let miniHtml = htmlMinifier().on('error', function(err) {
          console.log('Unable to remove comments.', err);
        });
        let sourcesStream = this.polymerProject.sources()
        .on('error', function(err) {
          console.log('Some error', err);
        })
        .pipe(sourcesStreamSplitter.split())
        .pipe(gulpif(/\.js$/, jsComments))
        .pipe(gulpif(/\.js$/, fixJsMinification()))
        // .pipe(gulpif(/\.js$/, ugly))
        .pipe(gulpif(/\.html$/, htmlComments))
        .pipe(gulpif(/\.html$/, setElementPaths()))
        // .pipe(gulpif(/\.html$/, miniHtml))
        // .pipe(gulpif(/\.css$/, cssSlam()))
        .pipe(sourcesStreamSplitter.rejoin());

        let dependenciesStream = this.polymerProject.dependencies()
        .on('error', function(err) {
          console.log('Some error', err);
        })
        .pipe(dependenciesStreamSplitter.split())
        .pipe(gulpif(/\.js$/, jsComments))
        .pipe(gulpif(/\.js$/, fixJsMinification()))
        // .pipe(gulpif(/\.js$/, ugly))
        .pipe(gulpif(/\.html$/, htmlComments))
        .pipe(gulpif(/\.html$/, setElementPaths()))
        // .pipe(gulpif(/\.css$/, cssSlam()))
        // .pipe(gulpif(/\.html$/, miniHtml))
        .pipe(dependenciesStreamSplitter.rejoin());

        let buildStream = mergeStream(sourcesStream, dependenciesStream)
        .on('error', function(err) {
          console.log('Some error', err);
        })
        .once('data', () => {
          console.log('Analyzing build dependencies...');
        });

        buildStream = buildStream.pipe(this.polymerProject.bundler());
        buildStream = buildStream.pipe(gulp.dest(this.buildDir));

        return this.waitFor(buildStream);
      })
      .then(() => {
        console.log('Build complete!');
        resolve();
      });
    });
  }
}

exports.ACBuilder = ACBuilder;
