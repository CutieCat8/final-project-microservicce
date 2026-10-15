const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildServiceUrl } = require('../dist/config.js');

test('preserves the API path and query while forwarding to a service', () => {
  assert.equal(
    buildServiceUrl('http://user-auth:3000', '/api/auth/login?mode=demo'),
    'http://user-auth:3000/api/auth/login?mode=demo'
  );
});

test('supports a service base URL with a path prefix', () => {
  assert.equal(
    buildServiceUrl('http://localhost:3001/internal/', '/api/courses'),
    'http://localhost:3001/internal/api/courses'
  );
});
