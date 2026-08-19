import { TILE_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from '../engine/constants.js';

export class TileMap {
  constructor(definition) {
    this.definition = definition;
    this.width = WORLD_WIDTH;
    this.height = WORLD_HEIGHT;
    this.tileSize = TILE_SIZE;
    this.structures = definition.structures;
    this.blockers = this.structures.filter((item) => ['wall', 'low', 'tall'].includes(item.kind));
  }

  tileAtWorld(x, y) {
    return {
      col: Math.max(0, Math.min(this.definition.cols - 1, Math.floor(x / this.tileSize))),
      row: Math.max(0, Math.min(this.definition.rows - 1, Math.floor(y / this.tileSize)))
    };
  }

  groundType(col, row) {
    if (row <= 5 || row >= 16) return 'grass';
    if (row >= 8 && row <= 13) return 'asphalt';
    if (col <= 4 || col >= this.definition.cols - 5) return 'spawnConcrete';
    return 'concrete';
  }
}
