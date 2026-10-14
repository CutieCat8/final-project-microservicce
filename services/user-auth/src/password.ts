import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const options = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, options, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt);
  return `scrypt$${salt}$${key.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt' ||
      !/^[a-f0-9]{32}$/.test(parts[1]) || !/^[a-f0-9]{128}$/.test(parts[2])) return false;
  const expected = Buffer.from(parts[2], 'hex');
  const actual = await derive(password, parts[1]);
  return timingSafeEqual(actual, expected);
}
