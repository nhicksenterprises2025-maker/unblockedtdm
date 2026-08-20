import { TILE_SIZE } from '../engine/constants.js';

const ENEMY_REVEAL_SECONDS = 1.5;

function readMode() {
  try {
    return localStorage.getItem('unblockedtdm.minimapMode') || 'north-up';
  } catch {
    return 'north-up';
  }
}

export class MinimapRenderer {
  constructor(canvas, map) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.map = map;
    this.revealUntil = new Map();
    this.lastDrawTime = 0;
  }

  observeEnemyFire(players, localPlayer, nowSeconds) {
    for (const actor of players) {
      if (actor === localPlayer || actor.team === localPlayer.team) continue;
      const manager = actor.weaponManager;
      if (!manager) continue;
      if (manager.fireVisualTimer > 0 || manager.meleeVisualTimer > 0) {
        this.revealUntil.set(actor.id, nowSeconds + ENEMY_REVEAL_SECONDS);
      }
    }
  }

  isEnemyRevealed(actor, nowSeconds) {
    return (this.revealUntil.get(actor.id) || 0) > nowSeconds;
  }

  mapPointNorthUp(x, y, size, padding) {
    const usable = size - padding * 2;
    const scale = Math.min(usable / this.map.width, usable / this.map.height);
    const drawWidth = this.map.width * scale;
    const drawHeight = this.map.height * scale;
    const left = (size - drawWidth) / 2;
    const top = (size - drawHeight) / 2;
    return { x: left + x * scale, y: top + y * scale, scale };
  }

  mapPointRotating(x, y, localPlayer, size) {
    const radiusWorld = 12 * TILE_SIZE;
    const scale = (size * 0.43) / radiusWorld;
    const dx = x - localPlayer.x;
    const dy = y - localPlayer.y;
    const rotation = -localPlayer.aimAngle - Math.PI / 2;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    return {
      x: size / 2 + (dx * cos - dy * sin) * scale,
      y: size / 2 + (dx * sin + dy * cos) * scale,
      scale
    };
  }

  drawStructure(rect, localPlayer, size, mode) {
    const ctx = this.ctx;
    if (mode === 'north-up') {
      const a = this.mapPointNorthUp(rect.x, rect.y, size, 20);
      const b = this.mapPointNorthUp(rect.x + rect.w, rect.y + rect.h, size, 20);
      ctx.fillStyle = rect.kind === 'tall' ? 'rgba(205,224,234,.52)' : 'rgba(142,177,194,.42)';
      ctx.fillRect(a.x, a.y, Math.max(1, b.x - a.x), Math.max(1, b.y - a.y));
      return;
    }

    const corners = [
      [rect.x, rect.y], [rect.x + rect.w, rect.y], [rect.x + rect.w, rect.y + rect.h], [rect.x, rect.y + rect.h]
    ].map(([x, y]) => this.mapPointRotating(x, y, localPlayer, size));
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i += 1) ctx.lineTo(corners[i].x, corners[i].y);
    ctx.closePath();
    ctx.fillStyle = rect.kind === 'tall' ? 'rgba(205,224,234,.52)' : 'rgba(142,177,194,.42)';
    ctx.fill();
  }

  drawActor(actor, localPlayer, size, mode, nowSeconds) {
    if (!actor.health?.alive) return;
    if (actor !== localPlayer && actor.team !== localPlayer.team && !this.isEnemyRevealed(actor, nowSeconds)) return;

    const ctx = this.ctx;
    const point = mode === 'north-up'
      ? this.mapPointNorthUp(actor.x, actor.y, size, 20)
      : this.mapPointRotating(actor.x, actor.y, localPlayer, size);
    const center = size / 2;
    const maxRadius = size * 0.445;
    let drawX = point.x;
    let drawY = point.y;
    const fromCenterX = drawX - center;
    const fromCenterY = drawY - center;
    const distance = Math.hypot(fromCenterX, fromCenterY);
    if (distance > maxRadius) {
      const scale = maxRadius / distance;
      drawX = center + fromCenterX * scale;
      drawY = center + fromCenterY * scale;
    }

    if (actor === localPlayer) {
      const angle = mode === 'north-up' ? actor.aimAngle : -Math.PI / 2;
      ctx.save();
      ctx.translate(drawX, drawY);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(-6, -5);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-6, 5);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(255,255,255,.45)';
      ctx.fill();
      ctx.restore();
      return;
    }

    const friendly = actor.team === localPlayer.team;
    ctx.beginPath();
    ctx.arc(drawX, drawY, friendly ? 5.5 : 6, 0, Math.PI * 2);
    ctx.fillStyle = friendly ? '#61cfff' : '#ff6273';
    ctx.shadowBlur = friendly ? 7 : 10;
    ctx.shadowColor = friendly ? 'rgba(97,207,255,.55)' : 'rgba(255,98,115,.7)';
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  draw({ players, localPlayer }) {
    if (!this.canvas || !localPlayer) return;
    const nowSeconds = performance.now() / 1000;
    this.observeEnemyFire(players, localPlayer, nowSeconds);
    const mode = readMode() === 'rotate' ? 'rotate' : 'north-up';
    const ctx = this.ctx;
    const size = this.canvas.width;
    const center = size / 2;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, size * 0.47, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = 'rgba(5,18,26,.92)';
    ctx.fillRect(0, 0, size, size);

    if (mode === 'north-up') {
      const topLeft = this.mapPointNorthUp(0, 0, size, 20);
      const bottomRight = this.mapPointNorthUp(this.map.width, this.map.height, size, 20);
      ctx.fillStyle = 'rgba(48,76,88,.34)';
      ctx.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
    } else {
      const gridStep = TILE_SIZE * 2;
      ctx.strokeStyle = 'rgba(97,135,151,.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= this.map.width; x += gridStep) {
        const a = this.mapPointRotating(x, 0, localPlayer, size);
        const b = this.mapPointRotating(x, this.map.height, localPlayer, size);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      for (let y = 0; y <= this.map.height; y += gridStep) {
        const a = this.mapPointRotating(0, y, localPlayer, size);
        const b = this.mapPointRotating(this.map.width, y, localPlayer, size);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }

    for (const rect of this.map.blockers) this.drawStructure(rect, localPlayer, size, mode);
    for (const actor of players) this.drawActor(actor, localPlayer, size, mode, nowSeconds);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(center, center, size * 0.47, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(127,214,244,.42)';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = 'rgba(224,244,251,.72)';
    ctx.font = '900 15px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(mode === 'north-up' ? 'N' : 'AIM', center, 18);
  }
}
