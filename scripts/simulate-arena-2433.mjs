import { pathToFileURL } from 'node:url';
import {
  ARENA_AP_REWARDS,
  ARENA_RANKS,
  MAX_ARENA_THRESHOLD,
  calculateArenaMatch
} from '../game/src/arena/ArenaStore.js';

const DEFAULT_SEED = 2433;
const DEFAULT_TRIALS = 1200;
const DEFAULT_MAX_MATCHES = 10_000;

export const SIMULATION_ASSUMPTIONS = Object.freeze({
  interpretation:'Hours are active Arena match time. Queue, menus, and breaks are excluded.',
  seasonWindow:'A climb is modeled inside one monthly season; AP does not carry across a reset.',
  population:'Each trial represents one player. A small fixed skill variance is sampled per player, then match outcomes vary around that player skill.',
  correlation:'Win/loss determines the round record. Sweeps require wins, comebacks require wins after at least three lost rounds, streaks cannot exceed kills, and critical kills cannot exceed kills.',
  duration:'Match duration is derived from rounds played at a mean of 78 seconds per round, including countdown and round-break time, with bounded match-to-match variation.',
  rules:'First to five round wins, at most nine rounds, and the approved 2.4.3.1 AP table are used unchanged.',
  percentiles:'p10 is a faster-than-typical climb, median is p50, and p90 is a slower-than-typical climb.',
  materialMissDefinition:'The good-player median is a material miss when it differs from the 30-hour target by more than 20 percent.'
});

export const ARENA_ARCHETYPES = Object.freeze({
  weak:Object.freeze({
    label:'Weak',
    winRate:0.31,
    kd:0.68,
    killsPerRound:0.68,
    assistsPerRound:0.24,
    criticalKillRate:0.045,
    mvpRateOnWin:0.07,
    mvpRateOnLoss:0.015,
    streak5Rate:0.07,
    streak10Rate:0.004,
    sweepRateOnWin:0.035,
    comebackRateOnEligibleWin:0.025,
    teamWipesPerMatch:0.035,
    suddenDeathClutchRateOnWin:0.018
  }),
  average:Object.freeze({
    label:'Average',
    winRate:0.49,
    kd:1.02,
    killsPerRound:0.98,
    assistsPerRound:0.40,
    criticalKillRate:0.075,
    mvpRateOnWin:0.16,
    mvpRateOnLoss:0.045,
    streak5Rate:0.18,
    streak10Rate:0.018,
    sweepRateOnWin:0.055,
    comebackRateOnEligibleWin:0.055,
    teamWipesPerMatch:0.10,
    suddenDeathClutchRateOnWin:0.045
  }),
  good:Object.freeze({
    label:'Good',
    winRate:0.61,
    kd:1.42,
    killsPerRound:1.17,
    assistsPerRound:0.48,
    criticalKillRate:0.115,
    mvpRateOnWin:0.27,
    mvpRateOnLoss:0.08,
    streak5Rate:0.31,
    streak10Rate:0.052,
    sweepRateOnWin:0.075,
    comebackRateOnEligibleWin:0.085,
    teamWipesPerMatch:0.19,
    suddenDeathClutchRateOnWin:0.075
  }),
  elite:Object.freeze({
    label:'Elite',
    winRate:0.74,
    kd:2.05,
    killsPerRound:1.48,
    assistsPerRound:0.54,
    criticalKillRate:0.17,
    mvpRateOnWin:0.43,
    mvpRateOnLoss:0.14,
    streak5Rate:0.52,
    streak10Rate:0.14,
    sweepRateOnWin:0.12,
    comebackRateOnEligibleWin:0.11,
    teamWipesPerMatch:0.34,
    suddenDeathClutchRateOnWin:0.12
  })
});

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function round(value, digits = 2) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function seedFor(baseSeed, archetype, trial) {
  let hash = (Number(baseSeed) || DEFAULT_SEED) >>> 0;
  const text = `${archetype}:${trial}`;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash || 0x6d2b79f5;
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(random) {
  const first = Math.max(Number.EPSILON, random());
  const second = random();
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
}

function binomial(random, trials, probability) {
  let successes = 0;
  for (let index = 0; index < trials; index += 1) if (random() < probability) successes += 1;
  return successes;
}

function poisson(random, lambda) {
  if (lambda <= 0) return 0;
  const limit = Math.exp(-Math.min(30, lambda));
  let product = 1;
  let count = 0;
  do {
    count += 1;
    product *= random();
  } while (product > limit && count < 200);
  return count - 1;
}

function adjustedProbability(probability, factor) {
  const odds = probability / Math.max(Number.EPSILON, 1 - probability);
  const adjustedOdds = odds * factor;
  return clamp(adjustedOdds / (1 + adjustedOdds), 0.001, 0.999);
}

function sampleStreak(random, kills, profile, skillFactor) {
  if (kills >= 10 && random() < adjustedProbability(profile.streak10Rate, skillFactor)) return Math.min(kills, 10 + Math.floor(random() * 3));
  if (kills >= 5 && random() < adjustedProbability(profile.streak5Rate, skillFactor)) return Math.min(kills, 5 + Math.floor(random() * 5));
  return Math.min(kills, Math.floor(random() * 5));
}

function sampleMatch(random, profile, skillFactor) {
  const winRate = adjustedProbability(profile.winRate, skillFactor);
  const won = random() < winRate;
  const sweep = won && random() < adjustedProbability(profile.sweepRateOnWin, skillFactor);
  const closeRoundProbability = won
    ? clamp(0.68 - (winRate - 0.5) * 0.55, 0.42, 0.78)
    : clamp(0.58 + (winRate - 0.5) * 0.55, 0.38, 0.76);
  const losingSideRounds = sweep ? 0 : binomial(random, 4, closeRoundProbability);
  const roundWins = won ? 5 : losingSideRounds;
  const roundLosses = won ? losingSideRounds : 5;
  const totalRounds = roundWins + roundLosses;
  const outcomeKillFactor = won ? 1.07 : 0.93;
  const kills = Math.min(108, poisson(random, profile.killsPerRound * totalRounds * skillFactor * outcomeKillFactor));
  const deathMean = Math.max(0.35, kills / Math.max(0.2, profile.kd * skillFactor)) * (won ? 0.91 : 1.08);
  const deaths = Math.min(108, poisson(random, deathMean));
  const assists = Math.min(108, poisson(random, profile.assistsPerRound * totalRounds * (0.9 + skillFactor * 0.1)));
  const criticalKills = binomial(random, kills, clamp(profile.criticalKillRate * Math.sqrt(skillFactor), 0, 0.5));
  const bestStreak = sampleStreak(random, kills, profile, skillFactor);
  const mvpRate = won ? profile.mvpRateOnWin : profile.mvpRateOnLoss;
  const mvp = random() < adjustedProbability(mvpRate, skillFactor);
  const comebackEligible = won && !sweep && roundLosses >= 3;
  const comeback = comebackEligible && random() < adjustedProbability(profile.comebackRateOnEligibleWin, skillFactor);
  const teamWipes = Math.min(36, poisson(random, profile.teamWipesPerMatch * skillFactor));
  const suddenDeathClutches = won && random() < adjustedProbability(profile.suddenDeathClutchRateOnWin, skillFactor) ? 1 : 0;
  const durationFactor = clamp(1 + normal(random) * 0.10, 0.72, 1.32);
  const playSeconds = totalRounds * 78 * durationFactor;
  return {
    telemetry:{
      won,
      kills,
      deaths,
      assists,
      criticalKills,
      roundWins,
      roundLosses,
      bestStreak,
      mvp,
      comeback,
      teamWipes,
      suddenDeathClutches
    },
    playSeconds
  };
}

function quantile(sorted, probability) {
  if (!sorted.length) return null;
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  const weight = position - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function summarize(values, digits) {
  const sorted = [...values].sort((left, right) => left - right);
  return {
    p10:round(quantile(sorted, 0.10), digits),
    median:round(quantile(sorted, 0.50), digits),
    p90:round(quantile(sorted, 0.90), digits)
  };
}

function simulateArchetype(name, profile, { seed, trials, maxMatches }) {
  const completed = [];
  let censoredTrials = 0;
  for (let trial = 0; trial < trials; trial += 1) {
    const random = mulberry32(seedFor(seed, name, trial));
    const skillFactor = clamp(Math.exp(normal(random) * 0.075), 0.78, 1.28);
    let ap = 0;
    let matches = 0;
    let playSeconds = 0;
    let appliedAp = 0;
    while (ap < MAX_ARENA_THRESHOLD && matches < maxMatches) {
      const match = sampleMatch(random, profile, skillFactor);
      const scored = calculateArenaMatch(match.telemetry);
      const nextAp = Math.round(Math.max(0, ap + scored.rawDelta) * 2) / 2;
      appliedAp += nextAp - ap;
      ap = nextAp;
      matches += 1;
      playSeconds += match.playSeconds;
    }
    if (ap < MAX_ARENA_THRESHOLD) {
      censoredTrials += 1;
      continue;
    }
    completed.push({
      hours:playSeconds / 3600,
      matches,
      appliedApPerMatch:appliedAp / matches,
      minutesPerMatch:(playSeconds / 60) / matches
    });
  }
  return {
    trials,
    reachedTarget:completed.length,
    censoredTrials,
    reachRate:round(completed.length / trials, 4),
    hours:summarize(completed.map((entry) => entry.hours), 2),
    matches:summarize(completed.map((entry) => entry.matches), 0),
    appliedApPerMatch:summarize(completed.map((entry) => entry.appliedApPerMatch), 2),
    minutesPerMatch:summarize(completed.map((entry) => entry.minutesPerMatch), 2)
  };
}

export function runArenaSimulation({ seed = DEFAULT_SEED, trials = DEFAULT_TRIALS, maxMatches = DEFAULT_MAX_MATCHES } = {}) {
  const normalizedSeed = Number.isFinite(Number(seed)) ? Math.trunc(Number(seed)) : DEFAULT_SEED;
  const normalizedTrials = clamp(Math.trunc(Number(trials) || DEFAULT_TRIALS), 1, 20_000);
  const normalizedMaxMatches = clamp(Math.trunc(Number(maxMatches) || DEFAULT_MAX_MATCHES), 100, 100_000);
  const results = {};
  for (const [name, profile] of Object.entries(ARENA_ARCHETYPES)) {
    results[name] = simulateArchetype(name, profile, {
      seed:normalizedSeed,
      trials:normalizedTrials,
      maxMatches:normalizedMaxMatches
    });
  }
  const goodMedianHours = results.good.hours.median;
  const targetHours = 30;
  const relativeError = Math.abs(goodMedianHours - targetHours) / targetHours;
  const materialMiss = relativeError > 0.20;
  return {
    schemaVersion:1,
    simulator:'Skirmish Arena 2.4.3.3 deterministic AP calibration',
    machineReadable:true,
    seed:normalizedSeed,
    trialsPerArchetype:normalizedTrials,
    maxMatchesPerTrial:normalizedMaxMatches,
    target:{ rank:'OMNIPOTENT', ap:MAX_ARENA_THRESHOLD, goodPlayerHours:targetHours },
    economy:{
      rewards:{ ...ARENA_AP_REWARDS },
      thresholds:ARENA_RANKS.map(({ id, title, threshold }) => ({ id, title, threshold })),
      changedBySimulation:false
    },
    assumptions:{
      ...SIMULATION_ASSUMPTIONS,
      archetypes:Object.fromEntries(Object.entries(ARENA_ARCHETYPES).map(([name, profile]) => [name, { ...profile }]))
    },
    results,
    calibration:{
      goodMedianHours,
      targetHours,
      relativeError:round(relativeError, 4),
      materialMiss,
      verdict:materialMiss
        ? 'REPORT BEFORE CHANGING ECONOMY: the modeled good-player median is outside the ±20% calibration band.'
        : 'PASS: the modeled good-player median is inside the ±20% calibration band; preserve approved AP rewards and thresholds.'
    }
  };
}

function option(name, fallback) {
  const prefix = `--${name}=`;
  const raw = process.argv.find((argument) => argument.startsWith(prefix));
  return raw ? Number(raw.slice(prefix.length)) : fallback;
}

const isDirectRun = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  const report = runArenaSimulation({
    seed:option('seed', DEFAULT_SEED),
    trials:option('trials', DEFAULT_TRIALS),
    maxMatches:option('max-matches', DEFAULT_MAX_MATCHES)
  });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}
