const path = require('path');

module.exports = {
  target: 'node',
  mode: 'production',
  entry: './bin/script/cli.js', // make sure this matches the main root of your code
  output: {
    path: path.join(__dirname, 'dist'), // this can be any path and directory you want
    filename: 'code-push-standalone.js',
  },
  optimization: {
    minimize: true, // enabling this reduces file size and readability
  },
};
