import { TILE_SIZE } from '../engine/constants.js';

const T = TILE_SIZE;
const FOUNDRY_COLS = 38;
const FOUNDRY_ROWS = 24;
const WORLD_W = FOUNDRY_COLS * T;
const WORLD_H = FOUNDRY_ROWS * T;

const pxRect = (x, y, w, h, kind, palette = 'steel', label = '', visualRole = '') => ({
  x:x * T, y:y * T, w:w * T, h:h * T, kind, palette, label,
  ...(visualRole ? { visualRole } : {})
});
const mirrorRectX = (item) => ({
  ...item,
  x:WORLD_W - item.x - item.w,
  label:item.label ? `${item.label} East` : '',
  mirrored:true
});
const mirrorRectY = (item) => ({
  ...item,
  y:WORLD_H - item.y - item.h,
  label:item.label ? item.label.replace('North', 'South') : '',
  mirroredY:true
});
const pairX = (item) => [item, mirrorRectX(item)];
const quad = (item) => {
  const south = mirrorRectY(item);
  return [item, mirrorRectX(item), south, mirrorRectX(south)];
};

const point = (x, y, options = {}) => ({ x:x * T, y:y * T, ...options });
const mirrorPointX = (item) => ({
  ...item,
  x:WORLD_W - item.x,
  directionX:Number.isFinite(item.directionX) ? -item.directionX : item.directionX,
  driftX:Number.isFinite(item.driftX) ? -item.driftX : item.driftX,
  mirrored:true
});
const mirrorPointY = (item) => ({
  ...item,
  y:WORLD_H - item.y,
  directionY:Number.isFinite(item.directionY) ? -item.directionY : item.directionY,
  driftY:Number.isFinite(item.driftY) ? -item.driftY : item.driftY,
  mirroredY:true
});
const pointPairX = (item) => [item, mirrorPointX(item)];
const pointQuad = (item) => {
  const south = mirrorPointY(item);
  return [item, mirrorPointX(item), south, mirrorPointX(south)];
};

const visualRect = (x, y, w, h, type, options = {}) => ({ x:x * T, y:y * T, w:w * T, h:h * T, type, ...options });
const mirrorVisualRectX = (item) => ({ ...item, x:WORLD_W - item.x - item.w, mirrored:true });
const mirrorVisualRectY = (item) => ({ ...item, y:WORLD_H - item.y - item.h, mirroredY:true });
const visualPairX = (item) => [item, mirrorVisualRectX(item)];
const visualQuad = (item) => {
  const south = mirrorVisualRectY(item);
  return [item, mirrorVisualRectX(item), south, mirrorVisualRectX(south)];
};

const pipe = (points, options = {}) => ({ points:points.map(([x, y]) => [x * T, y * T]), ...options });
const mirrorPipeX = (item) => ({ ...item, points:item.points.map(([x, y]) => [WORLD_W - x, y]), mirrored:true });
const mirrorPipeY = (item) => ({ ...item, points:item.points.map(([x, y]) => [x, WORLD_H - y]), mirroredY:true });
const pipeQuad = (item) => {
  const south = mirrorPipeY(item);
  return [item, mirrorPipeX(item), south, mirrorPipeX(south)];
};

const perimeter = [
  pxRect(0, 0, FOUNDRY_COLS, 1, 'wall', 'navy', 'North Perimeter'),
  pxRect(0, FOUNDRY_ROWS - 1, FOUNDRY_COLS, 1, 'wall', 'navy', 'South Perimeter'),
  pxRect(0, 1, 1, FOUNDRY_ROWS - 2, 'wall', 'navy', 'West Perimeter'),
  pxRect(FOUNDRY_COLS - 1, 1, 1, FOUNDRY_ROWS - 2, 'wall', 'navy', 'East Perimeter')
];

// Four readable industrial districts surround a deliberately open center. All
// collision cover is authored in mirrored sets so neither team owns a shorter
// route, stronger head-glitch, or safer opening sightline.
const districtStructures = [
  ...quad(pxRect(4.35, 8.05, 2.05, 2.05, 'low', 'steel', 'North Deployment Baffle', 'spawnShield')),
  ...quad(pxRect(6.65, 2.25, 4.25, 2.85, 'tall', 'warehouse', 'North Forge Hall', 'forgeHall')),
  ...quad(pxRect(10.55, 7.05, 2.0, 2.1, 'wall', 'steel', 'North Coolant Block', 'coolantBlock')),
  ...quad(pxRect(11.8, 3.65, 1.55, 1.15, 'low', 'crate', 'North Loading Pallet', 'oreStack')),
  ...pairX(pxRect(13.55, 10.05, 1.05, 3.9, 'low', 'steel', 'Center Service Rail', 'centerRail'))
];

const coreStructures = [
  pxRect(17.0, 3.05, 4.0, 1.85, 'wall', 'navy', 'North Smelter', 'smelter'),
  pxRect(17.0, 19.10, 4.0, 1.85, 'wall', 'navy', 'South Smelter', 'smelter'),
  pxRect(16.35, 7.95, 1.35, 2.15, 'tall', 'steel', 'Forge Core NW', 'forgeCore'),
  pxRect(20.30, 7.95, 1.35, 2.15, 'tall', 'steel', 'Forge Core NE', 'forgeCore'),
  pxRect(16.35, 13.90, 1.35, 2.15, 'tall', 'steel', 'Forge Core SW', 'forgeCore'),
  pxRect(20.30, 13.90, 1.35, 2.15, 'tall', 'steel', 'Forge Core SE', 'forgeCore'),
  pxRect(17.25, 11.15, 1.20, 1.70, 'low', 'steel', 'Center Anvil West', 'anvil'),
  pxRect(19.55, 11.15, 1.20, 1.70, 'low', 'steel', 'Center Anvil East', 'anvil')
];

// The visual layer follows the architecture: service plates sit at loading
// points, drains sit beside coolant machinery, and thresholds guard the core.
const floorPlates = [
  ...visualQuad(visualRect(1.35, 2.10, 3.65, .40, 'servicePlate')),
  ...visualQuad(visualRect(6.25, 5.34, 4.85, .30, 'drainPlate')),
  ...visualPairX(visualRect(13.30, 9.70, 1.55, .26, 'coreThreshold')),
  ...visualPairX(visualRect(13.30, 14.04, 1.55, .26, 'coreThreshold')),
  visualRect(15.80, 10.52, 6.40, .22, 'coreThreshold'),
  visualRect(15.80, 13.26, 6.40, .22, 'coreThreshold')
];

const warningBands = [
  ...visualQuad(visualRect(4.12, 7.73, 2.52, .16, 'warningBand')),
  ...visualQuad(visualRect(11.52, 4.94, 2.08, .15, 'warningBand')),
  visualRect(15.82, 10.62, 6.36, .14, 'warningBand'),
  visualRect(15.82, 13.24, 6.36, .14, 'warningBand')
];

// Closed-loop pipe runs connect each hall to its coolant block. The two center
// feeds terminate at the smelter banks instead of floating as decorative lines.
const pipes = [
  ...pipeQuad(pipe([[1.05, 3.15], [3.25, 3.15], [3.25, 5.72], [6.05, 5.72]], { width:9, phase:.15 })),
  ...pipeQuad(pipe([[9.15, 2.02], [11.15, 2.02], [11.15, 5.88], [12.10, 5.88], [12.10, 6.72]], { width:7, phase:.35 })),
  ...pipeQuad(pipe([[14.85, 5.28], [16.10, 5.28], [16.10, 4.20], [16.85, 4.20]], { width:7, phase:.25 }))
];

const scorchMarks = [
  ...pointQuad(point(11.10, 5.38, { rx:31, ry:13, angle:-.10, alpha:.13 }))
];

// Six restrained heat sources replace the old field of disconnected flames.
// Every source gets a visible housing below and is still presentation-only.
const flames = [
  ...pointQuad(point(11.10, 5.18, { scale:.74, phase:.10, directionX:.08, cullRadius:76, kind:'pipe' })),
  point(19.0, 5.10, { scale:1.02, phase:.24, directionX:0, cullRadius:90, kind:'furnace' }),
  point(19.0, 18.90, { scale:1.02, phase:.74, directionX:0, cullRadius:90, kind:'furnace' })
];

const burnerHousings = flames.map((source) => ({
  x:source.x - (source.kind === 'furnace' ? .62 : .42) * T,
  y:source.y - .14 * T,
  w:(source.kind === 'furnace' ? 1.24 : .84) * T,
  h:(source.kind === 'furnace' ? .34 : .26) * T,
  type:source.kind === 'furnace' ? 'furnaceThroat' : 'pipeBurner',
  mirrored:source.mirrored === true,
  mirroredY:source.mirroredY === true
}));

const emberEmitters = flames.map((source) => ({
  x:source.x,
  y:source.y,
  mirrored:source.mirrored === true,
  mirroredY:source.mirroredY === true,
  scale:source.scale,
  phase:source.phase,
  cullRadius:source.cullRadius + 24,
  slots:source.kind === 'furnace' ? 6 : 4,
  seed:2600 + Math.round(source.phase * 1000)
}));

const smokeEmitters = [
  ...pointQuad(point(8.25, 2.02, { slots:2, seed:2641, phase:.05, cullRadius:110, driftX:-5, scale:.82 })),
  point(19.0, 2.82, { slots:2, seed:2977, phase:.24, cullRadius:102, driftX:0, scale:.72 }),
  point(19.0, 21.18, { slots:2, seed:3091, phase:.74, cullRadius:102, driftX:0, scale:.72 })
];

const steamVents = [
  ...pointQuad(point(10.42, 6.62, { slots:3, seed:3301, phase:.15, period:5.2, duration:.70, directionX:-.28, cullRadius:90 }))
];

const warmLights = flames.map((source) => ({
  x:source.x,
  y:source.y,
  radius:(source.kind === 'furnace' ? 142 : 90) * source.scale,
  alpha:source.kind === 'furnace' ? .14 : .08,
  phase:source.phase,
  cullRadius:(source.kind === 'furnace' ? 164 : 110) * source.scale
}));

const presentationBudgets = Object.freeze({
  maxAmbientSources:36,
  maxParticleSlots:84,
  maxSlotsPerEmitter:6,
  maxLightRadius:176,
  maxStaticFixtures:48
});

export const MAP_02 = {
  id:'foundry-zero',
  name:'Foundry Zero',
  mode:'arena',
  arenaOnly:true,
  cols:FOUNDRY_COLS,
  rows:FOUNDRY_ROWS,
  tileSize:TILE_SIZE,
  laneBounds:Object.freeze({ top:8, bottom:16 }),
  theme:'Competitive steelworks and forge complex',
  description:'A larger mirrored three-route Arena battleground with protected deployment bays, open rotations and a disciplined central forge.',
  groundType(col, row) {
    if (col <= 5 || col >= FOUNDRY_COLS - 6) return 'spawnConcrete';
    if (row >= 8 && row <= 15) return 'asphalt';
    return 'concrete';
  },
  spawns:{
    blue:[
      { x:2.55 * T, y:8.55 * T },
      { x:2.75 * T, y:12.00 * T },
      { x:2.55 * T, y:15.45 * T }
    ],
    red:[
      { x:35.45 * T, y:8.55 * T },
      { x:35.25 * T, y:12.00 * T },
      { x:35.45 * T, y:15.45 * T }
    ]
  },
  structures:[...perimeter, ...districtStructures, ...coreStructures],
  decals:[
    { type:'lane', y:11.90 * T },
    { type:'spawn', team:'blue', x:1.15 * T, y:7.05 * T, w:3.55 * T, h:9.90 * T },
    { type:'spawn', team:'red', x:33.30 * T, y:7.05 * T, w:3.55 * T, h:9.90 * T }
  ],
  presentation:{
    id:'foundry-zero-phase3',
    schema:2,
    enabled:true,
    symmetryAxisX:WORLD_W / 2,
    nonBlocking:true,
    deterministicSeed:260001,
    deterministic:true,
    systems:['burnerHousings', 'furnaceFlames', 'pipeFire', 'embers', 'heatShimmer', 'warmLights', 'lightSmoke', 'steamBursts', 'fans', 'gears', 'pistons'],
    budgets:presentationBudgets,
    limits:presentationBudgets,
    fixtures:{ floorPlates, warningBands, pipes, scorchMarks, burnerHousings },
    ambience:{ flames, emberEmitters, smokeEmitters, steamVents, warmLights },
    architecture:Object.freeze({
      zones:Object.freeze(['blue-deployment', 'west-forge-lane', 'north-maintenance', 'central-foundry-core', 'south-processing', 'east-forge-lane', 'red-deployment']),
      routes:Object.freeze(['north-maintenance-route', 'central-forge-route', 'south-processing-route']),
      crossRoutes:Object.freeze(['west-service-crossing', 'core-rotation', 'east-service-crossing']),
      fireSources:'mounted-burners-and-smelter-throats',
      coolant:'four-mirrored-closed-loop-blocks',
      ventilation:'roof-stacks-and-smelter-exhausts',
      storage:'loading-pallets-adjacent-to-forge-halls',
      machinery:'guarded-behind-purpose-built-cover-footprints',
      openCombatAreas:true
    }),
    scale:Object.freeze({
      casualAreaTiles:32 * 22,
      arenaAreaTiles:FOUNDRY_COLS * FOUNDRY_ROWS,
      areaRatio:(FOUNDRY_COLS * FOUNDRY_ROWS) / (32 * 22)
    }),
    safety:Object.freeze({
      fireDamage:false,
      fireCollision:false,
      fireSourcesBounded:true,
      sourceCount:flames.length,
      visualOnly:true
    })
  }
};
