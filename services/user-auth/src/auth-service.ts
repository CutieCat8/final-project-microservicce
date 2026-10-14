import { HttpError } from './errors';
import { hashPassword, verifyPassword } from './password';
import { publicUser, UserStore, type PublicUser } from './user-store';
import { validateLogin, validateRegister } from './validation';

export class AuthService {
  constructor(private readonly store: UserStore) {}

  async register(body: unknown): Promise<PublicUser> {
    const input = validateRegister(body);
    if (this.store.findByEmail(input.email)) {
      throw new HttpError(409, 'EMAIL_EXISTS', 'This email is already registered.');
    }
    const passwordHash = await hashPassword(input.password);
    return publicUser(this.store.create(input.name, input.email, passwordHash));
  }

  async login(body: unknown): Promise<PublicUser> {
    const input = validateLogin(body);
    const user = this.store.findByEmail(input.email);
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
    }
    return publicUser(user);
  }
}
