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
assert.ok(runtime.includes('ui221GearMetal'));
assert.ok(runtime.includes('ui221-manual'));
assert.equal(runtime.includes("'quit':"), false);
assert.ok(flow.includes("document.body.classList.add('ui-v18', 'ui-v19');"));

console.log('Skirmish Arena 2.2.1 compatibility checks passed with balance-ready weapon schema.');
