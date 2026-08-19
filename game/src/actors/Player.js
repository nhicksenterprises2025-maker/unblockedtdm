import {
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
import { moveCircle } from '../world/Collision.js';

const WALK_CYCLE_RATE = 5.4;
const SPRINT_CYCLE_RATE = 8.2;
const TRAIL_INTERVAL = 0.055;
const TRAIL_LIFETIME = 0.22;

export class Player {
  constructor(spawn, team = 'blue') {
    this.x = spawn.x;
    this.y = spawn.y;
    this.radius = PLAYER_RADIUS_TILES * TILE_SIZE;
    this.team = team;

    this.aimAngle = 0;
    this.moveAngle = 0;
    this.state = 'idle';
    this.animationTime = 0;
    this.animationPhase = 0;

    this.stamina = SPRINT_STAMINA_MAX;
    this.sprinting = false;
    this.staminaRegenDelay = 0;

    this.velocityX = 0;
    this.velocityY = 0;
    this.trailTimer = 0;
    this.trail = [];
  }

  update(dt, input, map, camera) {
    this.updateAim(input, camera);

    const axis = input.axis();
    const moving = axis.x !== 0 || axis.y !== 0;
    const wantsSprint = input.sprintHeld() && moving && this.stamina > 0;

    this.sprinting = wantsSprint;
    if (this.sprinting) {
      this.stamina = Math.max(0, this.stamina - SPRINT_DRAIN_PER_SECOND * dt);
      this.staminaRegenDelay = SPRINT_REGEN_DELAY;
      if (this.stamina <= 0) this.sprinting = false;
    } else if (this.staminaRegenDelay > 0) {
      this.staminaRegenDelay = Math.max(0, this.staminaRegenDelay - dt);
    } else {
      this.stamina = Math.min(SPRINT_STAMINA_MAX, this.stamina + SPRINT_REGEN_PER_SECOND * dt);
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

    const actuallyMoving = Math.abs(this.velocityX) > 0.01 || Math.abs(this.velocityY) > 0.01;
    if (actuallyMoving) {
      this.moveAngle = Math.atan2(this.velocityY, this.velocityX);
    }

    this.state = actuallyMoving ? (this.sprinting ? 'sprint' : 'walk') : 'idle';
    const cycleRate = this.state === 'sprint' ? SPRINT_CYCLE_RATE : this.state === 'walk' ? WALK_CYCLE_RATE : 1.4;
    this.animationTime += dt;
    this.animationPhase = (this.animationPhase + dt * cycleRate) % 1;

    this.updateSprintTrail(dt, actuallyMoving);
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

  updateSprintTrail(dt, moving) {
    for (const ghost of this.trail) ghost.life -= dt;
    this.trail = this.trail.filter((ghost) => ghost.life > 0);

    if (!this.sprinting || !moving) {
      this.trailTimer = 0;
      return;
    }

    this.trailTimer -= dt;
    if (this.trailTimer <= 0) {
      this.trailTimer = TRAIL_INTERVAL;
      this.trail.push({
        x: this.x,
        y: this.y,
        aimAngle: this.aimAngle,
        moveAngle: this.moveAngle,
        phase: this.animationPhase,
        life: TRAIL_LIFETIME,
        maxLife: TRAIL_LIFETIME
      });
      if (this.trail.length > 5) this.trail.shift();
    }
  }

  staminaPercent() {
    return this.stamina / SPRINT_STAMINA_MAX;
  }

  speedTilesPerSecond() {
    const magnitude = Math.hypot(this.velocityX, this.velocityY);
    return magnitude / TILE_SIZE;
  }
}
