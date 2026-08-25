import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const pkg = JSON.parse(read('launcher/package.json'));
const builder = read('launcher/electron-builder.yml');
const boot = read('launcher/src/boot.js');
const index = read('launcher/src/index.html');
const renderer = read('launcher/src/renderer.js');

assert.equal(pkg.productName, 'Skirmish Arena Launcher');
assert.equal(pkg.version, '1.0.1');
assert.equal(pkg.main, 'src/boot.js');

for (const token of [
  'appId: com.unblockedtdm.launcher',
  'productName: Skirmish Arena Launcher',
  'executableName: Skirmish Arena Launcher',
  'artifactName: SkirmishArena-Setup.exe',
  'shortcutName: Skirmish Arena',
  'uninstallDisplayName: Skirmish Arena Launcher'
]) assert.ok(builder.includes(token), `Launcher package contract missing: ${token}`);

assert.ok(boot.includes("app.setPath('userData', path.join(app.getPath('appData'), 'UnblockedTDM Launcher'))"), 'Existing launcher data directory must be preserved during the rebrand.');
assert.ok(boot.includes("app.setName('Skirmish Arena Launcher')"), 'Visible Electron app name must be Skirmish Arena Launcher.');
assert.ok(index.includes('assets/skirmish-arena-mark.svg'), 'Launcher must use the Skirmish Arena mark.');
assert.ok(index.includes('<strong>SKIRMISH</strong><span>ARENA</span>'), 'Launcher wordmark must remain Skirmish Arena.');
assert.equal(index.includes('UnblockedTDM'), false, 'Legacy project branding must not appear in visible launcher HTML.');
assert.equal(renderer.includes('UnblockedTDM'), false, 'Legacy project branding must not appear in visible launcher renderer copy.');

console.log('Launcher rebrand checks passed: same launcher identity/data, Skirmish Arena Windows branding, and no visible legacy branding.');
