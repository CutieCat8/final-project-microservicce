export type ServiceName = 'auth' | 'courses' | 'enrollments' | 'notifications';

export const serviceUrls: Record<ServiceName, string> = {
  auth: process.env.AUTH_SERVICE_URL ?? 'http://user-auth:3000',
  courses: process.env.COURSE_SERVICE_URL ?? 'http://course:3000',
  enrollments: process.env.ENROLLMENT_SERVICE_URL ?? 'http://enrollment:3000',
  notifications: process.env.NOTIFICATION_SERVICE_URL ?? 'http://notification:3000'
};

export function buildServiceUrl(baseUrl: string, originalUrl: string): string {
  const base = new URL(baseUrl);
  const request = new URL(originalUrl, 'http://gateway.local');
  base.pathname = `${base.pathname.replace(/\/$/, '')}${request.pathname}`;
  base.search = request.search;
  return base.toString();
}
