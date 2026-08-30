import { WorldRenderer } from './render/WorldRenderer.js';

function drawFloorPass(renderer, visible) {
  const { ctx, map } = renderer;
  const t = map.tileSize;
  const cx = map.width / 2;
  const cy = map.height / 2;
  ctx.save();

  if (map.definition.id === 'foundry-zero') {
    const glow = ctx.createRadialGradient(cx, cy, t * .5, cx, cy, t * 6.5);
    glow.addColorStop(0, 'rgba(244,106,31,.055)');
    glow.addColorStop(.55, 'rgba(177,74,23,.018)');
    glow.addColorStop(1, 'rgba(177,74,23,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(visible.left, visible.top, visible.right - visible.left, visible.bottom - visible.top);
    ctx.restore();
    return;
  }

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

  // Training floor calibration marks reinforce the three readable routes.
  ctx.strokeStyle = 'rgba(218,235,239,.10)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 12]);
  for (const y of [t * 5.75, t * 16.25]) {
    ctx.beginPath();ctx.moveTo(t * 4.7, y);ctx.lineTo(map.width - t * 4.7, y);ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(67,197,239,.12)';
  for (const x of [t * 6, t * 16, t * 26]) ctx.fillRect(x - 18, cy - 2, 36, 4);
  ctx.restore();
}

function drawArenaDecals(renderer) {
  const { ctx, map } = renderer;
  const t = map.tileSize;
  const cx = map.width / 2;
  const cy = map.height / 2;
  ctx.save();

  if (map.definition.id === 'foundry-zero') {
    ctx.strokeStyle = 'rgba(226,127,53,.24)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - t * 2.1, cy - t * 1.55, t * 4.2, t * 3.1);
    ctx.strokeStyle = 'rgba(225,197,110,.16)';
    ctx.setLineDash([14, 10]);
    ctx.beginPath();ctx.moveTo(cx - t * 3.2, cy);ctx.lineTo(cx + t * 3.2, cy);ctx.stroke();
    ctx.setLineDash([]);
    for (const side of [-1, 1]) {
      ctx.fillStyle = 'rgba(229,103,31,.20)';
      ctx.fillRect(cx + side * t * 2.55 - 12, cy - 3, 24, 6);
    }
    ctx.restore();
    return;
  }

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

  // Calibrated range ticks, deliberately subtle under combat silhouettes.
  ctx.strokeStyle = 'rgba(220,238,244,.13)';
  ctx.lineWidth = 2;
  for (let x = cx - t * 5; x <= cx + t * 5; x += t) {
    ctx.beginPath();ctx.moveTo(x, cy - 10);ctx.lineTo(x, cy + 10);ctx.stroke();
  }
  ctx.restore();
}

function drawStructurePass(renderer, item) {
  const { ctx, map } = renderer;
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
    ctx.strokeStyle = 'rgba(188,205,211,.24)';
    ctx.lineWidth = 1;
    ctx.strokeRect(item.x + 15.5, item.y + 16.5, signWidth, 22);
    // A recessed shutter grille replaces the old cyan decorative stripe. The
    // building now reads as a ventilated range-services bay rather than a
    // generic team-coloured block.
    ctx.fillStyle = 'rgba(179,194,199,.30)';
    const grilleX = item.x + 24;
    const grilleWidth = Math.max(24, signWidth - 18);
    for (let x = grilleX; x < grilleX + grilleWidth; x += 13) {
      ctx.fillRect(x, item.y + 23, Math.min(7, grilleX + grilleWidth - x), 2);
      ctx.fillRect(x, item.y + 29, Math.min(7, grilleX + grilleWidth - x), 2);
    }
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

  if (map.definition.id === 'training-complex') {
    if (item.visualRole === 'trainingHall') {
      ctx.fillStyle = 'rgba(5,18,25,.70)';
      ctx.fillRect(item.x + 17, item.y + item.h - 48, item.w - 34, 24);
      // Training halls are neutral facility architecture. Older builds painted
      // a cyan/red team bar across this recess, making the buildings read as
      // arbitrary coloured rectangles. A short segmented steel grille keeps
      // the bay legible without borrowing either team's HUD colour.
      ctx.fillStyle = 'rgba(179,194,199,.34)';
      const grilleX = item.x + item.w / 2 - 27;
      for (let offset = 0; offset < 54; offset += 12) ctx.fillRect(grilleX + offset, item.y + item.h - 36, 7, 2);
      ctx.strokeStyle = 'rgba(219,234,239,.16)';ctx.strokeRect(item.x + 17.5, item.y + item.h - 47.5, item.w - 35, 23);
    }
    if (item.visualRole === 'controlTerminal') {
      ctx.fillStyle = 'rgba(4,15,22,.72)';ctx.fillRect(item.x + 16, item.y + 14, item.w - 32, 27);
      ctx.fillStyle = 'rgba(67,197,239,.62)';ctx.fillRect(item.x + item.w / 2 - 34, item.y + 26, 68, 3);
      ctx.strokeStyle = 'rgba(128,204,229,.28)';ctx.strokeRect(item.x + 16.5, item.y + 14.5, item.w - 33, 26);
    }
    if (item.visualRole === 'coverModule') {
      ctx.strokeStyle = 'rgba(199,222,230,.22)';ctx.lineWidth=2;ctx.strokeRect(item.x + 12, item.y + 12, item.w - 24, item.h - 24);
      ctx.fillStyle = 'rgba(190,205,208,.24)';
      for (const offset of [-12, 0, 12]) ctx.fillRect(item.x + item.w / 2 + offset - 3, item.y + 18, 6, 3);
    }
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
