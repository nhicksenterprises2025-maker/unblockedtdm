import { TILE_SIZE } from './engine/constants.js';
import { WorldRenderer } from './render/WorldRenderer.js';
import { MinimapRenderer } from './render/MinimapRenderer.js';

const BLUE = '#61cfff';
const RED = '#ff6273';
const CYAN = '#37b8ff';

function drawFloorPass(renderer, visible) {
  const { ctx, map } = renderer;
  const t = map.tileSize;
  const cx = map.width / 2;
  const cy = map.height / 2;
  ctx.save();
  const glow = ctx.createRadialGradient(cx, cy, t, cx, cy, t * 8);
  glow.addColorStop(0, 'rgba(55,184,255,.09)');
  glow.addColorStop(.45, 'rgba(55,184,255,.025)');
  glow.addColorStop(1, 'rgba(55,184,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(visible.left, visible.top, visible.right - visible.left, visible.bottom - visible.top);
  ctx.fillStyle = 'rgba(97,207,255,.055)';
  ctx.fillRect(t, t * 7.2, t * 4.2, t * 7.6);
  ctx.fillStyle = 'rgba(255,98,115,.055)';
  ctx.fillRect(map.width - t * 5.2, t * 7.2, t * 4.2, t * 7.6);
  ctx.restore();
}

function drawArenaDecals(renderer) {
  const { ctx, map } = renderer;
  const t = map.tileSize;
  const cx = map.width / 2;
  const cy = map.height / 2;
  ctx.save();
  ctx.strokeStyle = 'rgba(55,184,255,.24)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, t * 1.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(220,238,244,.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, t * 2.05, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = '900 16px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(55,184,255,.18)';
  ctx.fillText('TC // MID', cx, cy + 6);

  const labels = [
    ['BLUE SPAWN', t * 2.8, t * 7.05, BLUE],
    ['NORTH WAREHOUSE', t * 7, t * 1.6, '#dcebf1'],
    ['SOUTH WAREHOUSE', t * 25, t * 20.4, '#dcebf1'],
    ['RED SPAWN', t * 29.2, t * 7.05, RED]
  ];
  ctx.font = '800 11px ui-monospace, monospace';
  for (const [label, x, y, color] of labels) {
    ctx.globalAlpha = .34;
    ctx.fillStyle = color;
    ctx.fillText(label, x, y);
  }
  ctx.restore();
}

function drawStructurePass(renderer, item) {
  const { ctx } = renderer;
  const label = String(item.label || '');
  ctx.save();

  if (item.palette === 'barrier') {
    ctx.fillStyle = 'rgba(242,201,76,.2)';
    ctx.fillRect(item.x + 6, item.y + 6, Math.max(0, item.w - 12), 8);
  }

  if (item.palette === 'crate') {
    ctx.fillStyle = 'rgba(255,243,213,.48)';
    ctx.font = '900 9px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SA // TRAINING', item.x + 12, item.y + Math.min(item.h - 10, 24));
  }

  if (label.includes('Warehouse')) {
    const copy = label.includes('North') ? 'NORTH // TRAINING' : 'SOUTH // TRAINING';
    ctx.fillStyle = 'rgba(4,17,24,.66)';
    ctx.fillRect(item.x + 15, item.y + 16, Math.min(item.w - 30, 190), 30);
    ctx.strokeStyle = 'rgba(55,184,255,.45)';
    ctx.strokeRect(item.x + 15.5, item.y + 16.5, Math.min(item.w - 30, 190), 30);
    ctx.fillStyle = '#9ad8ef';
    ctx.font = '900 12px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(copy, item.x + 26, item.y + 36);
  }

  if (label.includes('Terminal')) {
    ctx.fillStyle = 'rgba(4,15,22,.68)';
    ctx.fillRect(item.x + 14, item.y + 13, item.w - 28, 34);
    ctx.strokeStyle = 'rgba(55,184,255,.4)';
    ctx.strokeRect(item.x + 14.5, item.y + 13.5, item.w - 29, 34);
    ctx.fillStyle = CYAN;
    ctx.font = '900 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SKIRMISH ARENA', item.x + item.w / 2, item.y + 35);
  }

  if (label.includes('Mid Block')) {
    ctx.strokeStyle = 'rgba(214,235,243,.28)';
    ctx.strokeRect(item.x + 10, item.y + 10, item.w - 20, item.h - 20);
  }
  ctx.restore();
}

function drawTacticalLandmarks(renderer, canvas, full) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const map = renderer.map;
  const w = canvas.width;
  const h = canvas.height;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = full ? '900 12px ui-monospace, monospace' : '900 9px ui-monospace, monospace';
  if (full) {
    const padding = 28;
    const scale = Math.min((w - padding * 2) / map.width, (h - padding * 2) / map.height);
    const dw = map.width * scale;
    const dh = map.height * scale;
    const left = (w - dw) / 2;
    const top = (h - dh) / 2;
    const point = (x, y) => ({ x: left + x * scale, y: top + y * scale });
    const b = point(TILE_SIZE * 3, TILE_SIZE * 6.8);
    const m = point(map.width / 2, map.height / 2);
    const r = point(map.width - TILE_SIZE * 3, TILE_SIZE * 6.8);
    ctx.fillStyle = BLUE; ctx.fillText('BLUE', b.x, b.y);
    ctx.fillStyle = '#dcebf1'; ctx.fillText('MID', m.x, m.y - 18);
    ctx.fillStyle = RED; ctx.fillText('RED', r.x, r.y);
    ctx.strokeStyle = 'rgba(55,184,255,.34)';
    ctx.beginPath(); ctx.arc(m.x, m.y, 20, 0, Math.PI * 2); ctx.stroke();
  } else {
    ctx.fillStyle = 'rgba(220,235,241,.6)';
    ctx.fillText('TC', w / 2, h - 20);
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

if (!MinimapRenderer.prototype.__phase7Landmarks) {
  const fullMap = MinimapRenderer.prototype.drawFullMap;
  MinimapRenderer.prototype.drawFullMap = function phase7FullMap(canvas, state) {
    const result = fullMap.call(this, canvas, state);
    drawTacticalLandmarks(this, canvas, true);
    return result;
  };
  const minimap = MinimapRenderer.prototype.draw;
  MinimapRenderer.prototype.draw = function phase7Minimap(state) {
    const result = minimap.call(this, state);
    drawTacticalLandmarks(this, this.canvas, false);
    return result;
  };
  Object.defineProperty(MinimapRenderer.prototype, '__phase7Landmarks', { value: true });
}

document.body.classList.add('ui-phase7');
