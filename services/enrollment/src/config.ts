export function readPort(value: string | undefined): number {
  if (value === undefined) return 3000;
  if (!/^\d+$/.test(value)) throw new Error('PORT must be an integer from 1 to 65535.');
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer from 1 to 65535.');
  }
  return port;
}

export interface ServiceUrls { course: string; notification: string }

// Defaults use Docker Compose service names, so docker-compose.yml needs no extra variables.
export function readServiceUrls(env: NodeJS.ProcessEnv = process.env): ServiceUrls {
  const trim = (url: string) => url.replace(/\/+$/, '');
  return {
    course: trim(env.COURSE_SERVICE_URL ?? 'http://course:3000'),
    notification: trim(env.NOTIFICATION_SERVICE_URL ?? 'http://notification:3000')
  };
}
