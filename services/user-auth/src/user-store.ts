import { randomUUID } from 'node:crypto';
import { HttpError } from './errors';

export interface PublicUser { studentId: string; name: string; email: string }
export interface StoredUser extends PublicUser { passwordHash: string }

export function publicUser(user: StoredUser): PublicUser {
  return { studentId: user.studentId, name: user.name, email: user.email };
}

export class UserStore {
  private readonly users = new Map<string, StoredUser>();

  findByEmail(email: string): StoredUser | undefined {
    const user = this.users.get(email);
    return user ? { ...user } : undefined;
  }

  create(name: string, email: string, passwordHash: string): StoredUser {
    // Keep duplicate check and insertion synchronous: parallel requests cannot overwrite users.
    if (this.users.has(email)) throw new HttpError(409, 'EMAIL_EXISTS', 'This email is already registered.');
    const user: StoredUser = { studentId: `S${randomUUID()}`, name, email, passwordHash };
    this.users.set(email, user);
    return { ...user };
  }
}
