import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ARENA_AP_REWARDS,
  ARENA_RANKS,
  ARENA_STORAGE_KEY,
  ArenaStore,
  arenaNextRankForPoints,
  arenaRankForPoints,
  arenaSeasonId,
  calculateArenaMatch
} from '../game/src/arena/ArenaStore.js';

function memoryStorage() {
  const map = new Map();
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
    dump(key) { return map.get(key); }
  };
}

assert.equal(ARENA_RANKS.length, 14, 'Arena must ship all 14 ranks.');
assert.deepEqual(ARENA_RANKS.map((rank) => rank.title), [
  'PROSPECT','ROOKIE I','ROOKIE II','BRONZE TIER I','BRONZE TIER II','BRONZE TIER III',
  'SILVER TIER I','SILVER TIER II','GOLD','PLATINUM','DIAMOND','PINK DIAMOND','DARK OPAL','OMNIPOTENT'
]);
assert.deepEqual(ARENA_RANKS.map((rank) => rank.threshold), [0,100,250,450,700,1000,1350,1750,2200,2700,3200,3600,3900,4200]);
assert.equal(arenaRankForPoints(2199.5).title, 'SILVER TIER II');
assert.equal(arenaRankForPoints(2200).title, 'GOLD');
assert.equal(arenaNextRankForPoints(3900).title, 'OMNIPOTENT');
assert.equal(arenaSeasonId(new Date(2026, 7, 31, 23, 59)), '2026-08');

assert.deepEqual(ARENA_AP_REWARDS, {
  kill:1, criticalKill:2, assist:0.5, roundWin:2.5, matchWin:10,
  streak5:2, streak10:5, sweep:10, mvp:5, comeback:8, teamWipe:2.5,
  suddenDeathClutch:2, negativeKd:-10, matchLoss:-8
});

const dominant = calculateArenaMatch({
  won:true,
  kills:10,
  deaths:2,
  assists:3,
  criticalKills:2,
  roundWins:5,
  roundLosses:0,
  bestStreak:10,
  mvp:true,
  comeback:true,
  teamWipes:1,
  suddenDeathClutches:1
});
assert.equal(dominant.rawDelta, 70.5, 'Full bonus stack must retain half-point Arena precision.');
assert.equal(dominant.breakdown.kills, 12, 'Critical kills are 2 AP total, not +2 on top of normal kill AP.');
assert.equal(dominant.breakdown.mvp, 5);
assert.equal(dominant.breakdown.comeback, 8);
assert.equal(dominant.breakdown.teamWipes, 2.5);
assert.equal(dominant.breakdown.sweep, 10);

const storage = memoryStorage();
let now = new Date(2026, 7, 31, 20, 0, 0);
const store = new ArenaStore({ storage, now:() => now });
const first = store.recordMatch({ matchId:'match-a', ...dominant.counts, won:true, mvp:true, comeback:true, teamWipes:1, suddenDeathClutches:1 });
assert.equal(first.duplicate, false);
assert.ok(store.snapshot().ap > 0);
const apAfterFirst = store.snapshot().ap;
const duplicate = store.recordMatch({ matchId:'match-a', kills:99, won:true });
assert.equal(duplicate.duplicate, true, 'The same Arena match id may never award AP twice.');
assert.equal(store.snapshot().ap, apAfterFirst);

store.beginMatch({ id:'forfeit-a', team:'blue' });
store.updateActiveMatch({ kills:1, deaths:2, assists:0, roundWins:0, roundLosses:1, bestStreak:1 });
const forfeit = store.forfeitActive();
assert.equal(forfeit.rawDelta, -17, 'Forfeit with negative K/D must stack -8 loss and -10 negative-K/D against earned kill AP.');
assert.equal(forfeit.breakdown.loss, -8);
assert.equal(forfeit.breakdown.negativeKd, -10);
assert.equal(forfeit.flags.forfeit, true);

const beforeReset = store.snapshot();
assert.ok(beforeReset.matches >= 2);
now = new Date(2026, 8, 1, 0, 0, 1);
assert.equal(store.ensureCurrentSeason(), true, 'Arena must reset when local calendar reaches a new month.');
const afterReset = store.snapshot();
assert.equal(afterReset.seasonId, '2026-09');
assert.equal(afterReset.ap, 0);
assert.equal(afterReset.rank.title, 'PROSPECT');
assert.equal(afterReset.matches, 0);
assert.equal(afterReset.history.length, 1, 'Completed monthly season must be archived before reset.');
assert.equal(afterReset.history[0].seasonId, '2026-08');
assert.ok(storage.dump(ARENA_STORAGE_KEY), 'Arena profile must persist independently from Career.');

const crashStorage = memoryStorage();
let crashNow = new Date(2026, 8, 10, 12, 0, 0);
const crashed = new ArenaStore({ storage:crashStorage, now:() => crashNow });
crashed.recordMatch({ matchId:'seed', won:true, kills:10, deaths:1, roundWins:5, roundLosses:1 });
crashed.beginMatch({ id:'abandoned', team:'blue' });
crashed.updateActiveMatch({ kills:2, deaths:4, roundWins:1, roundLosses:2 });
const recovered = new ArenaStore({ storage:crashStorage, now:() => crashNow });
assert.ok(recovered.recoveredForfeit, 'An active Arena match left in storage must recover as a forfeit on next boot.');
assert.equal(recovered.recoveredForfeit.breakdown.loss, -8);
assert.equal(recovered.recoveredForfeit.breakdown.negativeKd, -10);
assert.equal(recovered.snapshot().activeMatch, null);

const read = (relative) => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const runtime = read('game/src/phase2431-runtime.js');
const parentRuntime = read('game/src/phase241-runtime.js');
const css = read('game/src/ui-2.4.3.1.css');
const runner = read('scripts/check-all.mjs');

for (const token of [
  "dataset.arenaReady = 'true'",
  'dataset.arenaStrip',
  'dataset.arenaModeSelect',
  'data-arena-select-mode="casual"',
  'data-arena-select-mode="arena"',
  'skirmish:match-started',
  'skirmish:arena-elimination-pre',
  'unblockedtdm:match-complete',
  'ARENA RESULTS',
  'VIEW ARENA',
  'MONTHLY COMPETITIVE',
  'Negative K/D −10',
  'Match Loss −8'
]) assert.ok(runtime.includes(token), `Arena Phase 1 runtime missing ${token}`);

assert.ok(parentRuntime.includes("import './phase2431-runtime.js';"), 'Arena Phase 1 must load through the deterministic 2.4 runtime chain.');
assert.ok(css.includes('.arena-strip') && css.includes('.career-primary'), 'Home Arena strip must intentionally reuse Career panel geometry.');
assert.ok(css.includes('.arena-mode-select') && css.includes('.arena-postgame'), 'Arena mode select and postgame presentation must be styled.');
assert.ok(runner.includes("'scripts/test-2.4.3.1-arena-phase1.mjs'"), 'Arena Phase 1 gate must be registered in centralized validation.');

console.log('Skirmish Arena 2.4.3.1 Phase 1 checks passed: Casual/Arena flow, monthly ranks, AP economy, penalties, persistence, reset/archive, forfeit recovery, Career-matched home UI and ranked postgame.');
