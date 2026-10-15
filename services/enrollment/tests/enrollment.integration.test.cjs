const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const { createApp } = require('../dist/app');
const { EnrollmentStore } = require('../dist/enrollment-store');
const { start, close, startCourse, startNotification } = require('./fakes.cjs');

const store = new EnrollmentStore();
let course;
let notification;
let enrollment;
let baseUrl;
const urls = {};

before(async () => {
  course = await startCourse();
  notification = await startNotification();
  urls.course = course.url;
  urls.notification = notification.url;
  // urls is passed by reference, so a test can point Enrollment at a dead service.
  enrollment = await start(createApp(store, urls));
  baseUrl = enrollment.url;
});
after(async () => {
  await close(enrollment?.server);
  await close(course?.server);
  await close(notification?.server);
});

async function enroll(body) {
  const response = await fetch(`${baseUrl}/api/enrollments`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  return { status: response.status, headers: response.headers, body: await response.json() };
}
async function list(studentId) {
  const response = await fetch(`${baseUrl}/api/enrollments/${encodeURIComponent(studentId)}`);
  return { status: response.status, body: await response.json() };
}

test('health endpoint identifies the running service', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok', service: 'enrollment' });
  assert.equal(response.headers.has('x-powered-by'), false);
});

test('successful enrollment returns 201 in contract shape and notifies Notification', async () => {
  const result = await enroll({ studentId: 'S001', courseId: 'CS101' });
  assert.equal(result.status, 201);
  assert.deepEqual(Object.keys(result.body.enrollment).sort(), ['courseId', 'enrollmentId', 'status', 'studentId']);
  assert.equal(result.body.enrollment.studentId, 'S001');
  assert.equal(result.body.enrollment.courseId, 'CS101');
  assert.equal(result.body.enrollment.status, 'confirmed');
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.deepEqual(notification.received.at(-1), {
    enrollmentId: result.body.enrollment.enrollmentId, studentId: 'S001', courseId: 'CS101'
  });
});

test('unknown course returns 404 and saves nothing', async () => {
  const result = await enroll({ studentId: 'S404', courseId: 'XX999' });
  assert.equal(result.status, 404);
  assert.equal(result.body.error.code, 'COURSE_NOT_FOUND');
  assert.deepEqual((await list('S404')).body.enrollments, []);
});

for (const [name, input] of [
  ['studentId missing', { courseId: 'CS101' }],
  ['courseId missing', { studentId: 'S001' }],
  ['empty object', {}]
]) {
  test(`incomplete request returns 400: ${name}`, async () => {
    const result = await enroll(input);
    assert.equal(result.status, 400);
    assert.equal(result.body.error.code, 'VALIDATION_ERROR');
    assert.equal('enrollment' in result.body, false);
  });
}

test('duplicate enrollment returns 409 without a second record', async () => {
  await enroll({ studentId: 'S002', courseId: 'CS101' });
  const result = await enroll({ studentId: 'S002', courseId: 'CS101' });
  assert.equal(result.status, 409);
  assert.equal(result.body.error.code, 'ENROLLMENT_EXISTS');
  assert.equal((await list('S002')).body.enrollments.length, 1);
});

test('parallel duplicate enrollments produce one record and one conflict', async () => {
  const input = { studentId: 'S003', courseId: 'CS102' };
  const results = await Promise.all([enroll(input), enroll(input)]);
  assert.deepEqual(results.map((result) => result.status).sort(), [201, 409]);
  assert.equal((await list('S003')).body.enrollments.length, 1);
});

test('GET /api/enrollments/:studentId returns only that student', async () => {
  await enroll({ studentId: 'S005', courseId: 'CS101' });
  await enroll({ studentId: 'S005', courseId: 'CS102' });
  await enroll({ studentId: 'S006', courseId: 'CS101' });
  const result = await list('S005');
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.enrollments.map((item) => item.courseId).sort(), ['CS101', 'CS102']);
  assert.ok(result.body.enrollments.every((item) => item.studentId === 'S005'));
});

test('student with no enrollments gets an empty list', async () => {
  const result = await list('S999');
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { enrollments: [] });
});

test('invalid studentId in path returns 400', async () => {
  const result = await list('bad id!');
  assert.equal(result.status, 400);
  assert.equal(result.body.error.code, 'VALIDATION_ERROR');
});

test('Course outage returns 502 and saves nothing', async () => {
  urls.course = 'http://127.0.0.1:0';
  try {
    const result = await enroll({ studentId: 'S007', courseId: 'CS101' });
    assert.equal(result.status, 502);
    assert.equal(result.body.error.code, 'COURSE_SERVICE_UNAVAILABLE');
  } finally {
    urls.course = course.url;
  }
  assert.deepEqual((await list('S007')).body.enrollments, []);
});

test('Notification outage still confirms the saved enrollment', async (t) => {
  t.mock.method(console, 'error', () => {});
  urls.notification = 'http://127.0.0.1:0';
  try {
    const result = await enroll({ studentId: 'S008', courseId: 'CS101' });
    assert.equal(result.status, 201);
    assert.equal(result.body.enrollment.status, 'confirmed');
  } finally {
    urls.notification = notification.url;
  }
  assert.equal((await list('S008')).body.enrollments.length, 1);
});

test('Notification error status still confirms the enrollment', async (t) => {
  t.mock.method(console, 'error', () => {});
  notification.state.status = 500;
  try {
    const result = await enroll({ studentId: 'S009', courseId: 'CS101' });
    assert.equal(result.status, 201);
  } finally {
    notification.state.status = 201;
  }
});

test('client-supplied enrollmentId and status are ignored', async () => {
  const result = await enroll({ studentId: 'S010', courseId: 'CS101', enrollmentId: 'E-admin', status: 'cancelled' });
  assert.equal(result.status, 201);
  assert.notEqual(result.body.enrollment.enrollmentId, 'E-admin');
  assert.equal(result.body.enrollment.status, 'confirmed');
});

test('malformed JSON returns 400 INVALID_JSON', async () => {
  const response = await fetch(`${baseUrl}/api/enrollments`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"studentId":'
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'INVALID_JSON');
});

test('oversized JSON body returns 413', async () => {
  const response = await fetch(`${baseUrl}/api/enrollments`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: 'x'.repeat(17_000) })
  });
  assert.equal(response.status, 413);
  assert.equal((await response.json()).error.code, 'PAYLOAD_TOO_LARGE');
});

test('unsupported content type returns 415', async () => {
  const response = await fetch(`${baseUrl}/api/enrollments`, {
    method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'studentId=S001'
  });
  assert.equal(response.status, 415);
  assert.equal((await response.json()).error.code, 'UNSUPPORTED_MEDIA_TYPE');
});

test('unknown route returns contract-shaped 404', async () => {
  const response = await fetch(`${baseUrl}/api/unknown`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, 'ROUTE_NOT_FOUND');
});
