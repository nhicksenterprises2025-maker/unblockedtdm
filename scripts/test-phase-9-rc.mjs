import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const debug = read('game/src/debug-tuning.js');
const runtime = read('game/src/phase9-runtime.js');
const css = read('game/src/ui-phase9.css');
const minimap = read('game/src/render/MinimapRenderer.js');
const loop = read('game/src/engine/GameLoop.js');
const phase7 = read('game/src/phase7-runtime.js');
const launcher = read('launcher/src/main.js');
const weapons = read('game/src/data/weapons.js');
const constants = read('game/src/engine/constants.js');
const match = read('game/src/match/MatchManager.js');
const map = read('game/src/world/map01.js');

assert.ok(debug.includes("import('./phase9-runtime.js')"), 'Phase 9 RC runtime must load after Phase 8.');
for (const token of [
  "ensureStyle('ui-phase9.css')",
  "classList.add('ui-phase9')",
  'unblockedtdm.pre2.backup.v1',
  'unblockedtdm.pre2.current.v1',
  'unblockedtdm.pre2.schema',
  'writeMigrationSnapshots',
  'pauseForFocusLoss',
  "window.addEventListener('blur'",
  "document.addEventListener('visibilitychange'"
]) assert.ok(runtime.includes(token), `Phase 9 RC hardening missing ${token}.`);

for (const forbidden of [
  "from './data/weapons.js'",
  "from './actors/Player.js'",
  "from './ai/BotController.js'",
  "from './match/MatchManager.js'",
  "from './world/map01.js'"
]) assert.equal(runtime.includes(forbidden), false, `Phase 9 runtime must remain non-gameplay: ${forbidden}.`);

for (const token of [
  'backdrop-filter:none!important',
  '.debug-chrome',
  '#debugPanel',
  'background:rgba(5,11,16,.72)!important'
]) assert.ok(css.includes(token), `Phase 9 HUD performance/presentation rule missing ${token}.`);

assert.ok(minimap.includes('const ENEMY_REVEAL_SECONDS = 1.5;'), 'Phase 9 must preserve the 1.5 second tactical enemy reveal.');
assert.ok(minimap.includes('const MINIMAP_FRAME_MS = 1000 / 30;'), 'Phase 9 must cap minimap redraws at 30 Hz.');
assert.ok(minimap.includes('nowMs - this.lastDrawTime < MINIMAP_FRAME_MS'), 'Minimap throttle must use the existing draw clock.');
assert.ok(loop.includes("document.addEventListener('visibilitychange'"), 'Game loop must reset its clock on visibility changes.');
assert.ok(loop.includes('globalThis.document?.hidden'), 'Game loop must skip hidden-window rendering/updating.');

for (const token of ['manifestNeedsUpdate', 'latestNeedsInstall', 'verifyFile(currentGamePath(), expected)']) {
  assert.ok(launcher.includes(token), `Phase 8 launcher update hardening must survive the RC: ${token}`);
}

for (const label of ['TC // MID', 'BLUE SPAWN', 'RED SPAWN', 'SA // TRAINING', "fillText('SKIRMISH ARENA'"]) {
  assert.equal(phase7.includes(label), false, `Prototype map text returned during Phase 9: ${label}`);
}

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
for (const geometry of [
  "pxRect(5, 2, 4, 3, 'tall', 'warehouse', 'North Warehouse')",
  "pxRect(5, 17, 4, 3, 'tall', 'warehouse', 'South Warehouse')",
  "{ x: 2.6 * T, y: 8.2 * T }",
  "{ x: 29.4 * T, y: 8.2 * T }"
]) assert.ok(map.includes(geometry), `Training Complex geometry changed during the RC: ${geometry}`);

console.log('Phase 9 checks passed: RC persistence safeguards, focus stability, minimap/HUD performance cleanup, launcher integrity, and unchanged gameplay contracts.');
