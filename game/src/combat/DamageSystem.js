import { WEAPON_LIST } from '../data/weapons.js';

const WEAPON_BY_ID = new Map(WEAPON_LIST.map((weapon) => [weapon.id, weapon]));

function inferCritical(sourceType, amount, explicit) {
  if (typeof explicit === 'boolean') return explicit;
  const weapon = WEAPON_BY_ID.get(sourceType);
  if (!weapon || weapon.critChance <= 0) return false;
  if (weapon.kind === 'shotgun') {
    const pellets = amount / weapon.critDamage;
    return Number.isInteger(pellets) && pellets >= 1 && pellets <= weapon.pelletCount;
  }
  return Math.abs(amount - weapon.critDamage) < 0.001;
}

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
    critical = null
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
    const wasCritical = inferCritical(sourceType, amount, critical);

    const enriched = {
      ...result,
      reason: result.applied ? 'applied' : 'ignored',
      directionAngle,
      critical: wasCritical,
      recentDamage: result.killed ? target.health.recentDamage() : null
    };

    if (enriched.applied) {
      this.onDamage?.({
        sourceId,
        sourceTeam,
        sourceType,
        target,
        selfDamage: isSelf && selfDamage,
        critical: wasCritical,
        result: enriched
      });
    }

    return enriched;
  }
}
