import {
  DASH_CHARGES_MAX,
  DASH_COOLDOWN,
  DASH_DISTANCE_TILES,
  DASH_INVULNERABILITY,
  DASH_SPEED_TILES,
  DASH_STAMINA_COST,
  DASH_SWEEP_STEP_PIXELS,
  PLAYER_RADIUS_TILES,
  PLAYER_SPEED_TILES,
  SPRINT_DRAIN_PER_SECOND,
  SPRINT_REGEN_DELAY,
  SPRINT_REGEN_PER_SECOND,
  SPRINT_SPEED_MULTIPLIER,
  SPRINT_STAMINA_MAX,
  TILE_SIZE,
  WORLD_HEIGHT,
  WORLD_WIDTH
} from '../engine/constants.js';
import { moveCircle, moveCircleSwept } from '../world/Collision.js';

const WALK_CYCLE_RATE = 3.2;
const SPRINT_CYCLE_RATE = 4.5;
const IDLE_CYCLE_RATE = 0.75;
const TRAIL_INTERVAL = 0.055;
const TRAIL_LIFETIME = 0.22;
const DASH_GHOST_INTERVAL = 0.026;
const DASH_GHOST_LIFETIME = 0.18;

function normalizeAngle(angle) {
  let value = angle;
  while (value > Math.PI) value -= Math.PI * 2;
  while (value < -Math.PI) value += Math.PI * 2;
  return value;
}

function approachAngle(current, target, rate, dt) {
  const delta = normalizeAngle(target - current);
  const blend = 1 - Math.exp(-rate * dt);
  return normalizeAngle(current + delta * blend);
}

function approach(current, target, rate, dt) {
  return current + (target - current) * (1 - Math.exp(-rate * dt));
}

export class Player {
  constructor(spawn, team = 'blue') {
    this.x = spawn.x;
    this.y = spawn.y;
    this.radius = PLAYER_RADIUS_TILES * TILE_SIZE;
    this.team = team;

    this.aimAngle = 0;
    this.moveAngle = 0;
    this.visualAimAngle = 0;
    this.visualMoveAngle = 0;
    this.state = 'idle';
    this.animationTime = 0;
    this.animationPhase = 0;
    this.motionBlend = 0;
    this.sprintBlend = 0;
    this.dashBlend = 0;
    this.bodyLean = 0;

    this.stamina = SPRINT_STAMINA_MAX;
    this.sprinting = false;
    this.staminaRegenDelay = 0;

    this.dashCharges = DASH_CHARGES_MAX;
    this.dashing = false;
    this.dashDirection = 0;
    this.dashDistanceRemaining = 0;
    this.dashCooldown = 0;
    this.invulnerabilityTimer = 0;
    this.dashDeniedTimer = 0;
    this.dashStartedThisFrame = false;
    this.dashEndedThisFrame = false;

    this.velocityX = 0;
    this.velocityY = 0;
    this.trailTimer = 0;
    this.dashGhostTimer = 0;
    this.trail = [];
  }

  update(dt, input, map, camera) {
    this.dashStartedThisFrame = false;
    this.dashEndedThisFrame = false;
    this.dashDeniedTimer = Math.max(0, this.dashDeniedTimer - dt);
    this.invulnerabilityTimer = Math.max(0, this.invulnerabilityTimer - dt);
    if (!this.dashing) this.dashCooldown = Math.max(0, this.dashCooldown - dt);

    this.updateAim(input, camera);

    if (input.dashPressed() && !this.dashing) {
      this.tryStartDash();
    }

    if (this.dashing) {
      this.updateDash(dt, map);
    } else {
      this.updateLocomotion(dt, input, map);
    }

    this.updateVisualMotion(dt);
    this.updateTrail(dt);
  }

  updateAim(input, camera) {
    const pointer = input.pointerPosition();
    const worldPointer = camera.screenToWorld(pointer.x, pointer.y);
    const dx = worldPointer.x - this.x;
    const dy = worldPointer.y - this.y;
    if (Math.abs(dx) + Math.abs(dy) > 0.001) {
      this.aimAngle = Math.atan2(dy, dx);
    }
  }

  updateLocomotion(dt, input, map) {
    const axis = input.axis();
    const moving = axis.x !== 0 || axis.y !== 0;
    const wantsSprint = input.sprintHeld() && moving && this.stamina > 0;

    this.sprinting = wantsSprint;
    if (this.sprinting) {
      this.stamina = Math.max(0, this.stamina - SPRINT_DRAIN_PER_SECOND * dt);
      this.staminaRegenDelay = SPRINT_REGEN_DELAY;
      if (this.stamina <= 0) this.sprinting = false;
    } else {
      this.updateStaminaRegen(dt);
    }

    const speedTiles = PLAYER_SPEED_TILES * (this.sprinting ? SPRINT_SPEED_MULTIPLIER : 1);
    const speed = speedTiles * TILE_SIZE;
    const dx = axis.x * speed * dt;
    const dy = axis.y * speed * dt;

    const beforeX = this.x;
    const beforeY = this.y;
    moveCircle(this, dx, dy, map.blockers, { w: WORLD_WIDTH, h: WORLD_HEIGHT });
    this.velocityX = dt > 0 ? (this.x - beforeX) / dt : 0;
    this.velocityY = dt > 0 ? (this.y - beforeY) / dt : 0;

    const actuallyMoving = Math.hypot(this.velocityX, this.velocityY) > 0.01;
    if (actuallyMoving) {
      this.moveAngle = Math.atan2(this.velocityY, this.velocityX);
    }

    this.state = actuallyMoving ? (this.sprinting ? 'sprint' : 'walk') : 'idle';
  }

  updateStaminaRegen(dt) {
    if (this.staminaRegenDelay > 0) {
      this.staminaRegenDelay = Math.max(0, this.staminaRegenDelay - dt);
    } else {
      this.stamina = Math.min(SPRINT_STAMINA_MAX, this.stamina + SPRINT_REGEN_PER_SECOND * dt);
    }
  }

  tryStartDash() {
    if (this.dashCooldown > 0 || this.dashCharges <= 0 || this.stamina < DASH_STAMINA_COST) {
      this.dashDeniedTimer = 0.18;
      return false;
    }

    this.dashing = true;
    this.sprinting = false;
    this.state = 'dash';
    this.dashDirection = this.aimAngle;
    this.dashDistanceRemaining = DASH_DISTANCE_TILES * TILE_SIZE;
    this.dashCharges -= 1;
    this.stamina = Math.max(0, this.stamina - DASH_STAMINA_COST);
    this.staminaRegenDelay = SPRINT_REGEN_DELAY;
    this.invulnerabilityTimer = DASH_INVULNERABILITY;
    this.dashStartedThisFrame = true;
    this.dashGhostTimer = 0;
    return true;
  }

  updateDash(dt, map) {
    const desiredDistance = Math.min(this.dashDistanceRemaining, DASH_SPEED_TILES * TILE_SIZE * dt);
    const dx = Math.cos(this.dashDirection) * desiredDistance;
    const dy = Math.sin(this.dashDirection) * desiredDistance;
    const beforeX = this.x;
    const beforeY = this.y;

    const result = moveCircleSwept(
      this,
      dx,
      dy,
      map.blockers,
      { w: WORLD_WIDTH, h: WORLD_HEIGHT },
      DASH_SWEEP_STEP_PIXELS
    );

    this.velocityX = dt > 0 ? (this.x - beforeX) / dt : 0;
    this.velocityY = dt > 0 ? (this.y - beforeY) / dt : 0;
    this.moveAngle = this.dashDirection;
    this.dashDistanceRemaining = Math.max(0, this.dashDistanceRemaining - result.distance);

    if (result.blocked || result.distance + 0.01 < desiredDistance || this.dashDistanceRemaining <= 0.5) {
      this.endDash();
    }
  }

  endDash() {
    if (!this.dashing) return;
    this.dashing = false;
    this.dashDistanceRemaining = 0;
    this.dashCooldown = DASH_COOLDOWN;
    this.dashEndedThisFrame = true;
    this.state = 'idle';
  }

  updateVisualMotion(dt) {
    const speedTiles = this.speedTilesPerSecond();
    const movingTarget = speedTiles > 0.05 ? 1 : 0;
    const sprintTarget = this.sprinting ? 1 : 0;
    const dashTarget = this.dashing ? 1 : 0;

    this.motionBlend = approach(this.motionBlend, movingTarget, movingTarget ? 15 : 10, dt);
    this.sprintBlend = approach(this.sprintBlend, sprintTarget, 11, dt);
    this.dashBlend = approach(this.dashBlend, dashTarget, dashTarget ? 24 : 13, dt);

    this.visualAimAngle = approachAngle(this.visualAimAngle, this.aimAngle, 18, dt);
    const lowerBodyTarget = speedTiles > 0.08 ? this.moveAngle : this.aimAngle;
    this.visualMoveAngle = approachAngle(this.visualMoveAngle, lowerBodyTarget, speedTiles > 0.08 ? 13 : 5, dt);

    const leanTarget = this.dashing ? 1 : this.sprinting ? 0.55 : speedTiles > 0.08 ? 0.16 : 0;
    this.bodyLean = approach(this.bodyLean, leanTarget, 12, dt);

    const rate = this.dashing
      ? 2.1
      : this.sprinting
        ? SPRINT_CYCLE_RATE
        : speedTiles > 0.08
          ? WALK_CYCLE_RATE
          : IDLE_CYCLE_RATE;

    this.animationTime += dt;
    this.animationPhase = (this.animationPhase + dt * rate) % 1;
  }

  updateTrail(dt) {
    for (const ghost of this.trail) ghost.life -= dt;
    this.trail = this.trail.filter((ghost) => ghost.life > 0);

    if (this.dashing) {
      this.dashGhostTimer -= dt;
      if (this.dashGhostTimer <= 0) {
        this.dashGhostTimer = DASH_GHOST_INTERVAL;
        this.pushGhost('dash', DASH_GHOST_LIFETIME);
      }
      return;
    }

    if (!this.sprinting || this.speedTilesPerSecond() < 0.05) {
      this.trailTimer = 0;
      return;
    }

    this.trailTimer -= dt;
    if (this.trailTimer <= 0) {
      this.trailTimer = TRAIL_INTERVAL;
      this.pushGhost('sprint', TRAIL_LIFETIME);
    }
  }

  pushGhost(type, lifetime) {
    this.trail.push({
      type,
      x: this.x,
      y: this.y,
      aimAngle: this.visualAimAngle,
      moveAngle: this.visualMoveAngle,
      phase: this.animationPhase,
      lean: this.bodyLean,
      life: lifetime,
      maxLife: lifetime
    });
    if (this.trail.length > 9) this.trail.shift();
  }

  resetForRound(spawn = null) {
    if (spawn) {
      this.x = spawn.x;
      this.y = spawn.y;
    }
    this.stamina = SPRINT_STAMINA_MAX;
    this.staminaRegenDelay = 0;
    this.dashCharges = DASH_CHARGES_MAX;
    this.dashing = false;
    this.dashDistanceRemaining = 0;
    this.dashCooldown = 0;
    this.invulnerabilityTimer = 0;
    this.trail.length = 0;
  }

  staminaPercent() {
    return this.stamina / SPRINT_STAMINA_MAX;
  }

  speedTilesPerSecond() {
    return Math.hypot(this.velocityX, this.velocityY) / TILE_SIZE;
  }

  dashPercentRemaining() {
    return this.dashDistanceRemaining / (DASH_DISTANCE_TILES * TILE_SIZE);
  }

  isInvulnerable() {
    return this.invulnerabilityTimer > 0;
  }

  canFire() {
    return !this.dashing;
  }

  canSwitchWeapon() {
    return !this.dashing;
  }
}
