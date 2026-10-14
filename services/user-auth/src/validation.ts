import { HttpError } from './errors';

export interface LoginInput { email: string; password: string }
export interface RegisterInput extends LoginInput { name: string }

function invalid(message: string): never {
  throw new HttpError(400, 'VALIDATION_ERROR', message);
}

function objectBody(body: unknown): Record<string, unknown> {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    invalid('Request body must be a JSON object.');
  }
  return body as Record<string, unknown>;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateLogin(body: unknown): LoginInput {
  const input = objectBody(body);
  if (typeof input.email !== 'string') invalid('email is required and must be a string.');
  const email = normalizeEmail(input.email);
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    invalid('email must be a valid email address, at most 254 characters.');
  }
  if (typeof input.password !== 'string' || !input.password.trim() || input.password.length > 128) {
    invalid('password is required and must be a non-blank string, at most 128 characters.');
  }
  // Passwords are never trimmed or converted to lowercase.
  return { email, password: input.password };
}

export function validateRegister(body: unknown): RegisterInput {
  const input = objectBody(body);
  const login = validateLogin(input);
  if (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 100) {
    invalid('name is required and must contain 1 to 100 characters.');
  }
  if (login.password.length < 8) invalid('password must contain at least 8 characters.');
  return { ...login, name: input.name.trim() };
}
