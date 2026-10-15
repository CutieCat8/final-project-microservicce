const assert = require('node:assert/strict');
const { test } = require('node:test');
const { validateCourseId, validateCourseInput } = require('../dist/validation');

test('validateCourseId accepts valid course IDs', () => {
  assert.equal(validateCourseId('CS101'), 'CS101');
  assert.equal(validateCourseId('  CS_102  '), 'CS_102');
});

test('validateCourseId rejects empty, non-string, or invalid characters', () => {
  assert.throws(() => validateCourseId(''), /courseId is required/);
  assert.throws(() => validateCourseId('   '), /courseId is required/);
  assert.throws(() => validateCourseId(null), /courseId is required/);
  assert.throws(() => validateCourseId('CS 101'), /must contain only/);
  assert.throws(() => validateCourseId('CS/101'), /must contain only/);
});

test('validateCourseInput accepts valid course payload', () => {
  const result = validateCourseInput({
    courseId: 'CS201',
    name: 'Software Engineering',
    description: 'Design patterns and architectures'
  });
  assert.deepEqual(result, {
    courseId: 'CS201',
    name: 'Software Engineering',
    description: 'Design patterns and architectures'
  });
});

test('validateCourseInput rejects invalid shapes or missing fields', () => {
  assert.throws(() => validateCourseInput(null), /must be a JSON object/);
  assert.throws(() => validateCourseInput([]), /must be a JSON object/);
  assert.throws(() => validateCourseInput({ name: 'Intro' }), /courseId is required/);
  assert.throws(() => validateCourseInput({ courseId: 'CS101' }), /name is required/);
  assert.throws(() => validateCourseInput({ courseId: 'CS101', name: '   ' }), /name is required/);
});
