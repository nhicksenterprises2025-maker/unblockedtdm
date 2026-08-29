import { MAP_COLS, MAP_ROWS, TILE_SIZE } from '../engine/constants.js';

const T = TILE_SIZE;
const WORLD_W = MAP_COLS * T;
const pxRect = (x, y, w, h, kind, palette = 'steel', label = '', visualRole = '') => ({
  x:x * T, y:y * T, w:w * T, h:h * T, kind, palette, label,
  ...(visualRole ? { visualRole } : {})
});
const mirrorX = (item) => ({ ...item, x:(MAP_COLS * T) - item.x - item.w, label:item.label ? `${item.label} Mirror` : '' });
const pair = (item) => [item, mirrorX(item)];
const point = (x, y, options = {}) => ({ x:x * T, y:y * T, ...options });
const visualRect = (x, y, w, h, type, options = {}) => ({ x:x * T, y:y * T, w:w * T, h:h * T, type, ...options });
const mirrorPointX = (item) => ({
  ...item,
  x:WORLD_W - item.x,
  directionX:Number.isFinite(item.directionX) ? -item.directionX : item.directionX,
  driftX:Number.isFinite(item.driftX) ? -item.driftX : item.driftX,
  mirrored:true
});
const pointPair = (item) => [item, mirrorPointX(item)];
const mirrorVisualRectX = (item) => ({ ...item, x:WORLD_W - item.x - item.w, mirrored:true });
const visualRectPair = (item) => [item, mirrorVisualRectX(item)];
const pipe = (points, options = {}) => ({ points:points.map(([x, y]) => [x * T, y * T]), ...options });
const mirrorPipeX = (item) => ({
  ...item,
  points:item.points.map(([x, y]) => [WORLD_W - x, y]),
  mirrored:true
});
const pipePair = (item) => [item, mirrorPipeX(item)];

const perimeter = [
  pxRect(0, 0, MAP_COLS, 1, 'wall', 'navy', 'North Perimeter'),
  pxRect(0, MAP_ROWS - 1, MAP_COLS, 1, 'wall', 'navy', 'South Perimeter'),
  pxRect(0, 1, 1, MAP_ROWS - 2, 'wall', 'navy', 'West Perimeter'),
  pxRect(MAP_COLS - 1, 1, 1, MAP_ROWS - 2, 'wall', 'navy', 'East Perimeter')
];

// Foundry Zero is intentionally symmetrical. Spawn bunkers shield the first sightline,
// while three routes remain available through the north hall, center forge, and south hall.
const mirrored = [
  ...pair(pxRect(3.7, 8.0, 2.1, 2.0, 'low', 'barrier', 'Spawn Shield North', 'spawnShield')),
  ...pair(pxRect(3.7, 12.0, 2.1, 2.0, 'low', 'barrier', 'Spawn Shield South', 'spawnShield')),
  ...pair(pxRect(5.5, 2.2, 3.4, 3.0, 'tall', 'warehouse', 'North Forge Hall', 'forgeHall')),
  ...pair(pxRect(5.5, 16.8, 3.4, 3.0, 'tall', 'warehouse', 'South Forge Hall', 'forgeHall')),
  ...pair(pxRect(7.2, 7.0, 2.0, 2.2, 'wall', 'steel', 'North Mid Block', 'coolantBlock')),
  ...pair(pxRect(7.2, 12.8, 2.0, 2.2, 'wall', 'steel', 'South Mid Block', 'coolantBlock')),
  ...pair(pxRect(9.8, 4.7, 1.8, 1.4, 'low', 'crate', 'North Ore Stack', 'oreStack')),
  ...pair(pxRect(9.8, 15.9, 1.8, 1.4, 'low', 'crate', 'South Ore Stack', 'oreStack')),
  ...pair(pxRect(10.6, 9.4, 1.2, 3.2, 'low', 'barrier', 'Center Rail', 'centerRail')),
  ...pair(pxRect(12.0, 2.2, 1.2, 2.4, 'wall', 'steel', 'North Flank Gate', 'flankGate')),
  ...pair(pxRect(12.0, 17.4, 1.2, 2.4, 'wall', 'steel', 'South Flank Gate', 'flankGate'))
];

const center = [
  pxRect(14.0, 3.0, 4.0, 2.0, 'wall', 'navy', 'North Smelter', 'smelter'),
  pxRect(14.0, 17.0, 4.0, 2.0, 'wall', 'navy', 'South Smelter', 'smelter'),
  pxRect(14.2, 7.2, 1.4, 2.2, 'tall', 'steel', 'Forge Core NW', 'forgeCore'),
  pxRect(16.4, 7.2, 1.4, 2.2, 'tall', 'steel', 'Forge Core NE', 'forgeCore'),
  pxRect(14.2, 12.6, 1.4, 2.2, 'tall', 'steel', 'Forge Core SW', 'forgeCore'),
  pxRect(16.4, 12.6, 1.4, 2.2, 'tall', 'steel', 'Forge Core SE', 'forgeCore'),
  pxRect(14.3, 10.2, 1.2, 1.6, 'low', 'barrier', 'Center Anvil West', 'anvil'),
  pxRect(16.5, 10.2, 1.2, 1.6, 'low', 'barrier', 'Center Anvil East', 'anvil')
];

// Presentation metadata is deliberately separate from `structures`: none of these
// records participate in collision, pathfinding, spawning, damage, or match rules.
// Mirrored authoring keeps both teams' visual information density exactly even.
const floorPlates = [
  ...visualRectPair(visualRect(1.35, 2.05, 3.45, .42, 'servicePlate')),
  ...visualRectPair(visualRect(1.35, 19.53, 3.45, .42, 'servicePlate')),
  ...visualRectPair(visualRect(5.15, 5.48, 4.1, .34, 'drainPlate')),
  ...visualRectPair(visualRect(5.15, 16.18, 4.1, .34, 'drainPlate')),
  visualRect(13.55, 6.55, 4.9, .32, 'coreThreshold'),
  visualRect(13.55, 15.13, 4.9, .32, 'coreThreshold'),
  visualRect(13.58, 9.72, 4.84, .25, 'coreThreshold'),
  visualRect(13.58, 12.03, 4.84, .25, 'coreThreshold')
];

const warningBands = [
  ...visualRectPair(visualRect(3.45, 7.58, 2.58, .18, 'warningBand', { angle:0 })),
  ...visualRectPair(visualRect(3.45, 14.24, 2.58, .18, 'warningBand', { angle:0 })),
  ...visualRectPair(visualRect(11.76, 4.83, 1.68, .18, 'warningBand', { angle:0 })),
  ...visualRectPair(visualRect(11.76, 16.99, 1.68, .18, 'warningBand', { angle:0 })),
  visualRect(13.58, 9.85, 4.84, .16, 'warningBand', { angle:0 }),
  visualRect(13.58, 12.0, 4.84, .16, 'warningBand', { angle:0 })
];

const pipes = [
  ...pipePair(pipe([[1.05, 3.15], [3.15, 3.15], [3.15, 5.65], [4.95, 5.65]], { width:9, phase:.15 })),
  ...pipePair(pipe([[1.05, 18.85], [3.15, 18.85], [3.15, 16.35], [4.95, 16.35]], { width:9, phase:.65 })),
  ...pipePair(pipe([[9.15, 2.02], [10.35, 2.02], [10.35, 3.75], [11.55, 3.75]], { width:7, phase:.35 })),
  ...pipePair(pipe([[9.15, 19.98], [10.35, 19.98], [10.35, 18.25], [11.55, 18.25]], { width:7, phase:.85 }))
];

const scorchMarks = [
  ...pointPair(point(5.08, 5.74, { rx:34, ry:14, angle:-.12, alpha:.16 })),
  ...pointPair(point(5.08, 16.26, { rx:34, ry:14, angle:.12, alpha:.16 })),
  ...pointPair(point(12.9, 5.35, { rx:27, ry:12, angle:.24, alpha:.12 })),
  ...pointPair(point(12.9, 16.65, { rx:27, ry:12, angle:-.24, alpha:.12 })),
  point(16, 6.72, { rx:48, ry:13, angle:0, alpha:.16 }),
  point(16, 15.28, { rx:48, ry:13, angle:0, alpha:.16 })
];

const flames = [
  ...pointPair(point(5.08, 5.47, { scale:.82, phase:.10, directionX:.10, cullRadius:78, kind:'pipe' })),
  ...pointPair(point(5.08, 16.53, { scale:.82, phase:.60, directionX:.10, cullRadius:78, kind:'pipe' })),
  ...pointPair(point(12.92, 4.72, { scale:.66, phase:.32, directionX:.06, cullRadius:68, kind:'vent' })),
  ...pointPair(point(12.92, 17.28, { scale:.66, phase:.82, directionX:.06, cullRadius:68, kind:'vent' })),
  point(16, 6.67, { scale:1.08, phase:.22, directionX:0, cullRadius:92, kind:'furnace' }),
  point(16, 15.33, { scale:1.08, phase:.72, directionX:0, cullRadius:92, kind:'furnace' })
];

const emberEmitters = flames.map((source) => ({
  x:source.x,
  y:source.y,
  mirrored:source.mirrored === true,
  scale:source.scale,
  phase:source.phase,
  cullRadius:source.cullRadius + 26,
  slots:source.kind === 'furnace' ? 8 : 5,
  seed:173 + Math.round(source.phase * 1000)
}));

const smokeEmitters = [
  ...pointPair(point(6.02, 2.02, { slots:3, seed:641, phase:.05, cullRadius:112, driftX:-7, scale:.92 })),
  ...pointPair(point(6.02, 19.98, { slots:3, seed:811, phase:.55, cullRadius:112, driftX:-7, scale:.92 })),
  point(16, 2.82, { slots:3, seed:977, phase:.24, cullRadius:105, driftX:0, scale:.78 }),
  point(16, 19.18, { slots:3, seed:1091, phase:.74, cullRadius:105, driftX:0, scale:.78 })
];

const steamVents = [
  ...pointPair(point(9.22, 3.82, { slots:4, seed:1301, phase:.15, period:4.8, duration:.78, directionX:-.34, cullRadius:92 })),
  ...pointPair(point(9.22, 18.18, { slots:4, seed:1451, phase:.65, period:4.8, duration:.78, directionX:-.34, cullRadius:92 })),
  ...pointPair(point(13.52, 5.22, { slots:3, seed:1601, phase:.35, period:5.6, duration:.68, directionX:-.18, cullRadius:82 })),
  ...pointPair(point(13.52, 16.78, { slots:3, seed:1753, phase:.85, period:5.6, duration:.68, directionX:-.18, cullRadius:82 }))
];

const warmLights = flames.map((source) => ({
  x:source.x,
  y:source.y,
  radius:(source.kind === 'furnace' ? 148 : 96) * source.scale,
  alpha:source.kind === 'furnace' ? .15 : .095,
  phase:source.phase,
  cullRadius:(source.kind === 'furnace' ? 170 : 118) * source.scale
}));

const presentationBudgets = {
  maxAmbientSources:48,
  maxParticleSlots:112,
  maxSlotsPerEmitter:8,
  maxLightRadius:192,
  maxStaticFixtures:64
};

export const MAP_02 = {
  id: 'foundry-zero',
  name: 'Foundry Zero',
  mode: 'arena',
  arenaOnly: true,
  cols: MAP_COLS,
  rows: MAP_ROWS,
  tileSize: TILE_SIZE,
  theme: 'Purpose-built competitive foundry',
  description: 'Symmetrical three-route Arena battleground with protected spawn pockets, split center-core cover and fast north/south flanks.',
  groundType(col, row) {
    if (col <= 4 || col >= MAP_COLS - 5) return 'spawnConcrete';
    if (row >= 7 && row <= 14) return 'asphalt';
    return 'concrete';
  },
  spawns: {
    blue: [
      { x:2.35 * T, y:7.4 * T },
      { x:2.55 * T, y:11.0 * T },
      { x:2.35 * T, y:14.6 * T }
    ],
    red: [
      { x:29.65 * T, y:7.4 * T },
      { x:29.45 * T, y:11.0 * T },
      { x:29.65 * T, y:14.6 * T }
    ]
  },
  structures: [...perimeter, ...mirrored, ...center],
  decals: [
    { type:'lane', y:10.85 * T },
    { type:'spawn', team:'blue', x:1.15 * T, y:6.55 * T, w:3.1 * T, h:8.9 * T },
    { type:'spawn', team:'red', x:27.75 * T, y:6.55 * T, w:3.1 * T, h:8.9 * T }
  ],
  presentation: {
    id:'foundry-zero-phase3',
    schema:1,
    enabled:true,
    symmetryAxisX:WORLD_W / 2,
    nonBlocking:true,
    deterministicSeed:243303,
    deterministic:true,
    systems:['furnaceFlames', 'pipeFire', 'embers', 'heatShimmer', 'warmLights', 'lightSmoke', 'steamBursts', 'fans', 'gears', 'pistons'],
    budgets:presentationBudgets,
    limits:presentationBudgets,
    fixtures: {
      floorPlates,
      warningBands,
      pipes,
      scorchMarks
    },
    ambience: {
      flames,
      emberEmitters,
      smokeEmitters,
      steamVents,
      warmLights
    }
  }
};
