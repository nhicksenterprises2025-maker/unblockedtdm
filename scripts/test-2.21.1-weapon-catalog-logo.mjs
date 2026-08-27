import fs from 'node:fs';
import assert from 'node:assert/strict';
import { WEAPON_LIST, WEAPONS } from '../game/src/data/weapons.js';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const menu = read('game/src/ui/MainMenu.js');
const runtime = read('game/src/phase2211-runtime.js');
const css = read('game/src/ui-2.21.1.css');
const debug = read('game/src/debug-tuning.js');
const index = read('game/src/index.html');
const uiBoot = read('game/src/ui-boot.js');
const gameBuilder = read('game/electron-builder.yml');
const launcherBuilder = read('launcher/electron-builder.yml');
const syncBuild = read('scripts/sync-build-info.mjs');
const gamePackage = JSON.parse(read('game/package.json'));
const launcherPackage = JSON.parse(read('launcher/package.json'));
const logoUrl = new URL('../game/src/assets/skirmish-arena-main-logo.webp', import.meta.url);
const gameIconUrl = new URL('../game/build/icon.ico', import.meta.url);
const launcherIconUrl = new URL('../launcher/build/icon.ico', import.meta.url);

function icoContains256Frame(icon) {
  if (icon.length < 22 || icon.readUInt16LE(0) !== 0 || icon.readUInt16LE(2) !== 1) return false;
  const count = icon.readUInt16LE(4);
  if (icon.length < 6 + count * 16) return false;
  for (let i = 0; i < count; i += 1) {
    const offset = 6 + i * 16;
    const width = icon[offset] === 0 ? 256 : icon[offset];
    const height = icon[offset + 1] === 0 ? 256 : icon[offset + 1];
    if (width >= 256 && height >= 256) return true;
  }
  return false;
}

assert.equal(WEAPON_LIST.length, 8, 'Weapon Info must cover all eight live weapons.');
assert.ok(menu.includes('WEAPON_LIST.map(weaponCatalogCard)'), 'Weapon Info must render every live weapon in one catalog.');
assert.ok(menu.includes('weaponModelSvg(weapon)'), 'Each catalog card must use the actual gameplay weapon-model canvas pipeline.');
assert.ok(menu.includes('formatWeaponStats(weapon)'), 'Each catalog card must show exact canonical numerical weapon data.');
assert.ok(menu.includes('statBarsHtml(weapon)'), 'Each weapon must retain its readable stat overview.');
assert.ok(menu.includes('spreadVisualHtml(weapon)'), 'Each weapon must retain the gameplay crosshair spread visualization.');
assert.ok(menu.includes('data-weapon-info-catalog'), 'The live Weapon Info page must expose the all-weapons catalog root.');
assert.equal(menu.includes('list.innerHTML = WEAPON_LIST.map'), false, 'The old selectable weapon-list UI must not remain the live renderer.');
assert.equal(menu.includes('detail.innerHTML ='), false, 'The old one-weapon detail renderer must be retired.');

assert.ok(runtime.includes("assets/skirmish-arena-main-logo.webp"), 'Home hero must use the supplied metallic Skirmish Arena logo asset.');
assert.ok(runtime.includes("document.body.classList.toggle('ui2211-weapon-page'"), 'Weapon Info must have an isolated dedicated-page state.');
assert.ok(runtime.includes('hydrateWeaponModelCanvases(document)'), 'All catalog models must hydrate through the gameplay WeaponRenderer pipeline.');
assert.ok(runtime.includes('hydrateGameplayCrosshairCanvases(document)'), 'All spread previews must hydrate through the gameplay crosshair renderer.');
assert.ok(debug.includes("import('./phase2211-runtime.js')"), 'Legacy loader must retain 2.21.1 compatibility.');

// Packaged Electron must have a direct module entrypoint for the complete modern UI stack.
// The game cannot depend solely on classic-script dynamic imports or expose the old Build 1.6 shell.
assert.ok(index.includes('<script type="module" src="ui-boot.js"></script>'), 'index.html must directly boot the modern Skirmish Arena UI as an ES module.');
for (const phase of [
  'flow-v18.js', 'phase4-runtime.js', 'phase5-runtime.js', 'phase6-runtime.js',
  'phase7-runtime.js', 'phase8-runtime.js', 'phase9-runtime.js', 'phase10-runtime.js',
  'phase2011-runtime.js', 'phase2012-runtime.js', 'phase2013-runtime.js',
  'phase2014-runtime.js', 'phase221-runtime.js', 'phase2211-runtime.js'
]) {
  assert.ok(uiBoot.includes(`import './${phase}';`), `Modern UI bootstrap missing ${phase}.`);
}
assert.ok(uiBoot.includes("document.documentElement.dataset.skirmishUiBoot = '2.21.1'"), 'Modern UI bootstrap must mark successful packaged startup.');

assert.ok(css.includes('body.ui-2211:not(.ui2211-weapon-page) #mainMenu [data-menu-view="weapon-info"]'), 'Inactive Weapon Info must be hard-hidden so it cannot leak onto Home.');
assert.ok(css.includes('overflow-y:auto!important'), 'Weapon Info must be one vertically scrollable page when all detailed cards exceed the viewport.');
assert.ok(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'), 'Desktop Weapon Info must use the readable all-weapons catalog grid.');
assert.ok(css.includes('.ui2211-weapon-card'), 'Every weapon must receive its own detailed catalog card.');
assert.ok(css.includes('.ui2211-exact-stats'), 'Exact weapon values must be readable inside each card.');
assert.ok(css.includes('.menu-hero h1{display:none!important}'), 'The old plain-text hero wordmark must be replaced, not layered beneath the supplied logo.');

assert.ok(fs.existsSync(logoUrl), 'Supplied metallic Skirmish Arena logo asset must ship with the game.');
const logo = fs.readFileSync(logoUrl);
assert.ok(logo.length > 10000, 'Home logo must be a real packaged image asset, not a placeholder stub.');
assert.equal(logo.subarray(0, 4).toString('ascii'), 'RIFF', 'Packaged logo must be a valid WebP container.');
assert.equal(logo.subarray(8, 12).toString('ascii'), 'WEBP', 'Packaged logo must be a valid WebP image.');

// Production packaging must use authored Skirmish Arena metadata and icons rather than Electron defaults.
for (const [label, iconUrl] of [['game', gameIconUrl], ['launcher', launcherIconUrl]]) {
  assert.ok(fs.existsSync(iconUrl), `${label} Windows icon must exist.`);
  const icon = fs.readFileSync(iconUrl);
  assert.ok(icon.length > 1000, `${label} Windows icon must be a real ICO asset.`);
  assert.deepEqual([...icon.subarray(0, 4)], [0, 0, 1, 0], `${label} Windows icon must be a valid ICO container.`);
  assert.ok(icoContains256Frame(icon), `${label} Windows icon must contain a 256x256 frame required by electron-builder.`);
}
assert.ok(gameBuilder.includes('icon: build/icon.ico'), 'Game builder must use the Skirmish Arena Windows icon.');
assert.ok(launcherBuilder.includes('icon: build/icon.ico'), 'Launcher builder must use the Skirmish Arena Windows icon.');
assert.equal(gamePackage.version, '2.21.1', 'Game package metadata must identify the 2.21.1 release line.');
assert.ok(gamePackage.description?.includes('Skirmish Arena'), 'Game package description must be branded.');
assert.ok(launcherPackage.description?.includes('Skirmish Arena'), 'Launcher package description must be branded.');
assert.equal(gamePackage.author, 'Skirmish Arena Development', 'Game package author metadata must be intentional.');
assert.equal(launcherPackage.author, 'Skirmish Arena Development', 'Launcher package author metadata must be intentional.');
assert.ok(syncBuild.includes('gamePackage.version = plan.gameVersion'), 'Build metadata sync must stamp the packaged game version from release-plan.json.');

// 2.21.1 is a UI/logo release. Preserve the 2.2.1 shotgun contract and all other canonical weapon values.
assert.deepEqual(
  [WEAPONS.shotgun.damage, WEAPONS.shotgun.pelletCount, WEAPONS.shotgun.fullDamageRangeTiles, WEAPONS.shotgun.maxRangeTiles, WEAPONS.shotgun.falloffDamage],
  [16, 8, 2, 2.5, 5]
);
assert.deepEqual(
  [WEAPONS.assaultRifle.damage, WEAPONS.smg.damage, WEAPONS.sniper.damage, WEAPONS.lmg.damage, WEAPONS.pistol.damage, WEAPONS.launcher.damage, WEAPONS.melee.damage],
  [20, 11, 145, 24, 15, 125, 75]
);

console.log('Skirmish Arena 2.21.1 checks passed: deterministic packaged UI boot, isolated all-weapons catalog, exact gameplay models/data, scrolling, supplied metallic home logo, and branded Windows packaging.');
