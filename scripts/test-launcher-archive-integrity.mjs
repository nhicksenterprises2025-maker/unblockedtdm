import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { inspectCachedFile, normalizedHash, sha256, verifyFile } = require('../launcher/src/file-integrity.js');
const read = (relative) => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const launcherMain = read('launcher/src/main.js');
const launcherRenderer = read('launcher/src/renderer.js');
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'skirmish-launcher-integrity-'));
const cachedGame = path.join(temporaryRoot, 'UnblockedTDM.exe');

try {
  const missing = await inspectCachedFile(cachedGame, 'a'.repeat(64));
  assert.equal(missing.status, 'missing');
  assert.equal(missing.downloaded, false);

  fs.writeFileSync(cachedGame, 'verified archive payload');
  const expected = await sha256(cachedGame);
  assert.equal(normalizedHash(`  ${expected.toUpperCase()}  `), expected);

  const verified = await inspectCachedFile(cachedGame, expected);
  assert.equal(verified.status, 'verified');
  assert.equal(verified.downloaded, true);
  assert.equal(verified.hash, expected);

  fs.writeFileSync(cachedGame, 'stale same-tag payload');
  const stale = await inspectCachedFile(cachedGame, expected);
  assert.equal(stale.status, 'stale');
  assert.equal(stale.downloaded, false);

  const unverifiable = await inspectCachedFile(cachedGame, '');
  assert.equal(unverifiable.status, 'unverifiable');
  assert.equal(unverifiable.downloaded, false);

  const managedCompatibility = await verifyFile(cachedGame, null);
  assert.equal(managedCompatibility.valid, true, 'Managed updater verification without a supplied hash must preserve its existing behavior.');
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}

for (const token of [
  "require('./file-integrity.js')",
  'await inspectCachedFile(localExe, entry.sha256)',
  'cacheStatus: cache.status',
  'async function ensureArchiveVersion(entry)',
  'if (!cache.downloaded) await downloadArchiveVersion(entry)',
  'const entry = await remoteArchiveEntry(tag)',
  'const executable = await ensureArchiveVersion(entry)',
  'await fsp.copyFile(partial, final)',
  'No SHA-256 is published'
]) assert.ok(launcherMain.includes(token), `Launcher archive integrity wiring missing: ${token}`);

assert.ok(
  launcherRenderer.includes("entry.cacheStatus === 'stale' ? 'REPAIR' : 'DOWNLOAD'"),
  'A stale same-tag archive copy must be presented as repairable instead of playable.'
);

for (const token of [
  "const row = document.createElement('div')",
  'row.textContent = message',
  'list.replaceChildren(row)',
  "const item = document.createElement('article')",
  "const phase = document.createElement('span')",
  "phase.textContent = entry.phase || 'Skirmish Arena'",
  "const tag = document.createElement('span')",
  "tag.textContent = entry.tag || 'UNPUBLISHED'",
  'item.append(title, phase, tag, actions)',
  "const fatal = document.createElement('pre')",
  'fatal.textContent = `Launcher initialization failed:\\n${error.stack || error.message}`',
  'document.body.replaceChildren(fatal)'
]) assert.ok(launcherRenderer.includes(token), `Launcher safe DOM construction missing: ${token}`);

const archiveRenderer = launcherRenderer.match(/async function loadArchive\(\) \{([\s\S]*?)\r?\n\}\r?\n\r?\nasync function init/)?.[1];
assert.ok(archiveRenderer, 'Archive rendering must remain independently auditable.');
assert.equal(archiveRenderer.includes('innerHTML'), false, 'Remote archive phase/tag fields must never reach innerHTML.');
const fatalRenderer = launcherRenderer.match(/init\(\)\.catch\(\(error\) => \{([\s\S]*?)\r?\n\}\);/)?.[1];
assert.ok(fatalRenderer, 'Fatal launcher rendering must remain independently auditable.');
assert.equal(fatalRenderer.includes('innerHTML'), false, 'Remote or runtime error messages must never reach innerHTML.');

console.log('Launcher archive integrity checks passed: missing, stale and unverifiable caches cannot be played, valid caches remain available, and remote archive/error text is rendered without innerHTML.');
