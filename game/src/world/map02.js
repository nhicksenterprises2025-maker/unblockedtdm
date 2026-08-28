import { MAP_COLS, MAP_ROWS, TILE_SIZE } from '../engine/constants.js';

const T = TILE_SIZE;
const pxRect = (x, y, w, h, kind, palette = 'steel', label = '') => ({ x:x * T, y:y * T, w:w * T, h:h * T, kind, palette, label });
const mirrorX = (item) => ({ ...item, x:(MAP_COLS * T) - item.x - item.w, label:item.label ? `${item.label} Mirror` : '' });
const pair = (item) => [item, mirrorX(item)];

const perimeter = [
  pxRect(0, 0, MAP_COLS, 1, 'wall', 'navy', 'North Perimeter'),
  pxRect(0, MAP_ROWS - 1, MAP_COLS, 1, 'wall', 'navy', 'South Perimeter'),
  pxRect(0, 1, 1, MAP_ROWS - 2, 'wall', 'navy', 'West Perimeter'),
  pxRect(MAP_COLS - 1, 1, 1, MAP_ROWS - 2, 'wall', 'navy', 'East Perimeter')
];

// Foundry Zero is intentionally symmetrical. Spawn bunkers shield the first sightline,
// while three routes remain available through the north hall, center forge, and south hall.
const mirrored = [
  ...pair(pxRect(3.7, 8.0, 2.1, 2.0, 'low', 'barrier', 'Spawn Shield North')),
  ...pair(pxRect(3.7, 12.0, 2.1, 2.0, 'low', 'barrier', 'Spawn Shield South')),
  ...pair(pxRect(5.5, 2.2, 3.4, 3.0, 'tall', 'warehouse', 'North Forge Hall')),
  ...pair(pxRect(5.5, 16.8, 3.4, 3.0, 'tall', 'warehouse', 'South Forge Hall')),
  ...pair(pxRect(7.2, 7.0, 2.0, 2.2, 'wall', 'steel', 'North Mid Block')),
  ...pair(pxRect(7.2, 12.8, 2.0, 2.2, 'wall', 'steel', 'South Mid Block')),
  ...pair(pxRect(9.8, 4.7, 1.8, 1.4, 'low', 'crate', 'North Ore Stack')),
  ...pair(pxRect(9.8, 15.9, 1.8, 1.4, 'low', 'crate', 'South Ore Stack')),
  ...pair(pxRect(10.6, 9.4, 1.2, 3.2, 'low', 'barrier', 'Center Rail')),
  ...pair(pxRect(12.0, 2.2, 1.2, 2.4, 'wall', 'steel', 'North Flank Gate')),
  ...pair(pxRect(12.0, 17.4, 1.2, 2.4, 'wall', 'steel', 'South Flank Gate'))
];

const center = [
  pxRect(14.0, 3.0, 4.0, 2.0, 'wall', 'navy', 'North Smelter'),
  pxRect(14.0, 17.0, 4.0, 2.0, 'wall', 'navy', 'South Smelter'),
  pxRect(14.2, 7.2, 1.4, 2.2, 'tall', 'steel', 'Forge Core NW'),
  pxRect(16.4, 7.2, 1.4, 2.2, 'tall', 'steel', 'Forge Core NE'),
  pxRect(14.2, 12.6, 1.4, 2.2, 'tall', 'steel', 'Forge Core SW'),
  pxRect(16.4, 12.6, 1.4, 2.2, 'tall', 'steel', 'Forge Core SE'),
  pxRect(14.3, 10.2, 1.2, 1.6, 'low', 'barrier', 'Center Anvil West'),
  pxRect(16.5, 10.2, 1.2, 1.6, 'low', 'barrier', 'Center Anvil East')
];

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
  ]
};
