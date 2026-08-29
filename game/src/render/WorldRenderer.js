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

const TAU = Math.PI * 2;
const FOUNDRY_PRESENTATION_ID = 'foundry-zero-phase3';
const HARD_MAX_AMBIENT_SOURCES = 48;
const HARD_MAX_PARTICLE_SLOTS = 112;
const HARD_MAX_SLOTS_PER_EMITTER = 8;
const HARD_MAX_LIGHT_RADIUS = 192;
const HARD_MAX_STATIC_FIXTURES = 64;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function unitHash(seed, index, salt = 0) {
  return hash2((seed + salt * 131) | 0, (index + salt * 17) | 0) / 4294967295;
}

function hash2(col, row) {
  let n = (col * 374761393 + row * 668265263) >>> 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return (n ^ (n >>> 16)) >>> 0;
}

export class WorldRenderer {
  constructor(ctx, map) {
    this.ctx = ctx;
    this.map = map;
    this.presentationRevision = -1;
    this.presentationDefinition = null;
    this.presentation = null;
    this.presentationCache = null;
    this.presentationMetrics = Object.freeze({ sourceCount:0, particleSlots:0, fixtureCount:0 });
    this.presentationTime = 0;
    this.presentationAnimationsEnabled = true;
    this.presentationVisibleBounds = null;
    this.syncPresentation();
  }

  drawBase(camera, debug, timestampMs) {
    const visible = camera.visibleBounds(TILE_SIZE * 2);
    this.syncPresentation();
    this.presentationVisibleBounds = visible;
    this.presentationTime = this.resolvePresentationTime(timestampMs);
    this.presentationAnimationsEnabled = !globalThis.document?.hidden;
    this.drawGround(visible);
    if (this.presentationCache) this.drawFoundryFloorPresentation(visible);
    this.drawLaneBorders();
    this.drawDecals();
    if (this.presentationCache) this.drawFoundryWarmLights(visible, this.presentationTime);
    this.drawStructures(['wall', 'low'], null, debug);
    if (this.presentationCache && this.presentationAnimationsEnabled) {
      this.drawFoundryAmbience(visible, this.presentationTime);
    }
  }

  drawForeground(player, debug) {
    this.syncPresentation();
    this.drawStructures(['tall'], player, debug);
    if (debug) this.drawDebugCollision();
  }

  resolvePresentationTime(timestampMs) {
    if (Number.isFinite(timestampMs)) return Math.max(0, timestampMs) * .001;
    const now = globalThis.performance?.now?.() ?? Date.now();
    return Math.max(0, Number(now) || 0) * .001;
  }

  syncPresentation() {
    const definition = this.map?.definition;
    const revision = Number(this.map?.revision || 0);
    if (definition === this.presentationDefinition && revision === this.presentationRevision) return;

    this.presentationDefinition = definition;
    this.presentationRevision = revision;
    this.presentation = null;
    this.presentationCache = null;
    this.presentationMetrics = Object.freeze({ sourceCount:0, particleSlots:0, fixtureCount:0, revision });

    const presentation = definition?.id === 'foundry-zero' ? definition.presentation : null;
    if (!presentation || presentation.id !== FOUNDRY_PRESENTATION_ID ||
        presentation.enabled !== true || presentation.nonBlocking !== true) return;

    const declaredLimits = presentation.limits || {};
    const limit = (value, fallback, hardMax) => clamp(Math.floor(Number(value) || fallback), 1, hardMax);
    const limits = {
      maxAmbientSources:limit(declaredLimits.maxAmbientSources, HARD_MAX_AMBIENT_SOURCES, HARD_MAX_AMBIENT_SOURCES),
      maxParticleSlots:limit(declaredLimits.maxParticleSlots, HARD_MAX_PARTICLE_SLOTS, HARD_MAX_PARTICLE_SLOTS),
      maxSlotsPerEmitter:limit(declaredLimits.maxSlotsPerEmitter, HARD_MAX_SLOTS_PER_EMITTER, HARD_MAX_SLOTS_PER_EMITTER),
      maxLightRadius:limit(declaredLimits.maxLightRadius, HARD_MAX_LIGHT_RADIUS, HARD_MAX_LIGHT_RADIUS),
      maxStaticFixtures:limit(declaredLimits.maxStaticFixtures, HARD_MAX_STATIC_FIXTURES, HARD_MAX_STATIC_FIXTURES)
    };

    let fixtureBudget = limits.maxStaticFixtures;
    const takeFixtures = (items) => {
      const result = [];
      if (!Array.isArray(items)) return result;
      for (let index = 0; index < items.length && fixtureBudget > 0; index += 1) {
        result.push(items[index]);
        fixtureBudget -= 1;
      }
      return result;
    };

    let sourceBudget = limits.maxAmbientSources;
    const takeSources = (items) => {
      const result = [];
      if (!Array.isArray(items)) return result;
      for (let index = 0; index < items.length && sourceBudget > 0; index += 1) {
        result.push(items[index]);
        sourceBudget -= 1;
      }
      return result;
    };

    const fixtureDefinition = presentation.fixtures || {};
    const ambienceDefinition = presentation.ambience || {};
    const fixtures = {
      floorPlates:takeFixtures(fixtureDefinition.floorPlates),
      warningBands:takeFixtures(fixtureDefinition.warningBands),
      pipes:takeFixtures(fixtureDefinition.pipes),
      scorchMarks:takeFixtures(fixtureDefinition.scorchMarks)
    };
    const sources = {
      warmLights:takeSources(ambienceDefinition.warmLights),
      flames:takeSources(ambienceDefinition.flames),
      emberEmitters:takeSources(ambienceDefinition.emberEmitters),
      smokeEmitters:takeSources(ambienceDefinition.smokeEmitters),
      steamVents:takeSources(ambienceDefinition.steamVents)
    };

    let particleBudget = limits.maxParticleSlots;
    const buildEmitters = (items, salt) => {
      const emitters = [];
      for (let emitterIndex = 0; emitterIndex < items.length && particleBudget > 0; emitterIndex += 1) {
        const source = items[emitterIndex];
        const requested = clamp(Math.floor(Number(source.slots) || 0), 0, limits.maxSlotsPerEmitter);
        const slotCount = Math.min(requested, particleBudget);
        if (slotCount <= 0) continue;
        const slots = new Array(slotCount);
        const seed = Number(source.seed) || Number(presentation.deterministicSeed) || 1;
        for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
          slots[slotIndex] = {
            phase:unitHash(seed, slotIndex, salt),
            speed:.72 + unitHash(seed, slotIndex, salt + 1) * .62,
            lateral:unitHash(seed, slotIndex, salt + 2) * 2 - 1,
            size:.58 + unitHash(seed, slotIndex, salt + 3) * .82,
            alpha:.58 + unitHash(seed, slotIndex, salt + 4) * .42,
            wobble:unitHash(seed, slotIndex, salt + 5) * TAU
          };
        }
        emitters.push({ source, slots });
        particleBudget -= slotCount;
      }
      return emitters;
    };

    // Canvas gradients capture the context transform that exists when they are
    // created. Caching a world-space gradient directly would therefore make it
    // drift away from its forge source as the camera moves. Cache a small set
    // of local light sprites by radius instead; they remain camera-correct and
    // avoid allocating gradients in the frame loop.
    const lightSprites = new Map();
    const buildLightSprite = (radius) => {
      const key = Math.round(radius * 100) / 100;
      if (lightSprites.has(key)) return lightSprites.get(key);
      let sprite = null;
      const canvas = globalThis.document?.createElement?.('canvas');
      if (canvas) {
        const size = Math.max(2, Math.ceil(radius * 2));
        canvas.width = size;
        canvas.height = size;
        const spriteContext = canvas.getContext?.('2d');
        if (spriteContext?.createRadialGradient) {
          const center = size / 2;
          const gradient = spriteContext.createRadialGradient(center, center, 2, center, center, radius);
          gradient.addColorStop(0, 'rgba(255,178,76,.92)');
          gradient.addColorStop(.22, 'rgba(255,116,35,.50)');
          gradient.addColorStop(.62, 'rgba(188,55,20,.15)');
          gradient.addColorStop(1, 'rgba(95,22,13,0)');
          spriteContext.fillStyle = gradient;
          spriteContext.fillRect(0, 0, size, size);
          sprite = { canvas, center };
        }
      }
      lightSprites.set(key, sprite);
      return sprite;
    };

    const lights = [];
    for (const source of sources.warmLights) {
      const radius = clamp(Number(source.radius) || 1, 1, limits.maxLightRadius);
      lights.push({ source, radius, sprite:buildLightSprite(radius) });
    }

    const embers = buildEmitters(sources.emberEmitters, 11);
    const smoke = buildEmitters(sources.smokeEmitters, 29);
    const steam = buildEmitters(sources.steamVents, 47);
    const fixtureCount = limits.maxStaticFixtures - fixtureBudget;
    const sourceCount = limits.maxAmbientSources - sourceBudget;
    const particleSlots = limits.maxParticleSlots - particleBudget;

    this.presentation = presentation;
    this.presentationCache = { fixtures, sources, lights, embers, smoke, steam, limits };
    this.presentationMetrics = Object.freeze({
      sourceCount,
      particleSlots,
      fixtureCount,
      revision,
      presentationId:presentation.id
    });
  }

  isCircleVisible(item, visible, radius = 0) {
    const r = Math.max(0, Number(radius || item.cullRadius || item.radius) || 0);
    return item.x + r >= visible.left && item.x - r <= visible.right &&
      item.y + r >= visible.top && item.y - r <= visible.bottom;
  }

  isRectVisible(item, visible, padding = 0) {
    return item.x + item.w + padding >= visible.left && item.x - padding <= visible.right &&
      item.y + item.h + padding >= visible.top && item.y - padding <= visible.bottom;
  }

  isPipeVisible(item, visible, padding = 20) {
    const points = item.points || [];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let index = 0; index < points.length; index += 1) {
      const point = points[index];
      minX = Math.min(minX, point[0]);
      minY = Math.min(minY, point[1]);
      maxX = Math.max(maxX, point[0]);
      maxY = Math.max(maxY, point[1]);
    }
    return maxX + padding >= visible.left && minX - padding <= visible.right &&
      maxY + padding >= visible.top && minY - padding <= visible.bottom;
  }

  drawFoundryFloorPresentation(visible) {
    const ctx = this.ctx;
    const fixtures = this.presentationCache.fixtures;
    ctx.save();

    // Scorch is kept low contrast and away from the center sightline.
    for (const mark of fixtures.scorchMarks) {
      if (!this.isCircleVisible(mark, visible, Math.max(mark.rx, mark.ry) + 8)) continue;
      ctx.fillStyle = 'rgba(20,24,24,.55)';
      ctx.globalAlpha = clamp(mark.alpha, .04, .22);
      ctx.beginPath();
      ctx.ellipse(mark.x, mark.y, mark.rx, mark.ry, mark.angle || 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha *= .48;
      ctx.beginPath();
      ctx.ellipse(mark.x - mark.rx * .12, mark.y, mark.rx * .58, mark.ry * .52, mark.angle || 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    for (const plate of fixtures.floorPlates) {
      if (!this.isRectVisible(plate, visible, 8)) continue;
      const core = plate.type === 'coreThreshold';
      const drain = plate.type === 'drainPlate';
      ctx.fillStyle = core ? 'rgba(44,49,49,.72)' : drain ? 'rgba(37,55,61,.76)' : 'rgba(55,69,73,.62)';
      ctx.strokeStyle = core ? 'rgba(217,111,42,.30)' : 'rgba(152,180,184,.20)';
      ctx.lineWidth = core ? 2 : 1.5;
      ctx.beginPath();
      ctx.roundRect(plate.x, plate.y, plate.w, plate.h, 3);
      ctx.fill();
      ctx.stroke();

      if (drain) {
        ctx.strokeStyle = 'rgba(15,30,34,.48)';
        ctx.lineWidth = 2;
        for (let x = plate.x + 12; x < plate.x + plate.w - 6; x += 15) {
          ctx.beginPath();
          ctx.moveTo(x, plate.y + 4);
          ctx.lineTo(x, plate.y + plate.h - 4);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = 'rgba(16,31,35,.58)';
        const inset = 6;
        for (let index = 0; index < 4; index += 1) {
          const x = index & 1 ? plate.x + plate.w - inset : plate.x + inset;
          const y = index & 2 ? plate.y + plate.h - inset : plate.y + inset;
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, TAU);
          ctx.fill();
        }
      }
    }

    for (const run of fixtures.pipes) {
      if (!this.isPipeVisible(run, visible, 24) || !run.points?.length) continue;
      const width = clamp(Number(run.width) || 7, 4, 12);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(10,26,31,.52)';
      ctx.lineWidth = width + 5;
      this.tracePipe(run.points);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(72,91,94,.88)';
      ctx.lineWidth = width;
      this.tracePipe(run.points);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(151,169,165,.30)';
      ctx.lineWidth = Math.max(1, width * .18);
      this.tracePipe(run.points);
      ctx.stroke();

      for (let index = 0; index < run.points.length; index += 1) {
        const point = run.points[index];
        ctx.fillStyle = 'rgba(29,46,49,.96)';
        ctx.beginPath();
        ctx.arc(point[0], point[1], width * .76, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(137,154,151,.42)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    for (const band of fixtures.warningBands) {
      if (!this.isRectVisible(band, visible, 8)) continue;
      ctx.save();
      ctx.beginPath();
      ctx.rect(band.x, band.y, band.w, band.h);
      ctx.clip();
      ctx.fillStyle = 'rgba(202,157,48,.45)';
      ctx.fillRect(band.x, band.y, band.w, band.h);
      ctx.strokeStyle = 'rgba(31,35,31,.50)';
      ctx.lineWidth = Math.max(4, band.h * .65);
      const stride = Math.max(13, band.h * 1.25);
      for (let x = band.x - band.h; x < band.x + band.w + band.h; x += stride) {
        ctx.beginPath();
        ctx.moveTo(x, band.y + band.h);
        ctx.lineTo(x + band.h, band.y);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  tracePipe(points) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let index = 1; index < points.length; index += 1) {
      ctx.lineTo(points[index][0], points[index][1]);
    }
  }

  drawFoundryWarmLights(visible, time) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const entry of this.presentationCache.lights) {
      const source = entry.source;
      if (!this.isCircleVisible(source, visible, entry.radius)) continue;
      const flicker = this.presentationAnimationsEnabled
        ? .88 + Math.sin(time * 7.3 + source.phase * TAU) * .075 + Math.sin(time * 13.7 + source.phase * 11) * .035
        : .88;
      ctx.globalAlpha = clamp((Number(source.alpha) || .08) * flicker, .025, .18);
      if (entry.sprite) {
        ctx.drawImage(entry.sprite.canvas, source.x - entry.sprite.center, source.y - entry.sprite.center);
      } else {
        // Non-DOM validation contexts use a cheap deterministic fallback.
        ctx.fillStyle = 'rgba(255,123,43,.16)';
        ctx.beginPath();
        ctx.arc(source.x, source.y, entry.radius * .72, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawFoundryAmbience(visible, time) {
    this.drawFoundrySmoke(visible, time);
    this.drawFoundrySteam(visible, time);

    for (const source of this.presentationCache.sources.flames) {
      if (!this.isCircleVisible(source, visible, source.cullRadius)) continue;
      const mirror = source.mirrored ? -1 : 1;
      this.drawHeatShimmer(source.x, source.y, source.scale, source.phase, time, mirror);
      this.drawFlame(source.x, source.y, source.scale, source.phase, source.directionX, time, source.kind, mirror);
    }
    this.drawFoundryEmbers(visible, time);
  }

  drawHeatShimmer(x, y, scale = 1, phase = 0, time = 0, mirror = 1) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = '#ffe0b0';
    ctx.lineWidth = 1.1;
    ctx.globalAlpha = .027;
    for (let index = 0; index < 3; index += 1) {
      const wave = time * 1.55 + phase * TAU + index * 2.31;
      const startX = x + Math.sin(wave) * (5 + index * 2) * scale * mirror;
      const startY = y - (13 + index * 9) * scale;
      ctx.beginPath();
      ctx.moveTo(startX, startY + 10 * scale);
      ctx.bezierCurveTo(
        startX + Math.sin(wave + 1.2) * 7 * scale * mirror, startY + 4 * scale,
        startX + Math.cos(wave * .83) * 8 * scale * mirror, startY - 5 * scale,
        startX + Math.sin(wave + 2.4) * 5 * scale * mirror, startY - 12 * scale
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  drawFlame(x, y, scale = 1, phase = 0, directionX = 0, time = 0, kind = 'pipe', mirror = 1) {
    const ctx = this.ctx;
    const furnace = kind === 'furnace';
    const pulse = Math.sin(time * 10.8 + phase * TAU) * .08 + Math.sin(time * 17.2 + phase * 9) * .045;
    const width = (furnace ? 24 : 17) * scale;
    const height = (furnace ? 47 : 32) * scale * (1 + pulse);
    const lean = (Number(directionX) || 0) * height + Math.sin(time * 5.4 + phase * 13) * 2.2 * scale * mirror;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.translate(x, y);

    ctx.fillStyle = 'rgba(205,47,18,.72)';
    ctx.beginPath();
    ctx.moveTo(-width * .62, 0);
    ctx.bezierCurveTo(-width * .84, -height * .28, -width * .28 + lean * .18, -height * .56, lean, -height);
    ctx.bezierCurveTo(width * .18 + lean * .25, -height * .61, width * .86, -height * .30, width * .62, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255,121,26,.92)';
    ctx.beginPath();
    ctx.moveTo(-width * .43, 0);
    ctx.bezierCurveTo(-width * .48, -height * .24, width * .05 + lean * .12, -height * .46, lean * .56, -height * .78);
    ctx.bezierCurveTo(width * .18 + lean * .18, -height * .42, width * .52, -height * .22, width * .43, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255,226,112,.96)';
    ctx.beginPath();
    ctx.moveTo(-width * .22, 0);
    ctx.bezierCurveTo(-width * .27, -height * .18, width * .08, -height * .32, lean * .30, -height * .50);
    ctx.bezierCurveTo(width * .18, -height * .28, width * .27, -height * .14, width * .22, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255,247,194,.90)';
    ctx.beginPath();
    ctx.ellipse(0, -height * .08, width * .16, height * .13, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  drawFoundryEmbers(visible, time) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = '#ffd06b';
    for (const emitter of this.presentationCache.embers) {
      const source = emitter.source;
      if (!this.isCircleVisible(source, visible, source.cullRadius)) continue;
      const scale = Number(source.scale) || 1;
      const mirror = source.mirrored ? -1 : 1;
      for (const slot of emitter.slots) {
        const progress = (time * slot.speed * .38 + slot.phase + source.phase) % 1;
        const rise = (38 + slot.speed * 25) * scale;
        const x = source.x + (slot.lateral * (7 + progress * 16) * scale + Math.sin(progress * TAU + slot.wobble) * 4) * mirror;
        const y = source.y - 8 * scale - progress * rise;
        const alpha = Math.sin(Math.PI * progress) * (1 - progress * .45) * slot.alpha;
        ctx.globalAlpha = clamp(alpha, 0, .72);
        ctx.beginPath();
        ctx.arc(x, y, slot.size * 1.35, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawFoundrySmoke(visible, time) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#aeb2aa';
    for (const emitter of this.presentationCache.smoke) {
      const source = emitter.source;
      if (!this.isCircleVisible(source, visible, source.cullRadius)) continue;
      const scale = Number(source.scale) || 1;
      const mirror = source.mirrored ? -1 : 1;
      for (const slot of emitter.slots) {
        const progress = (time * slot.speed * .11 + slot.phase + source.phase) % 1;
        const x = source.x + (Number(source.driftX) || 0) * progress + slot.lateral * 13 * progress * mirror;
        const y = source.y - progress * 58 * scale;
        const size = (8 + slot.size * 8) * scale * (.72 + progress * .64);
        ctx.globalAlpha = Math.sin(Math.PI * progress) * .052 * slot.alpha;
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * .68, slot.wobble * .12 * mirror, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawFoundrySteam(visible, time) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = '#d7e0dc';
    ctx.lineCap = 'round';
    for (const emitter of this.presentationCache.steam) {
      const source = emitter.source;
      if (!this.isCircleVisible(source, visible, source.cullRadius)) continue;
      const period = Math.max(2.5, Number(source.period) || 5);
      const duration = clamp(Number(source.duration) || .7, .35, 1.2);
      const elapsed = (time + source.phase * period) % period;
      if (elapsed >= duration) continue;
      const burst = elapsed / duration;
      const mirror = source.mirrored ? -1 : 1;
      for (const slot of emitter.slots) {
        const progress = (burst - slot.phase * .24) / .76;
        if (progress <= 0 || progress >= 1) continue;
        const directionX = Number(source.directionX) || 0;
        const x = source.x + directionX * progress * 42 + slot.lateral * (3 + progress * 8) * mirror;
        const y = source.y - progress * (34 + slot.speed * 11);
        const curl = Math.sin(progress * Math.PI * 2 + slot.wobble) * 5 * mirror;
        ctx.globalAlpha = Math.sin(Math.PI * progress) * .15 * slot.alpha;
        ctx.lineWidth = 1.4 + slot.size * .75;
        ctx.beginPath();
        ctx.moveTo(x, y + 9);
        ctx.quadraticCurveTo(x + curl, y + 4, x + curl * .45, y - 4);
        ctx.stroke();
      }
    }
    ctx.restore();
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
    if (this.presentationCache) this.drawFoundrySpawnDetail(decal, line, faint);
    ctx.restore();
  }

  drawFoundrySpawnDetail(decal, line, faint) {
    const ctx = this.ctx;
    const blue = decal.team === 'blue';
    const inward = blue ? 1 : -1;
    const railX = blue ? decal.x + 18 : decal.x + decal.w - 18;
    ctx.save();
    ctx.beginPath();
    ctx.rect(decal.x, decal.y, decal.w, decal.h);
    ctx.clip();

    ctx.strokeStyle = faint;
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.moveTo(railX, decal.y + 18);
    ctx.lineTo(railX, decal.y + decal.h - 18);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = line;
    ctx.lineWidth = 2.2;
    for (let y = decal.y + 54; y < decal.y + decal.h - 30; y += 72) {
      const tip = railX + inward * 24;
      ctx.beginPath();
      ctx.moveTo(railX + inward * 7, y - 10);
      ctx.lineTo(tip, y);
      ctx.lineTo(railX + inward * 7, y + 10);
      ctx.stroke();
    }

    const spawns = this.map.definition.spawns?.[decal.team] || [];
    for (let index = 0; index < spawns.length; index += 1) {
      const spawn = spawns[index];
      ctx.strokeStyle = faint;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(spawn.x, spawn.y, 26, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = line;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(spawn.x, spawn.y, 18, -.42, .42);
      ctx.arc(spawn.x, spawn.y, 18, Math.PI - .42, Math.PI + .42);
      ctx.stroke();
    }

    ctx.fillStyle = line;
    ctx.globalAlpha = .72;
    ctx.font = '700 10px ui-monospace, SFMono-Regular, Consolas, monospace';
    ctx.textAlign = blue ? 'left' : 'right';
    ctx.fillText(blue ? 'BLUE // DEPLOY' : 'RED // DEPLOY', blue ? decal.x + 31 : decal.x + decal.w - 31, decal.y + decal.h - 20);
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

    if (this.presentationCache && item.visualRole &&
        (!this.presentationVisibleBounds || this.isRectVisible(item, this.presentationVisibleBounds, 48))) {
      this.drawFoundryStructureDetail(item, p);
    }

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

  drawFoundryStructureDetail(item, p) {
    const time = this.presentationAnimationsEnabled ? this.presentationTime : 0;
    switch (item.visualRole) {
      case 'spawnShield':
        this.drawFoundrySpawnShield(item);
        break;
      case 'forgeHall':
        this.drawFoundryHall(item, p, time);
        break;
      case 'coolantBlock':
        this.drawFoundryCoolantBlock(item, time);
        break;
      case 'oreStack':
        this.drawFoundryOre(item);
        break;
      case 'centerRail':
        this.drawFoundryCenterRail(item, time);
        break;
      case 'flankGate':
        this.drawFoundryFlankGate(item, time);
        break;
      case 'smelter':
        this.drawFoundrySmelter(item, time);
        break;
      case 'forgeCore':
        this.drawFoundryCore(item, time);
        break;
      case 'anvil':
        this.drawFoundryAnvil(item, time);
        break;
      default:
        break;
    }
  }

  drawFoundrySpawnShield(item) {
    const ctx = this.ctx;
    const blue = item.x < this.map.width / 2;
    const accent = blue ? '#59b9f3' : '#ff6678';
    const inset = 14;
    ctx.save();
    ctx.fillStyle = 'rgba(24,37,40,.70)';
    ctx.strokeStyle = 'rgba(235,218,142,.34)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(item.x + inset, item.y + 15, item.w - inset * 2, 28, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.globalAlpha *= .76;
    ctx.fillRect(item.x + inset + 7, item.y + 23, item.w - inset * 2 - 14, 4);
    ctx.globalAlpha *= .72;
    const shortWidth = item.w * .32;
    ctx.fillRect(blue ? item.x + inset + 7 : item.x + item.w - inset - 7 - shortWidth, item.y + 32, shortWidth, 3);
    ctx.globalAlpha /= .76 * .72;
    ctx.fillStyle = 'rgba(30,40,38,.72)';
    for (let index = 0; index < 3; index += 1) {
      ctx.beginPath();
      ctx.arc(item.x + item.w * .5 + (index - 1) * 18, item.y + item.h - 17, 3, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  drawFoundryHall(item, p, time) {
    const ctx = this.ctx;
    const roofH = Math.max(24, item.h - 20);
    const leftSide = item.x < this.map.width / 2;
    const symmetricX = Math.min(item.x, this.map.width - item.x - item.w);
    const phase = (item.y / TILE_SIZE + symmetricX / TILE_SIZE) * .37;
    const fanX = item.x + item.w * (leftSide ? .67 : .33);
    const machineX = item.x + item.w * (leftSide ? .18 : .82);
    const centerY = item.y + roofH * .53;
    ctx.save();

    ctx.strokeStyle = 'rgba(29,48,52,.70)';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(item.x + 15, item.y + roofH - 20);
    ctx.lineTo(item.x + item.w - 15, item.y + roofH - 20);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(151,171,168,.30)';
    ctx.lineWidth = 2;
    ctx.stroke();

    this.drawFan(fanX, centerY, Math.min(29, roofH * .24), time * .72 + phase, p.detail);
    this.drawPiston(machineX, centerY + 16, item.w * .28, 9, time, phase, leftSide ? 0 : Math.PI);

    const ventX = item.x + item.w * .5 - 34;
    const ventY = item.y + roofH - 36;
    const pulse = .54 + Math.sin(time * 8.5 + phase * TAU) * .10;
    ctx.fillStyle = 'rgba(25,27,25,.86)';
    ctx.fillRect(ventX, ventY, 68, 13);
    ctx.fillStyle = 'rgba(236,93,27,.72)';
    ctx.globalAlpha *= pulse;
    for (let index = 0; index < 4; index += 1) {
      ctx.fillRect(ventX + 7 + index * 15, ventY + 4, 8, 3);
    }
    ctx.restore();
  }

  drawFoundryCoolantBlock(item, time) {
    const ctx = this.ctx;
    const topH = Math.max(32, item.h - 12);
    const cx = item.x + item.w * .5;
    const cy = item.y + topH * .48;
    const leftSide = item.x < this.map.width / 2;
    const direction = leftSide ? 1 : -1;
    const symmetricX = Math.min(item.x, this.map.width - item.x - item.w);
    const phase = (symmetricX + item.y) * .001;
    ctx.save();
    ctx.strokeStyle = 'rgba(24,47,55,.78)';
    ctx.lineWidth = 10;
    const pipeX = leftSide ? item.x + 12 : item.x + item.w - 12;
    ctx.beginPath();
    ctx.moveTo(pipeX, item.y + topH - 22);
    ctx.lineTo(pipeX, item.y + 20);
    ctx.quadraticCurveTo(pipeX, item.y + 10, pipeX + direction * 11, item.y + 10);
    ctx.lineTo(leftSide ? item.x + item.w - 18 : item.x + 18, item.y + 10);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(132,174,181,.38)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'rgba(21,39,45,.82)';
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(161,199,202,.50)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(100,207,214,.70)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const angle = -2.4 + (.58 + Math.sin(time * .75 + phase) * .08) * 1.65;
    ctx.lineTo(cx + Math.cos(angle) * 13 * direction, cy + Math.sin(angle) * 13);
    ctx.stroke();
    ctx.restore();
  }

  drawFoundryOre(item) {
    const ctx = this.ctx;
    const leftSide = item.x < this.map.width / 2;
    const symmetricX = Math.min(item.x, this.map.width - item.x - item.w);
    const seed = ((symmetricX + item.y) / TILE_SIZE) | 0;
    ctx.save();
    ctx.fillStyle = 'rgba(44,42,36,.82)';
    ctx.strokeStyle = 'rgba(236,161,75,.35)';
    ctx.lineWidth = 1.2;
    for (let index = 0; index < 7; index += 1) {
      const offset = 17 + unitHash(seed, index, 61) * (item.w - 34);
      const x = leftSide ? item.x + offset : item.x + item.w - offset;
      const y = item.y + 14 + unitHash(seed, index, 67) * Math.max(12, item.h - 34);
      const radius = 4 + unitHash(seed, index, 71) * 5;
      ctx.beginPath();
      ctx.moveTo(x - radius, y + 1);
      ctx.lineTo(x - radius * .32, y - radius);
      ctx.lineTo(x + radius * .78, y - radius * .45);
      ctx.lineTo(x + radius, y + radius * .58);
      ctx.lineTo(x - radius * .45, y + radius);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  drawFoundryCenterRail(item, time) {
    const ctx = this.ctx;
    const symmetricX = Math.min(item.x, this.map.width - item.x - item.w);
    const pulse = .60 + Math.sin(time * 6.8 + symmetricX * .01) * .13;
    ctx.save();
    ctx.fillStyle = 'rgba(28,35,34,.76)';
    ctx.fillRect(item.x + item.w * .5 - 8, item.y + 16, 16, item.h - 34);
    ctx.strokeStyle = 'rgba(229,199,96,.42)';
    ctx.lineWidth = 2;
    ctx.strokeRect(item.x + item.w * .5 - 8, item.y + 16, 16, item.h - 34);
    ctx.fillStyle = 'rgba(255,109,32,.78)';
    ctx.globalAlpha *= pulse;
    for (let y = item.y + 29; y < item.y + item.h - 24; y += 33) {
      ctx.beginPath();
      ctx.arc(item.x + item.w * .5, y, 3.2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  drawFoundryFlankGate(item, time) {
    const ctx = this.ctx;
    const cx = item.x + item.w * .5;
    const cy = item.y + Math.max(34, (item.h - 12) * .52);
    const direction = item.x < this.map.width / 2 ? 1 : -1;
    ctx.save();
    ctx.fillStyle = 'rgba(21,34,38,.82)';
    ctx.strokeStyle = 'rgba(164,184,181,.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(item.x + 10, item.y + 10, item.w - 20, item.h - 32, 3);
    ctx.fill();
    ctx.stroke();
    this.drawGear(cx, cy, Math.min(22, item.w * .28), 10, time * .66 * direction, '#526b70');
    ctx.restore();
  }

  drawFoundrySmelter(item, time) {
    const ctx = this.ctx;
    const topH = Math.max(34, item.h - 12);
    const north = item.y < this.map.height / 2;
    const phase = north ? .18 : .68;
    const apertureW = Math.min(78, item.w * .34);
    const apertureH = Math.min(50, topH * .54);
    const apertureX = item.x + item.w * .5 - apertureW * .5;
    const apertureY = item.y + topH * .5 - apertureH * .5;
    const inheritedAlpha = ctx.globalAlpha;
    ctx.save();
    ctx.fillStyle = 'rgba(18,24,24,.94)';
    ctx.strokeStyle = 'rgba(180,110,52,.66)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(apertureX, apertureY, apertureW, apertureH, 4);
    ctx.fill();
    ctx.stroke();

    const glow = .52 + Math.sin(time * 7.8 + phase * TAU) * .11;
    ctx.fillStyle = 'rgba(244,89,23,.62)';
    ctx.globalAlpha = inheritedAlpha * glow;
    ctx.fillRect(apertureX + 8, apertureY + apertureH - 10, apertureW - 16, 5);
    ctx.globalAlpha = inheritedAlpha;
    this.drawFlame(item.x + item.w * .5, apertureY + apertureH - 7, .62, phase, 0, time, 'furnace');

    const gearDirection = north ? 1 : -1;
    this.drawGear(item.x + 37, item.y + topH * .5, 15, 9, time * .55 * gearDirection, '#415a60');
    this.drawGear(item.x + item.w - 37, item.y + topH * .5, 15, 9, -time * .55 * gearDirection, '#415a60');
    ctx.restore();
  }

  drawFoundryCore(item, time) {
    const ctx = this.ctx;
    const topH = Math.max(34, item.h - 20);
    const cx = item.x + item.w * .5;
    const cy = item.y + topH * .46;
    const symmetricX = Math.min(item.x, this.map.width - item.x - item.w);
    const phase = ((symmetricX + item.y) / TILE_SIZE) * .11;
    const direction = item.x < this.map.width / 2 ? 1 : -1;
    const inheritedAlpha = ctx.globalAlpha;
    ctx.save();

    ctx.fillStyle = 'rgba(22,29,29,.92)';
    ctx.strokeStyle = 'rgba(191,124,67,.62)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(27, item.w * .31), 0, TAU);
    ctx.fill();
    ctx.stroke();
    this.drawGear(cx, cy, Math.min(21, item.w * .24), 8, time * .82 * direction + phase, '#6f7773');

    const pulse = .56 + Math.sin(time * 9.2 + phase * TAU) * .12;
    ctx.globalAlpha = inheritedAlpha * pulse;
    ctx.fillStyle = 'rgba(255,98,24,.78)';
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = inheritedAlpha;

    const ventY = item.y + topH - 24;
    ctx.fillStyle = 'rgba(22,27,25,.88)';
    ctx.fillRect(item.x + 12, ventY, item.w - 24, 12);
    ctx.fillStyle = 'rgba(241,104,31,.74)';
    ctx.globalAlpha = inheritedAlpha * pulse * .9;
    for (let x = item.x + 18; x < item.x + item.w - 16; x += 14) ctx.fillRect(x, ventY + 4, 7, 3);
    ctx.globalAlpha = inheritedAlpha;
    this.drawFlame(cx, ventY + 8, .45, phase, direction * .04, time, 'vent');
    ctx.restore();
  }

  drawFoundryAnvil(item, time) {
    const ctx = this.ctx;
    const inheritedAlpha = ctx.globalAlpha;
    const centerX = item.x + item.w * .5;
    const topY = item.y + 22;
    const symmetricX = Math.min(item.x, this.map.width - item.x - item.w);
    const pulse = .50 + Math.sin(time * 5.9 + symmetricX * .013) * .09;
    ctx.save();
    ctx.fillStyle = 'rgba(32,38,37,.92)';
    ctx.strokeStyle = 'rgba(221,154,76,.48)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(item.x + 10, topY);
    ctx.lineTo(item.x + item.w - 10, topY);
    ctx.lineTo(item.x + item.w - 20, topY + 14);
    ctx.lineTo(centerX + 12, topY + 16);
    ctx.lineTo(centerX + 8, item.y + item.h - 18);
    ctx.lineTo(centerX - 8, item.y + item.h - 18);
    ctx.lineTo(centerX - 12, topY + 16);
    ctx.lineTo(item.x + 20, topY + 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,121,35,.82)';
    ctx.globalAlpha = inheritedAlpha * pulse;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(item.x + 17, topY + 3);
    ctx.lineTo(item.x + item.w - 17, topY + 3);
    ctx.stroke();
    ctx.restore();
  }

  drawFan(x, y, radius, angle, detailColor) {
    const ctx = this.ctx;
    const inheritedAlpha = ctx.globalAlpha;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(19,31,35,.90)';
    ctx.strokeStyle = 'rgba(151,174,174,.42)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.rotate(angle);
    ctx.fillStyle = detailColor || '#829a9a';
    ctx.globalAlpha *= .62;
    for (let index = 0; index < 6; index += 1) {
      ctx.rotate(TAU / 6);
      ctx.beginPath();
      ctx.moveTo(3, -2);
      ctx.quadraticCurveTo(radius * .58, -radius * .30, radius * .79, -radius * .10);
      ctx.quadraticCurveTo(radius * .58, radius * .11, 4, 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = inheritedAlpha;
    ctx.fillStyle = 'rgba(24,38,41,.96)';
    ctx.beginPath();
    ctx.arc(0, 0, radius * .20, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  drawGear(x, y, radius, teeth, angle, color) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(190,202,195,.36)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let index = 0; index < teeth * 2; index += 1) {
      const a = index * Math.PI / teeth;
      const r = index & 1 ? radius * .80 : radius;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(21,32,34,.96)';
    ctx.beginPath();
    ctx.arc(0, 0, radius * .32, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  drawPiston(x, y, length, travel, time, phase, angle = 0) {
    const ctx = this.ctx;
    const shift = Math.sin(time * 1.9 + phase * TAU) * travel;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = 'rgba(20,34,38,.90)';
    ctx.fillRect(-6, -10, length + 12, 20);
    ctx.fillStyle = 'rgba(132,153,153,.78)';
    ctx.fillRect(0, -3, length, 6);
    ctx.fillStyle = 'rgba(57,76,78,.96)';
    ctx.fillRect(length * .46 + shift - 8, -11, 16, 22);
    ctx.strokeStyle = 'rgba(187,198,192,.42)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(length * .46 + shift - 8, -11, 16, 22);
    ctx.restore();
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
