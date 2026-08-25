import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const debug = read('game/src/debug-tuning.js');
const runtime = read('game/src/phase2013-runtime.js');
const css = read('game/src/ui-2.01.3.css');
const weapons = read('game/src/data/weapons.js');
const constants = read('game/src/engine/constants.js');
const match = read('game/src/match/MatchManager.js');

assert.ok(debug.includes("import('./phase2013-runtime.js')"), '2.01.3 runtime must load after 2.01.2.');
assert.ok(runtime.includes("ensureStyle('ui-2.01.3.css')"), '2.01.3 runtime must load its stylesheet.');
assert.ok(runtime.includes("document.body.classList.add('ui-2013')"), '2.01.3 must expose a scoped body class.');

assert.ok(css.includes('body.ui-2013 .main-content'), '2.01.3 must explicitly restore main-content behavior.');
assert.ok(css.includes('overflow:auto!important'), 'Main menu must remain scrollable when content requires it.');
assert.ok(css.includes('.loadout-screen:not(.hidden)'), 'No-scroll behavior must be scoped to the Loadouts screen.');
assert.ok(css.includes('height:100vh!important'), 'Loadouts must lock to the viewport height.');
assert.ok(css.includes('overflow:hidden!important'), 'Loadouts must not expose a vertical page scrollbar.');
assert.ok(css.includes('grid-template-rows:auto auto auto auto minmax(0,1fr) auto!important'), 'Loadout shell must allocate the weapon body from remaining viewport space.');
assert.ok(css.includes('.weapon-list'), 'Loadout weapon list must be compacted into the one-page layout.');
assert.ok(css.includes('.weapon-detail'), 'Loadout weapon detail must be compacted into the one-page layout.');
assert.ok(css.includes('.phase2012-spread'), '2.01.2 real gameplay crosshair spread preview must remain visible in Loadouts.');
assert.ok(css.includes('.phase2011-weapon-canvas'), '2.01.1 gameplay weapon model canvases must remain visible in Loadouts.');

for (const forbidden of [
  "import './data/weapons.js'",
  "import './combat/WeaponManager.js'",
  "import './ai/BotController.js'",
  "import './world/map01.js'",
  "import './world/SpawnSystem.js'"
]) assert.ok(!runtime.includes(forbidden), `2.01.3 presentation runtime must not import gameplay system: ${forbidden}`);

for (const token of [
  'damage: 20, critChance: 0.02, critDamage: 32',
  'damage: 145, critChance: 0.35, critDamage: 200',
  'damage: 125, critChance: 0, critDamage: 125'
]) assert.ok(weapons.includes(token), `Canonical weapon contract changed: ${token}`);

for (const token of ['PLAYER_SPEED_TILES = 5', 'SPRINT_SPEED_MULTIPLIER = 1.35', 'DASH_CHARGES_MAX = 4', 'DASH_DISTANCE_TILES = 3']) {
  assert.ok(constants.includes(token), `Canonical movement contract changed: ${token}`);
}

for (const token of ['const ROUND_DURATION = 90;', 'const ROUND_KILL_TARGET = 12;', 'const ROUND_WINS_TO_MATCH = 5;']) {
  assert.ok(match.includes(token), `Canonical match contract changed: ${token}`);
}

console.log('Skirmish Arena 2.01.3 checks passed: main menu scroll restored and Loadouts alone fit a single viewport with gameplay contracts unchanged.');
