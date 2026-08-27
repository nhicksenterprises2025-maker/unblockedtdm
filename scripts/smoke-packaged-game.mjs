import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const executable = path.resolve(here, '../dist-game/UnblockedTDM.exe');
const timeoutMs = 45000;

if (process.platform !== 'win32') {
  console.log('Packaged Skirmish Arena smoke test skipped outside Windows.');
  process.exit(0);
}

if (!fs.existsSync(executable)) {
  console.error(`Packaged game executable is missing: ${executable}`);
  process.exit(10);
}

console.log(`Boot-smoke testing packaged game: ${executable}`);
const child = spawn(executable, ['--smoke-test'], {
  stdio: 'inherit',
  windowsHide: true
});

let settled = false;
const timeout = setTimeout(() => {
  if (settled) return;
  settled = true;
  console.error(`Packaged game smoke test timed out after ${timeoutMs}ms.`);
  child.kill();
  process.exit(11);
}, timeoutMs);

child.on('error', (error) => {
  if (settled) return;
  settled = true;
  clearTimeout(timeout);
  console.error('Unable to start packaged game smoke test:', error);
  process.exit(12);
});

child.on('exit', (code, signal) => {
  if (settled) return;
  settled = true;
  clearTimeout(timeout);
  if (code === 0) {
    console.log('Packaged Skirmish Arena boot smoke test passed.');
    process.exit(0);
  }
  console.error(`Packaged Skirmish Arena boot smoke test failed (code=${code}, signal=${signal || 'none'}).`);
  process.exit(code || 13);
});
