const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');

async function smoke(baseUrl) {
  const account = {
    name: 'Smoke Student', email: `smoke-${randomUUID()}@example.test`, password: randomUUID()
  };
  async function request(path, body) {
    const response = await fetch(new URL(path, baseUrl), {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15_000)
    });
    return { status: response.status, body: await response.json() };
  }
  const health = await request('/health');
  assert.equal(health.status, 200);
  assert.deepEqual(health.body, { status: 'ok', service: 'user-auth' });
  const registration = await request('/api/auth/register', account);
  assert.equal(registration.status, 201);
  assert.deepEqual(Object.keys(registration.body.user).sort(), ['email', 'name', 'studentId']);
  const login = await request('/api/auth/login', { email: account.email, password: account.password });
  assert.equal(login.status, 200);
  assert.deepEqual(login.body.user, registration.body.user);
  const wrong = await request('/api/auth/login', { email: account.email, password: 'wrong-password' });
  assert.equal(wrong.status, 401);
  assert.equal(wrong.body.error.code, 'INVALID_CREDENTIALS');
  const missing = await request('/api/auth/login', { email: account.email });
  assert.equal(missing.status, 400);
  assert.equal(missing.body.error.code, 'VALIDATION_ERROR');
  const duplicate = await request('/api/auth/register', account);
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.error.code, 'EMAIL_EXISTS');
  console.log('Smoke passed: health, register, login, wrong password, missing field, duplicate email.');
}

module.exports = { smoke };
if (require.main === module) {
  smoke(process.argv[2] ?? 'http://127.0.0.1:3000').catch((error) => {
    console.error(`Smoke failed: ${error.message}`);
    process.exitCode = 1;
  });
}
