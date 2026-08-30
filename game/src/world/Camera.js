import { CAMERA_LERP, DEFAULT_ZOOM, WORLD_HEIGHT, WORLD_WIDTH } from '../engine/constants.js';

export class Camera {
  static active = null;

  constructor(worldWidth = WORLD_WIDTH, worldHeight = WORLD_HEIGHT) {
    this.worldWidth = Math.max(1, Number(worldWidth) || WORLD_WIDTH);
    this.worldHeight = Math.max(1, Number(worldHeight) || WORLD_HEIGHT);
    this.x = this.worldWidth / 2;
    this.y = this.worldHeight / 2;
    this.width = innerWidth;
    this.height = innerHeight;
    this.zoom = DEFAULT_ZOOM;
    Camera.active = this;
  }

  setWorldBounds(worldWidth, worldHeight, { preservePosition = true } = {}) {
    this.worldWidth = Math.max(1, Number(worldWidth) || WORLD_WIDTH);
    this.worldHeight = Math.max(1, Number(worldHeight) || WORLD_HEIGHT);
    if (!preservePosition) {
      this.x = this.worldWidth / 2;
      this.y = this.worldHeight / 2;
    }
    this.clamp();
    return this;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.clamp();
  }

  follow(targetX, targetY, dt) {
    const blend = 1 - Math.exp(-CAMERA_LERP * dt);
    this.x += (targetX - this.x) * blend;
    this.y += (targetY - this.y) * blend;
    this.clamp();
  }

  clamp() {
    const halfW = Math.min(this.worldWidth / 2, this.width / (2 * this.zoom));
    const halfH = Math.min(this.worldHeight / 2, this.height / (2 * this.zoom));
    this.x = Math.max(halfW, Math.min(this.worldWidth - halfW, this.x));
    this.y = Math.max(halfH, Math.min(this.worldHeight - halfH, this.y));
  }

  begin(ctx) {
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  }

  end(ctx) {
    ctx.restore();
  }

  worldToScreen(worldX, worldY) {
    return {
      x: this.width / 2 + (worldX - this.x) * this.zoom,
      y: this.height / 2 + (worldY - this.y) * this.zoom
    };
  }

  screenToWorld(screenX, screenY) {
    return {
      x: this.x + (screenX - this.width / 2) / this.zoom,
      y: this.y + (screenY - this.height / 2) / this.zoom
    };
  }

  visibleBounds(padding = 64) {
    const halfW = this.width / (2 * this.zoom);
    const halfH = this.height / (2 * this.zoom);
    return {
      left: this.x - halfW - padding,
      top: this.y - halfH - padding,
      right: this.x + halfW + padding,
      bottom: this.y + halfH + padding
    };
  }
}
