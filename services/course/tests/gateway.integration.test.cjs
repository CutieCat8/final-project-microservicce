const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const { once } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { createApp } = require('../dist/app');

let courseServer;
let gatewayServer;
let baseUrl;
let temporaryDir;
let gatewayConfig;
let courseUrl;

async function start(app) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server;
}

function close(server) {
  return server ? new Promise((resolve) => server.close(resolve)) : Promise.resolve();
}

before(async () => {
  courseServer = await start(createApp());
  courseUrl = `http://127.0.0.1:${courseServer.address().port}`;

  // Compile Gateway sources into temporary folder using Course's dependencies
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

  const previous = process.env.COURSE_SERVICE_URL;
  process.env.COURSE_SERVICE_URL = courseUrl;
  let createGateway;
  try {
    createGateway = require(path.join(temporaryDir, 'dist', 'app.js')).createApp;
    gatewayConfig = require(path.join(temporaryDir, 'dist', 'config.js'));
  } finally {
    if (previous === undefined) delete process.env.COURSE_SERVICE_URL;
    else process.env.COURSE_SERVICE_URL = previous;
  }
  gatewayConfig.serviceUrls.courses = courseUrl;

  gatewayServer = await start(createGateway());
  baseUrl = `http://127.0.0.1:${gatewayServer.address().port}`;
});

after(async () => {
  await close(gatewayServer);
  await close(courseServer);
  if (temporaryDir) {
    const tempRoot = path.resolve(__dirname, '../tmp');
    assert.ok(temporaryDir.startsWith(`${tempRoot}${path.sep}`));
    for (const name of ['app', 'config']) delete require.cache[path.join(temporaryDir, 'dist', `${name}.js`)];
    fs.rmSync(temporaryDir, { recursive: true, force: true });
  }
});

test('Gateway serves the web UI referencing courses', async () => {
  const response = await fetch(baseUrl);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /id="load-courses"/);
  assert.match(html, /\/api\/courses/);
});

test('Gateway proxies GET /api/courses and returns course list', async () => {
  const response = await fetch(`${baseUrl}/api/courses`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(Array.isArray(body.courses));
  assert.ok(body.courses.length >= 2);
  assert.ok(body.courses.some((c) => c.courseId === 'CS101'));
});

test('Gateway forwards query string parameters such as term=CS102', async () => {
  const response = await fetch(`${baseUrl}/api/courses?term=CS102`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.courses.length, 1);
  assert.equal(body.courses[0].courseId, 'CS102');
});

test('Gateway proxies GET /api/courses/:courseId and preserves 404 on missing course', async () => {
  const okRes = await fetch(`${baseUrl}/api/courses/CS101`);
  assert.equal(okRes.status, 200);
  const okBody = await okRes.json();
  assert.equal(okBody.course.courseId, 'CS101');

  const notFoundRes = await fetch(`${baseUrl}/api/courses/UNKNOWN_COURSE`);
  assert.equal(notFoundRes.status, 404);
  const errBody = await notFoundRes.json();
  assert.equal(errBody.error?.code, 'COURSE_NOT_FOUND');
});

test('Gateway returns 502 with UPSTREAM_UNAVAILABLE when Course service is stopped', async () => {
  await close(courseServer);
  courseServer = undefined;

  const response = await fetch(`${baseUrl}/api/courses`);
  assert.equal(response.status, 502);
  const body = await response.json();
  assert.equal(body.error?.code, 'UPSTREAM_UNAVAILABLE');
});
