import express, { type Request, type RequestHandler, type Response } from 'express';
import path from 'node:path';
import { buildServiceUrl, serviceUrls, type ServiceName } from './config';

function proxyTo(service: ServiceName): RequestHandler {
  return async (req: Request, res: Response): Promise<void> => {
    const target = buildServiceUrl(serviceUrls[service], req.originalUrl);
    const headers: Record<string, string> = {};

    for (const name of ['accept', 'authorization', 'content-type', 'cookie', 'x-request-id']) {
      const value = req.headers[name];
      if (typeof value === 'string') headers[name] = value;
    }

    const body = !['GET', 'HEAD'].includes(req.method) && req.body !== undefined
      ? JSON.stringify(req.body)
      : undefined;

    try {
      const upstream = await fetch(target, {
        method: req.method,
        headers,
        body,
        redirect: 'manual',
        signal: AbortSignal.timeout(15_000)
      });

      res.status(upstream.status);
      for (const name of ['content-type', 'cache-control', 'location', 'set-cookie']) {
        const value = upstream.headers.get(name);
        if (value) res.setHeader(name, value);
      }
      res.send(Buffer.from(await upstream.arrayBuffer()));
    } catch {
      res.status(502).json({
        error: {
          code: 'UPSTREAM_UNAVAILABLE',
          message: `The ${service} service is unavailable.`
        }
      });
    }
  };
}

export function createApp() {
  const app = express();
  const publicDir = path.resolve(__dirname, '../public');

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use(express.static(publicDir));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'gateway-web' });
  });

  app.use('/api/auth', proxyTo('auth'));
  app.use('/api/courses', proxyTo('courses'));
  app.use('/api/enrollments', proxyTo('enrollments'));
  app.use('/api/notifications', proxyTo('notifications'));
  app.use('/api', (_req, res) => {
    res.status(404).json({
      error: { code: 'ROUTE_NOT_FOUND', message: 'API route not found.' }
    });
  });
  app.use((_req, res) => res.status(404).send('Not found'));
  return app;
}
