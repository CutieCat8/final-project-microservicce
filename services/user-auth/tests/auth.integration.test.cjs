const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const { once } = require('node:events');
const { createApp } = require('../dist/app');
const { UserStore } = require('../dist/user-store');

const store = new UserStore();
let server;
let baseUrl;
const account = { name: 'Demo Student', email: 'ada@example.test', password: 'demo-password' };

before(async () => {
  server = createApp(store).listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve) => server.close(resolve)));

async function post(path, body) {
  const response = await fetch(`${baseUrl}/api/auth/${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  return { status: response.status, body: await response.json() };
}

test('register creates a public student and stores only a password hash', async () => {
  const result = await post('register', account);
  assert.equal(result.status, 201);
  assert.deepEqual(Object.keys(result.body.user).sort(), ['email', 'name', 'studentId']);
  assert.equal(result.body.user.email, account.email);
  assert.match(result.body.user.studentId, /^S[0-9a-f-]+$/);
  const stored = store.findByEmail(account.email);
  assert.equal('password' in stored, false);
  assert.equal(stored.passwordHash.includes(account.password), false);
  assert.match(stored.passwordHash, /^scrypt\$/);
});

test('login succeeds and returns the same studentId', async () => {
  const result = await post('login', { email: account.email, password: account.password });
  assert.equal(result.status, 200);
  assert.equal(result.body.user.studentId, store.findByEmail(account.email).studentId);
  assert.deepEqual(Object.keys(result.body.user).sort(), ['email', 'name', 'studentId']);
});

test('wrong password returns 401 with a generic error', async () => {
  const result = await post('login', { email: account.email, password: 'wrong-password' });
  assert.equal(result.status, 401);
  assert.equal(result.body.error.code, 'INVALID_CREDENTIALS');
  assert.equal('user' in result.body, false);
});

test('missing login password returns 400', async () => {
  const result = await post('login', { email: account.email });
  assert.equal(result.status, 400);
  assert.equal(result.body.error.code, 'VALIDATION_ERROR');
});

test('duplicate email is rejected without replacing the original user', async () => {
  const original = store.findByEmail(account.email);
  const result = await post('register', { ...account, email: ' ADA@EXAMPLE.TEST ' });
  assert.equal(result.status, 409);
  assert.equal(result.body.error.code, 'EMAIL_EXISTS');
  assert.deepEqual(store.findByEmail(account.email), original);
});
