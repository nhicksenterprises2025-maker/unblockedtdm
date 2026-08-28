import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const debug = read('game/src/debug-tuning.js');
const runtime = read('game/src/phase2013-runtime.js');
const css = read('game/src/ui-2.01.3.css');
const weapons = read('game/src/data/weapons.js');
const constants = read('game/src/engine/constants.js');
const match = read('game/src/match/MatchManager.js');

assert.ok(debug.includes("import('./phase2013-runtime.js')"));
assert.ok(runtime.includes("ensureStyle('ui-2.01.3.css')"));
assert.ok(runtime.includes("document.body.classList.add('ui-2013')"));
assert.ok(css.includes('body.ui-2013 .main-content'));
assert.ok(css.includes('overflow:auto!important'));
assert.ok(css.includes('.loadout-screen:not(.hidden)'));
assert.ok(css.includes('height:100vh!important'));
assert.ok(css.includes('overflow:hidden!important'));
assert.ok(css.includes('grid-template-rows:auto auto auto auto minmax(0,1fr) auto!important'));
assert.ok(css.includes('.weapon-list'));
assert.ok(css.includes('.weapon-detail'));
assert.ok(css.includes('.phase2012-spread'));
assert.ok(css.includes('.phase2011-weapon-canvas'));
for (const forbidden of ["import './data/weapons.js'","import './combat/WeaponManager.js'","import './ai/BotController.js'","import './world/map01.js'","import './world/SpawnSystem.js'"]) assert.ok(!runtime.includes(forbidden), `2.01.3 presentation runtime must not import ${forbidden}`);
for (const id of ['assault-rifle','smg','sniper','shotgun','lmg','pistol','launcher','melee']) assert.ok(weapons.includes(`id: '${id}'`), `Weapon roster missing ${id}.`);
for (const field of ['damage:', 'critChance:', 'fireInterval:', 'magazineSize:']) assert.ok(weapons.includes(field), `Weapon schema missing ${field}`);
for (const token of ['PLAYER_SPEED_TILES = 5','SPRINT_SPEED_MULTIPLIER = 1.35','DASH_CHARGES_MAX = 4','DASH_DISTANCE_TILES = 3']) assert.ok(constants.includes(token));
for (const token of ['const ROUND_DURATION = 90;','const ROUND_KILL_TARGET = 12;','const ROUND_WINS_TO_MATCH = 5;']) assert.ok(match.includes(token));

console.log('Skirmish Arena 2.01.3 checks passed: Loadouts remain viewport-contained with gameplay-model presentation and balance-ready weapon data.');
