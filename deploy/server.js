'use strict';

const express = require('express');
const compression = require('compression');
const path = require('path');

const app = express();

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const _apiBundle = require('./api-bundle.cjs');
const apiRouter = _apiBundle.default || _apiBundle;
app.use('/api', apiRouter);

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;

if (require.main === module) {
  const port = parseInt(process.env.PORT || '3000', 10);
  app.listen(port, function () {
    console.log('MetalRecovery Pro server listening on port ' + port);
  });
}
