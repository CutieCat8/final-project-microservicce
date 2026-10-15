import { HttpError } from './errors';

export interface CourseInput {
  courseId: string;
  name: string;
  description: string;
}

function invalid(message: string): never {
  throw new HttpError(400, 'VALIDATION_ERROR', message);
}

export function validateCourseId(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    invalid('courseId is required and must be a non-blank string.');
  }
  const id = value.trim();
  if (id.length > 64 || !/^[A-Za-z0-9_-]+$/.test(id)) {
    invalid('courseId must contain only letters, digits, "-" or "_", at most 64 characters.');
  }
  return id;
}

export function validateCourseInput(body: unknown): CourseInput {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    invalid('Request body must be a JSON object.');
  }
  const input = body as Record<string, unknown>;

  const courseId = validateCourseId(input.courseId);

  if (typeof input.name !== 'string' || !input.name.trim()) {
    invalid('name is required and must be a non-blank string.');
  }
  const name = input.name.trim();
  if (name.length > 200) {
    invalid('name must be at most 200 characters.');
  }

  let description = '';
  if (input.description !== undefined) {
    if (typeof input.description !== 'string') {
      invalid('description must be a string.');
    }
    description = input.description.trim();
    if (description.length > 1000) {
      invalid('description must be at most 1000 characters.');
    }
  }

  return { courseId, name, description };
}
