const assert = require('node:assert/strict');
const { test } = require('node:test');
const { EnrollmentStore } = require('../dist/enrollment-store');
const { readPort, readServiceUrls } = require('../dist/config');

test('create returns a confirmed enrollment with a server-generated id', () => {
  const enrollment = new EnrollmentStore().create('S001', 'CS101');
  assert.match(enrollment.enrollmentId, /^E[0-9a-f-]+$/);
  assert.deepEqual({ ...enrollment, enrollmentId: undefined }, {
    enrollmentId: undefined, studentId: 'S001', courseId: 'CS101', status: 'confirmed'
  });
});

test('same student and course cannot be enrolled twice', () => {
  const store = new EnrollmentStore();
  store.create('S001', 'CS101');
  assert.throws(() => store.create('S001', 'CS101'), { status: 409, code: 'ENROLLMENT_EXISTS' });
  assert.equal(store.listByStudent('S001').length, 1);
});

test('listByStudent returns only that student and copies records', () => {
  const store = new EnrollmentStore();
  store.create('S001', 'CS101');
  store.create('S001', 'CS102');
  store.create('S002', 'CS101');
  const list = store.listByStudent('S001');
  assert.deepEqual(list.map((item) => item.courseId).sort(), ['CS101', 'CS102']);
  list[0].status = 'changed';
  assert.equal(store.listByStudent('S001')[0].status, 'confirmed');
  assert.deepEqual(store.listByStudent('S404'), []);
});

test('config defaults to Compose hostnames and trims trailing slashes', () => {
  assert.deepEqual(readServiceUrls({}), { course: 'http://course:3000', notification: 'http://notification:3000' });
  assert.equal(readServiceUrls({ COURSE_SERVICE_URL: 'http://localhost:4001/' }).course, 'http://localhost:4001');
  assert.equal(readPort(undefined), 3000);
  assert.equal(readPort('4003'), 4003);
  assert.throws(() => readPort('abc'));
  assert.throws(() => readPort('70000'));
});
