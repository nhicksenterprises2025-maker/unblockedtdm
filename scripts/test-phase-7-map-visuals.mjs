import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const runtime = read('game/src/phase7-runtime.js');
const debug = read('game/src/debug-tuning.js');
const map = read('game/src/world/map01.js');
const weapons = read('game/src/data/weapons.js');
const constants = read('game/src/engine/constants.js');
const match = read('game/src/match/MatchManager.js');
const minimap = read('game/src/render/MinimapRenderer.js');

assert.ok(debug.includes("import('./phase7-runtime.js')"), 'Phase 7 visual runtime must load after the established phases.');
for (const token of [
  'WorldRenderer',
  'MinimapRenderer',
  'createRadialGradient',
  'BLUE SPAWN',
  'RED SPAWN',
  'NORTH WAREHOUSE',
  'SOUTH WAREHOUSE',
  'SKIRMISH ARENA',
  'TC // MID',
  '__phase7Visuals',
  '__phase7Landmarks'
]) assert.ok(runtime.includes(token), `Phase 7 visual layer missing ${token}.`);

for (const forbidden of [
  "from './data/weapons.js'",
  "from './actors/Player.js'",
  "from './ai/BotController.js'",
  "from './match/MatchManager.js'",
  "from './world/SpawnSystem.js'",
  "from './world/TileMap.js'",
  "from './world/map01.js'"
]) assert.equal(runtime.includes(forbidden), false, `Phase 7 must not import gameplay/geometry module ${forbidden}.`);

for (const geometry of [
  "pxRect(5, 2, 4, 3, 'tall', 'warehouse', 'North Warehouse')",
  "pxRect(5, 17, 4, 3, 'tall', 'warehouse', 'South Warehouse')",
  "pxRect(14, 3, 4, 2, 'wall', 'navy', 'North Terminal')",
  "pxRect(14, 17, 4, 2, 'wall', 'navy', 'South Terminal')",
  "{ x: 2.6 * T, y: 8.2 * T }",
  "{ x: 29.4 * T, y: 8.2 * T }",
  "{ type: 'lane', y: 10.85 * T }"
]) assert.ok(map.includes(geometry), `Canonical Training Complex geometry changed: ${geometry}`);

assert.ok(minimap.includes('const ENEMY_REVEAL_SECONDS = 1.5;'), 'Phase 7 must preserve the 1.5 second enemy reveal contract.');
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

console.log('Phase 7 checks passed: Training Complex material/landmark pass, tactical-map matching, preserved geometry, and unchanged gameplay contracts.');
