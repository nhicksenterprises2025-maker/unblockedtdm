const ROUND_DURATION = 90;
const ROUND_KILL_TARGET = 12;
const ROUND_WINS_TO_MATCH = 5;
const MAX_ROUNDS = 9;
const COUNTDOWN_DURATION = 5;
const ROUND_BREAK_DURATION = 10;
const SUICIDE_CREDIT_WINDOW = 5;
const ASSIST_DAMAGE_THRESHOLD = 45;

function freshStats() {
  return { kills: 0, deaths: 0, assists: 0, damage: 0, criticals: 0, streak: 0, bestStreak: 0 };
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, '0')}`;
}

export class MatchManager {
  constructor({ players, spawnSystem, projectileSystem, onRoundReset = null, onKill = null, onRoundEnd = null, onMatchEnd = null }) {
    this.players = players;
    this.spawnSystem = spawnSystem;
    this.projectileSystem = projectileSystem;
    this.onRoundReset = onRoundReset;
    this.onKill = onKill;
    this.onRoundEnd = onRoundEnd;
    this.onMatchEnd = onMatchEnd;
    this.round = 0;
    this.state = 'waiting';
    this.stateTimer = 0;
    this.roundTimer = ROUND_DURATION;
    this.roundKills = { blue: 0, red: 0 };
    this.roundWins = { blue: 0, red: 0 };
    this.suddenDeath = false;
    this.lastRoundWinner = null;
    this.matchWinner = null;
    this.recentCombat = [];
    this.goTimer = 0;
    this.matchElapsed = 0;
    this.roundElapsed = 0;
    this.roundHistory = [];
    this.stats = new Map(players.map((player) => [player.id, freshStats()]));
  }

  startMatch() {
    this.round = 1;
    this.roundWins = { blue: 0, red: 0 };
    this.matchWinner = null;
    this.lastRoundWinner = null;
    this.matchElapsed = 0;
    this.roundElapsed = 0;
    this.roundHistory = [];
    this.stats = new Map(this.players.map((player) => [player.id, freshStats()]));
    this.beginRound();
  }

  beginRound() {
    this.state = 'countdown';
    this.stateTimer = COUNTDOWN_DURATION;
    this.roundTimer = ROUND_DURATION;
    this.roundElapsed = 0;
    this.roundKills = { blue: 0, red: 0 };
    this.suddenDeath = false;
    this.lastRoundWinner = null;
    this.goTimer = 0;
    this.recentCombat = [];
    this.projectileSystem?.reset();
    const teamSlots = { blue: 0, red: 0 };
    for (const player of this.players) {
      const side = this.spawnSideForTeam(player.team);
      const index = teamSlots[player.team]++ % 3;
      const spawn = this.spawnSystem.map.definition.spawns[side][index];
      player.resetForRound(spawn);
    }
    this.onRoundReset?.(this.snapshot());
  }

  spawnSideForTeam(team) {
    const swapped = this.round % 2 === 0;
    if (!swapped) return team;
    return team === 'blue' ? 'red' : 'blue';
  }

  isLive() { return this.state === 'active' || this.state === 'sudden-death'; }
  isFrozen() { return this.state === 'countdown' || this.state === 'round-break' || this.state === 'match-over'; }
  canChangeLoadout() { return this.state === 'round-break'; }

  update(dt) {
    this.goTimer = Math.max(0, this.goTimer - dt);
    if (this.state !== 'waiting' && this.state !== 'match-over') this.matchElapsed += dt;
    if (this.state === 'countdown' || this.state === 'active' || this.state === 'sudden-death') this.roundElapsed += dt;
    for (const event of this.recentCombat) event.age += dt;
    this.recentCombat = this.recentCombat.filter((event) => event.age <= 8);
    if (this.state === 'countdown') {
      this.stateTimer = Math.max(0, this.stateTimer - dt);
      if (this.stateTimer <= 0) { this.state = 'active'; this.goTimer = 0.8; }
      return;
    }
    if (this.state === 'active') {
      this.roundTimer = Math.max(0, this.roundTimer - dt);
      if (this.roundTimer <= 0) {
        if (this.roundKills.blue === this.roundKills.red) { this.state = 'sudden-death'; this.suddenDeath = true; }
        else this.finishRound(this.roundKills.blue > this.roundKills.red ? 'blue' : 'red');
      }
      return;
    }
    if (this.state === 'round-break') {
      this.stateTimer = Math.max(0, this.stateTimer - dt);
      if (this.stateTimer <= 0) { this.round += 1; this.beginRound(); }
    }
  }

  registerCombatPoint(x, y) {
    this.recentCombat.push({ x, y, age: 0 });
    if (this.recentCombat.length > 24) this.recentCombat.shift();
  }

  playerById(id) { return this.players.find((player) => player.id === id) || null; }

  recordDamage({ sourceId, target, selfDamage = false, critical = false, result }) {
    if (!sourceId || !target || !result?.applied || selfDamage || sourceId === target.id) return;
    const source = this.playerById(sourceId);
    if (!source || source.team === target.team) return;
    const stats = this.stats.get(sourceId);
    if (!stats) return;
    stats.damage += result.amount;
    if (critical) stats.criticals += 1;
  }

  resolveCreditedKiller(attacker, victim, result) {
    if (attacker && attacker.id !== victim.id && attacker.team !== victim.team) return attacker;
    const recent = (result?.recentDamage || victim.health.recentDamage(SUICIDE_CREDIT_WINDOW))
      .filter((hit) => hit.age <= SUICIDE_CREDIT_WINDOW && hit.sourceId && hit.sourceId !== victim.id)
      .sort((a, b) => a.age - b.age);
    for (const hit of recent) {
      const candidate = this.playerById(hit.sourceId);
      if (candidate && candidate.team !== victim.team) return candidate;
    }
    return null;
  }

  registerAssists(victim, creditedKiller, result) {
    const grouped = new Map();
    for (const hit of result?.recentDamage || []) {
      if (!hit.sourceId || hit.sourceId === creditedKiller?.id || hit.sourceId === victim.id) continue;
      const source = this.playerById(hit.sourceId);
      if (!source || source.team === victim.team) continue;
      grouped.set(source.id, (grouped.get(source.id) || 0) + hit.amount);
    }
    for (const [id, damage] of grouped) {
      if (damage >= ASSIST_DAMAGE_THRESHOLD) this.stats.get(id).assists += 1;
    }
  }

  recordElimination(attacker, victim, result = {}) {
    if (!this.isLive() || !victim) return { counted: false };
    const victimStats = this.stats.get(victim.id);
    if (victimStats) {
      victimStats.deaths += 1;
      victimStats.streak = 0;
    }
    const creditedKiller = this.resolveCreditedKiller(attacker, victim, result);
    this.registerCombatPoint(victim.x, victim.y);
    if (!creditedKiller) {
      this.onKill?.({ attacker: null, victim, credited: false, suicide: true, snapshot: this.snapshot() });
      return { counted: false, suicide: true };
    }
    const killerStats = this.stats.get(creditedKiller.id);
    killerStats.kills += 1;
    killerStats.streak += 1;
    killerStats.bestStreak = Math.max(killerStats.bestStreak, killerStats.streak);
    this.registerAssists(victim, creditedKiller, result);
    this.roundKills[creditedKiller.team] += 1;
    const event = { attacker: creditedKiller, victim, credited: true, suicide: creditedKiller.id === victim.id, snapshot: this.snapshot() };
    this.onKill?.(event);
    if (this.state === 'sudden-death') this.finishRound(creditedKiller.team);
    else if (this.roundKills[creditedKiller.team] >= ROUND_KILL_TARGET) this.finishRound(creditedKiller.team);
    return { counted: true, killer: creditedKiller };
  }

  finishRound(winner) {
    if (!winner || this.state === 'round-break' || this.state === 'match-over') return;
    const wasSuddenDeath = this.suddenDeath;
    this.roundHistory.push({
      round: this.round,
      winner,
      kills: { ...this.roundKills },
      suddenDeath: wasSuddenDeath,
      duration: this.roundElapsed,
      durationLabel: formatDuration(this.roundElapsed)
    });
    this.roundWins[winner] += 1;
    this.lastRoundWinner = winner;
    this.suddenDeath = false;
    this.projectileSystem?.reset();
    this.onRoundEnd?.({ winner, snapshot: this.snapshot() });
    if (this.roundWins[winner] >= ROUND_WINS_TO_MATCH || this.round >= MAX_ROUNDS) {
      this.matchWinner = winner;
      this.state = 'match-over';
      this.stateTimer = 0;
      const finalSnapshot = this.postgameSnapshot();
      this.onMatchEnd?.({ winner, snapshot: finalSnapshot });
      try {
        window.dispatchEvent(new CustomEvent('unblockedtdm:match-complete', { detail: finalSnapshot }));
      } catch {}
      return;
    }
    this.state = 'round-break';
    this.stateTimer = ROUND_BREAK_DURATION;
  }

  respawnPlayer(player) {
    if (!this.isLive() || !player.health.readyToRespawn()) return null;
    const side = this.spawnSideForTeam(player.team);
    const enemies = this.players.filter((other) => other.team !== player.team && other.health.alive);
    const teammates = this.players.filter((other) => other.team === player.team && other !== player && other.health.alive);
    const spawn = this.spawnSystem.chooseSpawn(side, { enemies, teammates, recentCombat: this.recentCombat });
    player.respawn(spawn);
    return spawn;
  }

  formatTimer() {
    if (this.state === 'sudden-death') return 'SUDDEN DEATH';
    const seconds = Math.max(0, Math.ceil(this.roundTimer));
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  }

  overlayText() {
    if (this.state === 'countdown') return String(Math.max(1, Math.ceil(this.stateTimer)));
    if (this.state === 'sudden-death') return 'SUDDEN DEATH';
    if (this.state === 'round-break') return `${this.lastRoundWinner?.toUpperCase()} WINS ROUND`;
    if (this.state === 'match-over') return `${this.matchWinner?.toUpperCase()} TEAM WINS`;
    if (this.goTimer > 0) return 'GO';
    return '';
  }

  statsSnapshot() {
    return this.players.map((player) => {
      const stats = this.stats.get(player.id) || freshStats();
      const kd = stats.deaths > 0 ? stats.kills / stats.deaths : stats.kills;
      return {
        id: player.id,
        team: player.team,
        isLocal: Boolean(player.isLocal),
        kills: stats.kills,
        deaths: stats.deaths,
        assists: stats.assists,
        damage: Math.round(stats.damage),
        criticals: stats.criticals,
        bestStreak: stats.bestStreak,
        kd
      };
    });
  }

  postgameSnapshot() {
    return {
      ...this.snapshot(),
      duration: this.matchElapsed,
      durationLabel: formatDuration(this.matchElapsed),
      stats: this.statsSnapshot(),
      roundHistory: this.roundHistory.map((entry) => ({ ...entry, kills: { ...entry.kills } }))
    };
  }

  snapshot() {
    return {
      round: this.round,
      state: this.state,
      timer: this.roundTimer,
      timerLabel: this.formatTimer(),
      kills: { ...this.roundKills },
      wins: { ...this.roundWins },
      suddenDeath: this.suddenDeath,
      stateTimer: this.stateTimer,
      lastRoundWinner: this.lastRoundWinner,
      matchWinner: this.matchWinner,
      canChangeLoadout: this.canChangeLoadout(),
      overlay: this.overlayText()
    };
  }
}

export const MATCH_RULES = Object.freeze({ ROUND_DURATION, ROUND_KILL_TARGET, ROUND_WINS_TO_MATCH, MAX_ROUNDS, COUNTDOWN_DURATION, ROUND_BREAK_DURATION });
