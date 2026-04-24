'use strict';

const express = require('express');
const compression = require('compression');
const path = require('path');

const app = express();

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

const _apiBundle = require('./api-bundle.cjs');
const apiRouter = _apiBundle.default || _apiBundle;
app.use('/api', apiRouter);

app.use('/api', function (req, res) {
  res.status(404).json({ error: 'Endpoint not found: ' + req.method + ' /api' + req.path });
});

app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '7d',
  etag: true,
  lastModified: true,
  index: false,
}));

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(function (err, req, res, _next) {
  console.error('[error]', err.message || err);
  if (res.headersSent) return;
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: status === 500 ? 'Internal server error' : err.message });
});

let httpServer = null;

function shutdown(signal) {
  console.log('[shutdown] Received ' + signal + ', closing server gracefully...');
  if (httpServer) {
    httpServer.close(function () {
      console.log('[shutdown] HTTP server closed. Exiting.');
      process.exit(0);
    });
    setTimeout(function () {
      console.error('[shutdown] Forced exit after timeout.');
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', function () { shutdown('SIGTERM'); });
process.on('SIGINT',  function () { shutdown('SIGINT'); });

process.on('uncaughtException', function (err) {
  console.error('[uncaughtException]', err);
  process.exit(1);
});

process.on('unhandledRejection', function (reason) {
  console.error('[unhandledRejection]', reason);
});

module.exports = app;

if (require.main === module) {
  const port = parseInt(process.env.PORT || '3000', 10);
  httpServer = app.listen(port, function () {
    console.log('[start] MetalRecovery Pro listening on port ' + port);
  });
  httpServer.keepAliveTimeout = 65000;
  httpServer.headersTimeout = 66000;
}
