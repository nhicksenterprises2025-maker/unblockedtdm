import { TILE_SIZE } from '../engine/constants.js';
import { circleIntersectsRect } from '../world/Collision.js';

const CARDINAL_COST = 1;
const DIAGONAL_COST = Math.SQRT2;
const NEIGHBORS = Object.freeze([
  [1, 0, CARDINAL_COST], [-1, 0, CARDINAL_COST], [0, 1, CARDINAL_COST], [0, -1, CARDINAL_COST],
  [1, 1, DIAGONAL_COST], [1, -1, DIAGONAL_COST], [-1, 1, DIAGONAL_COST], [-1, -1, DIAGONAL_COST]
]);
const STEERING_OFFSETS = Object.freeze([
  0, Math.PI / 8, -Math.PI / 8, Math.PI / 4, -Math.PI / 4,
  Math.PI * 3 / 8, -Math.PI * 3 / 8, Math.PI / 2, -Math.PI / 2,
  Math.PI * 3 / 4, -Math.PI * 3 / 4, Math.PI
]);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const normalize = (x, y) => {
  const length = Math.hypot(x, y);
  return length > 0.0001 ? { x:x / length, y:y / length } : { x:0, y:0 };
};

function segmentIntersectsRect(from, to, rect) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  let tMin = 0;
  let tMax = 1;
  for (const axis of ['x', 'y']) {
    const origin = axis === 'x' ? from.x : from.y;
    const direction = axis === 'x' ? dx : dy;
    const min = rect[axis];
    const max = rect[axis] + (axis === 'x' ? rect.w : rect.h);
    if (Math.abs(direction) < 1e-9) {
      if (origin < min || origin > max) return false;
      continue;
    }
    let near = (min - origin) / direction;
    let far = (max - origin) / direction;
    if (near > far) [near, far] = [far, near];
    tMin = Math.max(tMin, near);
    tMax = Math.min(tMax, far);
    if (tMin > tMax) return false;
  }
  return tMax >= 0 && tMin <= 1;
}

function distanceToRect(x, y, rect) {
  const dx = Math.max(rect.x - x, 0, x - (rect.x + rect.w));
  const dy = Math.max(rect.y - y, 0, y - (rect.y + rect.h));
  if (dx > 0 || dy > 0) return Math.hypot(dx, dy);
  return -Math.min(x - rect.x, rect.x + rect.w - x, y - rect.y, rect.y + rect.h - y);
}

function distanceToSegment(point, from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq < 0.0001) return Math.hypot(point.x - from.x, point.y - from.y);
  const t = clamp(((point.x - from.x) * dx + (point.y - from.y) * dy) / lengthSq, 0, 1);
  return Math.hypot(point.x - (from.x + dx * t), point.y - (from.y + dy * t));
}

export class GridPathfinder {
  constructor(map, radius, clearance = 4) {
    this.map = map;
    this.cols = map.definition.cols;
    this.rows = map.definition.rows;
    this.radius = Math.max(1, radius);
    this.clearance = Math.max(0, clearance);
    this.walkable = new Uint8Array(this.cols * this.rows);
    this.clearanceField = new Float32Array(this.cols * this.rows);
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
    const count = this.cols * this.rows;
    if (this.walkable.length !== count) {
      this.walkable = new Uint8Array(count);
      this.clearanceField = new Float32Array(count);
    }
    this.rebuild();
    return true;
  }

  rebuild() {
    const count = this.cols * this.rows;
    if (this.walkable.length !== count) {
      this.walkable = new Uint8Array(count);
      this.clearanceField = new Float32Array(count);
    }
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        const point = this.tileCenter(col, row);
        const index = this.index(col, row);
        this.walkable[index] = this.isWorldWalkable(point.x, point.y) ? 1 : 0;
        this.clearanceField[index] = Math.max(0, this.wallClearanceAt(point.x, point.y));
      }
    }
    this.mapRevision = Number(this.map.revision || 0);
  }

  bounds() {
    return {
      width:Number(this.map.width) || this.cols * TILE_SIZE,
      height:Number(this.map.height) || this.rows * TILE_SIZE
    };
  }

  index(col, row) { return row * this.cols + col; }

  inBounds(col, row) {
    return col >= 0 && row >= 0 && col < this.cols && row < this.rows;
  }

  tileCenter(col, row) {
    return { x:(col + 0.5) * TILE_SIZE, y:(row + 0.5) * TILE_SIZE, col, row };
  }

  worldToTile(x, y) {
    return {
      col:clamp(Math.floor(x / TILE_SIZE), 0, this.cols - 1),
      row:clamp(Math.floor(y / TILE_SIZE), 0, this.rows - 1)
    };
  }

  isWorldWalkable(x, y, radius = this.radius, extraClearance = 0) {
    const padded = Math.max(0, radius) + this.clearance + Math.max(0, extraClearance);
    const { width, height } = this.bounds();
    if (x < padded || y < padded || x > width - padded || y > height - padded) return false;
    return !this.map.blockers.some((rect) => circleIntersectsRect(x, y, padded, rect));
  }

  isTileWalkable(col, row) {
    return this.inBounds(col, row) && this.walkable[this.index(col, row)] === 1;
  }

  wallClearanceAt(x, y, radius = this.radius) {
    const { width, height } = this.bounds();
    const padded = Math.max(0, radius) + this.clearance;
    let nearest = Math.min(x, y, width - x, height - y) - padded;
    for (const rect of this.map.blockers) {
      nearest = Math.min(nearest, distanceToRect(x, y, rect) - padded);
    }
    return nearest;
  }

  nearestWalkable(tile, maxRadius = Math.max(this.cols, this.rows)) {
    if (this.isTileWalkable(tile.col, tile.row)) return tile;
    for (let radius = 1; radius <= maxRadius; radius += 1) {
      let best = null;
      let bestDistance = Infinity;
      let bestClearance = -Infinity;
      for (let y = -radius; y <= radius; y += 1) {
        for (let x = -radius; x <= radius; x += 1) {
          if (Math.max(Math.abs(x), Math.abs(y)) !== radius) continue;
          const col = tile.col + x;
          const row = tile.row + y;
          if (!this.isTileWalkable(col, row)) continue;
          const distance = x * x + y * y;
          const clearance = this.clearanceField[this.index(col, row)];
          if (distance < bestDistance || (distance === bestDistance && clearance > bestClearance)) {
            bestDistance = distance;
            bestClearance = clearance;
            best = { col, row };
          }
        }
      }
      if (best) return best;
    }
    return null;
  }

  nearestSafeWorld(point, { maxRadius = Math.max(this.cols, this.rows), preferredClearance = TILE_SIZE * 0.22 } = {}) {
    if (this.isWorldWalkable(point.x, point.y) && this.wallClearanceAt(point.x, point.y) >= preferredClearance) {
      return { x:point.x, y:point.y };
    }
    const start = this.worldToTile(point.x, point.y);
    let fallback = null;
    let fallbackScore = -Infinity;
    for (let ring = 0; ring <= maxRadius; ring += 1) {
      let ringBest = null;
      let ringScore = -Infinity;
      for (let y = -ring; y <= ring; y += 1) {
        for (let x = -ring; x <= ring; x += 1) {
          if (ring && Math.max(Math.abs(x), Math.abs(y)) !== ring) continue;
          const col = start.col + x;
          const row = start.row + y;
          if (!this.isTileWalkable(col, row)) continue;
          const candidate = this.tileCenter(col, row);
          const clearance = this.clearanceField[this.index(col, row)];
          const score = clearance - Math.hypot(candidate.x - point.x, candidate.y - point.y) * 0.08;
          if (score > fallbackScore) {
            fallbackScore = score;
            fallback = candidate;
          }
          if (clearance >= preferredClearance && score > ringScore) {
            ringScore = score;
            ringBest = candidate;
          }
        }
      }
      if (ringBest) return { x:ringBest.x, y:ringBest.y };
    }
    return fallback ? { x:fallback.x, y:fallback.y } : null;
  }

  canUseDiagonal(col, row, nextCol, nextRow) {
    const dc = nextCol - col;
    const dr = nextRow - row;
    if (!dc || !dr) return true;
    if (!this.isTileWalkable(col + dc, row) || !this.isTileWalkable(col, row + dr)) return false;
    const from = this.tileCenter(col, row);
    const to = this.tileCenter(nextCol, nextRow);
    return this.segmentClear(from, to);
  }

  lineClear(from, to) {
    const { width, height } = this.bounds();
    if (to.x < 0 || to.y < 0 || to.x > width || to.y > height) return false;
    return !this.map.blockers.some((rect) => segmentIntersectsRect(from, to, rect));
  }

  segmentClear(from, to, radius = this.radius, extraClearance = 0) {
    const padded = Math.max(0, radius) + this.clearance + Math.max(0, extraClearance);
    const { width, height } = this.bounds();
    if (to.x < padded || to.y < padded || to.x > width - padded || to.y > height - padded) return false;
    for (const rect of this.map.blockers) {
      const expanded = {
        x:rect.x - padded,
        y:rect.y - padded,
        w:rect.w + padded * 2,
        h:rect.h + padded * 2
      };
      if (segmentIntersectsRect(from, to, expanded)) return false;
    }
    return true;
  }

  dangerCostAt(x, y, options = {}) {
    let cost = 0;
    for (const zone of options.dangerZones || []) {
      const radius = Math.max(1, Number(zone.radius) || TILE_SIZE * 2);
      const distance = Math.hypot(x - zone.x, y - zone.y);
      if (distance < radius) cost += (1 - distance / radius) * (Number(zone.weight) || 1);
    }
    for (const corridor of options.dangerSegments || []) {
      if (!corridor?.from || !corridor?.to) continue;
      const width = Math.max(1, Number(corridor.width) || TILE_SIZE);
      const distance = distanceToSegment({ x, y }, corridor.from, corridor.to);
      if (distance < width) cost += (1 - distance / width) * (Number(corridor.weight) || 1);
    }
    return cost;
  }

  steeringProbe(origin, desiredDirection, {
    radius = this.radius,
    shortDistance = TILE_SIZE * 0.58,
    lookAhead = TILE_SIZE * 1.32,
    preferredClearance = TILE_SIZE * 0.18,
    previousDirection = null,
    dangerZones = [],
    dangerSegments = []
  } = {}) {
    const desired = normalize(desiredDirection.x, desiredDirection.y);
    if (Math.hypot(desired.x, desired.y) < 0.01) {
      return { direction:{ x:0, y:0 }, blocked:false, correction:0, clearance:this.wallClearanceAt(origin.x, origin.y, radius) };
    }
    const baseAngle = Math.atan2(desired.y, desired.x);
    let best = null;
    for (const offset of STEERING_OFFSETS) {
      const direction = { x:Math.cos(baseAngle + offset), y:Math.sin(baseAngle + offset) };
      const shortPoint = { x:origin.x + direction.x * shortDistance, y:origin.y + direction.y * shortDistance };
      const farPoint = { x:origin.x + direction.x * lookAhead, y:origin.y + direction.y * lookAhead };
      if (!this.segmentClear(origin, shortPoint, radius)) continue;
      const farClear = this.segmentClear(origin, farPoint, radius);
      const endpoint = farClear ? farPoint : shortPoint;
      const clearance = Math.max(0, this.wallClearanceAt(endpoint.x, endpoint.y, radius));
      const forward = direction.x * desired.x + direction.y * desired.y;
      const continuity = previousDirection
        ? direction.x * previousDirection.x + direction.y * previousDirection.y
        : 0;
      const danger = this.dangerCostAt(endpoint.x, endpoint.y, { dangerZones, dangerSegments });
      const clearanceReward = Math.min(1.5, clearance / Math.max(1, preferredClearance));
      const score = forward * 4.2 + continuity * 0.45 + clearanceReward * 0.55 + (farClear ? 0.7 : 0) - danger;
      if (!best || score > best.score) best = { direction, score, clearance, farClear, offset };
    }
    if (!best) {
      return { direction:{ x:0, y:0 }, blocked:true, correction:Math.PI, clearance:this.wallClearanceAt(origin.x, origin.y, radius) };
    }
    return {
      direction:best.direction,
      blocked:Math.abs(best.offset) > 0.001 || !best.farClear,
      correction:best.offset,
      clearance:best.clearance
    };
  }

  canDash(origin, direction, distance, radius = this.radius) {
    const normalized = normalize(direction.x, direction.y);
    if (Math.hypot(normalized.x, normalized.y) < 0.5) return false;
    const endpoint = { x:origin.x + normalized.x * distance, y:origin.y + normalized.y * distance };
    return this.segmentClear(origin, endpoint, radius, 2)
      && this.wallClearanceAt(endpoint.x, endpoint.y, radius) >= 2;
  }

  reconstructPath(parent, startIndex, endIndex) {
    const nodes = [];
    let cursor = endIndex;
    while (cursor !== -1 && cursor !== startIndex) {
      const col = cursor % this.cols;
      const row = Math.floor(cursor / this.cols);
      nodes.push(this.tileCenter(col, row));
      cursor = parent[cursor];
    }
    if (cursor !== startIndex) return [];
    nodes.reverse();
    return nodes;
  }

  smoothPath(startWorld, nodes, goalWorld, reachedGoal) {
    const smoothed = [];
    let anchor = { x:startWorld.x, y:startWorld.y };
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
      smoothed.push({ x:point.x, y:point.y });
      anchor = point;
      index = furthest + 1;
    }
    if (reachedGoal && this.isWorldWalkable(goalWorld.x, goalWorld.y) && this.segmentClear(anchor, goalWorld)) {
      if (!smoothed.length || Math.hypot(goalWorld.x - anchor.x, goalWorld.y - anchor.y) > 2) {
        smoothed.push({ x:goalWorld.x, y:goalWorld.y });
      }
    }
    return smoothed;
  }

  findPath(startWorld, goalWorld, options = {}) {
    this.syncMap();
    const rawStart = this.worldToTile(startWorld.x, startWorld.y);
    const rawGoal = this.worldToTile(goalWorld.x, goalWorld.y);
    const start = this.nearestWalkable(rawStart);
    const goal = this.nearestWalkable(rawGoal);
    if (!start || !goal) return [];

    if (start.col === goal.col && start.row === goal.row) {
      return this.segmentClear(startWorld, goalWorld)
        ? [{ x:goalWorld.x, y:goalWorld.y }]
        : [this.tileCenter(goal.col, goal.row)];
    }

    const count = this.cols * this.rows;
    const gScore = new Float64Array(count);
    const fScore = new Float64Array(count);
    const parent = new Int32Array(count);
    const closed = new Uint8Array(count);
    const inOpen = new Uint8Array(count);
    gScore.fill(Infinity);
    fScore.fill(Infinity);
    parent.fill(-1);

    const startIndex = this.index(start.col, start.row);
    const goalIndex = this.index(goal.col, goal.row);
    gScore[startIndex] = 0;
    fScore[startIndex] = Math.hypot(goal.col - start.col, goal.row - start.row);
    const open = [startIndex];
    inOpen[startIndex] = 1;
    let closestIndex = startIndex;
    let closestHeuristic = fScore[startIndex];

    while (open.length) {
      let bestOpenIndex = 0;
      for (let i = 1; i < open.length; i += 1) {
        if (fScore[open[i]] < fScore[open[bestOpenIndex]]) bestOpenIndex = i;
      }
      const currentIndex = open.splice(bestOpenIndex, 1)[0];
      inOpen[currentIndex] = 0;
      if (currentIndex === goalIndex) {
        closestIndex = goalIndex;
        break;
      }
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
        const point = this.tileCenter(col, row);
        const clearance = this.clearanceField[nextIndex];
        const preferredClearance = Math.max(1, Number(options.preferredClearance) || TILE_SIZE * 0.45);
        const wallPenalty = Math.max(0, 1 - clearance / preferredClearance) * (Number(options.clearanceWeight) || 0.28);
        const dangerPenalty = this.dangerCostAt(point.x, point.y, options);
        const tentative = gScore[currentIndex] + stepCost + wallPenalty + dangerPenalty;
        if (tentative >= gScore[nextIndex]) continue;
        parent[nextIndex] = currentIndex;
        gScore[nextIndex] = tentative;
        const heuristic = Math.hypot(goal.col - col, goal.row - row);
        fScore[nextIndex] = tentative + heuristic;
        if (heuristic < closestHeuristic) {
          closestHeuristic = heuristic;
          closestIndex = nextIndex;
        }
        if (!inOpen[nextIndex]) {
          open.push(nextIndex);
          inOpen[nextIndex] = 1;
        }
      }
    }

    const reachedGoal = closestIndex === goalIndex;
    const nodes = this.reconstructPath(parent, startIndex, closestIndex);
    if (!nodes.length) return [];
    return this.smoothPath(startWorld, nodes, goalWorld, reachedGoal);
  }
}
