const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const { once } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { createApp } = require('../dist/app');

let authServer;
let gatewayServer;
let baseUrl;
let temporaryDir;
let gatewayConfig;
let authUrl;
let studentId;
const account = { name: 'Gateway Student', email: 'gateway@example.test', password: 'demo-password' };

async function start(app) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server;
}
function close(server) {
  return server ? new Promise((resolve) => server.close(resolve)) : Promise.resolve();
}
async function post(route, body) {
  const response = await fetch(`${baseUrl}/api/auth/${route}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  return { status: response.status, headers: response.headers, body: await response.json() };
}

before(async () => {
  authServer = await start(createApp());
  authUrl = `http://127.0.0.1:${authServer.address().port}`;

  // Compile the team's actual Gateway sources into an ignored temporary folder.
  // Reuse Auth's Express/TypeScript dependencies: npm test needs no second install or network.
  const serviceRoot = path.resolve(__dirname, '..');
  const gatewayRoot = path.resolve(serviceRoot, '../gateway-web');
  const tempRoot = path.join(serviceRoot, 'tmp');
  fs.mkdirSync(tempRoot, { recursive: true });
  temporaryDir = fs.mkdtempSync(path.join(tempRoot, 'gateway-'));
  fs.mkdirSync(path.join(temporaryDir, 'dist'));
  fs.mkdirSync(path.join(temporaryDir, 'public'));
  for (const name of ['app', 'config']) {
    const source = fs.readFileSync(path.join(gatewayRoot, 'src', `${name}.ts`), 'utf8');
    const output = ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true }
    });
    fs.writeFileSync(path.join(temporaryDir, 'dist', `${name}.js`), output.outputText);
  }
  fs.copyFileSync(path.join(gatewayRoot, 'public', 'index.html'), path.join(temporaryDir, 'public', 'index.html'));
  const previous = process.env.AUTH_SERVICE_URL;
  process.env.AUTH_SERVICE_URL = authUrl;
  let createGateway;
  try {
    createGateway = require(path.join(temporaryDir, 'dist', 'app.js')).createApp;
    gatewayConfig = require(path.join(temporaryDir, 'dist', 'config.js'));
  } finally {
    if (previous === undefined) delete process.env.AUTH_SERVICE_URL;
    else process.env.AUTH_SERVICE_URL = previous;
  }
  gatewayServer = await start(createGateway());
  baseUrl = `http://127.0.0.1:${gatewayServer.address().port}`;
  const initial = await post('register', account);
  assert.equal(initial.status, 201);
  studentId = initial.body.user.studentId;
});

after(async () => {
  await close(gatewayServer);
  await close(authServer);
  if (temporaryDir) {
    const tempRoot = path.resolve(__dirname, '../tmp');
    assert.ok(temporaryDir.startsWith(`${tempRoot}${path.sep}`));
    for (const name of ['app', 'config']) delete require.cache[path.join(temporaryDir, 'dist', `${name}.js`)];
    fs.rmSync(temporaryDir, { recursive: true, force: true });
  }
});

test('Gateway serves the existing Register/Login web forms', async () => {
  const response = await fetch(baseUrl);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /id="register-form"/);
  assert.match(html, /id="login-form"/);
  assert.match(html, /\/api\/auth\/register/);
  assert.match(html, /\/api\/auth\/login/);
});

test('Gateway forwards registration body and public user response', async () => {
  const result = await post('register?source=integration', { ...account, email: 'gateway-new@example.test' });
  assert.equal(result.status, 201);
  assert.equal(result.body.user.email, 'gateway-new@example.test');
  assert.equal(result.body.user.name, account.name);
  assert.deepEqual(Object.keys(result.body.user).sort(), ['email', 'name', 'studentId']);
});

test('Gateway forwards login and preserves studentId for Enrollment', async () => {
  const result = await post('login', { email: account.email, password: account.password });
  assert.equal(result.status, 200);
  assert.equal(result.body.user.studentId, studentId);
  assert.equal(result.headers.get('cache-control'), 'no-store');
});

test('Gateway preserves incorrect-password 401 and JSON error', async () => {
  const result = await post('login', { email: account.email, password: 'wrong-password' });
  assert.equal(result.status, 401);
  assert.equal(result.body.error.code, 'INVALID_CREDENTIALS');
});

test('Gateway preserves incomplete-request 400', async () => {
  const result = await post('login', { email: account.email });
  assert.equal(result.status, 400);
  assert.equal(result.body.error.code, 'VALIDATION_ERROR');
});

test('Gateway preserves duplicate-email 409', async () => {
  const result = await post('register', account);
  assert.equal(result.status, 409);
  assert.equal(result.body.error.code, 'EMAIL_EXISTS');
});

test('Gateway returns 502 if Auth cannot be reached', async () => {
  // Invalid destination fails immediately without taking down other tests' servers.
  gatewayConfig.serviceUrls.auth = 'http://127.0.0.1:0';
  try {
    const result = await post('login', account);
    assert.equal(result.status, 502);
    assert.equal(result.body.error.code, 'UPSTREAM_UNAVAILABLE');
  } finally {
    gatewayConfig.serviceUrls.auth = authUrl;
  }
});
