const STORAGE_KEY = 'skirmisharena.career.v2';
const LEGACY_STORAGE_KEY = 'unblockedtdm.progression.v1';

export const MAX_CAREER_LEVEL = 1000;

export const CAREER_RANKS = Object.freeze([
  { id:'recruit-i', startLevel:1, endLevel:5, title:'RECRUIT I', xpPerLevel:25, material:'Grey + green' },
  { id:'recruit-ii', startLevel:6, endLevel:10, title:'RECRUIT II', xpPerLevel:50, material:'Grey + green' },
  { id:'recruit-iii', startLevel:11, endLevel:15, title:'RECRUIT III', xpPerLevel:75, material:'Grey + green' },
  { id:'fighter-i', startLevel:16, endLevel:25, title:'FIGHTER I', xpPerLevel:125, material:'Black + red' },
  { id:'fighter-ii', startLevel:26, endLevel:35, title:'FIGHTER II', xpPerLevel:175, material:'Black + red' },
  { id:'fighter-iii', startLevel:36, endLevel:45, title:'FIGHTER III', xpPerLevel:225, material:'Black + red' },
  { id:'specialist-i', startLevel:46, endLevel:60, title:'SPECIALIST I', xpPerLevel:300, material:'Gold + brown' },
  { id:'specialist-ii', startLevel:61, endLevel:75, title:'SPECIALIST II', xpPerLevel:375, material:'Gold + brown' },
  { id:'specialist-iii', startLevel:76, endLevel:90, title:'SPECIALIST III', xpPerLevel:450, material:'Gold + brown' },
  { id:'colonel-i', startLevel:91, endLevel:110, title:'COLONEL I', xpPerLevel:550, material:'Baby blue + white' },
  { id:'colonel-ii', startLevel:111, endLevel:130, title:'COLONEL II', xpPerLevel:650, material:'Baby blue + white' },
  { id:'veteran-i', startLevel:131, endLevel:155, title:'VETERAN I', xpPerLevel:800, material:'Golden green' },
  { id:'veteran-ii', startLevel:156, endLevel:180, title:'VETERAN II', xpPerLevel:950, material:'Golden green' },
  { id:'elite-i', startLevel:181, endLevel:210, title:'ELITE I', xpPerLevel:1150, material:'Dark purple + black' },
  { id:'elite-ii', startLevel:211, endLevel:240, title:'ELITE II', xpPerLevel:1350, material:'Dark purple + black' },
  { id:'master-i', startLevel:241, endLevel:275, title:'MASTER I', xpPerLevel:1600, material:'Rose gold' },
  { id:'master-ii', startLevel:276, endLevel:310, title:'MASTER II', xpPerLevel:1850, material:'Rose gold' },
  { id:'grandmaster-i', startLevel:311, endLevel:350, title:'GRANDMASTER I', xpPerLevel:2150, material:'Diamond coating' },
  { id:'grandmaster-ii', startLevel:351, endLevel:400, title:'GRANDMASTER II', xpPerLevel:2500, material:'Diamond coating' },
  { id:'legend', startLevel:401, endLevel:500, title:'LEGEND', xpPerLevel:3000, material:'Gold diamonds' },
  { id:'transcendent', startLevel:501, endLevel:600, title:'TRANSCENDENT', xpPerLevel:4000, material:'Blue diamonds' },
  { id:'immortal', startLevel:601, endLevel:700, title:'IMMORTAL', xpPerLevel:5000, material:'Shiny galaxy' },
  { id:'demigod', startLevel:701, endLevel:800, title:'DEMIGOD', xpPerLevel:6500, material:'Prismatic spectrum' },
  { id:'divine', startLevel:801, endLevel:900, title:'DIVINE', xpPerLevel:8000, material:'Crystal' },
  { id:'celestial', startLevel:901, endLevel:999, title:'CELESTIAL', xpPerLevel:10000, material:'Black hole + crystals + diamonds' },
  { id:'omnipotent', startLevel:1000, endLevel:1000, title:'OMNIPOTENT', xpPerLevel:0, material:'White-gold singularity + obsidian crown + prismatic crystals' }
]);

// Backward-compatible export name for older modules/tests. These are ranks now, not prototype titles.
export const CAREER_TITLES = CAREER_RANKS;

export const CAREER_XP_REWARDS = Object.freeze({
  kill: 8,
  assist: 4,
  roundWin: 16,
  roundLoss: 4,
  matchWin: 100
});

export const MILESTONE_TRACKS = Object.freeze([
  { id:'kills', label:'KILLS', stat:'kills' },
  { id:'assists', label:'ASSISTS', stat:'assists' },
  { id:'roundWins', label:'ROUND WINS', stat:'roundWins' },
  { id:'wins', label:'MATCH WINS', stat:'wins' },
  { id:'matches', label:'MATCHES COMPLETED', stat:'matches' }
]);

export const MILESTONE_TIERS = Object.freeze([
  { tier:'I', reward:250, kills:1000, assists:300, roundWins:250, wins:25, matches:50 },
  { tier:'II', reward:500, kills:3000, assists:900, roundWins:750, wins:75, matches:150 },
  { tier:'III', reward:1000, kills:6000, assists:1800, roundWins:1500, wins:150, matches:300 },
  { tier:'IV', reward:2500, kills:15000, assists:4500, roundWins:3750, wins:375, matches:750 },
  { tier:'V', reward:5000, kills:30000, assists:9000, roundWins:7500, wins:750, matches:1500 },
  { tier:'VI', reward:10000, kills:60000, assists:18000, roundWins:15000, wins:1500, matches:3000 },
  { tier:'VII', reward:20000, kills:100000, assists:30000, roundWins:25000, wins:2500, matches:5000 },
  { tier:'VIII', reward:35000, kills:140000, assists:42000, roundWins:35000, wins:3500, matches:7000 },
  { tier:'IX', reward:50000, kills:170000, assists:51000, roundWins:42500, wins:4250, matches:8500 },
  { tier:'X', reward:51750, kills:200000, assists:60000, roundWins:50000, wins:5000, matches:10000 }
]);

const LEVEL_START_XP = new Array(MAX_CAREER_LEVEL + 1).fill(0);
for (let level = 1; level < MAX_CAREER_LEVEL; level += 1) {
  const rank = CAREER_RANKS.find((entry) => level >= entry.startLevel && level <= entry.endLevel);
  LEVEL_START_XP[level + 1] = LEVEL_START_XP[level] + (rank?.xpPerLevel || 0);
}
export const TOTAL_CAREER_XP = LEVEL_START_XP[MAX_CAREER_LEVEL];
export const TOTAL_MILESTONE_XP = MILESTONE_TIERS.reduce((sum, tier) => sum + tier.reward, 0) * MILESTONE_TRACKS.length;

function safeNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
}

function safeInt(value, fallback = 0) {
  return Math.floor(safeNumber(value, fallback));
}

function freshClaims() {
  return Object.fromEntries(MILESTONE_TRACKS.map((track) => [track.id, 0]));
}

const freshProfile = () => ({
  schema: 2,
  totalXp: 0,
  matches: 0,
  wins: 0,
  losses: 0,
  kills: 0,
  deaths: 0,
  assists: 0,
  roundWins: 0,
  roundLosses: 0,
  playSeconds: 0,
  damage: 0,
  criticals: 0,
  bestStreak: 0,
  claimedMilestones: freshClaims(),
  recent: [],
  migratedFromPrototype: false
});

function normalizeClaims(value) {
  const source = value && typeof value === 'object' ? value : {};
  return Object.fromEntries(MILESTONE_TRACKS.map((track) => [track.id, Math.max(0, Math.min(10, safeInt(source[track.id]))) ]));
}

function normalizeProfile(value) {
  const base = freshProfile();
  const source = value && typeof value === 'object' ? value : {};
  return {
    ...base,
    schema: 2,
    totalXp: Math.min(TOTAL_CAREER_XP, safeInt(source.totalXp)),
    matches: safeInt(source.matches),
    wins: safeInt(source.wins),
    losses: safeInt(source.losses),
    kills: safeInt(source.kills),
    deaths: safeInt(source.deaths),
    assists: safeInt(source.assists),
    roundWins: safeInt(source.roundWins),
    roundLosses: safeInt(source.roundLosses),
    playSeconds: safeNumber(source.playSeconds),
    damage: safeInt(source.damage),
    criticals: safeInt(source.criticals),
    bestStreak: safeInt(source.bestStreak),
    claimedMilestones: normalizeClaims(source.claimedMilestones),
    recent: Array.isArray(source.recent) ? source.recent.slice(0, 20) : [],
    migratedFromPrototype: Boolean(source.migratedFromPrototype)
  };
}

function migrateLegacyProfile(value) {
  const source = value && typeof value === 'object' ? value : {};
  return normalizeProfile({
    totalXp: 0,
    matches: source.matches,
    wins: source.wins,
    losses: source.losses,
    kills: source.kills,
    deaths: source.deaths,
    assists: source.assists,
    damage: source.damage,
    criticals: source.criticals,
    bestStreak: source.bestStreak,
    roundWins: 0,
    roundLosses: 0,
    playSeconds: 0,
    claimedMilestones: freshClaims(),
    recent: [],
    migratedFromPrototype: true
  });
}

function storageFallback() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); }
  };
}

function resolveStorage(storage) {
  if (storage) return storage;
  try { if (globalThis.localStorage) return globalThis.localStorage; } catch {}
  return storageFallback();
}

export function rankForLevel(level) {
  const safeLevel = Math.max(1, Math.min(MAX_CAREER_LEVEL, safeInt(level, 1)));
  return CAREER_RANKS.find((entry) => safeLevel >= entry.startLevel && safeLevel <= entry.endLevel) || CAREER_RANKS[0];
}

export function nextRankForLevel(level) {
  const safeLevel = Math.max(1, Math.min(MAX_CAREER_LEVEL, safeInt(level, 1)));
  return CAREER_RANKS.find((entry) => entry.startLevel > safeLevel) || null;
}

export function titleForLevel(level) {
  return rankForLevel(level).title;
}

export function nextTitleForLevel(level) {
  const rank = nextRankForLevel(level);
  return rank ? { ...rank, level: rank.startLevel } : null;
}

export function xpRequiredForLevel(level) {
  const safeLevel = Math.max(1, Math.min(MAX_CAREER_LEVEL, safeInt(level, 1)));
  return safeLevel >= MAX_CAREER_LEVEL ? 0 : rankForLevel(safeLevel).xpPerLevel;
}

export function totalXpAtLevel(level) {
  const safeLevel = Math.max(1, Math.min(MAX_CAREER_LEVEL, safeInt(level, 1)));
  return LEVEL_START_XP[safeLevel];
}

export function careerLevelFromXp(totalXp) {
  const xp = Math.max(0, Math.min(TOTAL_CAREER_XP, safeInt(totalXp)));
  if (xp >= TOTAL_CAREER_XP) return { level:MAX_CAREER_LEVEL, levelXp:0, levelXpRequired:0 };
  let low = 1;
  let high = MAX_CAREER_LEVEL;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (LEVEL_START_XP[mid] <= xp) low = mid;
    else high = mid - 1;
  }
  const level = low;
  return {
    level,
    levelXp: xp - LEVEL_START_XP[level],
    levelXpRequired: xpRequiredForLevel(level)
  };
}

export function calculateMatchXp({ won = false, kills = 0, assists = 0, roundWins = 0, roundLosses = 0 } = {}) {
  const counts = {
    kills: safeInt(kills),
    assists: safeInt(assists),
    roundWins: safeInt(roundWins),
    roundLosses: safeInt(roundLosses)
  };
  const breakdown = {
    kills: counts.kills * CAREER_XP_REWARDS.kill,
    assists: counts.assists * CAREER_XP_REWARDS.assist,
    roundWins: counts.roundWins * CAREER_XP_REWARDS.roundWin,
    roundLosses: counts.roundLosses * CAREER_XP_REWARDS.roundLoss,
    victory: won ? CAREER_XP_REWARDS.matchWin : 0
  };
  return {
    total: Object.values(breakdown).reduce((sum, value) => sum + value, 0),
    counts,
    breakdown
  };
}

export function milestoneProgressForProfile(profile) {
  const safeProfile = normalizeProfile(profile);
  return MILESTONE_TRACKS.map((track) => {
    const claimed = safeProfile.claimedMilestones[track.id] || 0;
    const tier = claimed < MILESTONE_TIERS.length ? MILESTONE_TIERS[claimed] : null;
    const current = safeInt(safeProfile[track.stat]);
    return {
      ...track,
      claimed,
      complete: !tier,
      current,
      tier: tier?.tier || 'X',
      target: tier ? tier[track.stat] : MILESTONE_TIERS[MILESTONE_TIERS.length - 1][track.stat],
      reward: tier?.reward || 0
    };
  });
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
      if (raw) return normalizeProfile(JSON.parse(raw));
      const legacyRaw = this.storage.getItem(LEGACY_STORAGE_KEY);
      return legacyRaw ? migrateLegacyProfile(JSON.parse(legacyRaw)) : freshProfile();
    } catch {
      return freshProfile();
    }
  }

  persist() {
    try { this.storage.setItem(STORAGE_KEY, JSON.stringify(this.profile)); } catch {}
  }

  snapshot() {
    const career = careerLevelFromXp(this.profile.totalXp);
    const rank = rankForLevel(career.level);
    const nextRank = nextRankForLevel(career.level);
    return {
      ...this.profile,
      ...career,
      rank,
      title: rank.title,
      nextRank,
      nextTitle: nextRank ? { ...nextRank, level:nextRank.startLevel } : null,
      totalCareerXp: this.profile.totalXp,
      careerCompletion: TOTAL_CAREER_XP ? this.profile.totalXp / TOTAL_CAREER_XP : 0,
      winRate: this.profile.matches ? this.profile.wins / this.profile.matches : 0,
      kd: this.profile.deaths ? this.profile.kills / this.profile.deaths : this.profile.kills,
      milestones: milestoneProgressForProfile(this.profile)
    };
  }

  recordMatch({ won = false, local = null, roundHistory = [], duration = 0, durationLabel = '0:00' } = {}) {
    if (!local) return null;
    const before = this.snapshot();
    const safeRounds = Array.isArray(roundHistory) ? roundHistory : [];
    const roundWins = safeRounds.filter((round) => round?.winner === local.team).length;
    const roundLosses = Math.max(0, safeRounds.length - roundWins);
    const matchXp = calculateMatchXp({ won, kills:local.kills, assists:local.assists, roundWins, roundLosses });

    const safeKills = safeInt(local.kills);
    const safeDeaths = safeInt(local.deaths);
    const safeAssists = safeInt(local.assists);
    const safeDamage = safeInt(local.damage);
    const safeCriticals = safeInt(local.criticals);
    const safeStreak = safeInt(local.bestStreak);

    this.profile.totalXp = Math.min(TOTAL_CAREER_XP, this.profile.totalXp + matchXp.total);
    this.profile.matches += 1;
    this.profile.wins += won ? 1 : 0;
    this.profile.losses += won ? 0 : 1;
    this.profile.kills += safeKills;
    this.profile.deaths += safeDeaths;
    this.profile.assists += safeAssists;
    this.profile.roundWins += roundWins;
    this.profile.roundLosses += roundLosses;
    this.profile.playSeconds += safeNumber(duration);
    this.profile.damage += safeDamage;
    this.profile.criticals += safeCriticals;
    this.profile.bestStreak = Math.max(this.profile.bestStreak, safeStreak);

    const milestoneAwards = [];
    for (const track of MILESTONE_TRACKS) {
      let claimed = this.profile.claimedMilestones[track.id] || 0;
      const current = safeInt(this.profile[track.stat]);
      while (claimed < MILESTONE_TIERS.length && current >= MILESTONE_TIERS[claimed][track.stat]) {
        const milestone = MILESTONE_TIERS[claimed];
        milestoneAwards.push({
          trackId: track.id,
          label: track.label,
          tier: milestone.tier,
          target: milestone[track.stat],
          reward: milestone.reward
        });
        claimed += 1;
      }
      this.profile.claimedMilestones[track.id] = claimed;
    }
    const milestoneXp = milestoneAwards.reduce((sum, award) => sum + award.reward, 0);
    this.profile.totalXp = Math.min(TOTAL_CAREER_XP, this.profile.totalXp + milestoneXp);

    this.profile.recent.unshift({
      won: Boolean(won),
      kills: safeKills,
      deaths: safeDeaths,
      assists: safeAssists,
      roundWins,
      roundLosses,
      xp: matchXp.total + milestoneXp,
      matchXp: matchXp.total,
      milestoneXp,
      durationLabel: String(durationLabel || '0:00'),
      completedAt: Date.now()
    });
    this.profile.recent = this.profile.recent.slice(0, 20);
    this.persist();

    const after = this.snapshot();
    const rankPromotions = CAREER_RANKS.filter((entry) => entry.startLevel > before.level && entry.startLevel <= after.level);
    return {
      xpGained: matchXp.total + milestoneXp,
      matchXp: matchXp.total,
      milestoneXp,
      breakdown: matchXp.breakdown,
      counts: matchXp.counts,
      milestoneAwards,
      before,
      after,
      leveledUp: after.level > before.level,
      levelsGained: Math.max(0, after.level - before.level),
      rankPromotions,
      unlockedTitles: rankPromotions
    };
  }
}

export { STORAGE_KEY as PROGRESSION_STORAGE_KEY, LEGACY_STORAGE_KEY as LEGACY_PROGRESSION_STORAGE_KEY };
