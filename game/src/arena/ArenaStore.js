export const ARENA_STORAGE_KEY = 'skirmisharena.arena.v1';

export const ARENA_RANKS = Object.freeze([
  { id:'prospect', title:'PROSPECT', threshold:0, material:'Raw steel', tone:'#7d8b95' },
  { id:'rookie-i', title:'ROOKIE I', threshold:100, material:'Steel I', tone:'#97a8b4' },
  { id:'rookie-ii', title:'ROOKIE II', threshold:250, material:'Steel II', tone:'#b1c0c9' },
  { id:'bronze-i', title:'BRONZE TIER I', threshold:450, material:'Bronze I', tone:'#a96f43' },
  { id:'bronze-ii', title:'BRONZE TIER II', threshold:700, material:'Bronze II', tone:'#ba7d4b' },
  { id:'bronze-iii', title:'BRONZE TIER III', threshold:1000, material:'Bronze III', tone:'#cc8f57' },
  { id:'silver-i', title:'SILVER TIER I', threshold:1350, material:'Silver I', tone:'#aebbc5' },
  { id:'silver-ii', title:'SILVER TIER II', threshold:1750, material:'Silver II', tone:'#d3dde3' },
  { id:'gold', title:'GOLD', threshold:2200, material:'Gold', tone:'#d8b553' },
  { id:'platinum', title:'PLATINUM', threshold:2700, material:'Platinum', tone:'#9ee8e2' },
  { id:'diamond', title:'DIAMOND', threshold:3200, material:'Blue crystal', tone:'#69c9ff' },
  { id:'pink-diamond', title:'PINK DIAMOND', threshold:3600, material:'Pink crystal', tone:'#ff76cf' },
  { id:'dark-opal', title:'DARK OPAL', threshold:3900, material:'Dark opal', tone:'#8d70d8' },
  { id:'omnipotent', title:'OMNIPOTENT', threshold:4200, material:'Obsidian + silver + cyan', tone:'#45d8ff' }
]);

export const MAX_ARENA_THRESHOLD = ARENA_RANKS.at(-1).threshold;

export const ARENA_AP_REWARDS = Object.freeze({
  kill: 1,
  criticalKill: 2,
  assist: 0.5,
  roundWin: 2.5,
  matchWin: 10,
  streak5: 2,
  streak10: 5,
  sweep: 10,
  mvp: 5,
  comeback: 8,
  teamWipe: 2.5,
  suddenDeathClutch: 2,
  negativeKd: -10,
  matchLoss: -8
});

const roundHalf = (value) => Math.round((Number(value) || 0) * 2) / 2;
const safeNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
};
const safeInt = (value, fallback = 0) => Math.floor(safeNumber(value, fallback));

function memoryStorage() {
  const map = new Map();
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); }
  };
}

function resolveStorage(storage) {
  if (storage) return storage;
  try { if (globalThis.localStorage) return globalThis.localStorage; } catch {}
  return memoryStorage();
}

export function arenaSeasonId(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function arenaSeasonLabel(dateOrId = new Date()) {
  const date = dateOrId instanceof Date
    ? dateOrId
    : new Date(Number(String(dateOrId).slice(0, 4)), Math.max(0, Number(String(dateOrId).slice(5, 7)) - 1), 1);
  return new Intl.DateTimeFormat('en-US', { month:'short', year:'numeric' }).format(date).toUpperCase();
}

export function arenaNextReset(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date);
  return new Date(value.getFullYear(), value.getMonth() + 1, 1, 0, 0, 0, 0);
}

export function arenaRankForPoints(points) {
  const ap = Math.max(0, safeNumber(points));
  let result = ARENA_RANKS[0];
  for (const rank of ARENA_RANKS) {
    if (ap < rank.threshold) break;
    result = rank;
  }
  return result;
}

export function arenaNextRankForPoints(points) {
  const rank = arenaRankForPoints(points);
  const index = ARENA_RANKS.findIndex((entry) => entry.id === rank.id);
  return ARENA_RANKS[index + 1] || null;
}

export function arenaRankIndex(rankOrId) {
  const id = typeof rankOrId === 'string' ? rankOrId : rankOrId?.id;
  return Math.max(0, ARENA_RANKS.findIndex((entry) => entry.id === id));
}

function freshCurrent(seasonId) {
  return {
    seasonId,
    ap: 0,
    peakAp: 0,
    peakRankId: ARENA_RANKS[0].id,
    matches: 0,
    wins: 0,
    losses: 0,
    forfeits: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
    roundWins: 0,
    roundLosses: 0,
    criticalKills: 0,
    mvps: 0,
    fiveZeroWins: 0,
    comebackWins: 0,
    teamWipes: 0,
    suddenDeathClutches: 0,
    bestStreak: 0,
    playSeconds: 0,
    recent: [],
    processedMatchIds: []
  };
}

function normalizeCurrent(source, seasonId) {
  const base = freshCurrent(seasonId);
  const value = source && typeof source === 'object' ? source : {};
  const result = { ...base, seasonId: String(value.seasonId || seasonId) };
  for (const key of ['ap','peakAp','matches','wins','losses','forfeits','kills','deaths','assists','roundWins','roundLosses','criticalKills','mvps','fiveZeroWins','comebackWins','teamWipes','suddenDeathClutches','bestStreak','playSeconds']) {
    result[key] = safeNumber(value[key]);
  }
  result.ap = roundHalf(result.ap);
  result.peakAp = Math.max(result.ap, roundHalf(result.peakAp));
  result.peakRankId = ARENA_RANKS.some((rank) => rank.id === value.peakRankId) ? value.peakRankId : arenaRankForPoints(result.peakAp).id;
  result.recent = Array.isArray(value.recent) ? value.recent.slice(0, 16) : [];
  result.processedMatchIds = Array.isArray(value.processedMatchIds) ? value.processedMatchIds.map(String).slice(0, 120) : [];
  return result;
}

function normalizeActive(source) {
  if (!source || typeof source !== 'object' || !source.id) return null;
  return {
    id: String(source.id),
    seasonId: String(source.seasonId || ''),
    startedAt: safeNumber(source.startedAt, Date.now()),
    team: source.team === 'red' ? 'red' : 'blue',
    kills: safeInt(source.kills),
    deaths: safeInt(source.deaths),
    assists: safeInt(source.assists),
    roundWins: safeInt(source.roundWins),
    roundLosses: safeInt(source.roundLosses),
    criticalKills: safeInt(source.criticalKills),
    teamWipes: safeInt(source.teamWipes),
    suddenDeathClutches: safeInt(source.suddenDeathClutches),
    bestStreak: safeInt(source.bestStreak),
    playSeconds: safeNumber(source.playSeconds)
  };
}

function freshProfile(seasonId) {
  return { schema:1, current:freshCurrent(seasonId), history:[], activeMatch:null };
}

function normalizeProfile(source, seasonId) {
  const value = source && typeof source === 'object' ? source : {};
  return {
    schema: 1,
    current: normalizeCurrent(value.current, seasonId),
    history: Array.isArray(value.history) ? value.history.slice(0, 24) : [],
    activeMatch: normalizeActive(value.activeMatch)
  };
}

function rankProgress(ap) {
  const rank = arenaRankForPoints(ap);
  const next = arenaNextRankForPoints(ap);
  if (!next) return 1;
  const span = Math.max(1, next.threshold - rank.threshold);
  return Math.max(0, Math.min(1, (ap - rank.threshold) / span));
}

export function calculateArenaMatch(input = {}) {
  const kills = safeInt(input.kills);
  const deaths = safeInt(input.deaths);
  const assists = safeInt(input.assists);
  const criticalKills = Math.min(kills, safeInt(input.criticalKills));
  const roundWins = safeInt(input.roundWins);
  const roundLosses = safeInt(input.roundLosses);
  const teamWipes = safeInt(input.teamWipes);
  const suddenDeathClutches = safeInt(input.suddenDeathClutches);
  const bestStreak = safeInt(input.bestStreak);
  const won = Boolean(input.won) && !input.forfeit;
  const fiveZero = won && roundWins === 5 && roundLosses === 0;
  const negativeKd = kills < deaths;

  const breakdown = {
    kills: roundHalf((kills - criticalKills) * ARENA_AP_REWARDS.kill + criticalKills * ARENA_AP_REWARDS.criticalKill),
    assists: roundHalf(assists * ARENA_AP_REWARDS.assist),
    roundWins: roundHalf(roundWins * ARENA_AP_REWARDS.roundWin),
    victory: won ? ARENA_AP_REWARDS.matchWin : 0,
    streak5: bestStreak >= 5 ? ARENA_AP_REWARDS.streak5 : 0,
    streak10: bestStreak >= 10 ? ARENA_AP_REWARDS.streak10 : 0,
    sweep: fiveZero ? ARENA_AP_REWARDS.sweep : 0,
    mvp: input.mvp ? ARENA_AP_REWARDS.mvp : 0,
    comeback: won && input.comeback ? ARENA_AP_REWARDS.comeback : 0,
    teamWipes: roundHalf(teamWipes * ARENA_AP_REWARDS.teamWipe),
    suddenDeathClutches: roundHalf(suddenDeathClutches * ARENA_AP_REWARDS.suddenDeathClutch),
    negativeKd: negativeKd ? ARENA_AP_REWARDS.negativeKd : 0,
    loss: won ? 0 : ARENA_AP_REWARDS.matchLoss
  };
  const rawDelta = roundHalf(Object.values(breakdown).reduce((sum, value) => sum + value, 0));
  return {
    counts: { kills, deaths, assists, criticalKills, roundWins, roundLosses, teamWipes, suddenDeathClutches, bestStreak },
    flags: { won, forfeit:Boolean(input.forfeit), negativeKd, fiveZero, mvp:Boolean(input.mvp), comeback:Boolean(input.comeback) },
    breakdown,
    rawDelta
  };
}

function archiveCurrent(current, endedAt) {
  const rank = arenaRankForPoints(current.ap);
  const peakRank = arenaRankForPoints(current.peakAp);
  return {
    ...current,
    finalRankId: rank.id,
    finalRankTitle: rank.title,
    peakRankId: peakRank.id,
    peakRankTitle: peakRank.title,
    endedAt
  };
}

export class ArenaStore {
  constructor({ storage = null, now = () => new Date() } = {}) {
    this.storage = resolveStorage(storage);
    this.now = typeof now === 'function' ? now : () => new Date();
    this.recoveredForfeit = null;
    this.profile = this.read();
    if (this.profile.activeMatch) this.recoveredForfeit = this.recoverAbandonedMatch();
    this.ensureCurrentSeason();
  }

  read() {
    const seasonId = arenaSeasonId(this.now());
    try {
      const raw = this.storage.getItem(ARENA_STORAGE_KEY);
      return raw ? normalizeProfile(JSON.parse(raw), seasonId) : freshProfile(seasonId);
    } catch {
      return freshProfile(seasonId);
    }
  }

  save() {
    try { this.storage.setItem(ARENA_STORAGE_KEY, JSON.stringify(this.profile)); } catch {}
  }

  ensureCurrentSeason(date = this.now()) {
    const seasonId = arenaSeasonId(date);
    if (this.profile.current.seasonId === seasonId) return false;
    const current = this.profile.current;
    if (current.matches > 0 || current.ap > 0 || current.kills > 0) {
      this.profile.history.unshift(archiveCurrent(current, new Date(date).getTime()));
      this.profile.history = this.profile.history.slice(0, 24);
    }
    this.profile.current = freshCurrent(seasonId);
    this.profile.activeMatch = null;
    this.save();
    return true;
  }

  snapshot() {
    this.ensureCurrentSeason();
    const current = this.profile.current;
    const rank = arenaRankForPoints(current.ap);
    const nextRank = arenaNextRankForPoints(current.ap);
    const kd = current.deaths > 0 ? current.kills / current.deaths : current.kills;
    const winRate = current.matches > 0 ? current.wins / current.matches : 0;
    return {
      ...current,
      rank,
      nextRank,
      rankProgress: rankProgress(current.ap),
      kd,
      winRate,
      resetAt: arenaNextReset(this.now()).getTime(),
      seasonLabel: arenaSeasonLabel(current.seasonId),
      history: this.profile.history.map((entry) => ({ ...entry })),
      activeMatch: this.profile.activeMatch ? { ...this.profile.activeMatch } : null
    };
  }

  beginMatch({ id, team = 'blue', startedAt = Date.now() } = {}) {
    this.ensureCurrentSeason();
    if (!id) throw new Error('Arena match requires a unique match id.');
    if (this.profile.activeMatch) this.recoverAbandonedMatch();
    this.profile.activeMatch = {
      id: String(id),
      seasonId: this.profile.current.seasonId,
      startedAt: safeNumber(startedAt, Date.now()),
      team: team === 'red' ? 'red' : 'blue',
      kills:0, deaths:0, assists:0, roundWins:0, roundLosses:0,
      criticalKills:0, teamWipes:0, suddenDeathClutches:0, bestStreak:0, playSeconds:0
    };
    this.save();
    return { ...this.profile.activeMatch };
  }

  updateActiveMatch(patch = {}) {
    const active = this.profile.activeMatch;
    if (!active) return null;
    for (const key of ['kills','deaths','assists','roundWins','roundLosses','criticalKills','teamWipes','suddenDeathClutches','bestStreak','playSeconds']) {
      if (patch[key] != null) active[key] = safeNumber(patch[key]);
    }
    this.save();
    return { ...active };
  }

  _applyMatch(input = {}, { skipSeasonCheck = false } = {}) {
    if (!skipSeasonCheck) this.ensureCurrentSeason();
    const current = this.profile.current;
    const matchId = String(input.matchId || this.profile.activeMatch?.id || `arena-${Date.now()}`);
    if (current.processedMatchIds.includes(matchId)) {
      this.profile.activeMatch = null;
      this.save();
      return { duplicate:true, matchId, after:this.snapshot() };
    }

    const beforeAp = current.ap;
    const beforeRank = arenaRankForPoints(beforeAp);
    const scored = calculateArenaMatch(input);
    const afterAp = roundHalf(Math.max(0, beforeAp + scored.rawDelta));
    const appliedDelta = roundHalf(afterAp - beforeAp);
    const afterRank = arenaRankForPoints(afterAp);
    const won = scored.flags.won;

    current.ap = afterAp;
    current.peakAp = Math.max(current.peakAp, afterAp);
    const peakRank = arenaRankForPoints(current.peakAp);
    if (arenaRankIndex(peakRank) >= arenaRankIndex(current.peakRankId)) current.peakRankId = peakRank.id;
    current.matches += 1;
    current.wins += won ? 1 : 0;
    current.losses += won ? 0 : 1;
    current.forfeits += scored.flags.forfeit ? 1 : 0;
    current.kills += scored.counts.kills;
    current.deaths += scored.counts.deaths;
    current.assists += scored.counts.assists;
    current.roundWins += scored.counts.roundWins;
    current.roundLosses += scored.counts.roundLosses;
    current.criticalKills += scored.counts.criticalKills;
    current.mvps += scored.flags.mvp ? 1 : 0;
    current.fiveZeroWins += scored.flags.fiveZero ? 1 : 0;
    current.comebackWins += scored.flags.comeback && won ? 1 : 0;
    current.teamWipes += scored.counts.teamWipes;
    current.suddenDeathClutches += scored.counts.suddenDeathClutches;
    current.bestStreak = Math.max(current.bestStreak, scored.counts.bestStreak);
    current.playSeconds += safeNumber(input.playSeconds);
    current.processedMatchIds.unshift(matchId);
    current.processedMatchIds = current.processedMatchIds.slice(0, 120);

    const recent = {
      id:matchId,
      won,
      forfeit:scored.flags.forfeit,
      kills:scored.counts.kills,
      deaths:scored.counts.deaths,
      assists:scored.counts.assists,
      apDelta:appliedDelta,
      rawDelta:scored.rawDelta,
      afterAp,
      rankId:afterRank.id,
      completedAt:Date.now()
    };
    current.recent.unshift(recent);
    current.recent = current.recent.slice(0, 16);
    this.profile.activeMatch = null;
    this.save();

    const beforeIndex = arenaRankIndex(beforeRank);
    const afterIndex = arenaRankIndex(afterRank);
    return {
      duplicate:false,
      matchId,
      ...scored,
      apBefore:beforeAp,
      apAfter:afterAp,
      apDelta:appliedDelta,
      rankBefore:beforeRank,
      rankAfter:afterRank,
      promoted:afterIndex > beforeIndex,
      demoted:afterIndex < beforeIndex,
      after:this.snapshot()
    };
  }

  recordMatch(input = {}) {
    return this._applyMatch(input);
  }

  forfeitActive(extra = {}) {
    const active = this.profile.activeMatch;
    if (!active) return null;
    const input = {
      matchId:active.id,
      kills:extra.kills ?? active.kills,
      deaths:extra.deaths ?? active.deaths,
      assists:extra.assists ?? active.assists,
      roundWins:extra.roundWins ?? active.roundWins,
      roundLosses:extra.roundLosses ?? active.roundLosses,
      criticalKills:extra.criticalKills ?? active.criticalKills,
      teamWipes:extra.teamWipes ?? active.teamWipes,
      suddenDeathClutches:extra.suddenDeathClutches ?? active.suddenDeathClutches,
      bestStreak:extra.bestStreak ?? active.bestStreak,
      playSeconds:extra.playSeconds ?? active.playSeconds,
      won:false,
      mvp:false,
      comeback:false,
      forfeit:true
    };
    return this._applyMatch(input, { skipSeasonCheck:true });
  }

  recoverAbandonedMatch() {
    return this.forfeitActive();
  }
}
