import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ARENA_RANKS } from '../game/src/arena/ArenaStore.js';
import { ARENA_EMBLEM_IDS, arenaBadgeMarkup } from '../game/src/arena/ArenaBadges.js';
import { GridPathfinder } from '../game/src/ai/GridPathfinder.js';
import { TileMap } from '../game/src/world/TileMap.js';
import { MAP_01 } from '../game/src/world/map01.js';
import { MAP_02 } from '../game/src/world/map02.js';

assert.equal(MAP_02.id, 'foundry-zero');
assert.equal(MAP_02.name, 'Foundry Zero');
assert.equal(MAP_02.arenaOnly, true);
assert.equal(MAP_02.mode, 'arena');
assert.equal(MAP_02.cols, MAP_01.cols, 'Arena map must preserve the proven world width.');
assert.equal(MAP_02.rows, MAP_01.rows, 'Arena map must preserve the proven world height.');
assert.equal(MAP_02.spawns.blue.length, 3);
assert.equal(MAP_02.spawns.red.length, 3);
assert.ok(MAP_02.structures.length >= 25, 'Foundry Zero must be a complete competitive layout, not an empty reskin.');
assert.ok(MAP_02.structures.some((item) => item.label === 'Forge Core NW'));
assert.ok(MAP_02.structures.some((item) => item.label === 'North Forge Hall'));

const map = new TileMap(MAP_01);
const originalRevision = map.revision;
map.setDefinition(MAP_02);
assert.equal(map.definition.id, 'foundry-zero');
assert.ok(map.revision > originalRevision, 'Switching maps must advance TileMap revision.');
assert.equal(map.groundType(16, 10), 'asphalt');
assert.equal(map.groundType(2, 10), 'spawnConcrete');

const pathfinder = new GridPathfinder(map, 18, 4);
for (const blue of MAP_02.spawns.blue) {
  assert.ok(pathfinder.isWorldWalkable(blue.x, blue.y), 'Every Blue Arena spawn must be collision safe.');
  for (const red of MAP_02.spawns.red) {
    assert.ok(pathfinder.isWorldWalkable(red.x, red.y), 'Every Red Arena spawn must be collision safe.');
    const path = pathfinder.findPath(blue, red);
    assert.ok(path.length > 0, `Foundry Zero must have a navigable route from ${blue.x},${blue.y} to ${red.x},${red.y}.`);
  }
}

map.setDefinition(MAP_01);
const casualPath = pathfinder.findPath(MAP_01.spawns.blue[1], MAP_01.spawns.red[1]);
assert.ok(casualPath.length > 0, 'Pathfinder must rebuild after returning from Arena to Training Complex.');
assert.equal(pathfinder.mapRevision, map.revision);

assert.equal(ARENA_EMBLEM_IDS.length, 14, 'Phase 2 must author all 14 Arena emblems.');
assert.deepEqual([...ARENA_EMBLEM_IDS].sort(), ARENA_RANKS.map((rank) => rank.id).sort());
const badgeOutputs = ARENA_RANKS.map((rank) => arenaBadgeMarkup(rank));
assert.equal(new Set(badgeOutputs).size, 14, 'Every Arena rank must render distinct badge markup.');
for (const [index, rank] of ARENA_RANKS.entries()) {
  assert.ok(badgeOutputs[index].includes(`data-arena-rank-badge="${rank.id}"`));
  assert.ok(badgeOutputs[index].includes('data-arena-emblem="authored"'));
}
assert.ok(arenaBadgeMarkup(ARENA_RANKS.at(-1)).includes('circle cx="48" cy="58" r="18"'), 'Omnipotent must use its authored singularity emblem.');

const read = (relative) => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const runtime = read('game/src/phase2432-runtime.js');
const parent = read('game/src/phase241-runtime.js');
const css = read('game/src/ui-2.4.3.2.css');
const runner = read('scripts/check-all.mjs');

for (const token of [
  "import { MAP_02 } from './world/map02.js'",
  'liveMap.setDefinition(nextMap)',
  "document.body.dataset.activeMap = map.id",
  "document.body.dataset.arenaPhase2Ready = 'true'",
  'Foundry Zero',
  'skirmish:map-selected',
  'dataset.arenaMapChip'
]) assert.ok(runtime.includes(token), `Arena Phase 2 runtime missing ${token}`);

assert.ok(parent.includes("import './phase2431-runtime.js';"));
assert.ok(parent.includes("import './phase2432-runtime.js';"));
assert.ok(parent.indexOf("phase2432-runtime.js") > parent.indexOf("phase2431-runtime.js"), 'Phase 2 must evaluate after the Phase 1 Arena bridge.');
assert.ok(css.includes('[data-active-map="foundry-zero"]'));
assert.ok(css.includes('.arena-map-chip'));
assert.ok(runner.includes("'scripts/test-2.4.3.2-arena-phase2.mjs'"));

console.log('Skirmish Arena 2.4.3.2 Phase 2 checks passed: 14 authored Arena emblems, Foundry Zero exclusivity, collision-safe spawns, cross-map bot navigation, map switching and Arena UI map identity.');
