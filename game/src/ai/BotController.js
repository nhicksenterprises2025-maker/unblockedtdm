import { castHitscan } from '../combat/Hitscan.js';
import { TILE_SIZE } from '../engine/constants.js';

const BOT_AIM_ERROR_SCALE = 1.65;
const BOT_TARGET_MOTION_ERROR_SCALE = 1.35;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const normalize = (x, y) => {
  const length = Math.hypot(x, y);
  return length > 0.0001 ? { x: x / length, y: y / length } : { x: 0, y: 0 };
};
const angleDiff = (a, b) => {
  let delta = a - b;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
};

export const AI_DIFFICULTIES = Object.freeze({
  Beginner: { label: 'Beginner', multiplier: 0.80 },
  Average: { label: 'Average', multiplier: 1.00 },
  Sweat: { label: 'Sweat', multiplier: 1.35 },
  Pro: { label: 'Pro', multiplier: 1.75 }
});

function preferredRange(weapon) {
  switch (weapon?.id) {
    case 'melee': return 1.35;
    case 'shotgun': return 3.4;
    case 'smg': return 5.6;
    case 'pistol': return 6.5;
    case 'assault-rifle': return 8.5;
    case 'launcher': return 9;
    case 'lmg': return 10.5;
    case 'sniper': return 14.5;
    default: return 8;
  }
}

function practicalRange(weapon) {
  switch (weapon?.id) {
    case 'melee': return 2.05;
    case 'shotgun': return 6.5;
    case 'smg': return 11;
    case 'pistol': return 10;
    case 'launcher': return 15;
    case 'sniper': return 25;
    default: return 18;
  }
}

function jitterBase(weapon) {
  if (weapon?.id === 'sniper') return 5;
  if (weapon?.id === 'shotgun') return 14;
  if (weapon?.id === 'smg') return 12;
  if (weapon?.id === 'lmg') return 10;
  return 8;
}

function savedDifficulty() {
  try {
    return localStorage.getItem('unblockedtdm.aiDifficulty') || 'Average';
  } catch {
    return 'Average';
  }
}

export class BotController {
  constructor(player, weaponManager, seed = 0, difficulty = savedDifficulty()) {
    this.player = player;
    this.weaponManager = weaponManager;
    this.seed = seed;
    this.camera = null;
    this.aimWorld = { x: player.x + 100, y: player.y };
    this.moveAxis = { x: 0, y: 0 };
    this.fire = false;
    this.firePulse = false;
    this.ads = false;
    this.sprint = false;
    this.dashPulse = false;
    this.reloadPulse = false;
    this.primaryPulse = false;
    this.secondaryPulse = false;
    this.shotTimer = 0;
    this.dashThinkTimer = 0.8 + seed * 0.17;
    this.strafeClock = seed * 0.71;
    this.target = null;
    this.targetDecisionTimer = 0;
    this.targetLockTimer = 0;
    this.lastX = player.x;
    this.lastY = player.y;
    this.stuckTimer = 0;
    this.routeFlip = seed % 2 === 0 ? 1 : -1;
    this.path = [];
    this.pathIndex = 0;
    this.pathRecalcTimer = 0;
    this.pathGoal = null;
    this.pathOverrideTimer = 0;
    this.debugPath = [];
    this.pathMapRevision = null;
    this.setDifficulty(difficulty);
  }

  setDifficulty(name) {
    const difficulty = AI_DIFFICULTIES[name] || AI_DIFFICULTIES.Average;
    this.difficultyName = difficulty.label;
    this.skillMultiplier = difficulty.multiplier;
    return difficulty;
  }

  resetTransient() {
    this.fire = false;
    this.firePulse = false;
    this.dashPulse = false;
    this.reloadPulse = false;
    this.primaryPulse = false;
    this.secondaryPulse = false;
  }

  resetNavigation(mapRevision = null) {
    this.path = [];
    this.pathIndex = 0;
    this.pathGoal = null;
    this.pathRecalcTimer = 0;
    this.pathOverrideTimer = 0;
    this.debugPath = [];
    this.stuckTimer = 0;
    this.pathMapRevision = Number.isFinite(Number(mapRevision)) ? Number(mapRevision) : null;
  }

  chooseTarget(enemies, targetCounts) {
    let best = null;
    let bestScore = Infinity;
    for (const enemy of enemies) {
      if (!enemy.health?.alive) continue;
      const distance = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y) / TILE_SIZE;
      const healthFraction = enemy.health.health / Math.max(1, enemy.health.maxHealth);
      const focusPenalty = (targetCounts.get(enemy.id) || 0) * 2.8;
      const score = distance + healthFraction * 2.5 + focusPenalty;
      if (score < bestScore) {
        bestScore = score;
        best = enemy;
      }
    }
    return best;
  }

  hasLOS(target, map) {
    const dx = target.x - this.player.x;
    const dy = target.y - this.player.y;
    const distance = Math.hypot(dx, dy);
    const hit = castHitscan({
      origin: { x: this.player.x, y: this.player.y },
      angle: Math.atan2(dy, dx),
      map,
      targets: [target],
      shooter: this.player,
      maxDistance: distance + target.radius + 4
    });
    return hit.target === target;
  }

  slotScore(slot, distanceTiles) {
    const weapon = this.weaponManager.loadout[slot];
    if (!weapon) return 999;
    const ammo = this.weaponManager.ammo?.[slot];
    if (weapon.magazineSize > 0 && ammo && ammo.magazine <= 0 && ammo.reserve <= 0) return 999;
    let score = Math.abs(distanceTiles - preferredRange(weapon)) / Math.max(1, preferredRange(weapon));
    if (weapon.id === 'launcher' && distanceTiles < 3.2) score += 3;
    if (weapon.id === 'melee' && distanceTiles > 3) score += 2;
    return score;
  }

  maybeSwitch(distanceTiles) {
    if (this.weaponManager.isSwitching() || this.weaponManager.isReloading()) return;
    const current = this.weaponManager.currentSlot;
    const other = current === 'primary' ? 'secondary' : 'primary';
    if (this.slotScore(other, distanceTiles) + 0.24 < this.slotScore(current, distanceTiles)) {
      if (other === 'primary') this.primaryPulse = true;
      else this.secondaryPulse = true;
    }
  }

  routeGoalFor(target, hasLOS) {
    if (hasLOS) return { x: target.x, y: target.y };
    const centerX = 16 * TILE_SIZE;
    const targetAcrossCenter = (this.player.x < centerX && target.x > centerX) || (this.player.x > centerX && target.x < centerX);
    if (!targetAcrossCenter) return { x: target.x, y: target.y };
    const laneChoice = (this.seed + (this.routeFlip > 0 ? 1 : 0)) % 3;
    const laneY = [6.5, 11, 15.5][laneChoice] * TILE_SIZE;
    return { x: centerX, y: laneY };
  }

  ensurePath(pathfinder, goal, force = false) {
    if (!pathfinder || !goal) return;
    const goalMoved = !this.pathGoal || Math.hypot(goal.x - this.pathGoal.x, goal.y - this.pathGoal.y) > TILE_SIZE * 1.15;
    if (!force && this.path.length && this.pathRecalcTimer > 0 && !goalMoved) return;
    this.path = pathfinder.findPath({ x: this.player.x, y: this.player.y }, goal);
    this.pathIndex = 0;
    this.pathGoal = { x: goal.x, y: goal.y };
    this.pathRecalcTimer = clamp(0.62 / this.skillMultiplier, 0.20, 0.82);
    this.debugPath = this.path.map((point) => ({ ...point }));
  }

  followPath() {
    while (this.pathIndex < this.path.length) {
      const point = this.path[this.pathIndex];
      const distance = Math.hypot(point.x - this.player.x, point.y - this.player.y);
      if (distance > TILE_SIZE * 0.42) return normalize(point.x - this.player.x, point.y - this.player.y);
      this.pathIndex += 1;
    }
    return { x: 0, y: 0 };
  }

  avoidWalls(direction, pathfinder) {
    if (!pathfinder || Math.hypot(direction.x, direction.y) < 0.01) return direction;
    const probeDistance = TILE_SIZE * 0.72;
    const openAt = (x, y) => pathfinder.isWorldWalkable(
      this.player.x + x * probeDistance,
      this.player.y + y * probeDistance,
      this.player.radius
    );
    if (openAt(direction.x, direction.y)) return direction;

    const baseAngle = Math.atan2(direction.y, direction.x);
    const offsets = [Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, Math.PI];
    let best = { x: 0, y: 0 };
    let bestDot = -Infinity;
    for (const offset of offsets) {
      const candidate = { x: Math.cos(baseAngle + offset), y: Math.sin(baseAngle + offset) };
      if (!openAt(candidate.x, candidate.y)) continue;
      const dot = candidate.x * direction.x + candidate.y * direction.y;
      if (dot > bestDot) {
        bestDot = dot;
        best = candidate;
      }
    }
    return best;
  }

  update(dt, { camera, enemies = [], teammates = [], map, targetCounts = new Map(), pathfinder = null }) {
    const liveDifficulty = savedDifficulty();
    if (liveDifficulty !== this.difficultyName) this.setDifficulty(liveDifficulty);
    this.resetTransient();
    // A TileMap definition can change between Casual and Arena without replacing
    // the pathfinder or bot controller. Synchronize before any cached-path early
    // return, then invalidate every route derived from the previous map revision.
    pathfinder?.syncMap?.();
    const liveMapRevision = Number(pathfinder?.mapRevision ?? map?.revision ?? 0);
    if (this.pathMapRevision !== liveMapRevision) this.resetNavigation(liveMapRevision);
    this.camera = camera;
    const skill = this.skillMultiplier;
    this.shotTimer = Math.max(0, this.shotTimer - dt);
    this.dashThinkTimer -= dt;
    this.targetDecisionTimer -= dt;
    this.pathRecalcTimer -= dt;
    this.pathOverrideTimer = Math.max(0, this.pathOverrideTimer - dt);
    this.strafeClock += dt;

    if (!this.player.health.alive) {
      this.moveAxis = { x: 0, y: 0 };
      this.sprint = false;
      this.ads = false;
      this.target = null;
      this.targetLockTimer = 0;
      this.resetNavigation(liveMapRevision);
      return;
    }

    if (!this.target?.health?.alive || this.targetDecisionTimer <= 0) {
      const next = this.chooseTarget(enemies, targetCounts);
      if (next !== this.target) {
        this.targetLockTimer = 0;
        this.path = [];
        this.pathGoal = null;
      }
      this.target = next;
      this.targetDecisionTimer = clamp(0.34 / skill, 0.08, 0.48);
    }

    if (!this.target) {
      this.moveAxis = { x: 0, y: 0 };
      this.sprint = false;
      this.ads = false;
      return;
    }

    this.targetLockTimer += dt;
    let weapon = this.weaponManager.currentWeapon();
    let ammo = this.weaponManager.currentAmmo();
    const dx = this.target.x - this.player.x;
    const dy = this.target.y - this.player.y;
    const distance = Math.hypot(dx, dy);
    const distanceTiles = distance / TILE_SIZE;
    const toward = normalize(dx, dy);
    const hasLOS = this.hasLOS(this.target, map);

    this.maybeSwitch(distanceTiles);
    weapon = this.weaponManager.currentWeapon();
    ammo = this.weaponManager.currentAmmo();

    const baseError = jitterBase(weapon) * BOT_AIM_ERROR_SCALE / clamp(skill, 0.65, 2.2);
    const motionError = Math.min(10, (this.target.speedTilesPerSecond?.() || 0) * 1.7)
      * BOT_TARGET_MOTION_ERROR_SCALE / skill;
    const jitter = baseError + motionError;
    const desiredAim = {
      x: this.target.x + Math.cos(this.strafeClock * 1.83 + this.seed) * jitter,
      y: this.target.y + Math.sin(this.strafeClock * 1.39 + this.seed * 0.7) * jitter
    };
    const aimBlend = 1 - Math.exp(-(4.6 + 5.0 * skill) * dt);
    this.aimWorld.x += (desiredAim.x - this.aimWorld.x) * aimBlend;
    this.aimWorld.y += (desiredAim.y - this.aimWorld.y) * aimBlend;

    const preferred = preferredRange(weapon);
    const lowHealth = this.player.health.health <= 55 && this.player.health.timeSinceDamage < 4.5;
    const strafeSign = (this.seed % 2 === 0 ? 1 : -1) * (Math.sin(this.strafeClock * (0.58 + 0.12 * skill)) >= 0 ? 1 : -1);
    let desiredMove = { x: 0, y: 0 };

    const movedLastFrame = Math.hypot(this.player.x - this.lastX, this.player.y - this.lastY);
    if (movedLastFrame < 1.5 && Math.hypot(this.moveAxis.x, this.moveAxis.y) > 0.45) this.stuckTimer += dt;
    else this.stuckTimer = Math.max(0, this.stuckTimer - dt * 2.5);
    this.lastX = this.player.x;
    this.lastY = this.player.y;

    if (this.stuckTimer > 0.38) {
      this.routeFlip *= -1;
      this.pathOverrideTimer = 1.15;
      this.pathRecalcTimer = 0;
      this.stuckTimer = 0;
    }

    if (lowHealth) {
      desiredMove = {
        x: -toward.x * 0.9 - toward.y * strafeSign * 0.45,
        y: -toward.y * 0.9 + toward.x * strafeSign * 0.45
      };
    } else if (!hasLOS || this.pathOverrideTimer > 0) {
      const routeGoal = this.routeGoalFor(this.target, hasLOS);
      this.ensurePath(pathfinder, routeGoal, this.pathOverrideTimer > 0 && this.pathRecalcTimer <= 0);
      desiredMove = this.followPath();
      if (Math.hypot(desiredMove.x, desiredMove.y) < 0.01) desiredMove = toward;
    } else if (distanceTiles > preferred * 1.18) {
      desiredMove = toward;
    } else if (distanceTiles < preferred * (weapon?.id === 'launcher' ? 0.62 : 0.50)) {
      desiredMove = { x: -toward.x, y: -toward.y };
    } else {
      const radial = clamp((distanceTiles - preferred) / Math.max(1, preferred), -0.35, 0.35);
      desiredMove = {
        x: -toward.y * strafeSign + toward.x * radial,
        y: toward.x * strafeSign + toward.y * radial
      };
    }

    for (const mate of teammates) {
      if (!mate.health?.alive || mate === this.player) continue;
      const mx = this.player.x - mate.x;
      const my = this.player.y - mate.y;
      const mateDistance = Math.hypot(mx, my);
      if (mateDistance > 0 && mateDistance < TILE_SIZE * 1.7) {
        const strength = (1 - mateDistance / (TILE_SIZE * 1.7)) * 0.85;
        desiredMove.x += (mx / mateDistance) * strength;
        desiredMove.y += (my / mateDistance) * strength;
      }
    }

    desiredMove = normalize(desiredMove.x, desiredMove.y);
    desiredMove = this.avoidWalls(desiredMove, pathfinder);
    this.moveAxis = normalize(desiredMove.x, desiredMove.y);
    this.sprint = ((!hasLOS && distanceTiles > 8.5) || lowHealth) && this.player.stamina > 30;
    this.ads = hasLOS && weapon?.canADS !== false && distanceTiles > (weapon?.id === 'shotgun' ? 2.2 : 3);

    if (weapon?.magazineSize > 0 && ammo && ammo.reserve > 0 && !this.weaponManager.isReloading()) {
      const lowAmmo = ammo.magazine <= Math.max(1, Math.floor(weapon.magazineSize * (0.12 + 0.08 / skill)));
      if (ammo.magazine === 0 || (lowAmmo && (!hasLOS || distanceTiles > preferred * 1.35))) this.reloadPulse = true;
    }

    const actualAngle = Math.atan2(dy, dx);
    const aimError = Math.abs(angleDiff(this.player.aimAngle, actualAngle));
    const reactionReady = this.targetLockTimer >= clamp(0.30 / skill, 0.07, 0.42);
    const tolerance = clamp(0.16 / skill, 0.035, 0.20);
    const safeLauncher = weapon?.id !== 'launcher' || distanceTiles >= 3.2;
    const wantsFire = hasLOS && distanceTiles <= practicalRange(weapon) && reactionReady && aimError <= tolerance && safeLauncher;

    if (wantsFire && !this.reloadPulse) {
      if (weapon?.fireMode === 'auto') this.fire = true;
      else if (this.shotTimer <= 0) {
        this.firePulse = true;
        const base = weapon?.id === 'pistol' ? 0.22 : Math.max(0.16, weapon?.fireInterval || 0.24);
        this.shotTimer = clamp(base / skill, 0.09, base);
      }
    }

    if (this.dashThinkTimer <= 0) {
      this.dashThinkTimer = clamp((2.7 + ((this.seed * 0.37 + this.strafeClock * 0.13) % 1.5)) / skill, 1.05, 4.2);
      if (hasLOS && (distanceTiles < preferred * 0.85 || lowHealth) && this.player.dashCharges > 0 && this.player.stamina >= 15) {
        this.dashPulse = true;
      }
    }
  }

  axis() { return { ...this.moveAxis }; }
  sprintHeld() { return this.sprint; }
  dashPressed() { return this.dashPulse; }
  reloadPressed() { return this.reloadPulse; }
  slotPrimaryPressed() { return this.primaryPulse; }
  slotSecondaryPressed() { return this.secondaryPulse; }
  fireHeld() { return this.fire; }
  firePressed() { return this.firePulse; }
  adsHeld() { return this.ads; }
  aimSensitivity() { return clamp(this.skillMultiplier, 0.65, 2.1); }

  pointerPosition() {
    if (!this.camera) return { x: 0, y: 0, inside: true };
    return {
      x: (this.aimWorld.x - this.camera.x) * this.camera.zoom + this.camera.width / 2,
      y: (this.aimWorld.y - this.camera.y) * this.camera.zoom + this.camera.height / 2,
      inside: true
    };
  }

  wasPressed() { return false; }
  endFrame() { this.resetTransient(); }
}
