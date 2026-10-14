import express from 'express';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'user-auth' });
  });
  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'ROUTE_NOT_FOUND', message: 'API route not found.' }
    });
  });
  return app;
}
