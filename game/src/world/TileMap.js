import { TILE_SIZE } from '../engine/constants.js';

export class TileMap {
  constructor(definition) {
    this.tileSize = TILE_SIZE;
    this.revision = 0;
    this.setDefinition(definition);
  }

  setDefinition(definition) {
    if (!definition?.structures || !definition?.spawns) throw new Error('Invalid map definition');
    const cols = Number(definition.cols);
    const rows = Number(definition.rows);
    const tileSize = Number(definition.tileSize || TILE_SIZE);
    if (!Number.isInteger(cols) || cols < 8 || !Number.isInteger(rows) || rows < 8 || !Number.isFinite(tileSize) || tileSize <= 0) {
      throw new Error('Map definitions require valid cols, rows and tileSize values.');
    }
    this.definition = definition;
    this.tileSize = tileSize;
    this.width = cols * tileSize;
    this.height = rows * tileSize;
    this.structures = definition.structures;
    this.blockers = this.structures.filter((item) => ['wall', 'low', 'tall'].includes(item.kind));
    this.revision += 1;
    return this;
  }

  tileAtWorld(x, y) {
    return {
      col: Math.max(0, Math.min(this.definition.cols - 1, Math.floor(x / this.tileSize))),
      row: Math.max(0, Math.min(this.definition.rows - 1, Math.floor(y / this.tileSize)))
    };
  }

  groundType(col, row) {
    if (typeof this.definition.groundType === 'function') {
      const type = this.definition.groundType(col, row);
      if (type) return type;
    }
    if (row <= 5 || row >= 16) return 'grass';
    if (row >= 8 && row <= 13) return 'asphalt';
    if (col <= 4 || col >= this.definition.cols - 5) return 'spawnConcrete';
    return 'concrete';
  }
}
