import { TILE_SIZE } from '../engine/constants.js';

const PALETTES = {
  navy: { top: '#244660', side: '#152d41', edge: '#0d2232' },
  warehouse: { top: '#64859a', side: '#405f73', edge: '#2c495b' },
  steel: { top: '#557486', side: '#365466', edge: '#263f4e' },
  crate: { top: '#bf8b4c', side: '#8f6336', edge: '#684725' },
  barrier: { top: '#d8b750', side: '#a28535', edge: '#735f27' }
};

export class WorldRenderer {
  constructor(ctx, map) {
    this.ctx = ctx;
    this.map = map;
  }

  drawBase(camera, debug) {
    const visible = camera.visibleBounds(TILE_SIZE * 2);
    this.drawGround(visible);
    this.drawDecals();
    this.drawStructures(['wall', 'low'], null, debug);
  }

  drawForeground(player, debug) {
    this.drawStructures(['tall'], player, debug);
    if (debug) this.drawDebugCollision();
  }

  drawGround(visible) {
    const ctx = this.ctx;
    const tile = this.map.tileSize;
    const startCol = Math.max(0, Math.floor(visible.left / tile));
    const endCol = Math.min(this.map.definition.cols - 1, Math.ceil(visible.right / tile));
    const startRow = Math.max(0, Math.floor(visible.top / tile));
    const endRow = Math.min(this.map.definition.rows - 1, Math.ceil(visible.bottom / tile));
    const colors = {
      grass: ['#4f8f65', '#55976b'],
      asphalt: ['#354955', '#394f5c'],
      concrete: ['#71828a', '#768891'],
      spawnConcrete: ['#657982', '#6c818b']
    };

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const type = this.map.groundType(col, row);
        const palette = colors[type];
        ctx.fillStyle = palette[(col + row) & 1];
        ctx.fillRect(col * tile, row * tile, tile + 1, tile + 1);
        ctx.strokeStyle = 'rgba(10, 29, 38, .08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(col * tile + .5, row * tile + .5, tile - 1, tile - 1);
        if (type === 'grass' && (col * 7 + row * 11) % 5 === 0) {
          ctx.strokeStyle = 'rgba(28, 91, 53, .26)';
          ctx.beginPath();
          ctx.moveTo(col * tile + 18, row * tile + 42);
          ctx.lineTo(col * tile + 22, row * tile + 32);
          ctx.moveTo(col * tile + 22, row * tile + 42);
          ctx.lineTo(col * tile + 29, row * tile + 35);
          ctx.stroke();
        }
      }
    }
  }

  drawDecals() {
    const ctx = this.ctx;
    for (const decal of this.map.definition.decals) {
      if (decal.type === 'lane') {
        ctx.save();
        ctx.setLineDash([28, 24]);
        ctx.strokeStyle = 'rgba(226, 236, 193, .34)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(TILE_SIZE * 1.4, decal.y);
        ctx.lineTo(this.map.width - TILE_SIZE * 1.4, decal.y);
        ctx.stroke();
        ctx.restore();
      }
      if (decal.type === 'spawn') {
        ctx.fillStyle = decal.team === 'blue' ? 'rgba(71, 169, 255, .14)' : 'rgba(255, 88, 109, .14)';
        ctx.fillRect(decal.x, decal.y, decal.w, decal.h);
        ctx.strokeStyle = decal.team === 'blue' ? 'rgba(71, 169, 255, .42)' : 'rgba(255, 88, 109, .42)';
        ctx.lineWidth = 3;
        ctx.strokeRect(decal.x + 2, decal.y + 2, decal.w - 4, decal.h - 4);
      }
    }
  }

  drawStructures(kinds, player, debug) {
    for (const item of this.map.structures) {
      if (kinds.includes(item.kind)) this.drawStructure(item, player, debug);
    }
  }

  drawStructure(item, player, debug) {
    const ctx = this.ctx;
    const p = PALETTES[item.palette] || PALETTES.steel;
    const depth = item.kind === 'tall' ? 20 : item.kind === 'wall' ? 12 : 7;
    const obstructsPlayer = Boolean(
      player &&
      item.kind === 'tall' &&
      player.x > item.x - player.radius &&
      player.x < item.x + item.w + player.radius &&
      player.y > item.y - player.radius &&
      player.y < item.y + item.h + player.radius
    );

    ctx.save();
    if (obstructsPlayer) ctx.globalAlpha = 0.36;

    ctx.fillStyle = 'rgba(3, 15, 22, .25)';
    ctx.fillRect(item.x + 7, item.y + depth + 8, item.w, item.h);

    ctx.fillStyle = p.side;
    ctx.fillRect(item.x, item.y + depth, item.w, Math.max(0, item.h - depth));

    ctx.fillStyle = p.top;
    ctx.fillRect(item.x, item.y, item.w, Math.max(8, item.h - depth));

    ctx.strokeStyle = p.edge;
    ctx.lineWidth = 3;
    ctx.strokeRect(item.x + 1.5, item.y + 1.5, item.w - 3, item.h - 3);

    if (item.kind === 'low' && item.palette === 'crate') {
      ctx.strokeStyle = 'rgba(88, 55, 28, .45)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(item.x + 12, item.y + 12);
      ctx.lineTo(item.x + item.w - 12, item.y + item.h - 12);
      ctx.moveTo(item.x + item.w - 12, item.y + 12);
      ctx.lineTo(item.x + 12, item.y + item.h - 12);
      ctx.stroke();
    }

    if (item.kind === 'tall') {
      ctx.fillStyle = 'rgba(198, 227, 238, .18)';
      const panels = Math.max(1, Math.floor(item.w / 70));
      for (let i = 0; i < panels; i++) {
        ctx.fillRect(item.x + 18 + i * 70, item.y + 14, 38, 18);
      }
    }

    if (debug) {
      ctx.fillStyle = 'rgba(255,255,255,.65)';
      ctx.font = '11px ui-monospace, monospace';
      ctx.fillText(item.kind, item.x + 7, item.y + 15);
    }

    ctx.restore();
  }

  drawDebugCollision() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 77, 112, .11)';
    ctx.strokeStyle = 'rgba(255, 90, 120, .72)';
    ctx.lineWidth = 2;
    for (const rect of this.map.blockers) {
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
  }
}
