const STORAGE_KEY = 'unblockedtdm.progression.v1';
export const MAX_CAREER_LEVEL = 100;

export const CAREER_TITLES = Object.freeze([
  { level: 1, title: 'RECRUIT' },
  { level: 5, title: 'SKIRMISHER' },
  { level: 10, title: 'OPERATOR' },
  { level: 20, title: 'VANGUARD' },
  { level: 35, title: 'ELITE' },
  { level: 50, title: 'VETERAN' },
  { level: 75, title: 'ACE' },
  { level: 100, title: 'ARENA LEGEND' }
]);

const freshProfile = () => ({
  schema: 1,
  totalXp: 0,
  matches: 0,
  wins: 0,
  losses: 0,
  kills: 0,
  deaths: 0,
  assists: 0,
  damage: 0,
  criticals: 0,
  bestStreak: 0,
  recent: []
});

function safeNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
}

function normalizeProfile(value) {
  const base = freshProfile();
  const source = value && typeof value === 'object' ? value : {};
  return {
    ...base,
    schema: 1,
    totalXp: Math.floor(safeNumber(source.totalXp)),
    matches: Math.floor(safeNumber(source.matches)),
    wins: Math.floor(safeNumber(source.wins)),
    losses: Math.floor(safeNumber(source.losses)),
    kills: Math.floor(safeNumber(source.kills)),
    deaths: Math.floor(safeNumber(source.deaths)),
    assists: Math.floor(safeNumber(source.assists)),
    damage: Math.floor(safeNumber(source.damage)),
    criticals: Math.floor(safeNumber(source.criticals)),
    bestStreak: Math.floor(safeNumber(source.bestStreak)),
    recent: Array.isArray(source.recent) ? source.recent.slice(0, 20) : []
  };
}

function storageFallback() {
  let value = null;
  return {
    getItem() { return value; },
    setItem(_key, next) { value = String(next); }
  };
}

function resolveStorage(storage) {
  if (storage) return storage;
  try { if (globalThis.localStorage) return globalThis.localStorage; } catch {}
  return storageFallback();
}

export function xpRequiredForLevel(level) {
  const safeLevel = Math.max(1, Math.min(MAX_CAREER_LEVEL - 1, Math.floor(Number(level) || 1)));
  return 900 + (safeLevel - 1) * 100;
}

export function careerLevelFromXp(totalXp) {
  let remaining = Math.max(0, Math.floor(Number(totalXp) || 0));
  let level = 1;
  while (level < MAX_CAREER_LEVEL) {
    const needed = xpRequiredForLevel(level);
    if (remaining < needed) break;
    remaining -= needed;
    level += 1;
  }
  return { level, levelXp: remaining, levelXpRequired: level >= MAX_CAREER_LEVEL ? 0 : xpRequiredForLevel(level) };
}

export function titleForLevel(level) {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  let current = CAREER_TITLES[0];
  for (const entry of CAREER_TITLES) {
    if (entry.level > safeLevel) break;
    current = entry;
  }
  return current.title;
}

export function nextTitleForLevel(level) {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  return CAREER_TITLES.find((entry) => entry.level > safeLevel) || null;
}

export function calculateMatchXp({ won = false, kills = 0, assists = 0, damage = 0, criticals = 0, bestStreak = 0 } = {}) {
  const safeKills = Math.floor(safeNumber(kills));
  const safeAssists = Math.floor(safeNumber(assists));
  const safeDamage = Math.floor(safeNumber(damage));
  const safeCriticals = Math.floor(safeNumber(criticals));
  const safeStreak = Math.floor(safeNumber(bestStreak));
  const breakdown = {
    completion: 200,
    victory: won ? 175 : 0,
    kills: safeKills * 22,
    assists: safeAssists * 12,
    damage: Math.min(220, Math.floor(safeDamage / 18)),
    criticals: safeCriticals * 8,
    streak: Math.min(100, safeStreak * 10)
  };
  return { total: Object.values(breakdown).reduce((sum, value) => sum + value, 0), breakdown };
}

export class ProgressionStore {
  constructor(storage = null) {
    this.storage = resolveStorage(storage);
    this.profile = this.read();
    this.persist();
  }

  read() {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      return normalizeProfile(raw ? JSON.parse(raw) : null);
    } catch {
      return freshProfile();
    }
  }

  persist() {
    try { this.storage.setItem(STORAGE_KEY, JSON.stringify(this.profile)); } catch {}
  }

  snapshot() {
    const career = careerLevelFromXp(this.profile.totalXp);
    const level = career.level;
    const nextTitle = nextTitleForLevel(level);
    return {
      ...this.profile,
      ...career,
      title: titleForLevel(level),
      nextTitle,
      wins: this.profile.wins,
      losses: this.profile.losses,
      winRate: this.profile.matches ? this.profile.wins / this.profile.matches : 0,
      kd: this.profile.deaths ? this.profile.kills / this.profile.deaths : this.profile.kills
    };
  }

  recordMatch({ won = false, local = null, durationLabel = '0:00' } = {}) {
    if (!local) return null;
    const before = this.snapshot();
    const xp = calculateMatchXp({
      won,
      kills: local.kills,
      assists: local.assists,
      damage: local.damage,
      criticals: local.criticals,
      bestStreak: local.bestStreak
    });

    const safeKills = Math.floor(safeNumber(local.kills));
    const safeDeaths = Math.floor(safeNumber(local.deaths));
    const safeAssists = Math.floor(safeNumber(local.assists));
    const safeDamage = Math.floor(safeNumber(local.damage));
    const safeCriticals = Math.floor(safeNumber(local.criticals));
    const safeStreak = Math.floor(safeNumber(local.bestStreak));

    this.profile.totalXp += xp.total;
    this.profile.matches += 1;
    this.profile.wins += won ? 1 : 0;
    this.profile.losses += won ? 0 : 1;
    this.profile.kills += safeKills;
    this.profile.deaths += safeDeaths;
    this.profile.assists += safeAssists;
    this.profile.damage += safeDamage;
    this.profile.criticals += safeCriticals;
    this.profile.bestStreak = Math.max(this.profile.bestStreak, safeStreak);
    this.profile.recent.unshift({
      won: Boolean(won),
      kills: safeKills,
      deaths: safeDeaths,
      assists: safeAssists,
      damage: safeDamage,
      xp: xp.total,
      durationLabel: String(durationLabel || '0:00'),
      completedAt: Date.now()
    });
    this.profile.recent = this.profile.recent.slice(0, 20);
    this.persist();

    const after = this.snapshot();
    return {
      xpGained: xp.total,
      breakdown: xp.breakdown,
      before,
      after,
      leveledUp: after.level > before.level,
      levelsGained: Math.max(0, after.level - before.level),
      unlockedTitles: CAREER_TITLES.filter((entry) => entry.level > before.level && entry.level <= after.level)
    };
  }
}

export { STORAGE_KEY as PROGRESSION_STORAGE_KEY };
