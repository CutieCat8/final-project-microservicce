const assert = require('node:assert/strict');
const { test } = require('node:test');
const { hashPassword, verifyPassword } = require('../dist/password');

test('scrypt round trip succeeds and wrong password fails', async () => {
  const hash = await hashPassword('demo-password');
  assert.match(hash, /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
  assert.equal(hash.includes('demo-password'), false);
  assert.equal(await verifyPassword('demo-password', hash), true);
  assert.equal(await verifyPassword('wrong-password', hash), false);
});

test('equal passwords receive different salts and hashes', async () => {
  const first = await hashPassword('same-password');
  const second = await hashPassword('same-password');
  assert.notEqual(first.split('$')[1], second.split('$')[1]);
  assert.notEqual(first, second);
});

test('hash verification preserves spaces and letter case', async () => {
  const hash = await hashPassword(' Password123 ');
  assert.equal(await verifyPassword(' Password123 ', hash), true);
  assert.equal(await verifyPassword('Password123', hash), false);
  assert.equal(await verifyPassword(' password123 ', hash), false);
});

test('malformed stored hashes fail safely', async () => {
  for (const hash of ['', 'plaintext', 'scrypt$x$z', `scrypt$${'a'.repeat(32)}$${'g'.repeat(128)}`, `scrypt$${'a'.repeat(32)}$${'b'.repeat(128)}$extra`]) {
    assert.equal(await verifyPassword('demo-password', hash), false);
  }
});
