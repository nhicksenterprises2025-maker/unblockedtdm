import assert from 'node:assert/strict';
import {
  ARENA_AP_REWARDS,
  ARENA_MATCH_LIMITS,
  ARENA_RANKS,
  ARENA_STORAGE_KEY,
  ArenaStore,
  arenaRankForPoints,
  calculateArenaMatch
} from '../game/src/arena/ArenaStore.js';
import { runArenaSimulation } from './simulate-arena-2433.mjs';

function memoryStorage(initial = null) {
  const map = new Map();
  if (initial != null) map.set(ARENA_STORAGE_KEY, String(initial));
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
    dump(key = ARENA_STORAGE_KEY) { return map.get(key); }
  };
}

function storedProfile(seasonId, current = {}, history = [], activeMatch = null) {
  return JSON.stringify({
    schema:1,
    current:{ seasonId, ap:0, peakAp:0, recent:[], processedMatchIds:[], ...current },
    history,
    activeMatch
  });
}

function plausibleWin(matchId, extra = {}) {
  return {
    matchId,
    won:true,
    kills:8,
    deaths:5,
    assists:3,
    criticalKills:1,
    roundWins:5,
    roundLosses:3,
    bestStreak:5,
    mvp:false,
    comeback:false,
    teamWipes:0,
    suddenDeathClutches:0,
    playSeconds:600,
    ...extra
  };
}

// Every exact threshold, the half-point immediately below it, and the
// half-point immediately above it must resolve deterministically.
for (const [index, rank] of ARENA_RANKS.entries()) {
  assert.equal(arenaRankForPoints(rank.threshold).id, rank.id, `${rank.title} must begin at its exact AP threshold.`);
  assert.equal(arenaRankForPoints(rank.threshold + 0.5).id, rank.id, `${rank.title} must remain active above its threshold.`);
  if (index > 0) {
    assert.equal(
      arenaRankForPoints(rank.threshold - 0.5).id,
      ARENA_RANKS[index - 1].id,
      `${rank.title} must not be granted a half-point early.`
    );
  }
}

assert.deepEqual(ARENA_AP_REWARDS, {
  kill:1, criticalKill:2, assist:0.5, roundWin:2.5, matchWin:10,
  streak5:2, streak10:5, sweep:10, mvp:5, comeback:8, teamWipe:2.5,
  suddenDeathClutch:2, negativeKd:-10, matchLoss:-8, forfeit:-50
}, 'Phase 3 calibration must not silently change approved AP values.');

const stackedPenalty = calculateArenaMatch({ won:false, kills:0, deaths:1, roundWins:0, roundLosses:5 });
assert.equal(stackedPenalty.breakdown.negativeKd, -10);
assert.equal(stackedPenalty.breakdown.loss, -8);
assert.equal(stackedPenalty.rawDelta, -18, 'Negative K/D and match loss must stack to -18 AP.');

const impossible = calculateArenaMatch({
  won:false,
  kills:2.9,
  deaths:-4,
  assists:999,
  criticalKills:99,
  roundWins:99,
  roundLosses:99,
  teamWipes:999,
  suddenDeathClutches:999,
  bestStreak:99,
  comeback:true
});
assert.equal(impossible.counts.kills, 2);
assert.equal(impossible.counts.deaths, 0);
assert.equal(impossible.counts.assists, ARENA_MATCH_LIMITS.maxAssists);
assert.equal(impossible.counts.criticalKills, 2);
assert.equal(impossible.counts.roundWins, 4, 'A losing side cannot record five round wins.');
assert.equal(impossible.counts.roundLosses, 5);
assert.equal(impossible.counts.teamWipes, ARENA_MATCH_LIMITS.maxTeamWipes);
assert.equal(impossible.counts.suddenDeathClutches, ARENA_MATCH_LIMITS.maxSuddenDeathClutches);
assert.equal(impossible.counts.bestStreak, 2);
assert.equal(impossible.flags.comeback, false, 'Comeback AP requires a win.');
assert.equal(impossible.validation.clamped, true);
assert.ok(impossible.validation.adjustments.length >= 8, 'Every corrected impossible field must be diagnosable.');

const forfeitFlags = calculateArenaMatch({ won:true, forfeit:true, mvp:true, comeback:true, roundWins:5 });
assert.equal(forfeitFlags.flags.won, false);
assert.equal(forfeitFlags.flags.mvp, false);
assert.equal(forfeitFlags.flags.comeback, false);
assert.equal(forfeitFlags.breakdown.mvp, 0);
assert.equal(forfeitFlags.breakdown.comeback, 0);

const invalidFlags = calculateArenaMatch({ won:'true', mvp:1, comeback:'false', kills:1 });
assert.equal(invalidFlags.flags.won, false, 'String/number flags must not be treated as trusted match telemetry.');
assert.equal(invalidFlags.flags.mvp, false);
assert.equal(invalidFlags.flags.comeback, false);
assert.equal(invalidFlags.validation.clamped, true);

// Promotion, demotion, and AP floor use real match application rather than
// rank lookup alone.
const promotionStorage = memoryStorage(storedProfile('2026-08', { ap:99.5, peakAp:99.5 }));
const promotionStore = new ArenaStore({ storage:promotionStorage, now:() => new Date(2026, 7, 15, 12) });
const promotion = promotionStore.recordMatch(plausibleWin('promotion'));
assert.equal(promotion.promoted, true);
assert.equal(promotion.rankBefore.id, 'prospect');
assert.equal(promotion.rankAfter.id, 'rookie-i');

const demotionStorage = memoryStorage(storedProfile('2026-08', { ap:100, peakAp:100, peakRankId:'rookie-i' }));
const demotionStore = new ArenaStore({ storage:demotionStorage, now:() => new Date(2026, 7, 15, 12) });
const demotion = demotionStore.recordMatch({ matchId:'demotion', won:false, kills:0, deaths:1, roundWins:0, roundLosses:5 });
assert.equal(demotion.demoted, true);
assert.equal(demotion.rankBefore.id, 'rookie-i');
assert.equal(demotion.rankAfter.id, 'prospect');
assert.equal(demotion.apAfter, 82);

const floorStorage = memoryStorage(storedProfile('2026-08', { ap:5, peakAp:5 }));
const floorStore = new ArenaStore({ storage:floorStorage, now:() => new Date(2026, 7, 15, 12) });
const floor = floorStore.recordMatch({ matchId:'floor', won:false, kills:0, deaths:1, roundWins:0, roundLosses:5 });
assert.equal(floor.rawDelta, -18);
assert.equal(floor.apDelta, -5, 'Applied AP delta must reflect the zero floor.');
assert.equal(floor.apAfter, 0, 'Arena AP may never drop below zero.');

// Ordinary month rollover archives once at the actual boundary.
const monthStorage = memoryStorage();
let monthNow = new Date(2026, 7, 31, 23, 59, 59);
const monthStore = new ArenaStore({ storage:monthStorage, now:() => monthNow });
monthStore.recordMatch(plausibleWin('august'));
monthNow = new Date(2026, 8, 1, 0, 0, 0);
assert.equal(monthStore.ensureCurrentSeason(), true);
const september = monthStore.snapshot();
assert.equal(september.seasonId, '2026-09');
assert.equal(september.ap, 0);
assert.equal(september.history.length, 1);
assert.equal(september.history[0].seasonId, '2026-08');
assert.equal(september.history[0].endedAt, new Date(2026, 8, 1, 0, 0, 0, 0).getTime());

// December-to-January is the same forward transition, not a special reset.
const yearStorage = memoryStorage(storedProfile('2026-12', { ap:250, peakAp:250, matches:1, wins:1 }));
const yearStore = new ArenaStore({ storage:yearStorage, now:() => new Date(2027, 0, 1, 0, 0, 1) });
const january = yearStore.snapshot();
assert.equal(january.seasonId, '2027-01');
assert.equal(january.history[0].seasonId, '2026-12');
assert.equal(january.history[0].endedAt, new Date(2027, 0, 1, 0, 0, 0, 0).getTime());

// An offline multi-month gap advances directly to the observed month and does
// not manufacture empty archived seasons.
const gapStorage = memoryStorage(storedProfile('2026-03', { ap:450, peakAp:450, matches:4, wins:2, losses:2 }));
const gapStore = new ArenaStore({ storage:gapStorage, now:() => new Date(2026, 7, 20, 8) });
const afterGap = gapStore.snapshot();
assert.equal(afterGap.seasonId, '2026-08');
assert.deepEqual(afterGap.history.map((season) => season.seasonId), ['2026-03']);
assert.equal(afterGap.history[0].endedAt, new Date(2026, 3, 1, 0, 0, 0, 0).getTime());

const emptyGapStorage = memoryStorage(storedProfile('2026-03'));
const emptyGapStore = new ArenaStore({ storage:emptyGapStorage, now:() => new Date(2026, 7, 20, 8) });
assert.equal(emptyGapStore.snapshot().history.length, 0, 'Empty offline months must not create fake history rows.');

// Forward-only policy: a clock rollback never rewinds or re-archives a season.
const rollbackStorage = memoryStorage(storedProfile('2026-09', { ap:200, peakAp:200, matches:2, wins:1, losses:1 }));
let rollbackNow = new Date(2026, 7, 20, 8);
const rollbackStore = new ArenaStore({ storage:rollbackStorage, now:() => rollbackNow });
let rollbackSnapshot = rollbackStore.snapshot();
assert.equal(rollbackSnapshot.seasonId, '2026-09');
assert.equal(rollbackSnapshot.ap, 200);
assert.equal(rollbackSnapshot.history.length, 0);
assert.equal(rollbackSnapshot.seasonState.clockRollbackDetected, true);
const rollbackCount = rollbackSnapshot.seasonState.rollbackCount;
rollbackStore.ensureCurrentSeason();
assert.equal(rollbackStore.snapshot().seasonState.rollbackCount, rollbackCount, 'Repeated reads during one rollback must not inflate diagnostics.');
rollbackNow = new Date(2026, 9, 1, 0, 0, 1);
assert.equal(rollbackStore.ensureCurrentSeason(), true, 'The profile may advance once the clock moves beyond its stored season.');
assert.equal(rollbackStore.snapshot().seasonId, '2026-10');

// A match started before midnight remains live and owned by that season until
// it settles; only then may rollover archive it.
const boundaryStorage = memoryStorage();
let boundaryNow = new Date(2026, 7, 31, 23, 59, 30);
const boundaryStore = new ArenaStore({ storage:boundaryStorage, now:() => boundaryNow });
boundaryStore.beginMatch({ id:'live-boundary', team:'blue' });
boundaryStore.updateActiveMatch({ kills:3, deaths:1, assists:1, roundWins:2, roundLosses:1, playSeconds:240 });
boundaryNow = new Date(2026, 8, 1, 0, 0, 2);
const duringBoundary = boundaryStore.snapshot();
assert.equal(duringBoundary.seasonId, '2026-08');
assert.equal(duringBoundary.activeMatch.id, 'live-boundary');
assert.equal(duringBoundary.seasonState.pendingSeasonId, '2026-09');
const boundaryResult = boundaryStore.recordMatch(plausibleWin('live-boundary', { kills:9, deaths:4 }));
assert.equal(boundaryResult.seasonId, '2026-08');
assert.equal(boundaryResult.after.seasonId, '2026-08', 'Postgame must display the season that owns the match.');
assert.equal(boundaryResult.rolloverApplied, true);
assert.equal(boundaryResult.currentSeasonId, '2026-09');
const afterBoundary = boundaryStore.snapshot();
assert.equal(afterBoundary.seasonId, '2026-09');
assert.equal(afterBoundary.activeMatch, null);
assert.equal(afterBoundary.history[0].seasonId, '2026-08');
assert.equal(afterBoundary.history[0].matches, 1);
assert.ok(afterBoundary.history[0].ap > 0);
const replayAcrossBoundary = boundaryStore.recordMatch(plausibleWin('live-boundary'));
assert.equal(replayAcrossBoundary.duplicate, true, 'The archived boundary match must remain duplicate-protected.');
assert.equal(boundaryStore.snapshot().ap, 0, 'An old-season replay must not award new-season AP.');

// Offline recovery follows the same ownership rule and records the forfeit in
// the month where the abandoned match began.
const offlineStorage = memoryStorage();
let offlineNow = new Date(2026, 10, 30, 23, 58);
const offlineBefore = new ArenaStore({ storage:offlineStorage, now:() => offlineNow });
offlineBefore.beginMatch({ id:'offline-boundary' });
offlineBefore.updateActiveMatch({ kills:1, deaths:3, roundWins:1, roundLosses:2, playSeconds:180 });
offlineNow = new Date(2026, 11, 2, 9, 30);
const offlineRecovered = new ArenaStore({ storage:offlineStorage, now:() => offlineNow });
assert.ok(offlineRecovered.recoveredForfeit);
assert.equal(offlineRecovered.recoveredForfeit.seasonId, '2026-11');
assert.equal(offlineRecovered.recoveredForfeit.after.seasonId, '2026-11');
const offlineDecember = offlineRecovered.snapshot();
assert.equal(offlineDecember.seasonId, '2026-12');
assert.equal(offlineDecember.history[0].seasonId, '2026-11');
assert.equal(offlineDecember.history[0].forfeits, 1);
assert.equal(offlineDecember.activeMatch, null);

// More than the old 120-ID cap survives normalization/reload.
const ledgerStorage = memoryStorage();
const ledgerDate = new Date(2026, 5, 15, 12);
let ledgerStore = new ArenaStore({ storage:ledgerStorage, now:() => ledgerDate });
for (let index = 0; index < 121; index += 1) {
  ledgerStore.recordMatch({ matchId:`ledger-${index}`, won:false, kills:0, deaths:0, roundWins:0, roundLosses:5 });
}
assert.equal(ledgerStore.snapshot().processedMatchIds.length, 121);
ledgerStore = new ArenaStore({ storage:ledgerStorage, now:() => ledgerDate });
assert.equal(ledgerStore.snapshot().processedMatchIds.length, 121, 'Reload must preserve the full current-season ledger.');
assert.equal(ledgerStore.recordMatch(plausibleWin('ledger-0')).duplicate, true, 'An ID older than the former cap must stay protected.');

ledgerStore.beginMatch({ id:'different-live-match' });
const delayedDuplicate = ledgerStore.recordMatch(plausibleWin('ledger-1'));
assert.equal(delayedDuplicate.duplicate, true);
assert.equal(delayedDuplicate.clearedActiveMatch, false);
assert.equal(ledgerStore.snapshot().activeMatch.id, 'different-live-match', 'A delayed duplicate must not clear a different active match.');

// Snapshot consumers receive no mutable aliases into the store, including
// current arrays, recent records, archived arrays, rank objects, and active state.
const isolated = ledgerStore.snapshot();
isolated.processedMatchIds.length = 0;
isolated.recent[0].id = 'tampered-recent';
isolated.rank.id = 'tampered-rank';
isolated.activeMatch.id = 'tampered-active';
const isolatedAgain = ledgerStore.snapshot();
assert.equal(isolatedAgain.processedMatchIds.length, 121);
assert.notEqual(isolatedAgain.recent[0].id, 'tampered-recent');
assert.notEqual(isolatedAgain.rank.id, 'tampered-rank');
assert.equal(isolatedAgain.activeMatch.id, 'different-live-match');

const archivedIsolation = boundaryStore.snapshot();
archivedIsolation.history[0].processedMatchIds.length = 0;
archivedIsolation.history[0].recent[0].id = 'tampered-history';
const archivedIsolationAgain = boundaryStore.snapshot();
assert.ok(archivedIsolationAgain.history[0].processedMatchIds.includes('live-boundary'));
assert.notEqual(archivedIsolationAgain.history[0].recent[0].id, 'tampered-history');

// Persistence failures are observable in snapshots/results instead of being
// silently presented as durable progress.
const failingWriteStorage = {
  getItem() { return null; },
  setItem() { throw new Error('quota denied'); },
  removeItem() {}
};
const failingWriteStore = new ArenaStore({ storage:failingWriteStorage, now:() => new Date(2026, 7, 15) });
const failedWrite = failingWriteStore.recordMatch(plausibleWin('write-failure'));
assert.equal(failedWrite.after.persistence.writeOk, false);
assert.equal(failedWrite.after.persistence.healthy, false);
assert.match(failedWrite.after.persistence.lastWriteError, /quota denied/);
assert.ok(failedWrite.after.persistence.writeFailures >= 1);

const corruptReadStorage = memoryStorage('{not-json');
const corruptReadStore = new ArenaStore({ storage:corruptReadStorage, now:() => new Date(2026, 7, 15) });
const corruptSnapshot = corruptReadStore.snapshot();
assert.equal(corruptSnapshot.persistence.readOk, false);
assert.equal(corruptSnapshot.persistence.healthy, false);
assert.ok(corruptSnapshot.persistence.readFailures >= 1);

// The economy model is seeded, deterministic, correlated, and machine-readable.
const simulationOptions = { seed:2433, trials:120, maxMatches:10_000 };
const simulation = runArenaSimulation(simulationOptions);
const repeatedSimulation = runArenaSimulation(simulationOptions);
assert.deepEqual(simulation, repeatedSimulation, 'Identical seed and assumptions must produce identical percentiles.');
assert.equal(JSON.parse(JSON.stringify(simulation)).schemaVersion, 1);
assert.equal(simulation.economy.changedBySimulation, false);
assert.deepEqual(simulation.economy.rewards, ARENA_AP_REWARDS);
for (const result of Object.values(simulation.results)) {
  assert.ok(result.hours.p10 <= result.hours.median && result.hours.median <= result.hours.p90);
  assert.ok(result.matches.p10 <= result.matches.median && result.matches.median <= result.matches.p90);
}
assert.ok(simulation.results.weak.hours.median > simulation.results.average.hours.median, 'Weak players must struggle more than average players.');
assert.ok(simulation.results.average.hours.median > simulation.results.good.hours.median, 'Average progression must be slower than good progression.');
assert.ok(simulation.results.good.hours.median > simulation.results.elite.hours.median, 'Elite players must reach Omnipotent faster than good players.');
assert.equal(simulation.calibration.materialMiss, false, simulation.calibration.verdict);
assert.ok(simulation.calibration.goodMedianHours >= 24 && simulation.calibration.goodMedianHours <= 36, 'Good-player median must remain within the documented ±20% target band.');

console.log('Skirmish Arena 2.4.3.3 Arena core checks passed: exact ranks, bounded scoring, promotion/demotion/floor, forward-only monthly ownership, online/offline boundaries, durable duplicates, deep isolation, persistence diagnostics, and seeded AP calibration.');
