const path = require('path');
const express = require('express');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
