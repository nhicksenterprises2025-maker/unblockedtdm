import { MAP_COLS, MAP_ROWS, TILE_SIZE } from '../engine/constants.js';

const T = TILE_SIZE;
const pxRect = (x, y, w, h, kind, palette = 'steel', label = '', visualRole = '') => ({ x: x * T, y: y * T, w: w * T, h: h * T, kind, palette, label, ...(visualRole ? { visualRole } : {}) });
const mirrorX = (item) => ({ ...item, x: (MAP_COLS * T) - item.x - item.w, label: item.label ? `${item.label} Mirror` : '' });
const pair = (item) => [item, mirrorX(item)];
const role = (item, visualRole) => ({ ...item, visualRole });

const perimeter = [
  pxRect(0, 0, MAP_COLS, 1, 'wall', 'navy'),
  pxRect(0, MAP_ROWS - 1, MAP_COLS, 1, 'wall', 'navy'),
  pxRect(0, 1, 1, MAP_ROWS - 2, 'wall', 'navy'),
  pxRect(MAP_COLS - 1, 1, 1, MAP_ROWS - 2, 'wall', 'navy')
];

const mirroredStructures = [
  ...pair(role(pxRect(5, 2, 4, 3, 'tall', 'warehouse', 'North Warehouse'), 'trainingHall')),
  ...pair(role(pxRect(5, 17, 4, 3, 'tall', 'warehouse', 'South Warehouse'), 'trainingHall')),
  ...pair(role(pxRect(7, 7, 2, 2, 'wall', 'steel', 'Mid Block'), 'coverModule')),
  ...pair(role(pxRect(7, 13, 2, 2, 'wall', 'steel', 'Mid Block'), 'coverModule')),
  ...pair(role(pxRect(10, 4, 2, 2, 'low', 'crate', 'Upper Crates'), 'supplyCrate')),
  ...pair(role(pxRect(10, 16, 2, 2, 'low', 'crate', 'Lower Crates'), 'supplyCrate')),
  ...pair(role(pxRect(11, 9, 1, 4, 'low', 'barrier', 'Center Barrier'), 'rangeBarrier')),
  ...pair(role(pxRect(3, 6, 2, 1, 'low', 'barrier', 'Spawn Cover'), 'spawnRail')),
  ...pair(role(pxRect(3, 15, 2, 1, 'low', 'barrier', 'Spawn Cover'), 'spawnRail'))
];

const centerStructures = [
  role(pxRect(14, 3, 4, 2, 'wall', 'navy', 'North Terminal'), 'controlTerminal'),
  role(pxRect(14, 17, 4, 2, 'wall', 'navy', 'South Terminal'), 'controlTerminal'),
  role(pxRect(15, 7, 2, 2, 'low', 'crate', 'Center North Crates'), 'supplyCrate'),
  role(pxRect(15, 13, 2, 2, 'low', 'crate', 'Center South Crates'), 'supplyCrate'),
  role(pxRect(14, 10, 1, 2, 'low', 'barrier', 'Center Left'), 'rangeBarrier'),
  role(pxRect(17, 10, 1, 2, 'low', 'barrier', 'Center Right'), 'rangeBarrier')
];

export const MAP_01 = {
  id: 'training-complex',
  name: 'Training Complex',
  cols: MAP_COLS,
  rows: MAP_ROWS,
  tileSize: TILE_SIZE,
  theme: 'Bright Industrial Training Complex',
  description: 'Purpose-built three-lane training range with readable cover modules, protected deployment bays and calibrated center lanes.',
  groundType(col, row) {
    if (col <= 4 || col >= MAP_COLS - 5) return 'spawnConcrete';
    if (row <= 3 || row >= MAP_ROWS - 4) return 'grass';
    if (row >= 7 && row <= 14) return 'asphalt';
    return 'concrete';
  },
  spawns: {
    blue: [
      { x: 2.6 * T, y: 8.2 * T },
      { x: 2.8 * T, y: 11 * T },
      { x: 2.6 * T, y: 13.8 * T }
    ],
    red: [
      { x: 29.4 * T, y: 8.2 * T },
      { x: 29.2 * T, y: 11 * T },
      { x: 29.4 * T, y: 13.8 * T }
    ]
  },
  structures: [...perimeter, ...mirroredStructures, ...centerStructures],
  decals: [
    { type: 'lane', y: 10.85 * T },
    { type: 'spawn', team: 'blue', x: 1.2 * T, y: 7.4 * T, w: 3.2 * T, h: 7.2 * T },
    { type: 'spawn', team: 'red', x: 27.6 * T, y: 7.4 * T, w: 3.2 * T, h: 7.2 * T }
  ],
  presentation: {
    id:'training-complex-2.5',
    schema:1,
    nonBlocking:true,
    deterministic:true,
    systems:['rangeGrid', 'deploymentRails', 'laneCalibration', 'controlPanels', 'coverIdentifiers'],
    zones:Object.freeze(['north-training-yard', 'central-live-fire-lane', 'south-training-yard']),
    budgets:Object.freeze({ maxStaticMarks:72, maxAnimatedSources:0 })
  }
};
