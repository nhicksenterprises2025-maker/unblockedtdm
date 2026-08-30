import { castHitscan } from '../combat/Hitscan.js';
import { DASH_DISTANCE_TILES, TILE_SIZE } from '../engine/constants.js';

const BOT_AIM_ERROR_SCALE = 1.65;
const BOT_TARGET_MOTION_ERROR_SCALE = 1.35;
const CLOSE_HEARING_TILES = 3.2;
const GUNFIRE_HEARING_TILES = 11;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const normalize = (x, y) => {
  const length = Math.hypot(x, y);
  return length > 0.0001 ? { x:x / length, y:y / length } : { x:0, y:0 };
};
const angleDiff = (a, b) => {
  let delta = a - b;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
};
const healthFraction = (actor) => clamp(
  Number(actor?.health?.health ?? 0) / Math.max(1, Number(actor?.health?.maxHealth ?? 150)),
  0,
  1
);

export const AI_DIFFICULTIES = Object.freeze({
  Beginner: { label:'Beginner', multiplier:0.80 },
  Average: { label:'Average', multiplier:1.00 },
  Sweat: { label:'Sweat', multiplier:1.35 },
  Pro: { label:'Pro', multiplier:1.75 }
});

// These profiles change positioning, commitment and firing discipline. Difficulty
// modifies how consistently a bot follows the profile; it does not grant extra
// damage, vision through walls, ammunition or impossible aim.
export const WEAPON_TACTICS = Object.freeze({
  'assault-rifle': Object.freeze({ ideal:8.5, min:5.0, fireMax:18, aggression:.54, flank:.42, cover:.78, hold:.52, laneRisk:.55, dashClose:.16, dashEscape:.68 }),
  smg: Object.freeze({ ideal:5.4, min:2.8, fireMax:11, aggression:.86, flank:.82, cover:.62, hold:.18, laneRisk:.82, dashClose:.78, dashEscape:.56 }),
  sniper: Object.freeze({ ideal:14.5, min:9.0, fireMax:25, aggression:.18, flank:.56, cover:.94, hold:.92, laneRisk:.94, dashClose:.04, dashEscape:.94 }),
  shotgun: Object.freeze({ ideal:3.1, min:1.25, fireMax:4.3, aggression:.94, flank:.90, cover:.84, hold:.18, laneRisk:.92, dashClose:.90, dashEscape:.48 }),
  lmg: Object.freeze({ ideal:10.4, min:6.0, fireMax:18, aggression:.28, flank:.28, cover:.88, hold:.90, laneRisk:.54, dashClose:.08, dashEscape:.78 }),
  pistol: Object.freeze({ ideal:6.2, min:3.0, fireMax:10.5, aggression:.60, flank:.62, cover:.60, hold:.24, laneRisk:.70, dashClose:.48, dashEscape:.62 }),
  launcher: Object.freeze({ ideal:9.0, min:5.1, fireMax:15, aggression:.38, flank:.48, cover:.84, hold:.70, laneRisk:.66, dashClose:.06, dashEscape:.90, cluster:.95 }),
  melee: Object.freeze({ ideal:1.25, min:.35, fireMax:2.05, aggression:1, flank:1, cover:.90, hold:0, laneRisk:1, dashClose:1, dashEscape:.34 })
});

const DEFAULT_TACTIC = WEAPON_TACTICS['assault-rifle'];
export const tacticForWeapon = (weapon) => WEAPON_TACTICS[weapon?.id] || DEFAULT_TACTIC;

function preferredRange(weapon) { return tacticForWeapon(weapon).ideal; }
function practicalRange(weapon) { return tacticForWeapon(weapon).fireMax; }

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

function firedRecently(actor) {
  return Number(actor?.weaponManager?.fireVisualTimer || 0) > 0
    || Number(actor?.weaponManager?.meleeVisualTimer || 0) > 0;
}

export class BotController {
  constructor(player, weaponManager, seed = 0, difficulty = savedDifficulty()) {
    this.player = player;
    this.weaponManager = weaponManager;
    this.seed = seed;
    this.camera = null;
    this.aimWorld = { x:player.x + 100, y:player.y };
    this.moveAxis = { x:0, y:0 };
    this.previousMoveAxis = { x:0, y:0 };
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
    this.targetIntel = null;
    this.targetDecisionTimer = 0;
    this.targetLockTimer = 0;
    this.perceptionClock = 0;
    this.perceptionScanTimer = 0;
    this.knownEnemies = new Map();
    this.lastX = player.x;
    this.lastY = player.y;
    this.stuckTimer = 0;
    this.blockedTimer = 0;
    this.cornerCorrectionTimer = 0;
    this.routeFlip = seed % 2 === 0 ? 1 : -1;
    this.path = [];
    this.pathIndex = 0;
    this.pathRecalcTimer = 0;
    this.pathGoal = null;
    this.pathOverrideTimer = 0;
    this.recoveryGoal = null;
    this.patrolGoal = null;
    this.patrolIndex = seed % 3;
    this.tacticalGoal = null;
    this.tacticalGoalTimer = 0;
    this.debugPath = [];
    this.pathMapRevision = null;
    this.lastNavigationReason = 'spawn';
    this.setDifficulty(difficulty);
  }

  setDifficulty(name) {
    const difficulty = AI_DIFFICULTIES[name] || AI_DIFFICULTIES.Average;
    this.difficultyName = difficulty.label;
    this.skillMultiplier = difficulty.multiplier;
    return difficulty;
  }

  discipline() {
    return clamp((this.skillMultiplier - AI_DIFFICULTIES.Beginner.multiplier)
      / (AI_DIFFICULTIES.Pro.multiplier - AI_DIFFICULTIES.Beginner.multiplier), 0, 1);
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
    this.recoveryGoal = null;
    this.patrolGoal = null;
    this.tacticalGoal = null;
    this.tacticalGoalTimer = 0;
    this.debugPath = [];
    this.stuckTimer = 0;
    this.blockedTimer = 0;
    this.pathMapRevision = Number.isFinite(Number(mapRevision)) ? Number(mapRevision) : null;
  }

  hasLOS(target, map, origin = this.player) {
    if (!target || !map) return false;
    const dx = target.x - origin.x;
    const dy = target.y - origin.y;
    const distance = Math.hypot(dx, dy);
    const hit = castHitscan({
      origin:{ x:origin.x, y:origin.y },
      angle:Math.atan2(dy, dx),
      map,
      targets:[target],
      shooter:this.player,
      maxDistance:distance + (target.radius || 0) + 4
    });
    return hit.target === target;
  }

  observeEnemies(enemies, map) {
    const memorySeconds = 3.1 + this.discipline() * 2.4;
    const liveIds = new Set();
    for (const enemy of enemies) {
      if (!enemy?.health?.alive) continue;
      liveIds.add(enemy.id);
      const distanceTiles = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y) / TILE_SIZE;
      const visible = this.hasLOS(enemy, map);
      const audible = distanceTiles <= CLOSE_HEARING_TILES
        || (firedRecently(enemy) && distanceTiles <= GUNFIRE_HEARING_TILES)
        || (enemy.sprinting && distanceTiles <= 5.2);
      const previous = this.knownEnemies.get(enemy.id);
      if (visible || audible) {
        const uncertainty = visible ? 0 : Math.min(TILE_SIZE * .55, distanceTiles * 2.2);
        const phase = this.seed * 1.73 + this.perceptionClock * .61 + String(enemy.id).length;
        this.knownEnemies.set(enemy.id, {
          actor:enemy,
          x:enemy.x + Math.cos(phase) * uncertainty,
          y:enemy.y + Math.sin(phase * .83) * uncertainty,
          visible,
          audible:!visible && audible,
          observedAt:this.perceptionClock,
          confidence:visible ? 1 : .54,
          health:visible ? healthFraction(enemy) : (previous?.health ?? .75)
        });
      } else if (previous) {
        previous.visible = false;
        previous.audible = false;
        previous.confidence = clamp(1 - (this.perceptionClock - previous.observedAt) / memorySeconds, 0, 1);
      }
    }
    for (const [id, intel] of this.knownEnemies) {
      if (!intel.actor?.health?.alive || !liveIds.has(id) || this.perceptionClock - intel.observedAt > memorySeconds) {
        this.knownEnemies.delete(id);
      }
    }
    return [...this.knownEnemies.values()];
  }

  clusterCount(candidate, perceptions) {
    const radius = TILE_SIZE * 2.6;
    let count = 0;
    for (const other of perceptions) {
      if (other === candidate || other.confidence < .4) continue;
      if (Math.hypot(other.x - candidate.x, other.y - candidate.y) <= radius) count += 1;
    }
    return count;
  }

  chooseTarget(candidates, targetCounts = new Map(), profile = DEFAULT_TACTIC) {
    let best = null;
    let bestScore = Infinity;
    const perceptions = candidates.map((candidate) => candidate.actor ? candidate : {
      actor:candidate,
      x:candidate.x,
      y:candidate.y,
      visible:true,
      confidence:1,
      health:healthFraction(candidate)
    });
    for (const intel of perceptions) {
      const enemy = intel.actor;
      if (!enemy?.health?.alive || intel.confidence <= 0) continue;
      const distance = Math.hypot(intel.x - this.player.x, intel.y - this.player.y) / TILE_SIZE;
      const rangeCost = Math.abs(distance - profile.ideal) * (profile.aggression > .75 ? .16 : .08);
      const focusPenalty = (targetCounts.get(enemy.id) || 0) * 2.6;
      const visibilityPenalty = intel.visible ? 0 : (1 - intel.confidence) * 4.5 + .8;
      const woundedBonus = intel.visible ? (1 - intel.health) * (profile.aggression * 2.8) : 0;
      const clusterBonus = (profile.cluster || 0) * this.clusterCount(intel, perceptions) * 1.4;
      const score = distance * .42 + rangeCost + focusPenalty + visibilityPenalty - woundedBonus - clusterBonus;
      if (score < bestScore) {
        bestScore = score;
        best = intel;
      }
    }
    return best;
  }

  slotScore(slot, distanceTiles) {
    const weapon = this.weaponManager.loadout?.[slot];
    if (!weapon) return 999;
    const ammo = this.weaponManager.ammo?.[slot];
    if (weapon.magazineSize > 0 && ammo && ammo.magazine <= 0 && ammo.reserve <= 0) return 999;
    const tactic = tacticForWeapon(weapon);
    let score = Math.abs(distanceTiles - tactic.ideal) / Math.max(1, tactic.ideal);
    if (distanceTiles > tactic.fireMax) score += (distanceTiles - tactic.fireMax) * .2;
    if (distanceTiles < tactic.min) score += (tactic.min - distanceTiles) * .35;
    if (weapon.magazineSize > 0 && ammo) {
      const magazineFraction = ammo.magazine / Math.max(1, weapon.magazineSize);
      if (ammo.magazine <= 0) score += ammo.reserve > 0 ? 1.4 : 5;
      else if (magazineFraction < .12) score += .45;
    }
    return score;
  }

  maybeSwitch(distanceTiles, hasLOS = false) {
    if (this.weaponManager.isSwitching?.() || this.weaponManager.isReloading?.()) return;
    const current = this.weaponManager.currentSlot;
    const other = current === 'primary' ? 'secondary' : 'primary';
    const currentAmmo = this.weaponManager.ammo?.[current];
    const currentEmpty = currentAmmo && currentAmmo.magazine <= 0;
    const threshold = currentEmpty && hasLOS ? .05 : .24;
    if (this.slotScore(other, distanceTiles) + threshold < this.slotScore(current, distanceTiles)) {
      if (other === 'primary') this.primaryPulse = true;
      else this.secondaryPulse = true;
    }
  }

  pathOptions(perceptions, targetIntel, profile, lowHealth = false) {
    const dangerZones = [];
    const dangerSegments = [];
    for (const intel of perceptions) {
      if (intel.confidence < .25) continue;
      const isTarget = intel === targetIntel;
      const threatWeapon = intel.actor?.weaponManager?.currentWeapon?.();
      const threatTactic = tacticForWeapon(threatWeapon);
      const longLaneThreat = threatWeapon?.id === 'sniper' || threatWeapon?.id === 'lmg';
      const closeThreat = threatWeapon?.id === 'shotgun' || threatWeapon?.id === 'melee';
      const threatMultiplier = longLaneThreat ? 1.35 : closeThreat ? .82 : 1;
      const weight = profile.laneRisk * intel.confidence * threatMultiplier
        * (isTarget ? (lowHealth ? 1.1 : .18) : .72);
      dangerZones.push({
        x:intel.x,
        y:intel.y,
        radius:TILE_SIZE * (isTarget ? 2.2 : Math.max(2.4, threatTactic.ideal * .36)),
        weight
      });
      if (intel.visible && (!isTarget || lowHealth)) {
        dangerSegments.push({
          from:{ x:intel.x, y:intel.y },
          to:{ x:this.player.x, y:this.player.y },
          width:TILE_SIZE * (longLaneThreat ? 1.35 : 1.05),
          weight:weight * (longLaneThreat ? 1.55 : 1.15)
        });
      }
    }
    return {
      preferredClearance:TILE_SIZE * (.34 + profile.cover * .26),
      clearanceWeight:.18 + profile.cover * .28,
      dangerZones,
      dangerSegments
    };
  }

  patrolGoalFor(pathfinder, profile) {
    if (!pathfinder) return null;
    const { width, height } = pathfinder.bounds();
    if (this.patrolGoal && Math.hypot(this.patrolGoal.x - this.player.x, this.patrolGoal.y - this.player.y) > TILE_SIZE * .8) {
      return this.patrolGoal;
    }
    const lanes = [.24, .50, .76];
    this.patrolIndex = (this.patrolIndex + (this.patrolGoal ? 1 : 0)) % lanes.length;
    const lane = lanes[(this.patrolIndex + this.seed) % lanes.length];
    const blue = this.player.team !== 'red';
    const holdFactor = profile.hold * .13;
    const xFraction = blue
      ? .48 + profile.aggression * .13 - holdFactor
      : .52 - profile.aggression * .13 + holdFactor;
    this.patrolGoal = pathfinder.nearestSafeWorld({ x:width * xFraction, y:height * lane }, {
      preferredClearance:TILE_SIZE * .25
    });
    return this.patrolGoal;
  }

  tacticalPosition(targetIntel, pathfinder, perceptions, teammates, profile, force = false) {
    if (!pathfinder || !targetIntel) return null;
    if (!force && this.tacticalGoal && this.tacticalGoalTimer > 0
      && pathfinder.isWorldWalkable(this.tacticalGoal.x, this.tacticalGoal.y)) return this.tacticalGoal;
    const baseAngle = Math.atan2(this.player.y - targetIntel.y, this.player.x - targetIntel.x);
    const offsets = [0, .34, -.34, .72, -.72, 1.12, -1.12, Math.PI];
    const idealDistance = profile.ideal * TILE_SIZE;
    const playerTargetAngle = Math.atan2(targetIntel.y - this.player.y, targetIntel.x - this.player.x);
    let best = null;
    let bestScore = -Infinity;
    for (const offset of offsets) {
      const angle = baseAngle + offset * (0.75 + profile.flank * .55) * this.routeFlip;
      const distanceScale = 1 + Math.sin(this.seed * 1.7 + offset * 2.1) * .09;
      const candidate = {
        x:targetIntel.x + Math.cos(angle) * idealDistance * distanceScale,
        y:targetIntel.y + Math.sin(angle) * idealDistance * distanceScale
      };
      if (!pathfinder.isWorldWalkable(candidate.x, candidate.y)) continue;
      const clearance = pathfinder.wallClearanceAt(candidate.x, candidate.y);
      const lineOfFire = pathfinder.lineClear(candidate, targetIntel);
      const directRoute = pathfinder.segmentClear(this.player, candidate);
      let exposure = 0;
      for (const intel of perceptions) {
        if (intel.confidence > .35 && pathfinder.lineClear(candidate, intel)) exposure += intel === targetIntel ? .35 : 1;
      }
      let teammateCrowding = 0;
      for (const mate of teammates) {
        if (!mate.health?.alive || mate === this.player) continue;
        const distance = Math.hypot(candidate.x - mate.x, candidate.y - mate.y) / TILE_SIZE;
        if (distance < 2) teammateCrowding += (2 - distance) * .8;
      }
      const approachAngle = Math.atan2(candidate.y - this.player.y, candidate.x - this.player.x);
      const lateral = Math.abs(Math.sin(angleDiff(approachAngle, playerTargetAngle)));
      const coverDistance = clamp(clearance / TILE_SIZE, 0, 2);
      const coverScore = 1 - Math.abs(coverDistance - .55) / 1.45;
      const score = (lineOfFire ? .5 + profile.hold * .8 : (profile.aggression > .75 ? .1 : -.7))
        + coverScore * profile.cover
        + lateral * profile.flank * 1.15
        + (directRoute ? .38 : 0)
        - exposure * profile.laneRisk * .46
        - teammateCrowding;
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
    this.tacticalGoal = best ? pathfinder.nearestSafeWorld(best, { preferredClearance:TILE_SIZE * .14 }) : null;
    this.tacticalGoalTimer = clamp(.95 / this.skillMultiplier, .36, 1.15);
    return this.tacticalGoal;
  }

  routeGoalFor(targetIntel, hasLOS, pathfinder, profile) {
    if (!targetIntel) return this.patrolGoalFor(pathfinder, profile);
    if (hasLOS && this.tacticalGoal) return this.tacticalGoal;
    const dx = targetIntel.x - this.player.x;
    const dy = targetIntel.y - this.player.y;
    const direction = normalize(dx, dy);
    const flankDistance = TILE_SIZE * (1.0 + profile.flank * 2.2);
    const raw = {
      x:targetIntel.x - direction.y * flankDistance * this.routeFlip,
      y:targetIntel.y + direction.x * flankDistance * this.routeFlip
    };
    return pathfinder?.nearestSafeWorld(raw, { preferredClearance:TILE_SIZE * .16 })
      || { x:targetIntel.x, y:targetIntel.y };
  }

  ensurePath(pathfinder, goal, force = false, options = {}) {
    if (!pathfinder || !goal) return;
    const safeGoal = pathfinder.isWorldWalkable(goal.x, goal.y)
      ? goal
      : pathfinder.nearestSafeWorld(goal);
    if (!safeGoal) {
      this.path = [];
      this.pathGoal = null;
      return;
    }
    const goalMoved = !this.pathGoal || Math.hypot(safeGoal.x - this.pathGoal.x, safeGoal.y - this.pathGoal.y) > TILE_SIZE * .85;
    if (!force && this.path.length && this.pathRecalcTimer > 0 && !goalMoved) return;
    this.path = pathfinder.findPath({ x:this.player.x, y:this.player.y }, safeGoal, options);
    this.pathIndex = 0;
    this.pathGoal = { x:safeGoal.x, y:safeGoal.y };
    this.pathRecalcTimer = clamp(.72 / this.skillMultiplier, .22, .88);
    this.debugPath = this.path.map((point) => ({ ...point }));
  }

  followPath(pathfinder = null) {
    while (this.pathIndex < this.path.length) {
      const point = this.path[this.pathIndex];
      const distance = Math.hypot(point.x - this.player.x, point.y - this.player.y);
      if (distance <= TILE_SIZE * .40) {
        this.pathIndex += 1;
        continue;
      }
      if (pathfinder && !pathfinder.segmentClear(this.player, point)) {
        this.path = [];
        this.pathIndex = 0;
        this.pathRecalcTimer = 0;
        this.lastNavigationReason = 'route-invalid';
        return { x:0, y:0 };
      }
      return normalize(point.x - this.player.x, point.y - this.player.y);
    }
    return { x:0, y:0 };
  }

  avoidWalls(direction, pathfinder, pathOptions = {}) {
    if (!pathfinder || Math.hypot(direction.x, direction.y) < .01) return direction;
    const probe = pathfinder.steeringProbe(this.player, direction, {
      radius:this.player.radius,
      previousDirection:this.previousMoveAxis,
      dangerZones:pathOptions.dangerZones,
      dangerSegments:pathOptions.dangerSegments
    });
    this.cornerCorrectionTimer = probe.blocked ? .22 : Math.max(0, this.cornerCorrectionTimer - .016);
    return probe.direction;
  }

  recoverNavigation(pathfinder, desiredDirection) {
    this.routeFlip *= -1;
    this.path = [];
    this.pathIndex = 0;
    this.pathGoal = null;
    this.pathRecalcTimer = 0;
    this.pathOverrideTimer = .9;
    const reverse = normalize(
      -this.previousMoveAxis.x - desiredDirection.y * this.routeFlip * .8,
      -this.previousMoveAxis.y + desiredDirection.x * this.routeFlip * .8
    );
    const probe = pathfinder?.steeringProbe(this.player, reverse, {
      radius:this.player.radius,
      shortDistance:TILE_SIZE * .46,
      lookAhead:TILE_SIZE * 1.1,
      previousDirection:null
    });
    if (probe && Math.hypot(probe.direction.x, probe.direction.y) > .5) {
      const rawGoal = {
        x:this.player.x + probe.direction.x * TILE_SIZE * 1.15,
        y:this.player.y + probe.direction.y * TILE_SIZE * 1.15
      };
      this.recoveryGoal = pathfinder.nearestSafeWorld(rawGoal, { preferredClearance:TILE_SIZE * .12 });
    } else {
      this.recoveryGoal = pathfinder?.nearestSafeWorld(this.player, { preferredClearance:TILE_SIZE * .5 }) || null;
    }
    this.blockedTimer = 0;
    this.stuckTimer = 0;
    this.lastNavigationReason = 'stuck-recovery';
  }

  updateMovementProgress(dt, desiredDirection, pathfinder) {
    const moved = Math.hypot(this.player.x - this.lastX, this.player.y - this.lastY);
    const commanded = Math.hypot(this.previousMoveAxis.x, this.previousMoveAxis.y);
    const expectedFloor = Math.max(.35, TILE_SIZE * dt * 1.05);
    if (commanded > .45 && moved < expectedFloor) {
      this.blockedTimer += dt;
      this.stuckTimer += dt;
    } else {
      this.blockedTimer = Math.max(0, this.blockedTimer - dt * 3.4);
      this.stuckTimer = Math.max(0, this.stuckTimer - dt * 2.8);
    }
    this.lastX = this.player.x;
    this.lastY = this.player.y;
    if (this.blockedTimer >= .16 || this.stuckTimer >= .34) this.recoverNavigation(pathfinder, desiredDirection);
  }

  localAvoidance(direction, teammates, perceptions, profile) {
    const adjusted = { x:direction.x, y:direction.y };
    for (const mate of teammates) {
      if (!mate.health?.alive || mate === this.player) continue;
      const dx = this.player.x - mate.x;
      const dy = this.player.y - mate.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 0 && distance < TILE_SIZE * 1.65) {
        const strength = (1 - distance / (TILE_SIZE * 1.65)) * .95;
        adjusted.x += dx / distance * strength;
        adjusted.y += dy / distance * strength;
      }
    }
    for (const intel of perceptions) {
      if (!intel.visible) continue;
      const dx = this.player.x - intel.x;
      const dy = this.player.y - intel.y;
      const distance = Math.hypot(dx, dy);
      const personalSpace = TILE_SIZE * (profile.aggression > .85 ? .58 : 1.05);
      if (distance > 0 && distance < personalSpace) {
        const strength = (1 - distance / personalSpace) * (profile.aggression > .85 ? .25 : .85);
        adjusted.x += dx / distance * strength;
        adjusted.y += dy / distance * strength;
      }
    }
    return normalize(adjusted.x, adjusted.y);
  }

  shouldDash({ profile, distanceTiles, lowHealth, outnumbered, hasLOS, pathfinder }) {
    if (!pathfinder || !hasLOS) return false;
    if (this.player.dashCharges <= 0 || this.player.stamina < 0 || this.weaponManager.isReloading?.() || this.weaponManager.isSwitching?.()) return false;
    const discipline = this.discipline();
    const closing = distanceTiles > profile.ideal * 1.28 && profile.dashClose > .2;
    const escaping = distanceTiles < profile.min * 1.15 || lowHealth || outnumbered;
    const intent = closing ? profile.dashClose : escaping ? profile.dashEscape : 0;
    if (intent < .2 || (this.seed * .37 + this.strafeClock * .17) % 1 > intent * (.62 + discipline * .35)) return false;
    return pathfinder.canDash(this.player, this.moveAxis, DASH_DISTANCE_TILES * TILE_SIZE, this.player.radius);
  }

  update(dt, { camera, enemies = [], teammates = [], map, targetCounts = new Map(), pathfinder = null }) {
    const liveDifficulty = savedDifficulty();
    if (liveDifficulty !== this.difficultyName) this.setDifficulty(liveDifficulty);
    this.resetTransient();
    pathfinder?.syncMap?.();
    const liveMapRevision = Number(pathfinder?.mapRevision ?? map?.revision ?? 0);
    if (this.pathMapRevision !== liveMapRevision) this.resetNavigation(liveMapRevision);
    this.camera = camera;
    const skill = this.skillMultiplier;
    const discipline = this.discipline();
    this.perceptionClock += dt;
    this.perceptionScanTimer -= dt;
    this.shotTimer = Math.max(0, this.shotTimer - dt);
    this.dashThinkTimer -= dt;
    this.targetDecisionTimer -= dt;
    this.pathRecalcTimer -= dt;
    this.pathOverrideTimer = Math.max(0, this.pathOverrideTimer - dt);
    this.tacticalGoalTimer = Math.max(0, this.tacticalGoalTimer - dt);
    this.strafeClock += dt;

    if (!this.player.health.alive) {
      this.moveAxis = { x:0, y:0 };
      this.previousMoveAxis = { x:0, y:0 };
      this.sprint = false;
      this.ads = false;
      this.target = null;
      this.targetIntel = null;
      this.targetLockTimer = 0;
      this.knownEnemies.clear();
      this.perceptionScanTimer = 0;
      this.resetNavigation(liveMapRevision);
      this.lastX = this.player.x;
      this.lastY = this.player.y;
      return;
    }

    let weapon = this.weaponManager.currentWeapon?.();
    let profile = tacticForWeapon(weapon);
    let perceptions;
    if (this.perceptionScanTimer <= 0) {
      perceptions = this.observeEnemies(enemies, map);
      this.perceptionScanTimer = clamp(.18 / skill, .07, .23);
    } else {
      perceptions = [...this.knownEnemies.values()];
    }
    const currentIntel = this.target ? this.knownEnemies.get(this.target.id) : null;
    if (!currentIntel || this.targetDecisionTimer <= 0) {
      const next = this.chooseTarget(perceptions, targetCounts, profile);
      if (next?.actor !== this.target) {
        this.targetLockTimer = 0;
        this.path = [];
        this.pathGoal = null;
        this.tacticalGoal = null;
      }
      this.target = next?.actor || null;
      this.targetIntel = next || null;
      this.targetDecisionTimer = clamp(.42 / skill, .11, .55);
    } else {
      this.targetIntel = currentIntel;
    }

    if (!this.targetIntel) {
      const patrol = this.patrolGoalFor(pathfinder, profile);
      this.ensurePath(pathfinder, patrol, false, {
        preferredClearance:TILE_SIZE * (.35 + profile.cover * .2),
        clearanceWeight:.25 + profile.cover * .18
      });
      let desired = this.followPath(pathfinder);
      this.updateMovementProgress(dt, desired, pathfinder);
      desired = this.localAvoidance(desired, teammates, perceptions, profile);
      desired = this.avoidWalls(desired, pathfinder);
      this.moveAxis = normalize(desired.x, desired.y);
      this.previousMoveAxis = { ...this.moveAxis };
      this.sprint = Math.hypot(this.moveAxis.x, this.moveAxis.y) > .5 && this.player.stamina > 35;
      this.ads = false;
      return;
    }

    this.targetLockTimer += dt;
    const aimTarget = this.targetIntel;
    const dx = aimTarget.x - this.player.x;
    const dy = aimTarget.y - this.player.y;
    const distance = Math.hypot(dx, dy);
    const distanceTiles = distance / TILE_SIZE;
    const toward = normalize(dx, dy);
    const hasLOS = this.targetIntel.visible && this.hasLOS(this.target, map);

    this.maybeSwitch(distanceTiles, hasLOS);
    weapon = this.weaponManager.currentWeapon?.();
    profile = tacticForWeapon(weapon);
    const ammo = this.weaponManager.currentAmmo?.();

    // Difficulty has a modest aim effect, while its larger effects are reaction,
    // replanning cadence and tactical-position adherence.
    const aimSkill = .90 + discipline * .22;
    const baseError = Math.max(3.5, jitterBase(weapon) * BOT_AIM_ERROR_SCALE / aimSkill);
    const targetMotion = hasLOS ? (this.target.speedTilesPerSecond?.() || 0) : 0;
    const motionError = Math.min(10, targetMotion * 1.7) * BOT_TARGET_MOTION_ERROR_SCALE / aimSkill;
    const jitter = baseError + motionError;
    const desiredAim = {
      x:aimTarget.x + Math.cos(this.strafeClock * 1.83 + this.seed) * jitter,
      y:aimTarget.y + Math.sin(this.strafeClock * 1.39 + this.seed * .7) * jitter
    };
    const aimBlend = 1 - Math.exp(-(4.6 + 3.5 * skill) * dt);
    this.aimWorld.x += (desiredAim.x - this.aimWorld.x) * aimBlend;
    this.aimWorld.y += (desiredAim.y - this.aimWorld.y) * aimBlend;

    const ownHealth = healthFraction(this.player);
    const recentlyHit = Number(this.player.health.timeSinceDamage ?? 99) < 4.5;
    const lowHealth = ownHealth <= .38 || (ownHealth <= .52 && recentlyHit);
    const nearbyEnemies = perceptions.filter((intel) => intel.confidence > .35
      && Math.hypot(intel.x - this.player.x, intel.y - this.player.y) <= TILE_SIZE * 6.5).length;
    const nearbyMates = teammates.filter((mate) => mate.health?.alive
      && Math.hypot(mate.x - this.player.x, mate.y - this.player.y) <= TILE_SIZE * 6.5).length;
    const outnumbered = nearbyEnemies > nearbyMates + 1;
    const pathOptions = this.pathOptions(perceptions, this.targetIntel, profile, lowHealth || outnumbered);
    const strafeSign = (this.seed % 2 === 0 ? 1 : -1)
      * (Math.sin(this.strafeClock * (.58 + .12 * skill)) >= 0 ? 1 : -1);
    let desiredMove = { x:0, y:0 };

    this.tacticalPosition(this.targetIntel, pathfinder, perceptions, teammates, profile, this.tacticalGoalTimer <= 0);
    if (this.recoveryGoal && Math.hypot(this.recoveryGoal.x - this.player.x, this.recoveryGoal.y - this.player.y) <= TILE_SIZE * .45) {
      this.recoveryGoal = null;
      this.pathOverrideTimer = 0;
    }

    const mustReload = weapon?.magazineSize > 0 && ammo && ammo.magazine <= 0 && ammo.reserve > 0;
    const needsCover = lowHealth || outnumbered || (mustReload && hasLOS);
    if (this.recoveryGoal) {
      this.ensurePath(pathfinder, this.recoveryGoal, this.pathRecalcTimer <= 0, pathOptions);
      desiredMove = this.followPath(pathfinder);
    } else if (needsCover) {
      const retreat = {
        x:this.player.x - toward.x * TILE_SIZE * (2.1 + profile.cover * 1.7) - toward.y * strafeSign * TILE_SIZE,
        y:this.player.y - toward.y * TILE_SIZE * (2.1 + profile.cover * 1.7) + toward.x * strafeSign * TILE_SIZE
      };
      const retreatGoal = pathfinder?.nearestSafeWorld(retreat, { preferredClearance:TILE_SIZE * .18 });
      this.ensurePath(pathfinder, retreatGoal, this.pathRecalcTimer <= 0, pathOptions);
      desiredMove = this.followPath(pathfinder);
      if (Math.hypot(desiredMove.x, desiredMove.y) < .01) {
        desiredMove = { x:-toward.x - toward.y * strafeSign * .45, y:-toward.y + toward.x * strafeSign * .45 };
      }
    } else if (!hasLOS || this.pathOverrideTimer > 0) {
      const routeGoal = this.routeGoalFor(this.targetIntel, hasLOS, pathfinder, profile);
      this.ensurePath(pathfinder, routeGoal, this.pathOverrideTimer > 0 && this.pathRecalcTimer <= 0, pathOptions);
      desiredMove = this.followPath(pathfinder);
      if (Math.hypot(desiredMove.x, desiredMove.y) < .01) desiredMove = toward;
    } else {
      const tacticalDistance = this.tacticalGoal
        ? Math.hypot(this.tacticalGoal.x - this.player.x, this.tacticalGoal.y - this.player.y) / TILE_SIZE
        : 0;
      if (tacticalDistance > 1.25 && (profile.hold > .45 || profile.flank > .72)) {
        this.ensurePath(pathfinder, this.tacticalGoal, false, pathOptions);
        desiredMove = this.followPath(pathfinder);
      }
      if (Math.hypot(desiredMove.x, desiredMove.y) < .01) {
        if (distanceTiles > profile.ideal * (1.12 + (1 - profile.aggression) * .08)) {
          desiredMove = { x:toward.x * (.55 + profile.aggression * .55), y:toward.y * (.55 + profile.aggression * .55) };
          desiredMove.x += -toward.y * strafeSign * profile.flank * .28;
          desiredMove.y += toward.x * strafeSign * profile.flank * .28;
        } else if (distanceTiles < profile.min) {
          desiredMove = { x:-toward.x, y:-toward.y };
        } else {
          const radial = clamp((distanceTiles - profile.ideal) / Math.max(1, profile.ideal), -.32, .32);
          desiredMove = {
            x:-toward.y * strafeSign * (.55 + profile.flank * .38) + toward.x * radial,
            y:toward.x * strafeSign * (.55 + profile.flank * .38) + toward.y * radial
          };
        }
      }
    }

    this.updateMovementProgress(dt, desiredMove, pathfinder);
    desiredMove = this.localAvoidance(normalize(desiredMove.x, desiredMove.y), teammates, perceptions, profile);
    const steering = pathfinder?.steeringProbe(this.player, desiredMove, {
      radius:this.player.radius,
      previousDirection:this.previousMoveAxis,
      dangerZones:pathOptions.dangerZones,
      dangerSegments:pathOptions.dangerSegments,
      lookAhead:TILE_SIZE * (1.15 + discipline * .42)
    });
    if (steering) {
      desiredMove = steering.direction;
      if (steering.blocked && Math.hypot(desiredMove.x, desiredMove.y) < .1) {
        this.pathRecalcTimer = 0;
        this.pathOverrideTimer = Math.max(this.pathOverrideTimer, .35);
      }
    }
    this.moveAxis = normalize(desiredMove.x, desiredMove.y);

    const actualAngle = Math.atan2(this.target.y - this.player.y, this.target.x - this.player.x);
    const aimError = Math.abs(angleDiff(this.player.aimAngle, actualAngle));
    const reactionReady = this.targetLockTimer >= clamp(.36 - discipline * .24, .12, .38);
    const tolerance = clamp(.15 - discipline * .035, .105, .16);
    const teammateInBlast = weapon?.id === 'launcher' && teammates.some((mate) => mate.health?.alive
      && Math.hypot(mate.x - this.target.x, mate.y - this.target.y) < TILE_SIZE * (weapon.blastRadiusTiles || 2.5));
    const launcherMuzzleSafe = weapon?.id !== 'launcher' || (
      distanceTiles >= profile.min
      && (pathfinder?.wallClearanceAt(this.player.x, this.player.y, this.player.radius) ?? TILE_SIZE) > TILE_SIZE * .12
      && !teammateInBlast
    );
    const wantsFire = hasLOS
      && distanceTiles <= practicalRange(weapon)
      && reactionReady
      && aimError <= tolerance
      && launcherMuzzleSafe
      && !mustReload;

    // Heavy/precision weapons gain accuracy by settling rather than by receiving
    // hidden spread bonuses. Beginners apply this discipline less consistently.
    if (wantsFire && profile.hold > .45) {
      const settle = 1 - profile.hold * (.48 + discipline * .34);
      this.moveAxis.x *= settle;
      this.moveAxis.y *= settle;
    }

    this.sprint = Math.hypot(this.moveAxis.x, this.moveAxis.y) > .55
      && ((!hasLOS && distanceTiles > profile.ideal) || needsCover)
      && this.player.stamina > 30
      && !mustReload;
    this.ads = hasLOS && weapon?.canADS !== false
      && distanceTiles > (weapon?.id === 'shotgun' ? 2.15 : profile.min * .55)
      && !(profile.hold > .75 && Math.hypot(this.moveAxis.x, this.moveAxis.y) > .7);

    if (weapon?.magazineSize > 0 && ammo && ammo.reserve > 0 && !this.weaponManager.isReloading?.()) {
      const lowAmmoThreshold = Math.max(1, Math.floor(weapon.magazineSize * (.10 + .08 * discipline)));
      const safeReload = !hasLOS || distanceTiles > profile.ideal * 1.35 || needsCover || nearbyMates >= nearbyEnemies;
      if (ammo.magazine === 0 || (ammo.magazine <= lowAmmoThreshold && safeReload)) this.reloadPulse = true;
    }

    if (wantsFire && !this.reloadPulse) {
      if (weapon?.fireMode === 'auto') this.fire = true;
      else if (this.shotTimer <= 0) {
        this.firePulse = true;
        const base = weapon?.id === 'pistol' ? .22 : Math.max(.16, weapon?.fireInterval || .24);
        this.shotTimer = clamp(base * (1.05 - discipline * .12), .09, base * 1.05);
      }
    }

    if (this.dashThinkTimer <= 0) {
      this.dashThinkTimer = clamp((2.8 + ((this.seed * .37 + this.strafeClock * .13) % 1.5)) / skill, 1.05, 4.3);
      if (this.shouldDash({ profile, distanceTiles, lowHealth, outnumbered, hasLOS, pathfinder })) this.dashPulse = true;
    }
    this.previousMoveAxis = { ...this.moveAxis };
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
  aimSensitivity() { return clamp(this.skillMultiplier, .65, 2.1); }

  pointerPosition() {
    if (!this.camera) return { x:0, y:0, inside:true };
    return {
      x:(this.aimWorld.x - this.camera.x) * this.camera.zoom + this.camera.width / 2,
      y:(this.aimWorld.y - this.camera.y) * this.camera.zoom + this.camera.height / 2,
      inside:true
    };
  }

  wasPressed() { return false; }
  endFrame() { this.resetTransient(); }
}
