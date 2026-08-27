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

assert.equal(DEFAULT_BINDINGS.map, 'KeyM', 'Tactical Map must default to M.');
assert.equal(DEFAULT_BINDINGS.scoreboard, 'Tab', 'Scoreboard must default to TAB.');
assert.ok(BINDING_ACTIONS.some(([id, label]) => id === 'map' && label === 'Tactical Map'));
assert.ok(BINDING_ACTIONS.some(([id, label]) => id === 'scoreboard' && label === 'Scoreboard'));
assert.ok(tactical.includes("this.binding('map')"), 'Tactical Map behavior must read the live saved binding.');
assert.ok(tactical.includes("this.binding('scoreboard')"), 'Scoreboard behavior must read the live saved binding.');
assert.ok(tactical.includes('syncControlCopy()'), 'HUD control labels must update after rebinding.');
assert.ok(tactical.includes('mouseBindingCode'), 'Map/scoreboard rebinds must support the same mouse binding model as Settings.');
assert.equal(tactical.includes("event.code === 'Tab'"), false, 'Scoreboard behavior cannot stay hard-coded to TAB.');
assert.equal(tactical.includes("event.code === 'KeyM'"), false, 'Map behavior cannot stay hard-coded to M.');

const shotgun = WEAPONS.shotgun;
assert.equal(shotgun.damage, 16);
assert.equal(shotgun.pelletCount, 8);
assert.equal(shotgun.fullDamageRangeTiles, 2, 'Shotgun full-damage band must end at 2.0 tiles.');
assert.equal(shotgun.maxRangeTiles, 2.5, 'Shotgun must have a hard 2.5-tile maximum damage range.');
assert.equal(shotgun.falloffDamage, 5, 'Shotgun falloff pellet damage must remain 5 in the 2.0–2.5 tile band.');
assert.ok(runtime.includes('weapon.maxRangeTiles ?? weapon.fullDamageRangeTiles'), 'Shotgun pellet cast must honor the canonical hard max range.');
assert.ok(runtime.includes('maxDistance }),'), 'Shotgun cast must be physically limited to the max range.');
assert.ok(runtime.includes('centerDistance > maxDistance'), 'No shotgun target beyond the hard maximum may receive damage.');

// Intentional 2.2.1 balance change is shotgun range only; core values for every other weapon stay canonical.
assert.deepEqual(
  [WEAPONS.assaultRifle.damage, WEAPONS.assaultRifle.fullDamageRangeTiles, WEAPONS.smg.damage, WEAPONS.smg.fullDamageRangeTiles,
   WEAPONS.sniper.damage, WEAPONS.sniper.fullDamageRangeTiles, WEAPONS.lmg.damage, WEAPONS.lmg.fullDamageRangeTiles,
   WEAPONS.pistol.damage, WEAPONS.pistol.fullDamageRangeTiles, WEAPONS.launcher.damage, WEAPONS.melee.damage],
  [20,13.5,11,10,145,25,24,16,15,8,125,75]
);

assert.ok(debug.includes("import('./phase221-runtime.js')"), '2.2.1 runtime must load after prior UI phases.');
assert.ok(runtime.includes("[data-menu-action=\"weapon-info\"]"), 'Weapon Info access guard must be installed.');
assert.ok(runtime.includes('data-ui221-weapon-back'), 'Dedicated Weapon Info page must provide a direct back control.');
assert.ok(css.includes('ui221-weapon-page #mainMenu .main-sidebar{display:none'), 'Weapon Info must become a dedicated page rather than a cramped sidebar view.');
assert.ok(css.includes('width:100vw!important'), 'Dedicated Weapon Info must use the full viewport width.');
assert.ok(css.includes('.loadout-screen:not(.hidden)'), 'Loadouts must receive the 2.2.1 readability pass.');
assert.ok(css.includes('font-size:13px!important'), 'Loadout weapon names must no longer use the tiny legacy scale.');
assert.ok(css.includes('font-size:8px!important'), 'Small helper text must have a readable floor rather than the old 6px scale.');
assert.ok(css.includes('[data-menu-view="settings"] .binding-row'), 'Settings/keybind rows must receive the readability pass.');
assert.ok(css.includes('[data-menu-view="career"]'), 'Career detail page must receive the readability pass without changing the home strip.');

// Requested menu artwork: real gameplay weapon canvases + authored metallic vector assets. Quit stays untouched.
assert.ok(runtime.includes('data-game-weapon-model="assault-rifle"'));
assert.ok(runtime.includes('data-game-weapon-model="shotgun"'));
assert.ok(runtime.includes('data-game-weapon-model="pistol"'));
assert.ok(runtime.includes('ui221PlayMetal'));
assert.ok(runtime.includes('ui221GearMetal'));
assert.ok(runtime.includes('ui221-manual'));
assert.equal(runtime.includes("quit: silver"), false);
assert.equal(runtime.includes("'quit':"), false, '2.2.1 must not replace the approved Quit icon.');
assert.ok(flow.includes("document.body.classList.add('ui-v18', 'ui-v19');"), 'Historical menu compatibility marker must remain untouched.');

console.log('Skirmish Arena 2.2.1 checks passed: dedicated Weapon Info page, readable UI scale, real menu weapon art, tactical rebinds, and 2.5-tile shotgun max range.');
