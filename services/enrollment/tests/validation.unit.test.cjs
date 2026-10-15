const assert = require('node:assert/strict');
const { test } = require('node:test');
const { validateEnrollment, validateStudentId } = require('../dist/validation');
const { HttpError } = require('../dist/errors');

function assertInvalid(action) {
  assert.throws(action, (error) => error instanceof HttpError && error.status === 400 && error.code === 'VALIDATION_ERROR');
}

test('valid enrollment input is trimmed and keeps only known fields', () => {
  assert.deepEqual(
    validateEnrollment({ studentId: ' S001 ', courseId: 'CS101', status: 'cancelled', enrollmentId: 'E999' }),
    { studentId: 'S001', courseId: 'CS101' }
  );
});

test('studentId from User/Auth (S + UUID) is accepted', () => {
  const studentId = 'S3f1c2a9e-1b2c-4d5e-8f90-123456789abc';
  assert.equal(validateStudentId(studentId), studentId);
});

for (const [name, input] of [
  ['studentId missing', { courseId: 'CS101' }],
  ['courseId missing', { studentId: 'S001' }],
  ['studentId blank', { studentId: '   ', courseId: 'CS101' }],
  ['courseId numeric', { studentId: 'S001', courseId: 101 }],
  ['courseId with path characters', { studentId: 'S001', courseId: '../admin' }],
  ['studentId too long', { studentId: 'S'.repeat(65), courseId: 'CS101' }],
  ['array body', []],
  ['null body', null],
  ['empty object', {}]
]) {
  test(`invalid enrollment: ${name}`, () => assertInvalid(() => validateEnrollment(input)));
}
