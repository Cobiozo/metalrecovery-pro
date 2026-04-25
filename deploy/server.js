'use strict';

var express = require('express');
var compression = require('compression');
var path = require('path');

var app = express();

app.disable('x-powered-by');

app.use(function (req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(compression({ threshold: 1024 }));

app.use('/api', function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

var apiRouterModule = require('./api-bundle.cjs');
var apiRouter = apiRouterModule.default || apiRouterModule;
app.use('/api', apiRouter);

app.use('/api', function (req, res) {
  res.status(404).json({ error: 'Endpoint not found: ' + req.method + ' /api' + req.path });
});

var publicDir = path.join(__dirname, 'public');

app.use(
  express.static(publicDir, {
    maxAge: '7d',
    etag: true,
    lastModified: true,
    index: false,
  })
);

app.use(function (req, res) {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use(function (err, req, res, next) {
  console.error('[error]', err.message || err);
  if (res.headersSent) return;
  var status = err.status || err.statusCode || 500;
  res.status(status).json({ error: status === 500 ? 'Internal server error' : err.message });
});

process.on('uncaughtException', function (err) {
  console.error('[uncaughtException]', err);
  process.exit(1);
});

process.on('unhandledRejection', function (reason) {
  console.error('[unhandledRejection]', reason);
});

var port = parseInt(process.env.PORT || '3000', 10);
var server = app.listen(port, function () {
  console.log('[start] MetalRecovery Pro listening on port ' + port);
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

process.on('SIGTERM', function () {
  server.close(function () { process.exit(0); });
});

process.on('SIGINT', function () {
  server.close(function () { process.exit(0); });
});
