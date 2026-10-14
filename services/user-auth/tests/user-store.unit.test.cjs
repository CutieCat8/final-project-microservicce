const assert = require('node:assert/strict');
const { test } = require('node:test');
const { UserStore, publicUser } = require('../dist/user-store');

test('student IDs are distinct; returned records cannot mutate stored users', () => {
  const store = new UserStore();
  const first = store.create('Ada', 'ada@example.test', 'hash-one');
  const second = store.create('Bo', 'bo@example.test', 'hash-two');
  assert.notEqual(first.studentId, second.studentId);
  first.passwordHash = 'tampered';
  const found = store.findByEmail('ada@example.test');
  assert.equal(found.passwordHash, 'hash-one');
  found.name = 'Changed';
  assert.equal(store.findByEmail('ada@example.test').name, 'Ada');
});

test('duplicate insertion does not overwrite the existing user', () => {
  const store = new UserStore();
  const first = store.create('Ada', 'ada@example.test', 'hash-one');
  assert.throws(() => store.create('Another', first.email, 'hash-two'), (error) => error.status === 409);
  assert.deepEqual(store.findByEmail(first.email), first);
});

test('public user projection excludes all stored secrets', () => {
  const user = { studentId: 'S-test', name: 'Ada', email: 'ada@example.test', passwordHash: 'secret' };
  assert.deepEqual(publicUser(user), { studentId: user.studentId, name: user.name, email: user.email });
});

test('store instances do not share data; restart begins empty', () => {
  const first = new UserStore();
  first.create('Ada', 'ada@example.test', 'hash');
  assert.equal(new UserStore().findByEmail('ada@example.test'), undefined);
});
