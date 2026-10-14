const assert = require('node:assert/strict');
const { test } = require('node:test');
const { normalizeEmail, validateLogin, validateRegister } = require('../dist/validation');

const account = { name: 'Demo Student', email: 'ada@example.test', password: 'demo-password' };
function invalid(callback) {
  assert.throws(callback, (error) => error.status === 400 && error.code === 'VALIDATION_ERROR');
}

test('email normalization trims and lowercases', () => {
  assert.equal(normalizeEmail(' ADA@EXAMPLE.TEST '), account.email);
});

test('register accepts boundary lengths and trims only name/email', () => {
  const result = validateRegister({ name: ' x ', email: ' ADA@EXAMPLE.TEST ', password: ' pass123 ' });
  assert.deepEqual(result, { name: 'x', email: account.email, password: ' pass123 ' });
  assert.equal(validateRegister({ ...account, name: 'x'.repeat(100), password: 'x'.repeat(128) }).name.length, 100);
  assert.equal(validateRegister({ ...account, password: 'x'.repeat(8) }).password.length, 8);
});

test('non-object bodies are rejected', () => {
  for (const body of [null, undefined, [], 'text', 1, true]) {
    invalid(() => validateLogin(body));
    invalid(() => validateRegister(body));
  }
});

test('invalid email values are rejected', () => {
  for (const email of [undefined, null, 123, {}, '', 'ada', 'ada@', 'ada@example', 'a b@example.test', 'a@@example.test', `${'a'.repeat(250)}@x.test`]) {
    invalid(() => validateLogin({ ...account, email }));
  }
});

test('missing, blank, non-string and excessive passwords are rejected', () => {
  for (const password of [undefined, null, 123, {}, '', '   ', 'x'.repeat(129)]) {
    invalid(() => validateLogin({ ...account, password }));
  }
  invalid(() => validateRegister({ ...account, password: '1234567' }));
});

test('missing, blank, non-string and excessive names are rejected', () => {
  for (const name of [undefined, null, 123, {}, '', '   ', 'x'.repeat(101)]) {
    invalid(() => validateRegister({ ...account, name }));
  }
});

test('login preserves password case and whitespace', () => {
  assert.equal(validateLogin({ ...account, password: ' X ' }).password, ' X ');
});
