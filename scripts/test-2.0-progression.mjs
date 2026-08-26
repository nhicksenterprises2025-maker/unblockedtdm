import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  ProgressionStore,
  MAX_CAREER_LEVEL,
  TOTAL_CAREER_XP,
  calculateMatchXp,
  careerLevelFromXp,
  titleForLevel,
  xpRequiredForLevel
} from '../game/src/progression/ProgressionStore.js';

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const bridge = read('game/src/phase10-runtime.js');
const runtime = read('game/src/phase211-runtime.js');
const css = read('game/src/ui-2.0.css');
const debug = read('game/src/debug-tuning.js');
const weapons = read('game/src/data/weapons.js');
const constants = read('game/src/engine/constants.js');
const match = read('game/src/match/MatchManager.js');

assert.equal(MAX_CAREER_LEVEL, 1000);
assert.equal(TOTAL_CAREER_XP, 4137375);
assert.equal(xpRequiredForLevel(1), 25);
assert.equal(xpRequiredForLevel(401), 3000);
assert.equal(xpRequiredForLevel(999), 10000);
assert.equal(xpRequiredForLevel(1000), 0);
assert.deepEqual(careerLevelFromXp(0), { level:1, levelXp:0, levelXpRequired:25 });
assert.equal(titleForLevel(1), 'RECRUIT I');
assert.equal(titleForLevel(401), 'LEGEND');
assert.equal(titleForLevel(1000), 'OMNIPOTENT');

const xp = calculateMatchXp({ won:true, kills:15, assists:4, roundWins:5, roundLosses:2 });
assert.deepEqual(xp.breakdown, { kills:120, assists:16, roundWins:80, roundLosses:8, victory:100 });
assert.equal(xp.total, 324);

const storage = new MemoryStorage();
const store = new ProgressionStore(storage);
const result = store.recordMatch({
  won:true,
  duration:522,
  durationLabel:'8:42',
  local:{ team:'blue', kills:15, deaths:8, assists:4, damage:1800, criticals:2, bestStreak:5 },
  roundHistory:[{winner:'blue'},{winner:'blue'},{winner:'red'},{winner:'blue'},{winner:'red'},{winner:'blue'},{winner:'blue'}]
});
assert.equal(result.xpGained, 324);
assert.equal(result.before.level, 1);
assert.equal(result.after.level, 9);
assert.equal(result.after.matches, 1);
assert.equal(result.after.wins, 1);
assert.equal(result.after.kills, 15);
assert.equal(result.after.deaths, 8);
assert.equal(result.after.roundWins, 5);
assert.equal(result.after.roundLosses, 2);
assert.equal(result.after.playSeconds, 522);
assert.equal(result.after.recent.length, 1);

const restored = new ProgressionStore(storage).snapshot();
assert.equal(restored.totalXp, 324, 'Career XP must persist across restarts.');
assert.equal(restored.matches, 1, 'Career match count must persist across restarts.');
assert.equal(restored.level, 9, 'Derived Career level must restore from persisted XP.');
assert.equal(restored.kd, 15 / 8);

assert.ok(debug.includes("import('./phase10-runtime.js')"), 'Historical Phase 10 entrypoint must stay in the runtime stack.');
assert.ok(bridge.includes("import('./phase211-runtime.js')"), 'Phase 10 must bridge to the single active 2.1.1 Career runtime.');
assert.equal(bridge.includes('unblockedtdm:match-complete'), false, 'Legacy bridge must not award XP a second time.');
for (const token of ['ProgressionStore', 'unblockedtdm:match-complete', 'dataset.careerStrip', 'career-postgame', 'MATCH XP', 'RANK PROMOTION']) {
  assert.ok(runtime.includes(token), `2.1.1 Career runtime missing ${token}.`);
}
for (const token of ['.career-strip', '.career-postgame', '.career-xp-track', '.career-recent']) assert.ok(css.includes(token), `Base Career presentation missing ${token}.`);

for (const forbidden of ["from './data/weapons.js'", "from './actors/Player.js'", "from './ai/BotController.js'", "from './match/MatchManager.js'", "from './engine/constants.js'", "from './world/map01.js'"]) {
  assert.equal(runtime.includes(forbidden), false, `Career runtime must not import gameplay system ${forbidden}.`);
}

for (const token of ['damage: 20, critChance: 0.02, critDamage: 32', 'damage: 145, critChance: 0.35, critDamage: 200', 'damage: 125, critChance: 0, critDamage: 125']) {
  assert.ok(weapons.includes(token), `Canonical weapon contract changed: ${token}`);
}
for (const token of ['PLAYER_SPEED_TILES = 5', 'SPRINT_SPEED_MULTIPLIER = 1.35', 'DASH_CHARGES_MAX = 4', 'DASH_DISTANCE_TILES = 3']) assert.ok(constants.includes(token), `Canonical movement contract changed: ${token}`);
for (const token of ['const ROUND_DURATION = 90;', 'const ROUND_KILL_TARGET = 12;', 'const ROUND_WINS_TO_MATCH = 5;']) assert.ok(match.includes(token), `Canonical match contract changed: ${token}`);

console.log('Skirmish Arena progression compatibility checks passed: Phase 10 bridge, 1000-level Career, agreed XP economy, persistence, and unchanged competitive gameplay.');
