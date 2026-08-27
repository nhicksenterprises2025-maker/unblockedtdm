import fs from 'node:fs';
import assert from 'node:assert/strict';
import { WEAPON_LIST, WEAPONS } from '../game/src/data/weapons.js';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const menu = read('game/src/ui/MainMenu.js');
const runtime = read('game/src/phase2211-runtime.js');
const css = read('game/src/ui-2.21.1.css');
const debug = read('game/src/debug-tuning.js');
const logoUrl = new URL('../game/src/assets/skirmish-arena-main-logo.webp', import.meta.url);

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
assert.ok(debug.includes("import('./phase2211-runtime.js')"), '2.21.1 runtime must load after the 2.2.1 runtime.');

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

// 2.21.1 is a UI/logo release. Preserve the 2.2.1 shotgun contract and all other canonical weapon values.
assert.deepEqual(
  [WEAPONS.shotgun.damage, WEAPONS.shotgun.pelletCount, WEAPONS.shotgun.fullDamageRangeTiles, WEAPONS.shotgun.maxRangeTiles, WEAPONS.shotgun.falloffDamage],
  [16, 8, 2, 2.5, 5]
);
assert.deepEqual(
  [WEAPONS.assaultRifle.damage, WEAPONS.smg.damage, WEAPONS.sniper.damage, WEAPONS.lmg.damage, WEAPONS.pistol.damage, WEAPONS.launcher.damage, WEAPONS.melee.damage],
  [20, 11, 145, 24, 15, 125, 75]
);

console.log('Skirmish Arena 2.21.1 checks passed: isolated all-weapons catalog, exact gameplay models/data, scrolling, and supplied metallic home logo.');
