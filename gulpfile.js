const gulp = require('gulp');
const builder = require('./builder/main.js');

gulp.task('build', function(done) {
  builder({
    src: './',
    dest: 'build'
  })
  .then(() => {
    console.log('Build complete');
    done();
  });
});
