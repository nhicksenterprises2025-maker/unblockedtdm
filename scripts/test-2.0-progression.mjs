import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  ProgressionStore,
  MAX_CAREER_LEVEL,
  CAREER_TITLES,
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
const runtime = read('game/src/phase10-runtime.js');
const css = read('game/src/ui-2.0.css');
const debug = read('game/src/debug-tuning.js');
const weapons = read('game/src/data/weapons.js');
const constants = read('game/src/engine/constants.js');
const match = read('game/src/match/MatchManager.js');

assert.equal(MAX_CAREER_LEVEL, 100);
assert.equal(xpRequiredForLevel(1), 900);
assert.equal(xpRequiredForLevel(10), 1800);
assert.deepEqual(careerLevelFromXp(0), { level: 1, levelXp: 0, levelXpRequired: 900 });
assert.equal(titleForLevel(1), 'RECRUIT');
assert.equal(titleForLevel(10), 'OPERATOR');
assert.equal(titleForLevel(100), 'ARENA LEGEND');
assert.ok(CAREER_TITLES.some((entry) => entry.level === 50 && entry.title === 'VETERAN'));

const xp = calculateMatchXp({ won: true, kills: 15, assists: 4, damage: 1800, criticals: 2, bestStreak: 5 });
assert.deepEqual(xp.breakdown, { completion: 200, victory: 175, kills: 330, assists: 48, damage: 100, criticals: 16, streak: 50 });
assert.equal(xp.total, 919);

const storage = new MemoryStorage();
const store = new ProgressionStore(storage);
const result = store.recordMatch({
  won: true,
  durationLabel: '8:42',
  local: { kills: 15, deaths: 8, assists: 4, damage: 1800, criticals: 2, bestStreak: 5 }
});
assert.equal(result.xpGained, 919);
assert.equal(result.before.level, 1);
assert.equal(result.after.level, 2);
assert.equal(result.after.matches, 1);
assert.equal(result.after.wins, 1);
assert.equal(result.after.kills, 15);
assert.equal(result.after.deaths, 8);
assert.equal(result.after.recent.length, 1);
assert.equal(result.after.recent[0].xp, 919);

const restored = new ProgressionStore(storage).snapshot();
assert.equal(restored.totalXp, 919, 'Career XP must persist across restarts.');
assert.equal(restored.matches, 1, 'Career match count must persist across restarts.');
assert.equal(restored.level, 2, 'Derived career level must restore from persisted XP.');
assert.equal(restored.kd, 15 / 8);

assert.ok(debug.includes("import('./phase10-runtime.js')"), '2.0 progression runtime must load after the RC stack.');
for (const token of [
  'ProgressionStore',
  'unblockedtdm:match-complete',
  'data-career-strip',
  'career-postgame',
  'MATCH XP',
  'NEXT TITLE'
]) assert.ok(runtime.includes(token), `2.0 progression runtime missing ${token}.`);
for (const token of ['.career-strip', '.career-postgame', '.career-xp-track', '.career-recent']) {
  assert.ok(css.includes(token), `2.0 career presentation missing ${token}.`);
}

for (const forbidden of [
  "from './data/weapons.js'",
  "from './actors/Player.js'",
  "from './ai/BotController.js'",
  "from './match/MatchManager.js'",
  "from './engine/constants.js'",
  "from './world/map01.js'"
]) assert.equal(runtime.includes(forbidden), false, `2.0 progression must not import gameplay system ${forbidden}.`);

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

console.log('Skirmish Arena 2.0 checks passed: persistent career XP, 100-level progression, non-power titles, postgame/home presentation, and unchanged competitive gameplay.');
