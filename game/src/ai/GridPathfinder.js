import { TILE_SIZE } from '../engine/constants.js';
import { circleIntersectsRect } from '../world/Collision.js';

const CARDINAL_COST = 1;
const DIAGONAL_COST = Math.SQRT2;
const NEIGHBORS = [
  [1, 0, CARDINAL_COST], [-1, 0, CARDINAL_COST], [0, 1, CARDINAL_COST], [0, -1, CARDINAL_COST],
  [1, 1, DIAGONAL_COST], [1, -1, DIAGONAL_COST], [-1, 1, DIAGONAL_COST], [-1, -1, DIAGONAL_COST]
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export class GridPathfinder {
  constructor(map, radius, clearance = 4) {
    this.map = map;
    this.cols = map.definition.cols;
    this.rows = map.definition.rows;
    this.radius = Math.max(1, radius);
    this.clearance = clearance;
    this.walkable = new Uint8Array(this.cols * this.rows);
    this.mapRevision = -1;
    this.rebuild();
  }

  syncMap() {
    const nextCols = this.map.definition.cols;
    const nextRows = this.map.definition.rows;
    const revision = Number(this.map.revision || 0);
    if (revision === this.mapRevision && nextCols === this.cols && nextRows === this.rows) return false;
    this.cols = nextCols;
    this.rows = nextRows;
    if (this.walkable.length !== this.cols * this.rows) this.walkable = new Uint8Array(this.cols * this.rows);
    this.rebuild();
    return true;
  }

  rebuild() {
    if (this.walkable.length !== this.cols * this.rows) this.walkable = new Uint8Array(this.cols * this.rows);
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        const point = this.tileCenter(col, row);
        this.walkable[this.index(col, row)] = this.isWorldWalkable(point.x, point.y) ? 1 : 0;
      }
    }
    this.mapRevision = Number(this.map.revision || 0);
  }

  index(col, row) {
    return row * this.cols + col;
  }

  inBounds(col, row) {
    return col >= 0 && row >= 0 && col < this.cols && row < this.rows;
  }

  tileCenter(col, row) {
    return { x: (col + 0.5) * TILE_SIZE, y: (row + 0.5) * TILE_SIZE, col, row };
  }

  worldToTile(x, y) {
    return {
      col: clamp(Math.floor(x / TILE_SIZE), 0, this.cols - 1),
      row: clamp(Math.floor(y / TILE_SIZE), 0, this.rows - 1)
    };
  }

  isWorldWalkable(x, y, radius = this.radius) {
    const padded = radius + this.clearance;
    if (x < padded || y < padded || x > this.map.width - padded || y > this.map.height - padded) return false;
    return !this.map.blockers.some((rect) => circleIntersectsRect(x, y, padded, rect));
  }

  isTileWalkable(col, row) {
    return this.inBounds(col, row) && this.walkable[this.index(col, row)] === 1;
  }

  nearestWalkable(tile, maxRadius = 5) {
    if (this.isTileWalkable(tile.col, tile.row)) return tile;
    for (let radius = 1; radius <= maxRadius; radius += 1) {
      let best = null;
      let bestDistance = Infinity;
      for (let y = -radius; y <= radius; y += 1) {
        for (let x = -radius; x <= radius; x += 1) {
          if (Math.max(Math.abs(x), Math.abs(y)) !== radius) continue;
          const col = tile.col + x;
          const row = tile.row + y;
          if (!this.isTileWalkable(col, row)) continue;
          const distance = x * x + y * y;
          if (distance < bestDistance) {
            bestDistance = distance;
            best = { col, row };
          }
        }
      }
      if (best) return best;
    }
    return null;
  }

  canUseDiagonal(col, row, nextCol, nextRow) {
    const dc = nextCol - col;
    const dr = nextRow - row;
    if (!dc || !dr) return true;
    return this.isTileWalkable(col + dc, row) && this.isTileWalkable(col, row + dr);
  }

  segmentClear(from, to) {
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(distance / 14));
    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t;
      if (!this.isWorldWalkable(x, y)) return false;
    }
    return true;
  }

  findPath(startWorld, goalWorld) {
    this.syncMap();
    const rawStart = this.worldToTile(startWorld.x, startWorld.y);
    const rawGoal = this.worldToTile(goalWorld.x, goalWorld.y);
    const start = this.nearestWalkable(rawStart);
    const goal = this.nearestWalkable(rawGoal);
    if (!start || !goal) return [];

    if (start.col === goal.col && start.row === goal.row) {
      return this.segmentClear(startWorld, goalWorld) ? [{ x: goalWorld.x, y: goalWorld.y }] : [this.tileCenter(goal.col, goal.row)];
    }

    const count = this.cols * this.rows;
    const gScore = new Float64Array(count);
    const fScore = new Float64Array(count);
    const parent = new Int32Array(count);
    const closed = new Uint8Array(count);
    gScore.fill(Infinity);
    fScore.fill(Infinity);
    parent.fill(-1);

    const startIndex = this.index(start.col, start.row);
    const goalIndex = this.index(goal.col, goal.row);
    gScore[startIndex] = 0;
    fScore[startIndex] = Math.hypot(goal.col - start.col, goal.row - start.row);
    const open = [startIndex];

    while (open.length) {
      let bestOpenIndex = 0;
      for (let i = 1; i < open.length; i += 1) {
        if (fScore[open[i]] < fScore[open[bestOpenIndex]]) bestOpenIndex = i;
      }
      const currentIndex = open.splice(bestOpenIndex, 1)[0];
      if (currentIndex === goalIndex) break;
      if (closed[currentIndex]) continue;
      closed[currentIndex] = 1;

      const currentCol = currentIndex % this.cols;
      const currentRow = Math.floor(currentIndex / this.cols);
      for (const [dc, dr, stepCost] of NEIGHBORS) {
        const col = currentCol + dc;
        const row = currentRow + dr;
        if (!this.isTileWalkable(col, row) || !this.canUseDiagonal(currentCol, currentRow, col, row)) continue;
        const nextIndex = this.index(col, row);
        if (closed[nextIndex]) continue;
        const tentative = gScore[currentIndex] + stepCost;
        if (tentative >= gScore[nextIndex]) continue;
        parent[nextIndex] = currentIndex;
        gScore[nextIndex] = tentative;
        fScore[nextIndex] = tentative + Math.hypot(goal.col - col, goal.row - row);
        if (!open.includes(nextIndex)) open.push(nextIndex);
      }
    }

    if (parent[goalIndex] === -1) return [];
    const nodes = [];
    let cursor = goalIndex;
    while (cursor !== -1 && cursor !== startIndex) {
      const col = cursor % this.cols;
      const row = Math.floor(cursor / this.cols);
      nodes.push(this.tileCenter(col, row));
      cursor = parent[cursor];
    }
    nodes.reverse();

    const smoothed = [];
    let anchor = { x: startWorld.x, y: startWorld.y };
    let index = 0;
    while (index < nodes.length) {
      let furthest = index;
      for (let test = nodes.length - 1; test >= index; test -= 1) {
        if (this.segmentClear(anchor, nodes[test])) {
          furthest = test;
          break;
        }
      }
      const point = nodes[furthest];
      smoothed.push({ x: point.x, y: point.y });
      anchor = point;
      index = furthest + 1;
    }

    if (this.isWorldWalkable(goalWorld.x, goalWorld.y) && this.segmentClear(anchor, goalWorld)) {
      smoothed.push({ x: goalWorld.x, y: goalWorld.y });
    }
    return smoothed;
  }
}
