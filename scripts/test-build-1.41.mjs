import assert from 'node:assert/strict';
import { GridPathfinder } from '../game/src/ai/GridPathfinder.js';
import { PLAYER_RADIUS_TILES, TILE_SIZE } from '../game/src/engine/constants.js';
import { TileMap } from '../game/src/world/TileMap.js';
import { MAP_01 } from '../game/src/world/map01.js';

const map = new TileMap(MAP_01);
const pathfinder = new GridPathfinder(map, PLAYER_RADIUS_TILES * TILE_SIZE);

for (const blue of MAP_01.spawns.blue) {
  for (const red of MAP_01.spawns.red) {
    const path = pathfinder.findPath(blue, red);
    assert.ok(path.length > 0, `Expected a path from blue spawn to red spawn (${blue.x},${blue.y}) -> (${red.x},${red.y})`);
    let previous = blue;
    for (const waypoint of path) {
      assert.equal(pathfinder.isWorldWalkable(waypoint.x, waypoint.y), true, 'Waypoint must be collision-safe');
      assert.equal(pathfinder.segmentClear(previous, waypoint), true, 'Smoothed path segment must be collision-safe');
      previous = waypoint;
    }
  }
}

console.log('Build 1.41 pathfinding validation passed.');
