const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const { once } = require('node:events');
const { createApp } = require('../dist/app');
const { UserStore } = require('../dist/user-store');
const { AuthService } = require('../dist/auth-service');

const store = new UserStore();
let server;
let baseUrl;
const account = { name: 'Demo Student', email: 'ada@example.test', password: 'demo-password' };

before(async () => {
  await new AuthService(store).register(account);
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
  const newAccount = { ...account, email: 'new@example.test' };
  const result = await post('register', newAccount);
  assert.equal(result.status, 201);
  assert.deepEqual(Object.keys(result.body.user).sort(), ['email', 'name', 'studentId']);
  assert.equal(result.body.user.email, newAccount.email);
  assert.match(result.body.user.studentId, /^S[0-9a-f-]+$/);
  const stored = store.findByEmail(newAccount.email);
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

test('unknown account and wrong password use the same error response', async () => {
  const missing = await post('login', { email: 'unknown@example.test', password: account.password });
  const wrong = await post('login', { email: account.email, password: 'wrong-password' });
  assert.deepEqual(missing, wrong);
});

test('login accepts normalized email', async () => {
  const result = await post('login', { email: ' ADA@EXAMPLE.TEST ', password: account.password });
  assert.equal(result.status, 200);
  assert.equal(result.body.user.email, account.email);
});

for (const [name, input] of [
  ['name missing', { email: 'bad@example.test', password: account.password }],
  ['name numeric', { ...account, name: 123 }],
  ['name blank', { ...account, name: '  ' }],
  ['email missing', { name: account.name, password: account.password }],
  ['email invalid', { ...account, email: 'bad-address' }],
  ['password missing', { name: account.name, email: account.email }],
  ['password short', { ...account, password: '1234567' }],
  ['password numeric', { ...account, password: 12345678 }],
  ['password blank', { ...account, password: '        ' }],
  ['password excessive', { ...account, password: 'x'.repeat(129) }],
  ['array body', []],
  ['empty object', {}]
]) {
  test(`invalid registration: ${name}`, async () => {
    const result = await post('register', input);
    assert.equal(result.status, 400);
    assert.equal(result.body.error.code, 'VALIDATION_ERROR');
    assert.equal('user' in result.body, false);
  });
}

test('parallel duplicate registrations produce one user and one conflict', async () => {
  const input = { ...account, email: 'parallel@example.test' };
  const results = await Promise.all([post('register', input), post('register', input)]);
  assert.deepEqual(results.map((result) => result.status).sort(), [201, 409]);
  const created = results.find((result) => result.status === 201).body.user;
  assert.equal(store.findByEmail(input.email).studentId, created.studentId);
  assert.equal((await post('login', input)).body.user.studentId, created.studentId);
});

test('client-supplied identity and passwordHash cannot override server values', async () => {
  const result = await post('register', { ...account, email: 'extra@example.test', studentId: 'admin', passwordHash: 'plaintext', role: 'admin' });
  assert.equal(result.status, 201);
  assert.notEqual(result.body.user.studentId, 'admin');
  assert.deepEqual(Object.keys(result.body.user).sort(), ['email', 'name', 'studentId']);
  assert.notEqual(store.findByEmail('extra@example.test').passwordHash, 'plaintext');
});

test('malformed JSON returns JSON error without reflecting request secrets', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"password":"sensitive-demo-value",'
  });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error.code, 'INVALID_JSON');
  assert.equal(JSON.stringify(body).includes('sensitive-demo-value'), false);
});

test('oversized JSON body returns 413', async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'x'.repeat(17_000) })
  });
  assert.equal(response.status, 413);
  assert.equal((await response.json()).error.code, 'PAYLOAD_TOO_LARGE');
});

test('unsupported content type returns 415', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'email=ada@example.test'
  });
  assert.equal(response.status, 415);
  assert.equal((await response.json()).error.code, 'UNSUPPORTED_MEDIA_TYPE');
});

test('unknown route returns contract-shaped 404', async () => {
  const response = await fetch(`${baseUrl}/api/auth/unknown`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, 'ROUTE_NOT_FOUND');
});

test('login response is not cacheable', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(account)
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  await response.json();
});
