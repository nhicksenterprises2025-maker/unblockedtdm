export class DamageSystem {
  constructor({ onDamage = null } = {}) {
    this.onDamage = onDamage;
  }

  applyDamage({
    target,
    amount,
    sourceId = null,
    sourceTeam = null,
    sourcePosition = null,
    sourceType = 'unknown',
    selfDamage = false,
    critical = false
  }) {
    if (!target?.health?.alive) {
      return { applied: false, reason: 'dead', killed: false, amount: 0 };
    }

    const isSelf = sourceId != null && sourceId === target.id;
    if (isSelf && !selfDamage) {
      return { applied: false, reason: 'self-blocked', killed: false, amount: 0 };
    }

    if (!isSelf && sourceTeam != null && sourceTeam === target.team) {
      return { applied: false, reason: 'friendly-fire', killed: false, amount: 0 };
    }

    if (target.health.isSpawnProtected()) {
      return { applied: false, reason: 'spawn-protection', killed: false, amount: 0 };
    }

    if (target.isInvulnerable()) {
      return { applied: false, reason: 'dash-invulnerability', killed: false, amount: 0 };
    }

    let directionAngle = target.aimAngle + Math.PI;
    if (sourcePosition) {
      directionAngle = Math.atan2(sourcePosition.y - target.y, sourcePosition.x - target.x);
    }

    const result = target.health.applyDamage(Math.max(0, amount), {
      sourceId,
      sourceTeam,
      sourceType,
      selfDamage: isSelf && selfDamage,
      directionAngle
    });

    const enriched = {
      ...result,
      reason: result.applied ? 'applied' : 'ignored',
      directionAngle,
      critical: Boolean(critical),
      recentDamage: result.killed ? target.health.recentDamage() : null
    };

    if (enriched.applied) {
      this.onDamage?.({
        sourceId,
        sourceTeam,
        sourceType,
        target,
        selfDamage: isSelf && selfDamage,
        critical: Boolean(critical),
        result: enriched
      });
    }

    return enriched;
  }
}
