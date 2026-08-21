import fs from 'node:fs';
import assert from 'node:assert/strict';
import { AI_DIFFICULTIES } from '../game/src/ai/BotController.js';
import { DamageSystem } from '../game/src/combat/DamageSystem.js';
import { HealthState } from '../game/src/combat/HealthState.js';
import { GameSettings } from '../game/src/engine/GameSettings.js';
import { Input } from '../game/src/engine/Input.js';
import { MatchManager } from '../game/src/match/MatchManager.js';

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

globalThis.innerWidth = 1280;
globalThis.innerHeight = 720;
const settings = new GameSettings(new MemoryStorage());
settings.setBinding('moveUp', 'KeyI');
const input = new Input({ addEventListener() {} }, settings);
let prevented = false;
input.onKeyDown({ code: 'KeyI', target: { closest: () => ({}) }, preventDefault() { prevented = true; } });
assert.equal(input.axis().y, -1, 'Rebound movement must work even if a hidden UI control still owns DOM focus.');
assert.equal(prevented, true, 'Active rebound gameplay keys should block browser defaults.');
input.setSuspended(true);
input.onKeyDown({ code: 'KeyI', target: null, preventDefault() {} });
assert.equal(input.down.size, 0, 'Suspended menu input must not leak into gameplay.');

assert.deepEqual(
  Object.fromEntries(Object.entries(AI_DIFFICULTIES).map(([key, value]) => [key, value.multiplier])),
  { Beginner: 0.8, Average: 1, Sweat: 1.35, Pro: 1.75 },
  'Difficulty multipliers are canonical and must remain unchanged.'
);
const botSource = fs.readFileSync(new URL('../game/src/ai/BotController.js', import.meta.url), 'utf8');
assert.ok(botSource.includes('BOT_AIM_ERROR_SCALE = 1.65'), 'Build 1.7 must apply the lower-accuracy bot aim model.');
assert.ok(botSource.includes('BOT_TARGET_MOTION_ERROR_SCALE = 1.35'), 'Moving targets must add extra bot aim error.');

const target = { id: 'red-1', team: 'red', aimAngle: 0, health: new HealthState(), isInvulnerable: () => false };
let damageEvent = null;
const damage = new DamageSystem({ onDamage: (event) => { damageEvent = event; } });
const damageResult = damage.applyDamage({ target, amount: 32, sourceId: 'blue-1', sourceTeam: 'blue', sourceType: 'assault-rifle' });
assert.equal(damageResult.applied, true);
assert.equal(damageResult.critical, true, 'Canonical AR critical damage should be recognized for postgame critical tracking.');
assert.equal(damageEvent.result.amount, 32);

const makePlayer = (id, team, isLocal = false) => ({ id, team, isLocal, x: 0, y: 0, health: { recentDamage: () => [] } });
const blue = makePlayer('local-blue', 'blue', true);
const red = makePlayer('red-bot-1', 'red');
let finalSnapshot = null;
const match = new MatchManager({
  players: [blue, red],
  spawnSystem: null,
  projectileSystem: { reset() {} },
  onMatchEnd: ({ snapshot }) => { finalSnapshot = snapshot; }
});
match.state = 'active';
match.round = 9;
match.roundWins.blue = 4;
match.recordDamage({ sourceId: blue.id, target: red, result: { applied: true, amount: 71 }, critical: true });
match.recordElimination(blue, red, { recentDamage: [] });
match.state = 'active';
match.recordElimination(blue, red, { recentDamage: [] });
const blueStats = match.statsSnapshot().find((row) => row.id === blue.id);
assert.equal(blueStats.kills, 2);
assert.equal(blueStats.damage, 71);
assert.equal(blueStats.criticals, 1);
assert.equal(blueStats.bestStreak, 2);
match.roundKills.blue = 12;
match.finishRound('blue');
assert.ok(finalSnapshot, 'Winning the match must produce a postgame snapshot.');
assert.equal(finalSnapshot.matchWinner, 'blue');
assert.ok(finalSnapshot.roundHistory.length >= 1, 'Postgame must include round history.');
assert.ok(Array.isArray(finalSnapshot.stats), 'Postgame must include six-player-compatible stats data.');

const postgame = fs.readFileSync(new URL('../game/src/ui/PostgameScreen.js', import.meta.url), 'utf8');
for (const token of ['YOUR K/D/A', 'YOUR DAMAGE', 'CRITICAL HITS', 'REMATCH', 'MAIN MENU', 'ROUND HISTORY']) {
  assert.ok(postgame.includes(token), `Missing postgame contract: ${token}`);
}

const launcherHtml = fs.readFileSync(new URL('../launcher/src/index.html', import.meta.url), 'utf8');
const launcherCss = fs.readFileSync(new URL('../launcher/src/styles.css', import.meta.url), 'utf8');
const launcherRenderer = fs.readFileSync(new URL('../launcher/src/renderer.js', import.meta.url), 'utf8');
for (const token of ['LAUNCH GAME', 'BUILD ARCHIVE', 'assets/skirmish-arena-mark.svg', 'assets/training-complex-art.svg', 'status-strip']) {
  assert.ok(launcherHtml.includes(token) || launcherCss.includes(token), `Missing launcher redesign contract: ${token}`);
}
assert.equal(launcherCss.includes('radial-gradient'), false, 'Launcher must not use the previous decorative radial gradient aesthetic.');
assert.equal(launcherCss.includes('linear-gradient'), false, 'Launcher must not use large decorative gradients.');
for (const forbidden of ['border-radius:10px', 'border-radius:14px', 'border-radius:16px', 'border-radius:999px']) {
  assert.equal(launcherCss.includes(forbidden), false, `Launcher still contains oversized repeated rounding: ${forbidden}`);
}
assert.ok(launcherRenderer.includes("button.textContent = 'LAUNCHING…'"), 'Launch CTA must expose an actual launching state.');

console.log('Build 1.7 bind fix, bot accuracy, postgame stats and authored launcher checks passed under the Skirmish Arena product identity.');
