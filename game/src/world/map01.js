import { MAP_COLS, MAP_ROWS, TILE_SIZE } from '../engine/constants.js';

const T = TILE_SIZE;
const pxRect = (x, y, w, h, kind, palette = 'steel', label = '') => ({ x: x * T, y: y * T, w: w * T, h: h * T, kind, palette, label });
const mirrorX = (item) => ({ ...item, x: (MAP_COLS * T) - item.x - item.w, label: item.label ? `${item.label} Mirror` : '' });
const pair = (item) => [item, mirrorX(item)];

const perimeter = [
  pxRect(0, 0, MAP_COLS, 1, 'wall', 'navy'),
  pxRect(0, MAP_ROWS - 1, MAP_COLS, 1, 'wall', 'navy'),
  pxRect(0, 1, 1, MAP_ROWS - 2, 'wall', 'navy'),
  pxRect(MAP_COLS - 1, 1, 1, MAP_ROWS - 2, 'wall', 'navy')
];

const mirroredStructures = [
  ...pair(pxRect(5, 2, 4, 3, 'tall', 'warehouse', 'North Warehouse')),
  ...pair(pxRect(5, 17, 4, 3, 'tall', 'warehouse', 'South Warehouse')),
  ...pair(pxRect(7, 7, 2, 2, 'wall', 'steel', 'Mid Block')),
  ...pair(pxRect(7, 13, 2, 2, 'wall', 'steel', 'Mid Block')),
  ...pair(pxRect(10, 4, 2, 2, 'low', 'crate', 'Upper Crates')),
  ...pair(pxRect(10, 16, 2, 2, 'low', 'crate', 'Lower Crates')),
  ...pair(pxRect(11, 9, 1, 4, 'low', 'barrier', 'Center Barrier')),
  ...pair(pxRect(3, 6, 2, 1, 'low', 'barrier', 'Spawn Cover')),
  ...pair(pxRect(3, 15, 2, 1, 'low', 'barrier', 'Spawn Cover'))
];

const centerStructures = [
  pxRect(14, 3, 4, 2, 'wall', 'navy', 'North Terminal'),
  pxRect(14, 17, 4, 2, 'wall', 'navy', 'South Terminal'),
  pxRect(15, 7, 2, 2, 'low', 'crate', 'Center North Crates'),
  pxRect(15, 13, 2, 2, 'low', 'crate', 'Center South Crates'),
  pxRect(14, 10, 1, 2, 'low', 'barrier', 'Center Left'),
  pxRect(17, 10, 1, 2, 'low', 'barrier', 'Center Right')
];

export const MAP_01 = {
  id: 'training-complex',
  name: 'Training Complex',
  cols: MAP_COLS,
  rows: MAP_ROWS,
  tileSize: TILE_SIZE,
  theme: 'Bright Industrial Training Complex',
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
  ]
};
