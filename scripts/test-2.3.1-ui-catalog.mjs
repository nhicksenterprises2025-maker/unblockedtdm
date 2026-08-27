import fs from 'node:fs';
import assert from 'node:assert/strict';
import { WEAPON_LIST, WEAPONS } from '../game/src/data/weapons.js';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const menu = read('game/src/ui/MainMenu.js');
const runtime = read('game/src/phase231-runtime.js');
const css = read('game/src/ui-2.3.1.css');
const debug = read('game/src/debug-tuning.js');
const settings = read('game/src/engine/GameSettings.js');
const loadouts = read('game/src/data/LoadoutStore.js');
const tactical = read('game/src/ui/TacticalHUD.js');
const career = read('game/src/phase211-runtime.js');
const logoUrl = new URL('../game/src/assets/skirmish-arena-main-logo.webp', import.meta.url);

assert.equal(WEAPON_LIST.length, 8, 'Weapon Info must cover all eight live weapons.');
assert.ok(menu.includes('WEAPON_LIST.map(weaponCatalogCard)'), 'Weapon Info must render every live weapon in one catalog.');
assert.ok(menu.includes('weaponModelSvg(weapon)'), 'Every Weapon Info card must use the gameplay WeaponRenderer canvas pipeline.');
assert.ok(menu.includes('formatWeaponStats(weapon)'), 'Every card must expose exact canonical weapon values.');
assert.ok(menu.includes('statBarsHtml(weapon)'), 'Every card must retain stat bars.');
assert.ok(menu.includes('spreadVisualHtml(weapon)'), 'Every card must retain gameplay crosshair spread visualization.');
assert.ok(menu.includes('data-weapon-info-catalog'), 'Weapon Info must expose the all-weapons catalog root.');
assert.equal(menu.includes('list.innerHTML = WEAPON_LIST.map'), false, 'The selectable one-weapon list renderer must not remain live.');
assert.equal(menu.includes('detail.innerHTML ='), false, 'The single-weapon detail renderer must be retired.');

assert.ok(runtime.includes("assets/skirmish-arena-main-logo.webp"), 'Home hero must use the supplied metallic Skirmish Arena logo.');
assert.ok(runtime.includes("document.body.classList.toggle('ui231-weapon-page'"), 'Weapon Info must use its own dedicated page state.');
assert.ok(runtime.includes("document.body.classList.remove('ui221-weapon-page')"), '2.3.1 must clean stale 2.2.1 Weapon Info page state when leaving the page.');
assert.ok(runtime.includes('hydrateWeaponModelCanvases(document)'), 'Real in-game weapon models must be hydrated throughout the UI.');
assert.ok(runtime.includes('hydrateGameplayCrosshairCanvases(document)'), 'Spread visualizers must use the live gameplay crosshair renderer.');
assert.ok(runtime.includes("eyebrow.textContent = 'BUILD 2.3.1'"), 'Home eyebrow must show the build without MATCH CLIENT copy.');
assert.ok(runtime.includes('ui231BlueprintEdge'), 'Weapon Info tile must use the blue blueprint/manual gun art.');
assert.equal(runtime.includes("button.addEventListener('click', () => queueMicrotask"), false, '2.3.1 must not double-bind Weapon Info navigation over the canonical MainMenu controller.');

assert.ok(debug.includes("import('./phase231-runtime.js')"), '2.3.1 runtime must load after the known-good 2.2.1 runtime.');
assert.equal(debug.includes("import('./weapon-info-hotfix.js')"), false, 'The rollback-only Weapon Info click hotfix must not remain active in 2.3.1.');

assert.ok(css.includes('body.ui-231:not(.ui231-weapon-page) #mainMenu [data-menu-view="weapon-info"]'), 'Inactive Weapon Info must be hard-hidden so it cannot leak beneath Home/Career.');
assert.ok(css.includes('overflow-y:auto!important'), 'The complete Weapon Info document must scroll vertically.');
assert.ok(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'), 'Desktop Weapon Info must use the readable two-column catalog.');
assert.ok(css.includes('.ui231-weapon-card'), 'Every weapon needs a dedicated detailed catalog card.');
assert.ok(css.includes('.ui231-exact-stats'), 'Exact weapon data must remain readable in each card.');
assert.ok(css.includes('.menu-hero h1{display:none!important}'), 'The plain hero text must be replaced by the supplied logo rather than layered beneath it.');
assert.ok(css.includes('body.ui-231 #mainMenu .phase2-play{'), '2.3.1 must preserve and enhance the Play command tile.');
assert.ok(css.includes('background:linear-gradient(135deg,#e1e6e9'), 'Play must use the requested lighter silver/gray metallic treatment.');
assert.ok(css.includes('phase2-loadouts .ui221-loadout-art'), 'Loadouts must retain posed real gameplay weapon models.');
assert.ok(css.includes('phase2-settings .ui221-settings-art'), 'Settings must retain the silver gear treatment.');
assert.ok(css.includes('.phase3-scoreboard-shell'), 'Existing tactical scoreboard must receive presentation polish.');
assert.ok(css.includes('#phase3MapCanvas'), 'Existing Tactical Map must receive presentation polish.');

assert.ok(settings.includes("map: 'KeyM'"), 'Tactical Map must remain rebindable with M as the default.');
assert.ok(settings.includes("scoreboard: 'Tab'"), 'Scoreboard must remain rebindable with Tab as the default.');
assert.ok(settings.includes("['map', 'Tactical Map']"), 'Tactical Map must be present in the binding UI.');
assert.ok(settings.includes("['scoreboard', 'Scoreboard']"), 'Scoreboard must be present in the binding UI.');
assert.ok(loadouts.includes('LOADOUT_SLOT_COUNT = 25'), 'Loadout capacity must remain 25.');
assert.ok(loadouts.includes('DEFAULT_LOADOUT_SLOT_COUNT = 3'), 'Fresh profiles must still begin with 3 created loadouts.');
assert.ok(tactical.includes('<span>K</span><span>D</span><span>A</span><span>K/D</span><span>DMG</span>'), 'Scoreboard must show Kills, Deaths, Assists, K/D and Damage.');
assert.ok(career.includes('MAX_CAREER_LEVEL'), 'The existing 1-1000 Career runtime must remain part of the game.');
assert.ok(career.includes('LEVEL ${profile.level}'), 'Career level presentation must remain intact.');

assert.ok(fs.existsSync(logoUrl), 'Supplied metallic Skirmish Arena logo asset must ship with 2.3.1.');
const logo = fs.readFileSync(logoUrl);
assert.ok(logo.length > 10000, 'Home logo must be the real image asset, not a placeholder.');
assert.equal(logo.subarray(0, 4).toString('ascii'), 'RIFF', 'Packaged logo must be a valid WebP container.');
assert.equal(logo.subarray(8, 12).toString('ascii'), 'WEBP', 'Packaged logo must be a valid WebP image.');

assert.deepEqual(
  [WEAPONS.shotgun.damage, WEAPONS.shotgun.pelletCount, WEAPONS.shotgun.fullDamageRangeTiles, WEAPONS.shotgun.maxRangeTiles, WEAPONS.shotgun.falloffDamage],
  [16, 8, 2, 2.5, 5],
  '2.3.1 must preserve the approved Shotgun 2.0/2.5-tile contract.'
);
assert.deepEqual(
  [WEAPONS.assaultRifle.damage, WEAPONS.smg.damage, WEAPONS.sniper.damage, WEAPONS.lmg.damage, WEAPONS.pistol.damage, WEAPONS.launcher.damage, WEAPONS.melee.damage],
  [20, 11, 145, 24, 15, 125, 75],
  '2.3.1 is presentation/reference work and must not rebalance the other weapons.'
);

console.log('Skirmish Arena 2.3.1 checks passed: stable Career/menu controller, supplied hero logo, silver command art, isolated all-eight arsenal catalog, real weapon/crosshair rendering, and preserved competitive contracts.');
