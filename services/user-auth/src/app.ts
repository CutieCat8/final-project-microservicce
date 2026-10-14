import express, { type ErrorRequestHandler, type RequestHandler } from 'express';
import { AuthService } from './auth-service';
import { HttpError } from './errors';
import { UserStore } from './user-store';

export function createApp(store = new UserStore()) {
  const app = express();
  const auth = new AuthService(store);
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'user-auth' });
  });
  app.use('/api/auth', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  const requireJson: RequestHandler = (req, _res, next) => {
    if (!req.is('application/json')) {
      next(new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Use Content-Type: application/json.'));
      return;
    }
    next();
  };
  app.post('/api/auth/register', requireJson, async (req, res) => {
    res.status(201).json({ user: await auth.register(req.body) });
  });
  app.post('/api/auth/login', requireJson, async (req, res) => {
    res.json({ user: await auth.login(req.body) });
  });
  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'ROUTE_NOT_FOUND', message: 'API route not found.' }
    });
  });
  const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof HttpError) {
      res.status(error.status).json({ error: { code: error.code, message: error.message } });
    } else if (error?.type === 'entity.parse.failed') {
      res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } });
    } else if (error?.type === 'entity.too.large') {
      res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body exceeds 16 KB.' } });
    } else if (error?.status === 415) {
      res.status(415).json({ error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Unsupported request encoding.' } });
    } else {
      console.error('User/Auth request failed with an internal error.');
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An internal error occurred.' } });
    }
  };
  app.use(handleError);
  return app;
}
