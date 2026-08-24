import { WorldRenderer } from './render/WorldRenderer.js';

function drawFloorPass(renderer, visible) {
  const { ctx, map } = renderer;
  const t = map.tileSize;
  const cx = map.width / 2;
  const cy = map.height / 2;
  ctx.save();

  const glow = ctx.createRadialGradient(cx, cy, t, cx, cy, t * 8);
  glow.addColorStop(0, 'rgba(55,184,255,.075)');
  glow.addColorStop(.45, 'rgba(55,184,255,.02)');
  glow.addColorStop(1, 'rgba(55,184,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(visible.left, visible.top, visible.right - visible.left, visible.bottom - visible.top);

  ctx.fillStyle = 'rgba(97,207,255,.04)';
  ctx.fillRect(t, t * 7.2, t * 4.2, t * 7.6);
  ctx.fillStyle = 'rgba(255,98,115,.04)';
  ctx.fillRect(map.width - t * 5.2, t * 7.2, t * 4.2, t * 7.6);
  ctx.restore();
}

function drawArenaDecals(renderer) {
  const { ctx, map } = renderer;
  const t = map.tileSize;
  const cx = map.width / 2;
  const cy = map.height / 2;
  ctx.save();

  ctx.strokeStyle = 'rgba(55,184,255,.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, t * 1.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(220,238,244,.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, t * 2.05, 0, Math.PI * 2);
  ctx.stroke();

  // Minimal geometric orientation marks. No literal floor labels.
  for (let i = 0; i < 4; i += 1) {
    const angle = i * Math.PI / 2;
    const x1 = cx + Math.cos(angle) * t * 1.72;
    const y1 = cy + Math.sin(angle) * t * 1.72;
    const x2 = cx + Math.cos(angle) * t * 1.93;
    const y2 = cy + Math.sin(angle) * t * 1.93;
    ctx.strokeStyle = 'rgba(210,229,236,.16)';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStructurePass(renderer, item) {
  const { ctx } = renderer;
  const label = String(item.label || '');
  ctx.save();

  if (item.palette === 'barrier') {
    ctx.fillStyle = 'rgba(242,201,76,.16)';
    ctx.fillRect(item.x + 6, item.y + 6, Math.max(0, item.w - 12), 7);
  }

  if (item.palette === 'crate') {
    ctx.strokeStyle = 'rgba(255,238,201,.18)';
    ctx.lineWidth = 2;
    ctx.strokeRect(item.x + 9, item.y + 9, Math.max(0, item.w - 18), Math.max(0, item.h - 18));
  }

  if (label.includes('Warehouse')) {
    const signWidth = Math.min(item.w - 30, 176);
    ctx.fillStyle = 'rgba(4,17,24,.56)';
    ctx.fillRect(item.x + 15, item.y + 16, signWidth, 22);
    ctx.strokeStyle = 'rgba(93,182,217,.28)';
    ctx.lineWidth = 1;
    ctx.strokeRect(item.x + 15.5, item.y + 16.5, signWidth, 22);
    ctx.fillStyle = 'rgba(55,184,255,.55)';
    ctx.fillRect(item.x + 22, item.y + 25, 38, 3);
    ctx.fillStyle = 'rgba(222,236,242,.28)';
    ctx.fillRect(item.x + 67, item.y + 25, Math.max(18, signWidth - 75), 3);
  }

  if (label.includes('Terminal')) {
    ctx.fillStyle = 'rgba(4,15,22,.6)';
    ctx.fillRect(item.x + 14, item.y + 13, item.w - 28, 28);
    ctx.strokeStyle = 'rgba(55,184,255,.28)';
    ctx.strokeRect(item.x + 14.5, item.y + 13.5, item.w - 29, 28);
    ctx.fillStyle = 'rgba(55,184,255,.6)';
    ctx.fillRect(item.x + item.w / 2 - 28, item.y + 26, 56, 3);
  }

  if (label.includes('Mid Block')) {
    ctx.strokeStyle = 'rgba(214,235,243,.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(item.x + 10, item.y + 10, item.w - 20, item.h - 20);
  }

  ctx.restore();
}

if (!WorldRenderer.prototype.__phase7Visuals) {
  const ground = WorldRenderer.prototype.drawGround;
  WorldRenderer.prototype.drawGround = function phase7Ground(visible) {
    const result = ground.call(this, visible);
    drawFloorPass(this, visible);
    return result;
  };

  const decals = WorldRenderer.prototype.drawDecals;
  WorldRenderer.prototype.drawDecals = function phase7Decals() {
    const result = decals.call(this);
    drawArenaDecals(this);
    return result;
  };

  const structure = WorldRenderer.prototype.drawStructure;
  WorldRenderer.prototype.drawStructure = function phase7Structure(item, player, debug) {
    const result = structure.call(this, item, player, debug);
    drawStructurePass(this, item);
    return result;
  };

  Object.defineProperty(WorldRenderer.prototype, '__phase7Visuals', { value: true });
}

document.body.classList.add('ui-phase7');
