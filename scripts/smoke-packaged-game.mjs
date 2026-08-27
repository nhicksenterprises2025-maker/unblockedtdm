import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const unpackedExecutable = path.resolve(here, '../dist-game/win-unpacked/UnblockedTDM.exe');
const portableExecutable = path.resolve(here, '../dist-game/UnblockedTDM.exe');
const timeoutMs = 60000;

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

function runSmoke(label, executable) {
  return new Promise((resolve, reject) => {
    console.log(`Boot-smoke testing ${label}: ${executable}`);
    const child = spawn(executable, ['--smoke-test'], {
      stdio: 'inherit',
      windowsHide: true,
      env: {
        ...process.env,
        SKIRMISH_SMOKE_TEST: '1'
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
      terminateTree(child.pid);
      finish(reject, new Error(`${label} smoke test timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    child.on('error', (error) => {
      terminateTree(child.pid);
      finish(reject, new Error(`Unable to start ${label} smoke test: ${error.message}`));
    });

    child.on('exit', (code, signal) => {
      if (settled) return;
      if (code === 0) {
        console.log(`${label} boot smoke test passed.`);
        finish(resolve);
        return;
      }
      finish(reject, new Error(`${label} boot smoke test failed (code=${code}, signal=${signal || 'none'}).`));
    });
  });
}

try {
  // First prove the exact packaged Electron application reaches modern UI.
  await runSmoke('win-unpacked packaged app', unpackedExecutable);
  // Then prove the final portable executable used by releases preserves the same boot path.
  await runSmoke('portable release executable', portableExecutable);
  console.log('Packaged Skirmish Arena boot integrity passed for both executable paths.');
  process.exit(0);
} catch (error) {
  console.error(error.message);
  process.exit(11);
}
