import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
// The production and CI path remains dist-game. A caller may point the exact
// same smoke gate at an alternate build output when a synchronized workspace
// or desktop capture process has a generated staging file open.
const configuredGameDistDir = process.env.SKIRMISH_DIST_GAME_DIR
  ? path.resolve(process.env.SKIRMISH_DIST_GAME_DIR)
  : null;
const unpackedExecutable = configuredGameDistDir
  ? path.resolve(configuredGameDistDir, 'win-unpacked/UnblockedTDM.exe')
  : path.resolve(here, '../dist-game/win-unpacked/UnblockedTDM.exe');
const portableExecutable = configuredGameDistDir
  ? path.resolve(configuredGameDistDir, 'UnblockedTDM.exe')
  : path.resolve(here, '../dist-game/UnblockedTDM.exe');
const smokeOutputDir = configuredGameDistDir
  ? path.resolve(configuredGameDistDir, 'smoke-results')
  : path.resolve(here, '../dist-game/smoke-results');
const timeoutMs = 55000;

if (process.platform !== 'win32') {
  console.log('Packaged Skirmish Arena smoke test skipped outside Windows.');
  process.exit(0);
}

for (const executable of [unpackedExecutable, portableExecutable]) {
  if (!fs.existsSync(executable)) {
    console.error(`Packaged game executable is missing: ${executable}`);
    process.exit(10);
  }
}
fs.mkdirSync(smokeOutputDir, { recursive: true });

function terminateTree(pid) {
  if (!pid) return;
  try {
    const killer = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true
    });
    killer.unref();
  } catch {}
}

function readSmokeResult(resultPath) {
  try {
    return JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  } catch {
    return null;
  }
}

function runSmoke(label, executable, resultName) {
  return new Promise((resolve, reject) => {
    const resultPath = path.join(smokeOutputDir, `${resultName}.json`);
    fs.rmSync(resultPath, { force: true });
    console.log(`Boot-smoke testing ${label}: ${executable}`);
    const child = spawn(executable, ['--smoke-test'], {
      stdio: 'inherit',
      windowsHide: true,
      env: {
        ...process.env,
        SKIRMISH_SMOKE_TEST: '1',
        SKIRMISH_SMOKE_RESULT_PATH: resultPath
      }
    });

    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      fn(value);
    };

    const timeout = setTimeout(() => {
      if (settled) return;
      const status = readSmokeResult(resultPath);
      terminateTree(child.pid);
      finish(reject, new Error(`${label} smoke test timed out after ${timeoutMs}ms. Last status: ${JSON.stringify(status)}`));
    }, timeoutMs);

    child.on('error', (error) => {
      const status = readSmokeResult(resultPath);
      terminateTree(child.pid);
      finish(reject, new Error(`Unable to start ${label} smoke test: ${error.message}. Last status: ${JSON.stringify(status)}`));
    });

    child.on('exit', (code, signal) => {
      if (settled) return;
      const status = readSmokeResult(resultPath);
      if (code === 0 && status?.stage === 'pass') {
        console.log(`${label} boot smoke test passed: ${JSON.stringify(status.state || {})}`);
        finish(resolve);
        return;
      }
      finish(reject, new Error(`${label} boot smoke test failed (code=${code}, signal=${signal || 'none'}). Last status: ${JSON.stringify(status)}`));
    });
  });
}

try {
  // First prove the exact packaged Electron application reaches modern UI.
  await runSmoke('win-unpacked packaged app', unpackedExecutable, 'win-unpacked');
  // Then prove the final portable executable used by releases preserves the same boot path.
  await runSmoke('portable release executable', portableExecutable, 'portable');
  console.log('Packaged Skirmish Arena boot integrity passed for both executable paths.');
  process.exit(0);
} catch (error) {
  console.error(error.message);
  process.exit(11);
}
