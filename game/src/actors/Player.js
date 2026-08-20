import {
  DASH_CHARGES_MAX,
  DASH_COOLDOWN,
  DASH_DISTANCE_TILES,
  DASH_INVULNERABILITY,
  DASH_SPEED_TILES,
  DASH_STAMINA_COST,
  DASH_SWEEP_STEP_PIXELS,
  DEFAULT_ZOOM,
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
import { HealthState } from '../combat/HealthState.js';
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
  return normalizeAngle(current + delta * (1 - Math.exp(-rate * dt)));
}

function approach(current, target, rate, dt) {
  return current + (target - current) * (1 - Math.exp(-rate * dt));
}

export class Player {
  constructor(spawn, team = 'blue', id = 'local-player') {
    this.id = id;
    this.x = spawn.x;
    this.y = spawn.y;
    this.radius = PLAYER_RADIUS_TILES * TILE_SIZE;
    this.team = team;
    this.health = new HealthState();
    this.weaponManager = null;
    this.controlsCamera = true;
    this.isLocal = false;

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

  setWeaponManager(manager) {
    this.weaponManager = manager;
  }

  update(dt, input, map, camera, dynamicBlockers = []) {
    this.health.update(dt);

    const adsProgress = this.health.alive ? (this.weaponManager?.adsProgress ?? 0) : 0;
    if (this.controlsCamera) {
      camera.zoom = approach(camera.zoom, DEFAULT_ZOOM + adsProgress * 0.10, 12, dt);
      camera.clamp();
    }

    this.dashStartedThisFrame = false;
    this.dashEndedThisFrame = false;
    this.dashDeniedTimer = Math.max(0, this.dashDeniedTimer - dt);
    this.invulnerabilityTimer = Math.max(0, this.invulnerabilityTimer - dt);
    if (!this.dashing) this.dashCooldown = Math.max(0, this.dashCooldown - dt);

    if (!this.health.alive) {
      this.sprinting = false;
      this.dashing = false;
      this.state = 'dead';
      this.velocityX = 0;
      this.velocityY = 0;
      this.updateVisualMotion(dt);
      this.updateTrail(dt);
      return;
    }

    this.updateAim(input, camera);
    const axis = input.axis();

    if (input.dashPressed() && !this.dashing) {
      const hasMovementInput = Math.abs(axis.x) + Math.abs(axis.y) > 0.001;
      const direction = hasMovementInput ? Math.atan2(axis.y, axis.x) : this.aimAngle;
      this.tryStartDash(direction);
    }

    const blockers = dynamicBlockers.length ? [...map.blockers, ...dynamicBlockers] : map.blockers;
    if (this.dashing) this.updateDash(dt, map, blockers);
    else this.updateLocomotion(dt, input, map, axis, blockers);

    this.updateVisualMotion(dt);
    this.updateTrail(dt);
  }

  updateAim(input, camera) {
    const pointer = input.pointerPosition();
    const world = camera.screenToWorld(pointer.x, pointer.y);
    const dx = world.x - this.x;
    const dy = world.y - this.y;
    if (Math.abs(dx) + Math.abs(dy) > 0.001) this.aimAngle = Math.atan2(dy, dx);
  }

  updateLocomotion(dt, input, map, axis = input.axis(), blockers = map.blockers) {
    const moving = axis.x !== 0 || axis.y !== 0;
    const wantsSprint = input.sprintHeld() && !input.adsHeld() && moving && this.stamina > 0;
    this.sprinting = wantsSprint;

    if (this.sprinting) {
      this.stamina = Math.max(0, this.stamina - SPRINT_DRAIN_PER_SECOND * dt);
      this.staminaRegenDelay = SPRINT_REGEN_DELAY;
      if (this.stamina <= 0) this.sprinting = false;
    } else {
      this.updateStaminaRegen(dt);
    }

    const equipmentMultiplier = this.weaponManager?.movementMultiplier(input) ?? 1;
    const speedTiles = PLAYER_SPEED_TILES * (this.sprinting ? SPRINT_SPEED_MULTIPLIER : 1) * equipmentMultiplier;
    const speed = speedTiles * TILE_SIZE;
    const beforeX = this.x;
    const beforeY = this.y;

    moveCircle(this, axis.x * speed * dt, axis.y * speed * dt, blockers, { w: WORLD_WIDTH, h: WORLD_HEIGHT });

    this.velocityX = dt > 0 ? (this.x - beforeX) / dt : 0;
    this.velocityY = dt > 0 ? (this.y - beforeY) / dt : 0;
    const actuallyMoving = Math.hypot(this.velocityX, this.velocityY) > 0.01;
    if (actuallyMoving) this.moveAngle = Math.atan2(this.velocityY, this.velocityX);
    this.state = actuallyMoving ? (this.sprinting ? 'sprint' : 'walk') : 'idle';
  }

  updateStaminaRegen(dt) {
    if (this.staminaRegenDelay > 0) this.staminaRegenDelay = Math.max(0, this.staminaRegenDelay - dt);
    else this.stamina = Math.min(SPRINT_STAMINA_MAX, this.stamina + SPRINT_REGEN_PER_SECOND * dt);
  }

  tryStartDash(direction = this.aimAngle) {
    if (!this.health.alive || this.dashCooldown > 0 || this.dashCharges <= 0 || this.stamina < DASH_STAMINA_COST) {
      this.dashDeniedTimer = 0.18;
      return false;
    }

    this.weaponManager?.cancelReload();
    this.dashing = true;
    this.sprinting = false;
    this.state = 'dash';
    this.dashDirection = direction;
    this.dashDistanceRemaining = DASH_DISTANCE_TILES * TILE_SIZE;
    this.dashCharges -= 1;
    this.stamina = Math.max(0, this.stamina - DASH_STAMINA_COST);
    this.staminaRegenDelay = SPRINT_REGEN_DELAY;
    this.invulnerabilityTimer = DASH_INVULNERABILITY;
    this.dashStartedThisFrame = true;
    this.dashGhostTimer = 0;
    return true;
  }

  updateDash(dt, map, blockers = map.blockers) {
    const desired = Math.min(this.dashDistanceRemaining, DASH_SPEED_TILES * TILE_SIZE * dt);
    const dx = Math.cos(this.dashDirection) * desired;
    const dy = Math.sin(this.dashDirection) * desired;
    const beforeX = this.x;
    const beforeY = this.y;
    const result = moveCircleSwept(this, dx, dy, blockers, { w: WORLD_WIDTH, h: WORLD_HEIGHT }, DASH_SWEEP_STEP_PIXELS);

    this.velocityX = dt > 0 ? (this.x - beforeX) / dt : 0;
    this.velocityY = dt > 0 ? (this.y - beforeY) / dt : 0;
    this.moveAngle = this.dashDirection;
    this.dashDistanceRemaining = Math.max(0, this.dashDistanceRemaining - result.distance);

    if (result.blocked || result.distance + 0.01 < desired || this.dashDistanceRemaining <= 0.5) this.endDash();
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
    const alive = this.health.alive;
    const movingTarget = alive && speedTiles > 0.05 ? 1 : 0;
    const sprintTarget = alive && this.sprinting ? 1 : 0;
    const dashTarget = alive && this.dashing ? 1 : 0;

    this.motionBlend = approach(this.motionBlend, movingTarget, movingTarget ? 15 : 10, dt);
    this.sprintBlend = approach(this.sprintBlend, sprintTarget, 11, dt);
    this.dashBlend = approach(this.dashBlend, dashTarget, dashTarget ? 24 : 13, dt);
    this.visualAimAngle = approachAngle(this.visualAimAngle, this.aimAngle, 22, dt);

    const lowerBodyTarget = speedTiles > 0.08 ? this.moveAngle : this.aimAngle;
    this.visualMoveAngle = approachAngle(this.visualMoveAngle, lowerBodyTarget, speedTiles > 0.08 ? 13 : 5, dt);

    let leanTarget = 0;
    if (this.dashing) leanTarget = 1;
    else if (this.sprinting) leanTarget = 0.55;
    else if (speedTiles > 0.08) leanTarget = 0.16;
    this.bodyLean = approach(this.bodyLean, leanTarget, 12, dt);

    const rate = this.dashing ? 2.1 : this.sprinting ? SPRINT_CYCLE_RATE : speedTiles > 0.08 ? WALK_CYCLE_RATE : IDLE_CYCLE_RATE;
    this.animationTime += dt;
    this.animationPhase = (this.animationPhase + dt * rate) % 1;
  }

  updateTrail(dt) {
    for (const ghost of this.trail) ghost.life -= dt;
    this.trail = this.trail.filter((ghost) => ghost.life > 0);
    if (!this.health.alive) return;

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

  onDeath() {
    this.sprinting = false;
    this.dashing = false;
    this.dashDistanceRemaining = 0;
    this.invulnerabilityTimer = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.state = 'dead';
    this.trail.length = 0;
    this.weaponManager?.cancelReload();
  }

  respawn(spawn) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.stamina = SPRINT_STAMINA_MAX;
    this.staminaRegenDelay = 0;
    this.sprinting = false;
    this.dashing = false;
    this.dashDistanceRemaining = 0;
    this.dashCooldown = 0;
    this.invulnerabilityTimer = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.state = 'idle';
    this.trail.length = 0;
    this.health.respawn();
    this.weaponManager?.resetForLife();
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
    this.velocityX = 0;
    this.velocityY = 0;
    this.trail.length = 0;
    this.health.resetForRound();
    this.weaponManager?.resetForLife();
  }

  staminaPercent() { return this.stamina / SPRINT_STAMINA_MAX; }
  speedTilesPerSecond() { return Math.hypot(this.velocityX, this.velocityY) / TILE_SIZE; }
  dashPercentRemaining() { return this.dashDistanceRemaining / (DASH_DISTANCE_TILES * TILE_SIZE); }
  isInvulnerable() { return this.health.isSpawnProtected() || this.invulnerabilityTimer > 0; }
  canFire() { return this.health.alive && !this.dashing; }
  canSwitchWeapon() { return this.health.alive && !this.dashing; }
  notifyFired() { this.health.endSpawnProtection(); }
}
