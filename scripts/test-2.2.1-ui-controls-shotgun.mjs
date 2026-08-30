import fs from 'node:fs';
import assert from 'node:assert/strict';
import { BINDING_ACTIONS, DEFAULT_BINDINGS } from '../game/src/engine/GameSettings.js';
import { WEAPONS } from '../game/src/data/weapons.js';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const runtime = read('game/src/phase221-runtime.js');
const css = read('game/src/ui-2.2.1.css');
const debug = read('game/src/debug-tuning.js');
const tactical = read('game/src/ui/TacticalHUD.js');
const flow = read('game/src/flow-v18.js');
const homeCommandArt = read('game/src/ui/HomeCommandArt.js');

assert.equal(DEFAULT_BINDINGS.map, 'KeyM');
assert.equal(DEFAULT_BINDINGS.scoreboard, 'Tab');
assert.ok(BINDING_ACTIONS.some(([id, label]) => id === 'map' && label === 'Tactical Map'));
assert.ok(BINDING_ACTIONS.some(([id, label]) => id === 'scoreboard' && label === 'Scoreboard'));
assert.ok(tactical.includes("this.binding('map')"));
assert.ok(tactical.includes("this.binding('scoreboard')"));
assert.ok(tactical.includes('syncControlCopy()'));
assert.ok(tactical.includes('mouseBindingCode'));
assert.equal(tactical.includes("event.code === 'Tab'"), false);
assert.equal(tactical.includes("event.code === 'KeyM'"), false);

const shotgun = WEAPONS.shotgun;
assert.equal(shotgun.kind, 'shotgun');
assert.ok(Number.isFinite(shotgun.damage) && shotgun.damage > 0);
assert.ok(Number.isFinite(shotgun.pelletCount) && shotgun.pelletCount > 0);
assert.ok(Number.isFinite(shotgun.fullDamageRangeTiles) && shotgun.fullDamageRangeTiles > 0);
assert.ok(Number.isFinite(shotgun.maxRangeTiles) && shotgun.maxRangeTiles >= shotgun.fullDamageRangeTiles);
assert.ok(Number.isFinite(shotgun.falloffDamage) && shotgun.falloffDamage >= 0);
assert.ok(runtime.includes('weapon.maxRangeTiles ?? weapon.fullDamageRangeTiles'));
assert.ok(runtime.includes('maxDistance });'));
assert.ok(runtime.includes('centerDistance > maxDistance'));

for (const weapon of Object.values(WEAPONS)) {
  assert.ok(weapon.id && weapon.name && weapon.kind && weapon.slot);
  assert.ok(Number.isFinite(weapon.damage) && weapon.damage >= 0);
  assert.ok(Number.isFinite(weapon.fireInterval) && weapon.fireInterval >= 0);
}

assert.ok(debug.includes("import('./phase221-runtime.js')"));
assert.ok(runtime.includes("[data-menu-action=\"weapon-info\"]"));
assert.ok(runtime.includes('data-ui221-weapon-back'));
assert.ok(css.includes('ui221-weapon-page #mainMenu .main-sidebar{display:none'));
assert.ok(css.includes('width:100vw!important'));
assert.ok(css.includes('.loadout-screen:not(.hidden)'));
assert.ok(css.includes('font-size:13px!important'));
assert.ok(css.includes('font-size:8px!important'));
assert.ok(css.includes('[data-menu-view="settings"] .binding-row'));
assert.ok(css.includes('[data-menu-view="career"]'));
assert.ok(runtime.includes('data-game-weapon-model="assault-rifle"'));
assert.ok(runtime.includes('data-game-weapon-model="shotgun"'));
assert.ok(runtime.includes('data-game-weapon-model="pistol"'));
assert.ok(runtime.includes('ui221PlayMetal'));
const homeArtImport = runtime.match(/import\s*\{([^}]*)\}\s*from\s*['"]\.\/ui\/HomeCommandArt\.js['"]/);
assert.ok(homeArtImport, 'Home command artwork must come from the shared authored icon module.');
for (const factory of ['weaponInfoCommandIcon', 'settingsCommandIcon', 'quitCommandIcon']) {
  assert.match(homeArtImport[1], new RegExp(`\\b${factory}\\b`), `Home menu must import ${factory}.`);
  assert.ok(homeCommandArt.includes(`export function ${factory}()`), `HomeCommandArt must export ${factory}.`);
}
for (const token of [
  "'weapon-info': weaponInfoCommandIcon",
  'settings: settingsCommandIcon',
  'quit: quitCommandIcon'
]) assert.ok(runtime.includes(token), `Home menu icon map missing: ${token}`);
for (const token of [
  'data-home-command-icon="${kind}"',
  'data-home-icon-family="command-metal"',
  'data-home-icon-version="${HOME_COMMAND_ICON_VERSION}"'
]) assert.ok(homeCommandArt.includes(token), `Shared Home icon data contract missing: ${token}`);
const retiredHomeArt = `${runtime}\n${css}`;
for (const token of [
  'function manualSvg(',
  'function weaponInfoIcon(',
  'function silverGearIcon(',
  'ui221GearMetal',
  'ui221-manual',
  'ui221-info-pistol',
  'ui221-info-art',
  'ui221-settings-art'
]) assert.equal(retiredHomeArt.includes(token), false, `Retired Home icon implementation must stay removed: ${token}`);
assert.equal(fs.existsSync(new URL('../game/src/weapon-info-hotfix.js', import.meta.url)), false, 'The unreferenced Weapon Info hotfix runtime must stay removed.');
assert.ok(flow.includes("document.body.classList.add('ui-v18', 'ui-v19');"));

console.log('Skirmish Arena 2.2.1 compatibility checks passed with balance-ready weapon schema.');
