"use strict";
let path = require('path');
let express = require('express');
let webpack = require('webpack');
let configFromArg = process.argv[2];
let port = process.argv[3];
let html = process.argv[4];
let config = require('./config/' + configFromArg);

let app = express();
let compiler = webpack(config);
app.all('/', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
 });
app.use(require('webpack-dev-middleware')(compiler, {
  noInfo: true,
  publicPath: config.output.publicPath
}));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(require('webpack-hot-middleware')(compiler));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, html + '.html'));
});

app.listen(port, 'localhost', err => {
  if (err) {
    console.log(err);
    return;
  }

  console.log(`Infoveave Development Instance - config ${configFromArg}  - Listening at http://localhost:${port}`);
});
