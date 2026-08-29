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
].map((rank) => Object.freeze(rank)));

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

// These are hard match-rule ceilings, not balance changes. Clamping at this
// boundary prevents corrupt telemetry from manufacturing unbounded AP.
export const ARENA_MATCH_LIMITS = Object.freeze({
  roundWinsToMatch: 5,
  maxRounds: 9,
  killsPerRound: 12,
  maxKills: 108,
  maxDeaths: 108,
  maxAssists: 108,
  maxTeamWipes: 36,
  maxSuddenDeathClutches: 9
});

const roundHalf = (value) => Math.round((Number(value) || 0) * 2) / 2;
const safeNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
};
const safeInt = (value, fallback = 0) => Math.floor(safeNumber(value, fallback));
const cloneRank = (rank) => rank ? { ...rank } : null;

function memoryStorage() {
  const map = new Map();
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); }
  };
}

function resolveStorage(storage) {
  if (storage) return { storage, backend:'provided', durable:true, error:null };
  try {
    if (globalThis.localStorage) return { storage:globalThis.localStorage, backend:'localStorage', durable:true, error:null };
  } catch (error) {
    return { storage:memoryStorage(), backend:'memory', durable:false, error };
  }
  return { storage:memoryStorage(), backend:'memory', durable:false, error:null };
}

function errorMessage(error) {
  if (error instanceof Error && error.message) return error.message;
  return String(error || 'Unknown persistence error');
}

function validDate(value) {
  return value instanceof Date && Number.isFinite(value.getTime());
}

function seasonParts(seasonId) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(String(seasonId || ''));
  if (!match) return null;
  return { year:Number(match[1]), month:Number(match[2]) };
}

function seasonOrdinal(seasonId) {
  const parts = seasonParts(seasonId);
  return parts ? parts.year * 12 + parts.month - 1 : null;
}

function seasonResetTimestamp(seasonId, fallbackDate = new Date()) {
  const parts = seasonParts(seasonId);
  if (!parts) return arenaNextReset(fallbackDate).getTime();
  return new Date(parts.year, parts.month, 1, 0, 0, 0, 0).getTime();
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

function normalizeRecent(source) {
  const value = source && typeof source === 'object' ? source : {};
  return {
    id:String(value.id || ''),
    won:Boolean(value.won),
    forfeit:Boolean(value.forfeit),
    kills:safeInt(value.kills),
    deaths:safeInt(value.deaths),
    assists:safeInt(value.assists),
    apDelta:roundHalf(Number(value.apDelta) || 0),
    rawDelta:roundHalf(Number(value.rawDelta) || 0),
    afterAp:roundHalf(safeNumber(value.afterAp)),
    rankId:ARENA_RANKS.some((rank) => rank.id === value.rankId) ? value.rankId : arenaRankForPoints(value.afterAp).id,
    completedAt:safeNumber(value.completedAt)
  };
}

function uniqueMatchIds(source) {
  if (!Array.isArray(source)) return [];
  return [...new Set(source.map(String).filter(Boolean))];
}

function normalizeCurrent(source, seasonId) {
  const base = freshCurrent(seasonId);
  const value = source && typeof source === 'object' ? source : {};
  const normalizedSeasonId = seasonParts(value.seasonId) ? String(value.seasonId) : seasonId;
  const result = { ...base, seasonId:normalizedSeasonId };
  for (const key of ['matches','wins','losses','forfeits','kills','deaths','assists','roundWins','roundLosses','criticalKills','mvps','fiveZeroWins','comebackWins','teamWipes','suddenDeathClutches','bestStreak']) {
    result[key] = safeInt(value[key]);
  }
  result.ap = roundHalf(safeNumber(value.ap));
  result.peakAp = Math.max(result.ap, roundHalf(safeNumber(value.peakAp)));
  result.playSeconds = safeNumber(value.playSeconds);
  result.peakRankId = ARENA_RANKS.some((rank) => rank.id === value.peakRankId) ? value.peakRankId : arenaRankForPoints(result.peakAp).id;
  result.recent = Array.isArray(value.recent) ? value.recent.slice(0, 16).map(normalizeRecent) : [];
  // The duplicate ledger intentionally lasts for the full current season. A
  // fixed-size tail allowed an older match to be replayed for AP.
  result.processedMatchIds = uniqueMatchIds(value.processedMatchIds);
  return result;
}

function normalizeActive(source, fallbackSeasonId) {
  if (!source || typeof source !== 'object' || !source.id) return null;
  const seasonId = seasonParts(source.seasonId) ? String(source.seasonId) : fallbackSeasonId;
  return {
    id: String(source.id),
    seasonId,
    startedAt: safeNumber(source.startedAt, Date.now()),
    team: source.team === 'red' ? 'red' : 'blue',
    kills: Math.min(ARENA_MATCH_LIMITS.maxKills, safeInt(source.kills)),
    deaths: Math.min(ARENA_MATCH_LIMITS.maxDeaths, safeInt(source.deaths)),
    assists: Math.min(ARENA_MATCH_LIMITS.maxAssists, safeInt(source.assists)),
    roundWins: Math.min(ARENA_MATCH_LIMITS.roundWinsToMatch, safeInt(source.roundWins)),
    roundLosses: Math.min(ARENA_MATCH_LIMITS.roundWinsToMatch, safeInt(source.roundLosses)),
    criticalKills: Math.min(ARENA_MATCH_LIMITS.maxKills, safeInt(source.criticalKills)),
    teamWipes: Math.min(ARENA_MATCH_LIMITS.maxTeamWipes, safeInt(source.teamWipes)),
    suddenDeathClutches: Math.min(ARENA_MATCH_LIMITS.maxSuddenDeathClutches, safeInt(source.suddenDeathClutches)),
    bestStreak: Math.min(ARENA_MATCH_LIMITS.maxKills, safeInt(source.bestStreak)),
    playSeconds: safeNumber(source.playSeconds)
  };
}

function cloneCurrent(current) {
  return {
    ...current,
    recent:(current.recent || []).map((entry) => ({ ...entry })),
    processedMatchIds:[...(current.processedMatchIds || [])]
  };
}

function normalizeHistoryEntry(source, fallbackSeasonId) {
  const value = source && typeof source === 'object' ? source : {};
  const seasonId = seasonParts(value.seasonId) ? String(value.seasonId) : fallbackSeasonId;
  const current = normalizeCurrent(value, seasonId);
  const finalRank = ARENA_RANKS.some((rank) => rank.id === value.finalRankId)
    ? ARENA_RANKS.find((rank) => rank.id === value.finalRankId)
    : arenaRankForPoints(current.ap);
  const peakRank = arenaRankForPoints(current.peakAp);
  return {
    ...current,
    finalRankId:finalRank.id,
    finalRankTitle:String(value.finalRankTitle || finalRank.title),
    peakRankId:peakRank.id,
    peakRankTitle:String(value.peakRankTitle || peakRank.title),
    endedAt:safeNumber(value.endedAt, seasonResetTimestamp(seasonId))
  };
}

function freshProfile(seasonId) {
  return { schema:1, current:freshCurrent(seasonId), history:[], activeMatch:null };
}

function normalizeProfile(source, seasonId) {
  const value = source && typeof source === 'object' ? source : {};
  const current = normalizeCurrent(value.current, seasonId);
  return {
    schema: 1,
    current,
    history: Array.isArray(value.history)
      ? value.history.slice(0, 24).map((entry) => normalizeHistoryEntry(entry, current.seasonId))
      : [],
    activeMatch: normalizeActive(value.activeMatch, current.seasonId)
  };
}

function rankProgress(ap) {
  const rank = arenaRankForPoints(ap);
  const next = arenaNextRankForPoints(ap);
  if (!next) return 1;
  const span = Math.max(1, next.threshold - rank.threshold);
  return Math.max(0, Math.min(1, (ap - rank.threshold) / span));
}

function adjustmentValue(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;
  return String(value);
}

function boundedInt(input, field, maximum, adjustments) {
  const supplied = input[field];
  if (supplied == null) return 0;
  const numeric = Number(supplied);
  const normalized = Number.isFinite(numeric) && numeric >= 0 ? Math.min(maximum, Math.floor(numeric)) : 0;
  if (!Number.isFinite(numeric) || numeric !== normalized) {
    adjustments.push({ field, from:adjustmentValue(supplied), to:normalized, reason:`Expected an integer from 0 to ${maximum}.` });
  }
  return normalized;
}

function clampRelated(field, value, maximum, adjustments, reason) {
  if (value <= maximum) return value;
  adjustments.push({ field, from:value, to:maximum, reason });
  return maximum;
}

function booleanFlag(input, field, adjustments) {
  const supplied = input[field];
  if (supplied == null) return false;
  if (typeof supplied === 'boolean') return supplied;
  adjustments.push({ field, from:String(supplied), to:false, reason:'Expected a boolean telemetry flag.' });
  return false;
}

export function calculateArenaMatch(input = {}) {
  const value = input && typeof input === 'object' ? input : {};
  const adjustments = [];
  const forfeit = booleanFlag(value, 'forfeit', adjustments);
  const requestedWin = booleanFlag(value, 'won', adjustments);
  const requestedMvp = booleanFlag(value, 'mvp', adjustments);
  const requestedComeback = booleanFlag(value, 'comeback', adjustments);
  const won = requestedWin && !forfeit;
  const kills = boundedInt(value, 'kills', ARENA_MATCH_LIMITS.maxKills, adjustments);
  const deaths = boundedInt(value, 'deaths', ARENA_MATCH_LIMITS.maxDeaths, adjustments);
  const assists = boundedInt(value, 'assists', ARENA_MATCH_LIMITS.maxAssists, adjustments);
  const criticalKills = clampRelated(
    'criticalKills',
    boundedInt(value, 'criticalKills', ARENA_MATCH_LIMITS.maxKills, adjustments),
    kills,
    adjustments,
    'Critical kills cannot exceed total kills.'
  );
  const roundWins = boundedInt(
    value,
    'roundWins',
    won ? ARENA_MATCH_LIMITS.roundWinsToMatch : ARENA_MATCH_LIMITS.roundWinsToMatch - 1,
    adjustments
  );
  const roundLosses = boundedInt(
    value,
    'roundLosses',
    won ? ARENA_MATCH_LIMITS.roundWinsToMatch - 1 : ARENA_MATCH_LIMITS.roundWinsToMatch,
    adjustments
  );
  const teamWipes = boundedInt(value, 'teamWipes', ARENA_MATCH_LIMITS.maxTeamWipes, adjustments);
  const suddenDeathClutches = boundedInt(value, 'suddenDeathClutches', ARENA_MATCH_LIMITS.maxSuddenDeathClutches, adjustments);
  const bestStreak = clampRelated(
    'bestStreak',
    boundedInt(value, 'bestStreak', ARENA_MATCH_LIMITS.maxKills, adjustments),
    kills,
    adjustments,
    'Best streak cannot exceed total kills.'
  );
  const mvp = requestedMvp && !forfeit;
  const comeback = requestedComeback && won;
  if (requestedMvp && !mvp) adjustments.push({ field:'mvp', from:true, to:false, reason:'A forfeited match cannot award MVP.' });
  if (requestedComeback && !comeback) adjustments.push({ field:'comeback', from:true, to:false, reason:'Comeback AP requires a match win.' });
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
    mvp: mvp ? ARENA_AP_REWARDS.mvp : 0,
    comeback: comeback ? ARENA_AP_REWARDS.comeback : 0,
    teamWipes: roundHalf(teamWipes * ARENA_AP_REWARDS.teamWipe),
    suddenDeathClutches: roundHalf(suddenDeathClutches * ARENA_AP_REWARDS.suddenDeathClutch),
    negativeKd: negativeKd ? ARENA_AP_REWARDS.negativeKd : 0,
    loss: won ? 0 : ARENA_AP_REWARDS.matchLoss
  };
  const rawDelta = roundHalf(Object.values(breakdown).reduce((sum, amount) => sum + amount, 0));
  return {
    counts: { kills, deaths, assists, criticalKills, roundWins, roundLosses, teamWipes, suddenDeathClutches, bestStreak },
    flags: { won, forfeit, negativeKd, fiveZero, mvp, comeback },
    breakdown,
    rawDelta,
    validation:{ clamped:adjustments.length > 0, adjustments }
  };
}

function archiveCurrent(current, endedAt) {
  const rank = arenaRankForPoints(current.ap);
  const peakRank = arenaRankForPoints(current.peakAp);
  return {
    ...cloneCurrent(current),
    finalRankId: rank.id,
    finalRankTitle: rank.title,
    peakRankId: peakRank.id,
    peakRankTitle: peakRank.title,
    endedAt
  };
}

export class ArenaStore {
  constructor({ storage = null, now = () => new Date() } = {}) {
    const resolved = resolveStorage(storage);
    this.storage = resolved.storage;
    this.now = typeof now === 'function' ? now : () => new Date();
    this.generatedMatchSequence = 0;
    this.recoveredForfeit = null;
    this.persistenceDiagnostics = {
      backend:resolved.backend,
      durable:resolved.durable,
      readOk:!resolved.error,
      writeOk:true,
      readFailures:resolved.error ? 1 : 0,
      writeFailures:0,
      lastReadError:resolved.error ? errorMessage(resolved.error) : null,
      lastWriteError:null,
      lastReadAt:null,
      lastWriteAt:null
    };
    this.seasonDiagnostics = {
      policy:'forward-only; active matches belong to their start season',
      observedSeasonId:null,
      pendingSeasonId:null,
      clockRollbackDetected:false,
      rollbackCount:0,
      lastRollbackAt:null
    };
    this.profile = this.read();
    if (this.profile.activeMatch) this.recoveredForfeit = this.recoverAbandonedMatch();
    this.ensureCurrentSeason();
  }

  _date(value = this.now()) {
    const date = value instanceof Date ? value : new Date(value);
    return validDate(date) ? date : new Date();
  }

  _timestamp(value = this.now()) {
    return this._date(value).getTime();
  }

  _persistenceSnapshot() {
    return {
      ...this.persistenceDiagnostics,
      healthy:this.persistenceDiagnostics.durable && this.persistenceDiagnostics.readOk && this.persistenceDiagnostics.writeOk
    };
  }

  read() {
    const seasonId = arenaSeasonId(this._date());
    this.persistenceDiagnostics.lastReadAt = Date.now();
    try {
      const raw = this.storage.getItem(ARENA_STORAGE_KEY);
      const profile = raw ? normalizeProfile(JSON.parse(raw), seasonId) : freshProfile(seasonId);
      this.persistenceDiagnostics.readOk = true;
      this.persistenceDiagnostics.lastReadError = null;
      return profile;
    } catch (error) {
      this.persistenceDiagnostics.readOk = false;
      this.persistenceDiagnostics.readFailures += 1;
      this.persistenceDiagnostics.lastReadError = errorMessage(error);
      return freshProfile(seasonId);
    }
  }

  save() {
    this.persistenceDiagnostics.lastWriteAt = Date.now();
    try {
      this.storage.setItem(ARENA_STORAGE_KEY, JSON.stringify(this.profile));
      this.persistenceDiagnostics.writeOk = true;
      this.persistenceDiagnostics.lastWriteError = null;
      return true;
    } catch (error) {
      this.persistenceDiagnostics.writeOk = false;
      this.persistenceDiagnostics.writeFailures += 1;
      this.persistenceDiagnostics.lastWriteError = errorMessage(error);
      return false;
    }
  }

  ensureCurrentSeason(date = this.now()) {
    const observedDate = this._date(date);
    const observedSeasonId = arenaSeasonId(observedDate);
    const currentSeasonId = this.profile.current.seasonId;
    const observedOrdinal = seasonOrdinal(observedSeasonId);
    const currentOrdinal = seasonOrdinal(currentSeasonId);
    const priorObservedSeasonId = this.seasonDiagnostics.observedSeasonId;
    this.seasonDiagnostics.observedSeasonId = observedSeasonId;

    if (observedOrdinal == null || currentOrdinal == null || observedOrdinal === currentOrdinal) {
      this.seasonDiagnostics.pendingSeasonId = null;
      this.seasonDiagnostics.clockRollbackDetected = false;
      return false;
    }

    // A device-clock or timezone rollback must never archive a future season
    // and recreate an older one. The profile advances only when time catches up.
    if (observedOrdinal < currentOrdinal) {
      const isNewRollback = !this.seasonDiagnostics.clockRollbackDetected || priorObservedSeasonId !== observedSeasonId;
      this.seasonDiagnostics.clockRollbackDetected = true;
      this.seasonDiagnostics.pendingSeasonId = null;
      if (isNewRollback) {
        this.seasonDiagnostics.rollbackCount += 1;
        this.seasonDiagnostics.lastRollbackAt = observedDate.getTime();
      }
      return false;
    }

    this.seasonDiagnostics.clockRollbackDetected = false;
    // Keep the old season mutable until its live match settles. This makes an
    // online boundary and an offline crash recovery follow the same ownership
    // rule and, critically, never drops the persisted active match.
    if (this.profile.activeMatch) {
      this.seasonDiagnostics.pendingSeasonId = observedSeasonId;
      return false;
    }

    const current = this.profile.current;
    if (current.matches > 0 || current.ap > 0 || current.kills > 0) {
      this.profile.history.unshift(archiveCurrent(current, seasonResetTimestamp(currentSeasonId, observedDate)));
      this.profile.history = this.profile.history.slice(0, 24);
    }
    this.profile.current = freshCurrent(observedSeasonId);
    this.seasonDiagnostics.pendingSeasonId = null;
    this.save();
    return true;
  }

  _createSnapshot(observedDate = this._date()) {
    const current = this.profile.current;
    const rank = arenaRankForPoints(current.ap);
    const nextRank = arenaNextRankForPoints(current.ap);
    const kd = current.deaths > 0 ? current.kills / current.deaths : current.kills;
    const winRate = current.matches > 0 ? current.wins / current.matches : 0;
    const isolatedCurrent = cloneCurrent(current);
    return {
      ...isolatedCurrent,
      rank:cloneRank(rank),
      nextRank:cloneRank(nextRank),
      rankProgress: rankProgress(current.ap),
      kd,
      winRate,
      resetAt: seasonResetTimestamp(current.seasonId, observedDate),
      seasonLabel: arenaSeasonLabel(current.seasonId),
      history: this.profile.history.map((entry) => cloneCurrent(entry)),
      activeMatch: this.profile.activeMatch ? { ...this.profile.activeMatch } : null,
      persistence:this._persistenceSnapshot(),
      seasonState:{ ...this.seasonDiagnostics }
    };
  }

  snapshot() {
    const observedDate = this._date();
    this.ensureCurrentSeason(observedDate);
    return this._createSnapshot(observedDate);
  }

  _processedSeasonForId(matchId) {
    if (this.profile.current.processedMatchIds.includes(matchId)) return this.profile.current.seasonId;
    const archived = this.profile.history.find((season) => season.processedMatchIds?.includes(matchId));
    return archived?.seasonId || null;
  }

  beginMatch({ id, team = 'blue', startedAt = null } = {}) {
    this.ensureCurrentSeason();
    if (!id) throw new Error('Arena match requires a unique match id.');
    const matchId = String(id);
    if (this.profile.activeMatch) {
      this.recoverAbandonedMatch();
      this.ensureCurrentSeason();
    }
    if (this._processedSeasonForId(matchId)) throw new Error(`Arena match id "${matchId}" was already processed.`);
    this.profile.activeMatch = {
      id:matchId,
      seasonId: this.profile.current.seasonId,
      startedAt: startedAt == null ? this._timestamp() : safeNumber(startedAt, this._timestamp()),
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
    const limits = {
      kills:ARENA_MATCH_LIMITS.maxKills,
      deaths:ARENA_MATCH_LIMITS.maxDeaths,
      assists:ARENA_MATCH_LIMITS.maxAssists,
      roundWins:ARENA_MATCH_LIMITS.roundWinsToMatch,
      roundLosses:ARENA_MATCH_LIMITS.roundWinsToMatch,
      criticalKills:ARENA_MATCH_LIMITS.maxKills,
      teamWipes:ARENA_MATCH_LIMITS.maxTeamWipes,
      suddenDeathClutches:ARENA_MATCH_LIMITS.maxSuddenDeathClutches,
      bestStreak:ARENA_MATCH_LIMITS.maxKills
    };
    for (const [key, maximum] of Object.entries(limits)) {
      if (patch[key] != null) active[key] = Math.min(maximum, safeInt(patch[key]));
    }
    if (patch.playSeconds != null) active.playSeconds = safeNumber(patch.playSeconds);
    this.save();
    return { ...active };
  }

  _applyMatch(input = {}, { skipSeasonCheck = false } = {}) {
    const value = input && typeof input === 'object' ? input : {};
    if (!skipSeasonCheck) this.ensureCurrentSeason();
    const active = this.profile.activeMatch;
    const generatedId = `arena-${this._timestamp()}-${++this.generatedMatchSequence}`;
    const matchId = String(value.matchId || active?.id || generatedId);
    const processedSeasonId = this._processedSeasonForId(matchId);
    if (processedSeasonId) {
      const clearsActiveMatch = this.profile.activeMatch?.id === matchId;
      if (clearsActiveMatch) {
        this.profile.activeMatch = null;
        this.save();
        this.ensureCurrentSeason();
      }
      return {
        duplicate:true,
        matchId,
        processedSeasonId,
        clearedActiveMatch:clearsActiveMatch,
        after:this.snapshot()
      };
    }

    const current = this.profile.current;
    const beforeAp = current.ap;
    const beforeRank = arenaRankForPoints(beforeAp);
    const scored = calculateArenaMatch(value);
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
    current.comebackWins += scored.flags.comeback ? 1 : 0;
    current.teamWipes += scored.counts.teamWipes;
    current.suddenDeathClutches += scored.counts.suddenDeathClutches;
    current.bestStreak = Math.max(current.bestStreak, scored.counts.bestStreak);
    current.playSeconds += safeNumber(value.playSeconds);
    current.processedMatchIds.unshift(matchId);

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
      completedAt:this._timestamp()
    };
    current.recent.unshift(recent);
    current.recent = current.recent.slice(0, 16);
    if (this.profile.activeMatch?.id === matchId) this.profile.activeMatch = null;
    this.save();

    // Capture the completed-match view before a deferred boundary archives it;
    // the postgame panel must show the AP/rank earned in the start season.
    const completedSeasonSnapshot = this._createSnapshot();
    const rolloverApplied = this.ensureCurrentSeason();
    completedSeasonSnapshot.persistence = this._persistenceSnapshot();
    const beforeIndex = arenaRankIndex(beforeRank);
    const afterIndex = arenaRankIndex(afterRank);
    return {
      duplicate:false,
      matchId,
      seasonId:current.seasonId,
      ...scored,
      apBefore:beforeAp,
      apAfter:afterAp,
      apDelta:appliedDelta,
      rankBefore:cloneRank(beforeRank),
      rankAfter:cloneRank(afterRank),
      promoted:afterIndex > beforeIndex,
      demoted:afterIndex < beforeIndex,
      rolloverApplied,
      currentSeasonId:this.profile.current.seasonId,
      after:completedSeasonSnapshot
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
