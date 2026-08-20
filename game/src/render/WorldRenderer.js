import { TILE_SIZE } from '../engine/constants.js';

const PALETTES = {
  navy: { top: '#294e69', side: '#163246', edge: '#0c2232', highlight: '#3e6d88', detail: '#8ab0c1' },
  warehouse: { top: '#66899d', side: '#3e6072', edge: '#29495a', highlight: '#82a4b5', detail: '#c1d8df' },
  steel: { top: '#5b7989', side: '#365666', edge: '#263f4d', highlight: '#7394a3', detail: '#b8cbd2' },
  crate: { top: '#c89551', side: '#946537', edge: '#684725', highlight: '#ddb16f', detail: '#714923' },
  barrier: { top: '#d9ba4f', side: '#a28735', edge: '#705d27', highlight: '#f0d36d', detail: '#493f23' }
};

const GROUND = {
  grass: ['#4f9167', '#51956a', '#4c8c63'],
  asphalt: ['#344b59', '#364e5c', '#314754'],
  concrete: ['#75878f', '#788a92', '#70828a'],
  spawnConcrete: ['#687d86', '#6b8089', '#647982']
};

function hash2(col, row) {
  let n = (col * 374761393 + row * 668265263) >>> 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return (n ^ (n >>> 16)) >>> 0;
}

export class WorldRenderer {
  constructor(ctx, map) {
    this.ctx = ctx;
    this.map = map;
  }

  drawBase(camera, debug) {
    const visible = camera.visibleBounds(TILE_SIZE * 2);
    this.drawGround(visible);
    this.drawLaneBorders();
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

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const type = this.map.groundType(col, row);
        const seed = hash2(col, row);
        const palette = GROUND[type];
        const x = col * tile;
        const y = row * tile;

        ctx.fillStyle = palette[seed % palette.length];
        ctx.fillRect(x, y, tile + 1, tile + 1);

        // Soft variation removes the blockout checkerboard look while preserving tiles.
        ctx.fillStyle = (seed & 1) ? 'rgba(255,255,255,.018)' : 'rgba(4,20,27,.018)';
        ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);

        ctx.strokeStyle = type === 'grass' ? 'rgba(25,72,45,.075)' : 'rgba(8,28,37,.07)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + .5, y + .5, tile - 1, tile - 1);

        if (type === 'grass') this.drawGrassDetail(x, y, seed);
        else if (type === 'asphalt') this.drawAsphaltDetail(x, y, seed);
        else this.drawConcreteDetail(x, y, seed, type === 'spawnConcrete');
      }
    }
  }

  drawGrassDetail(x, y, seed) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(25,88,49,.25)';
    ctx.lineWidth = 1.2;
    const count = 2 + (seed % 3);
    for (let i = 0; i < count; i++) {
      const ox = 12 + ((seed >>> (i * 4)) % 40);
      const oy = 14 + ((seed >>> (i * 5 + 3)) % 36);
      ctx.beginPath();
      ctx.moveTo(x + ox, y + oy + 5);
      ctx.lineTo(x + ox + 2, y + oy - 2);
      ctx.moveTo(x + ox + 2, y + oy + 5);
      ctx.lineTo(x + ox + 6, y + oy);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawAsphaltDetail(x, y, seed) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(11,29,36,.12)';
    for (let i = 0; i < 4; i++) {
      const ox = 8 + ((seed >>> (i * 5)) % 48);
      const oy = 8 + ((seed >>> (i * 4 + 2)) % 48);
      ctx.fillRect(x + ox, y + oy, 1.5, 1.5);
    }
    if (seed % 7 === 0) {
      ctx.strokeStyle = 'rgba(17,35,42,.20)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(x + 15, y + 18);
      ctx.lineTo(x + 27, y + 25);
      ctx.lineTo(x + 22, y + 34);
      ctx.lineTo(x + 36, y + 42);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawConcreteDetail(x, y, seed, spawn) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = spawn ? 'rgba(27,65,77,.12)' : 'rgba(33,55,63,.12)';
    ctx.lineWidth = 1;
    if (seed % 6 === 0) {
      ctx.beginPath();
      ctx.moveTo(x + 10, y + 48);
      ctx.lineTo(x + 23, y + 40);
      ctx.lineTo(x + 31, y + 44);
      ctx.stroke();
    }
    if (seed % 11 === 0) {
      ctx.fillStyle = 'rgba(29,49,56,.16)';
      ctx.beginPath();
      ctx.arc(x + 46, y + 18, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawLaneBorders() {
    const ctx = this.ctx;
    const top = TILE_SIZE * 8;
    const bottom = TILE_SIZE * 14;
    ctx.save();
    ctx.strokeStyle = 'rgba(211,223,206,.20)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(TILE_SIZE, top);
    ctx.lineTo(this.map.width - TILE_SIZE, top);
    ctx.moveTo(TILE_SIZE, bottom);
    ctx.lineTo(this.map.width - TILE_SIZE, bottom);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(15,36,44,.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(TILE_SIZE, top + 5);
    ctx.lineTo(this.map.width - TILE_SIZE, top + 5);
    ctx.moveTo(TILE_SIZE, bottom - 5);
    ctx.lineTo(this.map.width - TILE_SIZE, bottom - 5);
    ctx.stroke();
    ctx.restore();
  }

  drawDecals() {
    const ctx = this.ctx;
    for (const decal of this.map.definition.decals) {
      if (decal.type === 'lane') {
        ctx.save();
        ctx.setLineDash([30, 25]);
        ctx.strokeStyle = 'rgba(239,235,188,.12)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(TILE_SIZE * 1.4, decal.y + 2);
        ctx.lineTo(this.map.width - TILE_SIZE * 1.4, decal.y + 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(239,236,193,.48)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(TILE_SIZE * 1.4, decal.y);
        ctx.lineTo(this.map.width - TILE_SIZE * 1.4, decal.y);
        ctx.stroke();
        ctx.restore();
      }
      if (decal.type === 'spawn') this.drawSpawnZone(decal);
    }
  }

  drawSpawnZone(decal) {
    const ctx = this.ctx;
    const blue = decal.team === 'blue';
    const fill = blue ? 'rgba(59,164,255,.085)' : 'rgba(255,79,104,.085)';
    const line = blue ? 'rgba(79,183,255,.48)' : 'rgba(255,96,119,.48)';
    const faint = blue ? 'rgba(79,183,255,.17)' : 'rgba(255,96,119,.17)';
    const corner = 30;

    ctx.save();
    ctx.fillStyle = fill;
    ctx.fillRect(decal.x, decal.y, decal.w, decal.h);
    ctx.strokeStyle = faint;
    ctx.lineWidth = 1;
    ctx.strokeRect(decal.x + 6, decal.y + 6, decal.w - 12, decal.h - 12);

    ctx.strokeStyle = line;
    ctx.lineWidth = 4;
    const x1=decal.x+3, y1=decal.y+3, x2=decal.x+decal.w-3, y2=decal.y+decal.h-3;
    ctx.beginPath();
    ctx.moveTo(x1+corner,y1);ctx.lineTo(x1,y1);ctx.lineTo(x1,y1+corner);
    ctx.moveTo(x2-corner,y1);ctx.lineTo(x2,y1);ctx.lineTo(x2,y1+corner);
    ctx.moveTo(x1,y2-corner);ctx.lineTo(x1,y2);ctx.lineTo(x1+corner,y2);
    ctx.moveTo(x2-corner,y2);ctx.lineTo(x2,y2);ctx.lineTo(x2,y2-corner);
    ctx.stroke();
    ctx.restore();
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
    const fadeDepth = player ? Math.max(40, player.radius * 2.2) : 0;
    const obstructsPlayer = Boolean(
      player && item.kind === 'tall' &&
      player.x > item.x - player.radius && player.x < item.x + item.w + player.radius &&
      player.y > item.y + item.h - 10 && player.y < item.y + item.h + fadeDepth
    );

    ctx.save();
    if (obstructsPlayer) ctx.globalAlpha = 0.36;

    // Softer, deeper shadow makes cover separate from the floor without looking flat.
    ctx.fillStyle = 'rgba(3,15,22,.24)';
    ctx.beginPath();
    ctx.roundRect(item.x + 8, item.y + depth + 9, item.w, item.h, 3);
    ctx.fill();

    ctx.fillStyle = p.side;
    ctx.beginPath();
    ctx.roundRect(item.x, item.y + depth, item.w, Math.max(8, item.h - depth), 3);
    ctx.fill();

    ctx.fillStyle = p.top;
    ctx.beginPath();
    ctx.roundRect(item.x, item.y, item.w, Math.max(8, item.h - depth), 4);
    ctx.fill();

    // Top bevel/highlight.
    ctx.strokeStyle = p.highlight;
    ctx.globalAlpha *= 0.52;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(item.x + 5, item.y + 4);
    ctx.lineTo(item.x + item.w - 5, item.y + 4);
    ctx.stroke();
    ctx.globalAlpha = obstructsPlayer ? 0.36 : 1;

    ctx.strokeStyle = p.edge;
    ctx.lineWidth = 3;
    ctx.strokeRect(item.x + 1.5, item.y + 1.5, item.w - 3, item.h - 3);

    if (item.palette === 'crate') this.drawCrateDetail(item, p);
    else if (item.palette === 'barrier') this.drawBarrierDetail(item, p);
    else if (item.kind === 'tall') this.drawWarehouseDetail(item, p);
    else this.drawSteelDetail(item, p);

    if (debug) {
      ctx.fillStyle = 'rgba(255,255,255,.70)';
      ctx.font = '11px ui-monospace, monospace';
      ctx.fillText(item.kind, item.x + 7, item.y + 15);
    }

    ctx.restore();
  }

  drawCrateDetail(item, p) {
    const ctx = this.ctx;
    const inset = 10;
    ctx.strokeStyle = p.detail;
    ctx.globalAlpha *= 0.58;
    ctx.lineWidth = 3;
    ctx.strokeRect(item.x + inset, item.y + inset, item.w - inset * 2, item.h - inset * 2);
    ctx.beginPath();
    ctx.moveTo(item.x + inset + 4, item.y + inset + 4);
    ctx.lineTo(item.x + item.w - inset - 4, item.y + item.h - inset - 4);
    ctx.moveTo(item.x + item.w - inset - 4, item.y + inset + 4);
    ctx.lineTo(item.x + inset + 4, item.y + item.h - inset - 4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(62,40,21,.45)';
    for (const [ox,oy] of [[inset,inset],[item.w-inset,inset],[inset,item.h-inset],[item.w-inset,item.h-inset]]) {
      ctx.beginPath();ctx.arc(item.x+ox,item.y+oy,2.2,0,Math.PI*2);ctx.fill();
    }
  }

  drawBarrierDetail(item, p) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.rect(item.x + 5, item.y + 5, item.w - 10, Math.max(8, item.h - 17));
    ctx.clip();
    ctx.strokeStyle = 'rgba(75,61,29,.33)';
    ctx.lineWidth = 7;
    for (let x = item.x - item.h; x < item.x + item.w + item.h; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, item.y + item.h);
      ctx.lineTo(x + item.h, item.y);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = p.edge;
    ctx.fillRect(item.x + 8, item.y + item.h - 8, 8, 5);
    ctx.fillRect(item.x + item.w - 16, item.y + item.h - 8, 8, 5);
  }

  drawWarehouseDetail(item, p) {
    const ctx = this.ctx;
    const roofH = Math.max(12, item.h - 20);
    ctx.strokeStyle = 'rgba(34,72,88,.26)';
    ctx.lineWidth = 2;
    for (let x = item.x + 48; x < item.x + item.w - 12; x += 48) {
      ctx.beginPath();ctx.moveTo(x,item.y+6);ctx.lineTo(x,item.y+roofH-6);ctx.stroke();
    }

    const panels = Math.max(1, Math.floor(item.w / 72));
    for (let i = 0; i < panels; i++) {
      const px = item.x + 18 + i * 70;
      ctx.fillStyle = 'rgba(202,231,239,.18)';
      ctx.beginPath();ctx.roundRect(px,item.y+14,38,18,3);ctx.fill();
      ctx.strokeStyle = 'rgba(38,76,91,.28)';ctx.lineWidth=1.3;ctx.stroke();
    }

    // Roof vents break up the large rectangles and give the building a real function.
    if (item.w > TILE_SIZE * 2.5) {
      const vx=item.x+item.w-36, vy=item.y+18;
      ctx.fillStyle='rgba(31,58,70,.50)';ctx.beginPath();ctx.arc(vx,vy,9,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=p.detail;ctx.globalAlpha*=0.45;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(vx,vy,5.5,0,Math.PI*2);ctx.stroke();
    }
  }

  drawSteelDetail(item, p) {
    const ctx = this.ctx;
    const topH = Math.max(8, item.h - (item.kind === 'wall' ? 12 : 7));
    ctx.fillStyle = 'rgba(18,43,53,.34)';
    const points = [
      [item.x+8,item.y+8], [item.x+item.w-8,item.y+8],
      [item.x+8,item.y+topH-8], [item.x+item.w-8,item.y+topH-8]
    ];
    for (const [x,y] of points) { ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill(); }
    if (item.w > TILE_SIZE * 2) {
      ctx.strokeStyle = 'rgba(178,207,218,.15)';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(item.x+item.w/2,item.y+5);ctx.lineTo(item.x+item.w/2,item.y+topH-5);ctx.stroke();
    }
  }

  drawDebugCollision() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(255,77,112,.11)';
    ctx.strokeStyle = 'rgba(255,90,120,.72)';
    ctx.lineWidth = 2;
    for (const rect of this.map.blockers) {
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
  }
}
