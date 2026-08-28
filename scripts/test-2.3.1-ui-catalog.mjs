import fs from 'node:fs';
import assert from 'node:assert/strict';
import { WEAPON_LIST, WEAPONS } from '../game/src/data/weapons.js';
import { DASH_STAMINA_COST } from '../game/src/engine/constants.js';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const menu = read('game/src/ui/MainMenu.js');
const loadoutScreen = read('game/src/ui/LoadoutScreen.js');
const runtime = read('game/src/phase231-runtime.js');
const css = read('game/src/ui-2.3.1.css');
const css232 = read('game/src/ui-2.3.2.css');
const css233 = read('game/src/ui-2.3.3.css');
const css234 = read('game/src/ui-2.3.4.css');
const debug = read('game/src/debug-tuning.js');
const settings = read('game/src/engine/GameSettings.js');
const loadouts = read('game/src/data/LoadoutStore.js');
const tactical = read('game/src/ui/TacticalHUD.js');
const career = read('game/src/phase211-runtime.js');
const logoUrl = new URL('../game/src/assets/skirmish-arena-main-logo.webp', import.meta.url);

assert.equal(WEAPON_LIST.length, 8, 'Weapon Info must cover all eight live weapons.');
assert.ok(menu.includes('WEAPON_LIST.map(weaponCatalogCard)'), 'Weapon Info must render every live weapon in one catalog.');
assert.ok(menu.includes('weaponModelSvg(weapon)'), 'Every Weapon Info card must use the gameplay WeaponRenderer canvas pipeline.');
assert.ok(menu.includes('formatWeaponStats(weapon)'), 'Every Weapon Info card must expose exact canonical weapon values.');
assert.ok(menu.includes('statBarsHtml(weapon)'), 'Weapon Info must retain stat bars.');
assert.ok(menu.includes('spreadVisualHtml(weapon)'), 'Weapon Info must retain gameplay crosshair spread visualization.');
assert.ok(menu.includes('data-weapon-info-catalog'), 'Weapon Info must expose the all-weapons catalog root.');
assert.equal(menu.includes('list.innerHTML = WEAPON_LIST.map'), false, 'The selectable one-weapon list renderer must not remain live.');
assert.equal(menu.includes('detail.innerHTML ='), false, 'The single-weapon detail renderer must be retired.');

assert.ok(runtime.includes("assets/skirmish-arena-main-logo.webp"), 'Home hero must use the supplied metallic Skirmish Arena logo.');
assert.ok(runtime.includes("document.body.classList.toggle('ui231-weapon-page'"), 'Weapon Info must use its own dedicated page state.');
assert.ok(runtime.includes("document.body.classList.remove('ui221-weapon-page')"), '2.3.x must clean stale 2.2.1 Weapon Info page state when leaving the page.');
assert.ok(runtime.includes('hydrateWeaponModelCanvases(document)'), 'Real in-game weapon models must be hydrated throughout the UI.');
assert.ok(runtime.includes('hydrateGameplayCrosshairCanvases(document)'), 'Spread visualizers must use the live gameplay crosshair renderer.');
assert.ok(runtime.includes("setText(eyebrow, 'BUILD 2.3.4')"), 'Home eyebrow must use the 2.3.4 fallback build label with an idempotent write.');
assert.ok(runtime.includes("ensureStyle('ui-2.3.2.css')"), '2.3.2 Home cleanup stylesheet must remain loaded.');
assert.ok(runtime.includes("ensureStyle('ui-2.3.3.css')"), '2.3.3 Loadouts stylesheet must remain loaded.');
assert.ok(runtime.includes("ensureStyle('ui-2.3.4.css')"), '2.3.4 HUD/header stylesheet must load through the stable presentation runtime.');
assert.ok(runtime.includes("document.body.classList.add('ui-231', 'ui-232', 'ui-233', 'ui-234')"), '2.3.4 must layer on top of the stable 2.3.x presentation runtime.');
assert.ok(runtime.includes('ui232-blueprint-icon'), 'Weapon Info tile must retain the simplified blue manual/gun sketch.');
assert.equal(runtime.includes('linearGradient id="ui231BlueprintEdge"'), false, 'Simplified Weapon Info art must not regress to the over-detailed gradient treatment.');
assert.equal(runtime.includes("button.addEventListener('click', () => queueMicrotask"), false, '2.3.x must not double-bind Weapon Info navigation over the canonical MainMenu controller.');
assert.ok(runtime.includes("title.querySelectorAll('[data-ui221-weapon-back], .ui221-page-back')"), '2.3.4 must actively remove the legacy 2.2.1 Weapon Info Back control.');
assert.ok(runtime.includes('modernButtons.slice(1)'), '2.3.4 must collapse any duplicate modern Weapon Info Back controls.');

assert.ok(debug.includes("import('./phase231-runtime.js')"), '2.3.x presentation runtime must load after the known-good 2.2.1 runtime.');
assert.equal(debug.includes("import('./weapon-info-hotfix.js')"), false, 'The rollback-only Weapon Info click hotfix must not remain active.');

assert.ok(css.includes('body.ui-231:not(.ui231-weapon-page) #mainMenu [data-menu-view="weapon-info"]'), 'Inactive Weapon Info must be hard-hidden so it cannot leak beneath Home/Career.');
assert.ok(css.includes('overflow-y:auto!important'), 'The complete Weapon Info document must scroll vertically.');
assert.ok(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'), 'Desktop Weapon Info must use the readable two-column catalog.');
assert.ok(css.includes('.ui231-weapon-card'), 'Every weapon needs a dedicated detailed catalog card.');
assert.ok(css.includes('.ui231-exact-stats'), 'Exact weapon data must remain readable in each Weapon Info card.');
assert.ok(css.includes('.menu-hero h1{display:none!important}'), 'The plain hero text must be replaced by the supplied logo rather than layered beneath it.');
assert.ok(css.includes('body.ui-231 #mainMenu .phase2-play{'), '2.3.x must preserve and enhance the Play command tile.');
assert.ok(css.includes('background:linear-gradient(135deg,#e1e6e9'), 'Play must use the requested lighter silver/gray metallic treatment.');
assert.ok(css.includes('phase2-loadouts .ui221-loadout-art'), 'Loadouts command tile must retain posed real gameplay weapon models.');
assert.ok(css.includes('phase2-settings .ui221-settings-art'), 'Settings must retain the silver gear treatment.');
assert.ok(css.includes('.phase3-scoreboard-shell'), 'Existing tactical scoreboard must retain presentation polish.');
assert.ok(css.includes('#phase3MapCanvas'), 'Existing Tactical Map must retain presentation polish.');

assert.ok(css232.includes('[data-menu-view="home"] .menu-feature-grid'), '2.3.2 must target the Home summary-card row explicitly.');
assert.ok(css232.includes('display:none!important'), '2.3.2 must remove the 3V3 / loadout-slot / AI summary boxes from Home.');
assert.ok(css232.includes('.career-strip-211'), 'Career must remain the next major information block after the Home hero.');
assert.ok(css232.includes('.ui232-info-art'), '2.3.2 must size the simplified Weapon Info tile art independently.');

assert.ok(loadoutScreen.includes("import { PRIMARY_WEAPONS, SECONDARY_WEAPONS }"), 'Loadouts should import only the weapon pools it needs.');
assert.equal(loadoutScreen.includes('formatWeaponStats'), false, 'Exact stat formatting belongs in Weapon Info, not Loadouts.');
assert.equal(loadoutScreen.includes('statBarsHtml'), false, 'Stat bars must be removed from Loadouts.');
assert.equal(loadoutScreen.includes('spreadVisualHtml'), false, 'Spread visualization must be removed from Loadouts.');
assert.equal(loadoutScreen.includes('weapon-rule'), false, 'Weapon-description reference copy must be removed from Loadouts.');
assert.equal(loadoutScreen.includes('SWAP T'), false, 'Swap-tier reference copy must not clutter Loadouts cards.');
assert.equal(loadoutScreen.includes('fireMode.toUpperCase()'), false, 'Fire-mode reference copy must not clutter Loadouts cards.');
assert.ok(loadoutScreen.includes('weaponModelSvg(item)'), 'Loadout selection cards must retain actual gameplay weapon models.');
assert.ok(loadoutScreen.includes('weaponModelSvg(weapon)'), 'Selected weapon preview must retain the actual gameplay model.');
assert.ok(loadoutScreen.includes('data-loadout-index'), 'Saved loadout selection must remain functional.');
assert.ok(loadoutScreen.includes('data-slot="primary"') && loadoutScreen.includes('data-slot="secondary"'), 'Primary and secondary slot switching must remain functional.');
assert.ok(loadoutScreen.includes('id="selectWeapon"'), 'Explicit weapon equip action must remain available.');
assert.ok(loadoutScreen.includes('id="deployButton"'), 'Save/deploy flow must remain available.');
assert.ok(css233.includes('height:clamp(72px,10.5vh,112px)'), 'Weapon-card model stages must remain materially larger than the old 34px treatment.');
assert.ok(css233.includes('width:min(96%,220px)'), 'Weapon-card canvases must continue to fill substantially more of their card.');
assert.ok(css233.includes('width:min(92%,620px)'), 'Selected weapon preview must continue to use the available detail area.');
assert.ok(css233.includes('height:clamp(180px,30vh,310px)'), 'Selected weapon preview must remain visually dominant.');

assert.ok(css234.includes('body.ui-234 .ui221-page-back{display:none!important}'), 'Legacy Weapon Info Back control must be visually impossible to duplicate.');
assert.ok(css234.includes('grid-template-areas:'), 'Weapon Info header must explicitly group title/copy and its one Back control.');
for (const token of ['.health-hud', '.stamina-hud', '.dash-hud', '.weapon-hud', '.match-hud', '.phase3-feed-row']) {
  assert.ok(css234.includes(token), `2.3.4 transparent HUD missing ${token}.`);
}
assert.ok(css234.includes('background:transparent!important'), 'Persistent match HUD surfaces must be transparent rather than boxed panels.');
assert.ok(css234.includes('left:calc(var(--ui234-edge) + 312px)'), 'Dash HUD must have its own non-overlapping anchor beside Health/Stamina.');
assert.ok(css234.includes('right:var(--ui234-edge)!important'), 'Weapon HUD must remain independently anchored at the bottom-right.');

assert.ok(settings.includes("map: 'KeyM'"), 'Tactical Map must remain rebindable with M as the default.');
assert.ok(settings.includes("scoreboard: 'Tab'"), 'Scoreboard must remain rebindable with Tab as the default.');
assert.ok(settings.includes("['map', 'Tactical Map']"), 'Tactical Map must be present in the binding UI.');
assert.ok(settings.includes("['scoreboard', 'Scoreboard']"), 'Scoreboard must be present in the binding UI.');
assert.ok(loadouts.includes('LOADOUT_SLOT_COUNT = 25'), 'Loadout capacity must remain 25.');
assert.ok(loadouts.includes('DEFAULT_LOADOUT_SLOT_COUNT = 3'), 'Fresh profiles must still begin with 3 created loadouts.');
assert.ok(tactical.includes('<span>K</span><span>D</span><span>A</span><span>K/D</span><span>DMG</span>'), 'Scoreboard must show Kills, Deaths, Assists, K/D and Damage.');
assert.ok(career.includes('MAX_CAREER_LEVEL'), 'The existing 1-1000 Career runtime must remain part of the game.');
assert.ok(career.includes('LEVEL ${profile.level}'), 'Career level presentation must remain intact.');

assert.equal(DASH_STAMINA_COST, 0, '2.3.4 dashes must not require or consume stamina.');

assert.ok(fs.existsSync(logoUrl), 'Supplied metallic Skirmish Arena logo asset must ship with 2.3.x.');
const logo = fs.readFileSync(logoUrl);
assert.ok(logo.length > 10000, 'Home logo must be the real image asset, not a placeholder.');
assert.equal(logo.subarray(0, 4).toString('ascii'), 'RIFF', 'Packaged logo must be a valid WebP container.');
assert.equal(logo.subarray(8, 12).toString('ascii'), 'WEBP', 'Packaged logo must be a valid WebP image.');

assert.deepEqual(
  [WEAPONS.shotgun.damage, WEAPONS.shotgun.pelletCount, WEAPONS.shotgun.fullDamageRangeTiles, WEAPONS.shotgun.maxRangeTiles, WEAPONS.shotgun.falloffDamage],
  [16, 8, 2, 2.5, 5],
  '2.3.4 must preserve the approved Shotgun 2.0/2.5-tile contract.'
);
assert.deepEqual(
  [WEAPONS.assaultRifle.damage, WEAPONS.smg.damage, WEAPONS.sniper.damage, WEAPONS.lmg.damage, WEAPONS.pistol.damage, WEAPONS.launcher.damage, WEAPONS.melee.damage],
  [20, 11, 145, 24, 15, 125, 75],
  '2.3.4 must not include the pending 2.4 weapon rebalance.'
);

console.log('Skirmish Arena 2.3.4 checks passed: one Weapon Info Back control, transparent non-overlapping persistent HUD, zero-stamina dash cost, and weapon balance isolated for 2.4.');
