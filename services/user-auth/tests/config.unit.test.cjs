const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readPort } = require('../dist/config');

test('default port matches Docker Compose', () => {
  assert.equal(readPort(undefined), 3000);
  assert.equal(readPort('3001'), 3001);
});

test('invalid ports fail before starting the server', () => {
  for (const value of ['', '0', '-1', '65536', '3000oops', '3.5']) {
    assert.throws(() => readPort(value), /PORT must be an integer/);
  }
});
