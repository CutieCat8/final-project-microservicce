import { createApp } from './app';
import { readPort } from './config';

const port = readPort(process.env.PORT);
const server = createApp().listen(port, '0.0.0.0', () => {
  console.log(`Enrollment service listening on port ${port}`);
});
server.on('error', (error: NodeJS.ErrnoException) => {
  console.error(`Enrollment service could not start (${error.code ?? 'UNKNOWN'}).`);
  process.exitCode = 1;
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
