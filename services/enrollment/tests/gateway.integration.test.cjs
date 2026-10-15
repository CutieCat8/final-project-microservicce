const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { createApp } = require('../dist/app');
const { start, close, startCourse, startNotification } = require('./fakes.cjs');

let course;
let notification;
let enrollment;
let gateway;
let gatewayConfig;
let temporaryDir;

before(async () => {
  course = await startCourse();
  notification = await startNotification();
  enrollment = await start(createApp(undefined, { course: course.url, notification: notification.url }));

  // Compile the team's actual Gateway sources into an ignored temporary folder.
  // Reuse Enrollment's Express/TypeScript dependencies: npm test needs no second install or network.
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
  const createGateway = require(path.join(temporaryDir, 'dist', 'app.js')).createApp;
  gatewayConfig = require(path.join(temporaryDir, 'dist', 'config.js'));
  gatewayConfig.serviceUrls.enrollments = enrollment.url;
  gatewayConfig.serviceUrls.notifications = notification.url;
  gateway = await start(createGateway());
});

after(async () => {
  await close(gateway?.server);
  await close(enrollment?.server);
  await close(course?.server);
  await close(notification?.server);
  if (temporaryDir) {
    const tempRoot = path.resolve(__dirname, '../tmp');
    assert.ok(temporaryDir.startsWith(`${tempRoot}${path.sep}`));
    for (const name of ['app', 'config']) delete require.cache[path.join(temporaryDir, 'dist', `${name}.js`)];
    fs.rmSync(temporaryDir, { recursive: true, force: true });
  }
});

async function call(route, options = {}) {
  const response = await fetch(`${gateway.url}${route}`, options);
  return { status: response.status, body: await response.json() };
}
function enroll(body) {
  return call('/api/enrollments', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
}

test('Gateway web page posts enrollments and then reads the notification', async () => {
  const html = await (await fetch(gateway.url)).text();
  assert.match(html, /id="enroll-form"/);
  assert.match(html, /\/api\/enrollments/);
  assert.match(html, /\/api\/notifications\//);
});

test('enroll through Gateway, then the confirmation notice is readable by enrollmentId', async () => {
  const created = await enroll({ studentId: 'S100', courseId: 'CS101' });
  assert.equal(created.status, 201);
  const { enrollmentId } = created.body.enrollment;
  const notice = await call(`/api/notifications/${encodeURIComponent(enrollmentId)}`);
  assert.equal(notice.status, 200);
  assert.equal(notice.body.notification.enrollmentId, enrollmentId);
  assert.equal(notice.body.notification.message, 'ลงทะเบียนสำเร็จ');
});

test('Gateway lists the student enrollments', async () => {
  const result = await call('/api/enrollments/S100');
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.enrollments.map((item) => item.courseId), ['CS101']);
});

test('Gateway preserves 400, 404 and 409 error responses', async () => {
  const missing = await enroll({ studentId: 'S100' });
  assert.equal(missing.status, 400);
  assert.equal(missing.body.error.code, 'VALIDATION_ERROR');
  const unknown = await enroll({ studentId: 'S100', courseId: 'XX999' });
  assert.equal(unknown.status, 404);
  assert.equal(unknown.body.error.code, 'COURSE_NOT_FOUND');
  const duplicate = await enroll({ studentId: 'S100', courseId: 'CS101' });
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.error.code, 'ENROLLMENT_EXISTS');
});

test('Gateway returns 502 if Enrollment cannot be reached', async () => {
  gatewayConfig.serviceUrls.enrollments = 'http://127.0.0.1:0';
  try {
    const result = await enroll({ studentId: 'S100', courseId: 'CS102' });
    assert.equal(result.status, 502);
    assert.equal(result.body.error.code, 'UPSTREAM_UNAVAILABLE');
  } finally {
    gatewayConfig.serviceUrls.enrollments = enrollment.url;
  }
});
