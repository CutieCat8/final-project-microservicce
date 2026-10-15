#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
docker build -t registration-notification:dev .
container_id=$(docker run -d --rm registration-notification:dev)
trap 'docker rm -f "$container_id" >/dev/null 2>&1 || true' EXIT HUP INT TERM
# ตรวจผ่าน HTTP ภายใน container โดยไม่จองพอร์ตบนเครื่อง
docker exec -i "$container_id" node <<'NODE'
const assert = require('node:assert/strict');
const base = 'http://127.0.0.1:3000';
(async () => {
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${base}/health`);
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { status: 'ok', service: 'notification' });
      ready = true;
      break;
    } catch { await new Promise(resolve => setTimeout(resolve, 1000)); }
  }
  assert.ok(ready, 'Service did not become healthy within 30 seconds');
  const res = await fetch(`${base}/api/notifications`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enrollmentId: 'E-SMOKE', studentId: 'S001', courseId: 'CS101' }),
  });
  assert.equal(res.status, 201);
  const created = await res.json();
  assert.ok(created.notification.message.includes('S001 ลงทะเบียนวิชา CS101 สำเร็จ'));
  const found = await fetch(`${base}/api/notifications/E-SMOKE`);
  assert.equal(found.status, 200);
  assert.deepEqual(await found.json(), created);
  console.log('Docker smoke test passed: health, create, retrieve');
})().catch(error => { console.error(error); process.exitCode = 1; });
NODE
