import { TILE_SIZE } from '../engine/constants.js';

function pointInsideRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function lineBlocked(ax, ay, bx, by, blockers) {
  const distance = Math.hypot(bx - ax, by - ay);
  const steps = Math.max(1, Math.ceil(distance / 18));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    if (blockers.some((rect) => pointInsideRect(x, y, rect))) return true;
  }
  return false;
}

export class SpawnSystem {
  constructor(map) {
    this.map = map;
    this.rotation = { blue: 0, red: 0 };
  }

  chooseSpawn(team, context = {}) {
    const spawns = this.map.definition.spawns[team] || [];
    if (!spawns.length) throw new Error(`No ${team} spawn points are defined.`);

    const enemies = context.enemies || [];
    const teammates = context.teammates || [];
    const recentCombat = context.recentCombat || [];

    if (!enemies.length && !teammates.length && !recentCombat.length) {
      const index = this.rotation[team] % spawns.length;
      this.rotation[team] = (index + 1) % spawns.length;
      return { ...spawns[index], index, score: 0, reason: 'safe-rotation' };
    }

    let best = null;
    for (let index = 0; index < spawns.length; index += 1) {
      const spawn = spawns[index];
      let score = 0;

      for (const enemy of enemies) {
        if (enemy?.health && !enemy.health.alive) continue;
        if (enemy?.alive === false) continue;
        const distanceTiles = Math.hypot(spawn.x - enemy.x, spawn.y - enemy.y) / TILE_SIZE;
        score += Math.min(distanceTiles, 20) * 4;
        if (distanceTiles < 5) score -= (5 - distanceTiles) * 20;

        const blocked = lineBlocked(spawn.x, spawn.y, enemy.x, enemy.y, this.map.blockers);
        if (!blocked) score -= 85;
        else score += 20;
      }

      for (const teammate of teammates) {
        const distanceTiles = Math.hypot(spawn.x - teammate.x, spawn.y - teammate.y) / TILE_SIZE;
        if (distanceTiles <= 7) score += 10;
      }

      for (const event of recentCombat) {
        const ageWeight = Math.max(0, 1 - (event.age || 0) / 8);
        const distanceTiles = Math.hypot(spawn.x - event.x, spawn.y - event.y) / TILE_SIZE;
        if (distanceTiles < 6) score -= (6 - distanceTiles) * 8 * ageWeight;
      }

      if (!best || score > best.score) {
        best = { ...spawn, index, score, reason: 'dynamic-score' };
      }
    }

    return best;
  }
}
