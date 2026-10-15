const assert = require('node:assert/strict');
const { test, before, after } = require('node:test');
const { once } = require('node:events');
const { createApp } = require('../dist/app');
const { CourseStore } = require('../dist/course-store');

let server;
let baseUrl;
let store;

before(async () => {
  store = new CourseStore();
  const app = createApp(store);
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  if (server) {
    return new Promise((resolve) => server.close(resolve));
  }
});

test('GET /api/courses returns all courses in contract shape', async () => {
  const res = await fetch(`${baseUrl}/api/courses`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  const body = await res.json();
  assert.ok(Array.isArray(body.courses));
  assert.ok(body.courses.length >= 2);
  const first = body.courses[0];
  assert.ok(first.courseId);
  assert.ok(first.name);
});

test('GET /api/courses?term=CS101 filters courses', async () => {
  const res = await fetch(`${baseUrl}/api/courses?term=CS101`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.courses.length, 1);
  assert.equal(body.courses[0].courseId, 'CS101');
});

test('GET /api/courses/:courseId returns 200 for existing course', async () => {
  const res = await fetch(`${baseUrl}/api/courses/CS101`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(Object.keys(body.course).sort(), ['courseId', 'description', 'name']);
  assert.equal(body.course.courseId, 'CS101');
  assert.equal(body.course.name, 'Introduction to Computing');
});

test('GET /api/courses/:courseId returns 404 for nonexistent course', async () => {
  const res = await fetch(`${baseUrl}/api/courses/NONEXISTENT`);
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(body.error?.code, 'COURSE_NOT_FOUND');
});

test('POST /api/courses creates a new course with 201', async () => {
  const payload = {
    courseId: 'CS202',
    name: 'Operating Systems',
    description: 'Processes, memory, and concurrency'
  };
  const res = await fetch(`${baseUrl}/api/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.course?.courseId, 'CS202');
  assert.equal(body.course?.name, 'Operating Systems');

  // Verify can retrieve it via GET
  const getRes = await fetch(`${baseUrl}/api/courses/CS202`);
  assert.equal(getRes.status, 200);
});

test('POST /api/courses returns 409 for duplicate courseId', async () => {
  const payload = {
    courseId: 'CS101',
    name: 'Duplicate Intro',
    description: 'Duplicate'
  };
  const res = await fetch(`${baseUrl}/api/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  assert.equal(res.status, 409);
  const body = await res.json();
  assert.equal(body.error?.code, 'COURSE_ALREADY_EXISTS');
});

test('POST /api/courses returns 415 when Content-Type is missing', async () => {
  const res = await fetch(`${baseUrl}/api/courses`, {
    method: 'POST',
    body: 'plain text'
  });
  assert.equal(res.status, 415);
});

test('unknown route returns 404 with error JSON', async () => {
  const res = await fetch(`${baseUrl}/api/nonexistent`);
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(body.error?.code, 'ROUTE_NOT_FOUND');
});
