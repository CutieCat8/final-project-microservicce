import { HttpError } from './errors';

export interface EnrollmentInput { studentId: string; courseId: string }

function invalid(message: string): never {
  throw new HttpError(400, 'VALIDATION_ERROR', message);
}

function requiredId(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) invalid(`${field} is required and must be a non-blank string.`);
  const id = value.trim();
  // IDs are used in URLs to Course/Notification, so keep them to safe characters.
  if (id.length > 64 || !/^[A-Za-z0-9_-]+$/.test(id)) {
    invalid(`${field} must contain only letters, digits, "-" or "_", at most 64 characters.`);
  }
  return id;
}

export function validateStudentId(value: unknown): string {
  return requiredId(value, 'studentId');
}

export function validateEnrollment(body: unknown): EnrollmentInput {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    invalid('Request body must be a JSON object.');
  }
  const input = body as Record<string, unknown>;
  return { studentId: requiredId(input.studentId, 'studentId'), courseId: requiredId(input.courseId, 'courseId') };
}
