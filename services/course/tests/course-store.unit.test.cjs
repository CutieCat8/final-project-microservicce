const assert = require('node:assert/strict');
const { test } = require('node:test');
const { CourseStore, INITIAL_COURSES } = require('../dist/course-store');

test('CourseStore initializes with default courses', () => {
  const store = new CourseStore();
  const list = store.list();
  assert.equal(list.length, INITIAL_COURSES.length);
  assert.equal(list[0].courseId, 'CS101');
});

test('CourseStore filters courses by term', () => {
  const store = new CourseStore();
  const result = store.list('database');
  assert.equal(result.length, 1);
  assert.equal(result[0].courseId, 'CS103');
});

test('CourseStore findById returns course if found and undefined if missing', () => {
  const store = new CourseStore();
  const found = store.findById('CS101');
  assert.ok(found);
  assert.equal(found.courseId, 'CS101');
  assert.equal(found.name, 'Introduction to Computing');

  const missing = store.findById('NONEXISTENT');
  assert.equal(missing, undefined);
});

test('CourseStore creates and updates courses', () => {
  const store = new CourseStore([]);
  const created = store.create({
    courseId: 'CS999',
    name: 'Special Topics',
    description: 'Advanced computing topics'
  });
  assert.equal(created.courseId, 'CS999');
  assert.equal(store.list().length, 1);

  const updated = store.update('CS999', { name: 'Updated Topics' });
  assert.ok(updated);
  assert.equal(updated.name, 'Updated Topics');
});
