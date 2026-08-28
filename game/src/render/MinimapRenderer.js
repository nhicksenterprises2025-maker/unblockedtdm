import { TILE_SIZE } from '../engine/constants.js';

const ENEMY_REVEAL_SECONDS = 1.5;
const MINIMAP_FRAME_MS = 1000 / 30;
const MINIMAP_OCCLUSION_PADDING = 14;

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
    this.playerOverlap = false;
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

  updatePlayerOverlap(localPlayer, camera) {
    const shell = this.canvas?.closest?.('.minimap-shell') || this.canvas;
    if (!shell) return;

    if (!localPlayer?.health?.alive || !camera) {
      this.playerOverlap = false;
      shell.classList.remove('player-overlap');
      return;
    }

    const rect = shell.getBoundingClientRect();
    const zoom = Number(camera.zoom) || 1;
    const screenX = camera.width / 2 + (localPlayer.x - camera.x) * zoom;
    const screenY = camera.height / 2 + (localPlayer.y - camera.y) * zoom;
    const actorRadius = Math.max(18, (Number(localPlayer.radius) || 18) * zoom);
    const pad = MINIMAP_OCCLUSION_PADDING + actorRadius;
    const overlaps = screenX >= rect.left - pad
      && screenX <= rect.right + pad
      && screenY >= rect.top - pad
      && screenY <= rect.bottom + pad;

    if (overlaps === this.playerOverlap) return;
    this.playerOverlap = overlaps;
    shell.classList.toggle('player-overlap', overlaps);
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

  drawFullMap(canvas, { players, localPlayer }) {
    if (!canvas || !localPlayer) return;
    const ctx = canvas.getContext('2d');
    const nowSeconds = performance.now() / 1000;
    this.observeEnemyFire(players, localPlayer, nowSeconds);

    const width = canvas.width;
    const height = canvas.height;
    const padding = 28;
    const scale = Math.min((width - padding * 2) / this.map.width, (height - padding * 2) / this.map.height);
    const drawWidth = this.map.width * scale;
    const drawHeight = this.map.height * scale;
    const left = (width - drawWidth) / 2;
    const top = (height - drawHeight) / 2;
    const point = (x, y) => ({ x: left + x * scale, y: top + y * scale });

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#071018';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#132632';
    ctx.fillRect(left, top, drawWidth, drawHeight);

    ctx.strokeStyle = 'rgba(90,137,158,.10)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= this.map.width; x += TILE_SIZE * 4) {
      const a = point(x, 0), b = point(x, this.map.height);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    for (let y = 0; y <= this.map.height; y += TILE_SIZE * 4) {
      const a = point(0, y), b = point(this.map.width, y);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }

    for (const rect of this.map.blockers) {
      const a = point(rect.x, rect.y);
      const b = point(rect.x + rect.w, rect.y + rect.h);
      ctx.fillStyle = rect.kind === 'tall' ? '#536b79' : '#385260';
      ctx.fillRect(a.x, a.y, Math.max(2, b.x - a.x), Math.max(2, b.y - a.y));
      ctx.strokeStyle = 'rgba(211,234,243,.18)';
      ctx.strokeRect(a.x + .5, a.y + .5, Math.max(1, b.x - a.x - 1), Math.max(1, b.y - a.y - 1));
    }

    for (const actor of players) {
      if (!actor.health?.alive) continue;
      const enemy = actor !== localPlayer && actor.team !== localPlayer.team;
      if (enemy && !this.isEnemyRevealed(actor, nowSeconds)) continue;
      const p = point(actor.x, actor.y);
      if (actor === localPlayer) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(actor.aimAngle);
        ctx.beginPath();
        ctx.moveTo(12, 0); ctx.lineTo(-8, -7); ctx.lineTo(-4, 0); ctx.lineTo(-8, 7); ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(255,255,255,.65)';
        ctx.fill();
        ctx.restore();
      } else {
        const friendly = actor.team === localPlayer.team;
        ctx.beginPath();
        ctx.arc(p.x, p.y, friendly ? 7 : 8, 0, Math.PI * 2);
        ctx.fillStyle = friendly ? '#61cfff' : '#ff6273';
        ctx.shadowBlur = 10;
        ctx.shadowColor = friendly ? 'rgba(97,207,255,.65)' : 'rgba(255,98,115,.8)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    ctx.strokeStyle = 'rgba(97,207,255,.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(left, top, drawWidth, drawHeight);
    ctx.fillStyle = '#dbeaf1';
    ctx.font = '900 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', width / 2, Math.max(20, top - 8));
  }

  draw({ players, localPlayer, camera = null }) {
    if (!this.canvas || !localPlayer) return;
    this.updatePlayerOverlap(localPlayer, camera);

    const nowMs = performance.now();
    if (nowMs - this.lastDrawTime < MINIMAP_FRAME_MS) return;
    this.lastDrawTime = nowMs;

    const nowSeconds = nowMs / 1000;
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
