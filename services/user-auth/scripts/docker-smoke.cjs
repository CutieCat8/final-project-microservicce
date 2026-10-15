const { execFile, spawnSync } = require('node:child_process');
const { promisify } = require('node:util');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
const { smoke } = require('./smoke.cjs');
const execute = promisify(execFile);

async function main() {
  const serviceRoot = path.resolve(__dirname, '..');
  const image = 'registration-auth:dev';
  const container = `registration-auth-smoke-${randomUUID()}`;
  const build = spawnSync('docker', ['build', '-t', image, '.'], { cwd: serviceRoot, stdio: 'inherit' });
  if (build.error) throw build.error;
  if (build.status !== 0) throw new Error('Docker image build failed. Check that Docker Desktop is running.');
  let started = false;
  try {
    await execute('docker', ['run', '--detach', '--rm', '--name', container, '--publish', '127.0.0.1::3000', image]);
    started = true;
    const deadline = Date.now() + 60_000;
    let healthy = false;
    while (Date.now() < deadline) {
      const { stdout } = await execute('docker', ['inspect', '--format', '{{.State.Health.Status}}', container]);
      if (stdout.trim() === 'healthy') { healthy = true; break; }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (!healthy) throw new Error('Auth container did not become healthy within 60 seconds.');
    const { stdout } = await execute('docker', ['port', container, '3000/tcp']);
    const address = stdout.trim();
    if (!/^127\.0\.0\.1:\d+$/.test(address)) throw new Error('Unexpected Docker port mapping.');
    await smoke(`http://${address}`);
  } finally {
    if (started) await execute('docker', ['rm', '--force', container]);
  }
}

main().catch((error) => {
  console.error(`Docker smoke failed: ${error.message}`);
  process.exitCode = 1;
});
