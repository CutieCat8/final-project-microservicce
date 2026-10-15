import express, { type ErrorRequestHandler, type RequestHandler } from 'express';
import { CourseService } from './course-service';
import { CourseStore } from './course-store';
import { HttpError } from './errors';

export function createApp(store = new CourseStore()) {
  const app = express();
  const service = new CourseService(store);

  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'course' });
  });

  app.use('/api/courses', (_req, res, next) => {
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

  app.get('/api/courses', (req, res) => {
    const term = typeof req.query.term === 'string' ? req.query.term : undefined;
    const courses = service.list(term);
    res.json({ courses });
  });

  app.get('/api/courses/:courseId', (req, res, next) => {
    try {
      const course = service.get(req.params.courseId);
      res.json({ course });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/courses', requireJson, (req, res, next) => {
    try {
      const course = service.create(req.body);
      res.status(201).json({ course });
    } catch (err) {
      next(err);
    }
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
      console.error('Course request failed with an internal error.');
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An internal error occurred.' } });
    }
  };
  app.use(handleError);

  return app;
}
