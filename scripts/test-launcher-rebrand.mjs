import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const pkg = JSON.parse(read('launcher/package.json'));
const builder = read('launcher/electron-builder.yml');
const boot = read('launcher/src/boot.js');
const index = read('launcher/src/index.html');
const renderer = read('launcher/src/renderer.js');
const workflow = read('.github/workflows/publish-windows.yml');

assert.equal(pkg.productName, 'Skirmish Arena Launcher');
assert.equal(pkg.version, '1.0.3');
assert.equal(pkg.main, 'src/boot.js');

for (const token of [
  'appId: com.unblockedtdm.launcher',
  'productName: Skirmish Arena Launcher',
  'executableName: Skirmish Arena Launcher',
  'artifactName: SkirmishArena-Setup.exe',
  'shortcutName: Skirmish Arena',
  'uninstallDisplayName: Skirmish Arena Launcher',
  'icon: build/icon.ico'
]) assert.ok(builder.includes(token), `Launcher package contract missing: ${token}`);

assert.ok(boot.includes("app.setPath('userData', path.join(app.getPath('appData'), 'UnblockedTDM Launcher'))"), 'Existing launcher data directory must be preserved during the rebrand.');
assert.ok(boot.includes("app.setName('Skirmish Arena Launcher')"), 'Visible Electron app name must be Skirmish Arena Launcher.');
assert.ok(index.includes('assets/skirmish-arena-mark.svg'), 'Launcher must use the Skirmish Arena mark.');
assert.ok(index.includes('<strong>SKIRMISH</strong><span>ARENA</span>'), 'Launcher wordmark must remain Skirmish Arena.');
assert.equal(index.includes('UnblockedTDM'), false, 'Legacy project branding must not appear in visible launcher HTML.');
assert.equal(renderer.includes('UnblockedTDM'), false, 'Legacy project branding must not appear in visible launcher renderer copy.');

for (const token of [
  'async function ensureNewestInstalled()',
  'await ensureNewestInstalled();',
  "button.textContent = 'CHECKING…'",
  "stateText.textContent = 'VERIFYING LATEST BUILD'"
]) assert.ok(renderer.includes(token), `Launcher newest-build guard missing: ${token}`);

assert.equal(workflow.includes('Restore canonical 2.0 release assets'), false, 'Launcher publishing must never restore an obsolete 2.0 release into the modern pipeline.');
assert.equal(workflow.includes("gameVersion = '2.0'"), false, 'Launcher publishing must never rewrite the live game channel to 2.0.');
assert.ok(workflow.includes('git add distribution/launcher-latest.json'), 'Launcher publishing must own only the launcher manifest.');

console.log('Launcher 1.0.3 checks passed: identity/data compatibility, Skirmish Arena branding, newest-build guard, and isolated launcher-channel publishing.');
