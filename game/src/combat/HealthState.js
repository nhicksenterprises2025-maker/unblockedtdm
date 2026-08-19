import {
  DAMAGE_HISTORY_TTL,
  DAMAGE_INDICATOR_DURATION,
  DAMAGE_VIGNETTE_DURATION,
  HEALTH_BAR_FADE_TIME,
  HEALTH_BAR_HOLD_TIME,
  HEALTH_REGEN_CAP,
  HEALTH_REGEN_DELAY,
  HEALTH_REGEN_PER_SECOND,
  HIT_FLASH_DURATION,
  PLAYER_MAX_HEALTH,
  RESPAWN_DELAY,
  SPAWN_PROTECTION_DURATION
} from '../engine/constants.js';

export class HealthState {
  constructor() {
    this.maxHealth = PLAYER_MAX_HEALTH;
    this.health = PLAYER_MAX_HEALTH;
    this.alive = true;

    this.timeSinceDamage = Infinity;
    this.healthBarTimer = 0;
    this.hitFlashTimer = 0;
    this.damageVignetteTimer = 0;
    this.damageIndicatorTimer = 0;
    this.damageIndicatorAngle = 0;

    this.respawnTimer = 0;
    this.spawnProtectionTimer = 0;
    this.damageHistory = [];
    this.lastDamageResult = null;
  }

  update(dt) {
    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
    this.damageVignetteTimer = Math.max(0, this.damageVignetteTimer - dt);
    this.damageIndicatorTimer = Math.max(0, this.damageIndicatorTimer - dt);
    this.healthBarTimer = Math.max(0, this.healthBarTimer - dt);
    this.spawnProtectionTimer = Math.max(0, this.spawnProtectionTimer - dt);

    for (const hit of this.damageHistory) hit.age += dt;
    this.damageHistory = this.damageHistory.filter((hit) => hit.age <= DAMAGE_HISTORY_TTL);

    if (!this.alive) {
      this.respawnTimer = Math.max(0, this.respawnTimer - dt);
      return;
    }

    this.timeSinceDamage += dt;
    if (this.timeSinceDamage >= HEALTH_REGEN_DELAY && this.health < HEALTH_REGEN_CAP) {
      this.health = Math.min(HEALTH_REGEN_CAP, this.health + HEALTH_REGEN_PER_SECOND * dt);
    }
  }

  applyDamage(amount, metadata = {}) {
    if (!this.alive || amount <= 0) {
      return { applied: false, killed: false, amount: 0 };
    }

    const before = this.health;
    this.health = Math.max(0, this.health - amount);
    const applied = before - this.health;

    this.timeSinceDamage = 0;
    this.healthBarTimer = HEALTH_BAR_HOLD_TIME + HEALTH_BAR_FADE_TIME;
    this.hitFlashTimer = HIT_FLASH_DURATION;
    this.damageVignetteTimer = DAMAGE_VIGNETTE_DURATION;
    this.damageIndicatorTimer = DAMAGE_INDICATOR_DURATION;
    if (Number.isFinite(metadata.directionAngle)) this.damageIndicatorAngle = metadata.directionAngle;

    this.damageHistory.push({
      age: 0,
      amount: applied,
      sourceId: metadata.sourceId ?? null,
      sourceTeam: metadata.sourceTeam ?? null,
      sourceType: metadata.sourceType ?? 'unknown',
      selfDamage: Boolean(metadata.selfDamage)
    });

    const killed = this.health <= 0;
    if (killed) {
      this.alive = false;
      this.respawnTimer = RESPAWN_DELAY;
      this.spawnProtectionTimer = 0;
    }

    this.lastDamageResult = { applied: true, killed, amount: applied, before, after: this.health };
    return this.lastDamageResult;
  }

  respawn() {
    this.health = this.maxHealth;
    this.alive = true;
    this.timeSinceDamage = Infinity;
    this.healthBarTimer = 0;
    this.hitFlashTimer = 0;
    this.damageVignetteTimer = 0;
    this.damageIndicatorTimer = 0;
    this.respawnTimer = 0;
    this.spawnProtectionTimer = SPAWN_PROTECTION_DURATION;
    this.damageHistory = [];
    this.lastDamageResult = null;
  }

  resetForRound() {
    this.respawn();
    this.spawnProtectionTimer = 0;
  }

  readyToRespawn() {
    return !this.alive && this.respawnTimer <= 0;
  }

  isSpawnProtected() {
    return this.alive && this.spawnProtectionTimer > 0;
  }

  endSpawnProtection() {
    this.spawnProtectionTimer = 0;
  }

  healthPercent() {
    return this.health / this.maxHealth;
  }

  healthBarOpacity() {
    if (!this.alive || this.healthBarTimer <= 0) return 0;
    if (this.healthBarTimer >= HEALTH_BAR_FADE_TIME) return 1;
    return this.healthBarTimer / HEALTH_BAR_FADE_TIME;
  }

  hitFlashPercent() {
    return Math.min(1, this.hitFlashTimer / HIT_FLASH_DURATION);
  }

  vignettePercent() {
    return Math.min(1, this.damageVignetteTimer / DAMAGE_VIGNETTE_DURATION);
  }

  indicatorPercent() {
    return Math.min(1, this.damageIndicatorTimer / DAMAGE_INDICATOR_DURATION);
  }

  recentDamage(windowSeconds = DAMAGE_HISTORY_TTL) {
    return this.damageHistory.filter((hit) => hit.age <= windowSeconds);
  }
}
