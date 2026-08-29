import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { WorldRenderer } from '../game/src/render/WorldRenderer.js';
import { TileMap } from '../game/src/world/TileMap.js';
import { MAP_01 } from '../game/src/world/map01.js';
import { MAP_02 } from '../game/src/world/map02.js';

const WORLD_W = MAP_02.cols * MAP_02.tileSize;
const EPSILON = .0001;
const geometry = MAP_02.structures.map(({ x, y, w, h, kind, palette, label }) => [x, y, w, h, kind, palette, label]);
const geometryHash = crypto.createHash('sha256').update(JSON.stringify(geometry)).digest('hex');
const spawnHash = crypto.createHash('sha256').update(JSON.stringify(MAP_02.spawns)).digest('hex');

assert.equal(geometryHash, '59ffbdcbff9b5e033fbfa8d4b161db022c7a6909a092874b97b789def7c4256a', 'Phase 3 must not move or resize any Foundry blocker.');
assert.equal(spawnHash, '1450a968af44b9db1f1be3baf1812eb1ec1814ce00c31b64b337de158d4c705e', 'Phase 3 must preserve all six Foundry spawns exactly.');

const presentation = MAP_02.presentation;
assert.equal(presentation.id, 'foundry-zero-phase3');
assert.equal(presentation.enabled, true);
assert.equal(presentation.nonBlocking, true);
assert.equal(presentation.deterministic, true);
assert.equal(presentation.symmetryAxisX, WORLD_W / 2);
assert.ok(JSON.parse(JSON.stringify(presentation)), 'Presentation metadata must remain serializable for runtime and smoke-test inspection.');

for (const system of ['furnaceFlames', 'pipeFire', 'embers', 'heatShimmer', 'warmLights', 'lightSmoke', 'steamBursts', 'fans', 'gears', 'pistons']) {
  assert.ok(presentation.systems.includes(system), `Foundry presentation must register ${system}.`);
}

const ambienceLists = Object.values(presentation.ambience);
const sourceCount = ambienceLists.reduce((total, list) => total + list.length, 0);
const emitters = [
  ...presentation.ambience.emberEmitters,
  ...presentation.ambience.smokeEmitters,
  ...presentation.ambience.steamVents
];
const particleSlots = emitters.reduce((total, emitter) => total + emitter.slots, 0);
assert.equal(sourceCount, 44, 'The authored ambient source count is intentional and should remain reviewable.');
assert.equal(particleSlots, 102, 'The authored fixed particle-slot count is intentional and should remain reviewable.');
assert.ok(sourceCount <= presentation.budgets.maxAmbientSources);
assert.ok(particleSlots <= presentation.budgets.maxParticleSlots);
assert.ok(emitters.every((emitter) => emitter.slots <= presentation.budgets.maxSlotsPerEmitter));
assert.ok(presentation.ambience.warmLights.every((light) => light.radius <= presentation.budgets.maxLightRadius));
assert.ok(Object.values(presentation.fixtures).reduce((total, list) => total + list.length, 0) <= presentation.budgets.maxStaticFixtures);
assert.ok(MAP_02.structures.every((item) => !ambienceLists.some((list) => list.includes(item))), 'Ambient records must never enter the blocker list.');

function hasMirroredPoint(list, source) {
  return list.some((candidate) =>
    Math.abs(candidate.x - (WORLD_W - source.x)) < EPSILON &&
    Math.abs(candidate.y - source.y) < EPSILON &&
    (source.phase === undefined || Math.abs(candidate.phase - source.phase) < EPSILON) &&
    (source.slots === undefined || candidate.slots === source.slots) &&
    (source.seed === undefined || candidate.seed === source.seed) &&
    (source.directionX === undefined || Math.abs(candidate.directionX + source.directionX) < EPSILON) &&
    (source.driftX === undefined || Math.abs(candidate.driftX + source.driftX) < EPSILON));
}

for (const list of [
  presentation.ambience.flames,
  presentation.ambience.emberEmitters,
  presentation.ambience.smokeEmitters,
  presentation.ambience.steamVents,
  presentation.ambience.warmLights,
  presentation.fixtures.scorchMarks
]) {
  for (const source of list) assert.ok(hasMirroredPoint(list, source), `Missing mirrored presentation point at ${source.x},${source.y}.`);
}

for (const list of [presentation.fixtures.floorPlates, presentation.fixtures.warningBands]) {
  for (const fixture of list) {
    assert.ok(list.some((candidate) =>
      Math.abs(candidate.x - (WORLD_W - fixture.x - fixture.w)) < EPSILON &&
      Math.abs(candidate.y - fixture.y) < EPSILON &&
      Math.abs(candidate.w - fixture.w) < EPSILON &&
      Math.abs(candidate.h - fixture.h) < EPSILON &&
      candidate.type === fixture.type), `Missing mirrored presentation rectangle at ${fixture.x},${fixture.y}.`);
  }
}

for (const run of presentation.fixtures.pipes) {
  assert.ok(presentation.fixtures.pipes.some((candidate) => candidate.points.length === run.points.length &&
    candidate.points.every((point, index) =>
      Math.abs(point[0] - (WORLD_W - run.points[index][0])) < EPSILON &&
      Math.abs(point[1] - run.points[index][1]) < EPSILON)), 'Every authored pipe run must have an exact horizontal mirror.');
}

function createContext() {
  const calls = Object.create(null);
  const gradient = { addColorStop() {} };
  const target = {
    globalAlpha:1,
    createRadialGradient() {
      calls.createRadialGradient = (calls.createRadialGradient || 0) + 1;
      return gradient;
    }
  };
  return {
    calls,
    ctx:new Proxy(target, {
      get(object, property) {
        if (property in object) return object[property];
        if (typeof property !== 'string') return undefined;
        const method = () => { calls[property] = (calls[property] || 0) + 1; };
        object[property] = method;
        return method;
      },
      set(object, property, value) {
        object[property] = value;
        return true;
      }
    })
  };
}

const fake = createContext();
const liveMap = new TileMap(MAP_02);
const renderer = new WorldRenderer(fake.ctx, liveMap);
assert.equal(renderer.presentationMetrics.sourceCount, sourceCount);
assert.equal(renderer.presentationMetrics.particleSlots, particleSlots);
const fixtureCount = Object.values(presentation.fixtures).reduce((sum, entries) => sum + entries.length, 0);
assert.equal(renderer.presentationMetrics.fixtureCount, fixtureCount);
assert.ok(fixtureCount <= presentation.limits.maxStaticFixtures);
assert.equal(renderer.presentationMetrics.revision, liveMap.revision);

const centerCamera = { visibleBounds:() => ({ left:760, top:150, right:1290, bottom:1260 }) };
const offscreenCamera = { visibleBounds:() => ({ left:5000, top:5000, right:5200, bottom:5200 }) };
const stableCache = renderer.presentationCache;
renderer.drawBase(centerCamera, false, 4200);
renderer.drawForeground(null, false);
assert.strictEqual(renderer.presentationCache, stableCache, 'Foundry caches must be reused between frames at the same map revision.');
assert.ok(fake.calls.fillRect > 0 && fake.calls.arc > 0, 'The Foundry presentation must produce actual canvas drawing operations.');

let flameCalls = 0;
renderer.drawFlame = () => { flameCalls += 1; };
renderer.drawBase(offscreenCamera, false, 4300);
assert.equal(flameCalls, 0, 'Off-camera Foundry fire and structure animation must be culled.');
renderer.drawBase(centerCamera, false, 4300);
assert.ok(flameCalls > 0, 'Visible Foundry sources must render when inside camera bounds.');

const previousDocument = globalThis.document;
let ambienceCalls = 0;
renderer.drawFoundryAmbience = () => { ambienceCalls += 1; };
globalThis.document = { hidden:true };
renderer.drawBase(centerCamera, false, 4400);
assert.equal(ambienceCalls, 0, 'Hidden documents must not run Foundry ambience.');
if (previousDocument === undefined) delete globalThis.document;
else globalThis.document = previousDocument;

liveMap.setDefinition(MAP_01);
renderer.drawBase(centerCamera, false, 4500);
assert.equal(renderer.presentationCache, null, 'Foundry presentation must be removed immediately after a map revision switches to Casual.');
assert.equal(renderer.presentationMetrics.sourceCount, 0);
liveMap.setDefinition(MAP_02);
renderer.drawBase(centerCamera, false, 4600);
assert.equal(renderer.presentationMetrics.revision, liveMap.revision);
assert.equal(renderer.presentationMetrics.particleSlots, particleSlots, 'Returning to Foundry must rebuild the same bounded deterministic cache.');

const rendererSource = fs.readFileSync(new URL('../game/src/render/WorldRenderer.js', import.meta.url), 'utf8');
assert.ok(!rendererSource.includes('Math.random'), 'Foundry animation must be deterministic and must not use Math.random().');
assert.ok(rendererSource.includes('globalThis.document?.hidden'), 'Foundry animation must explicitly respect tab visibility.');
assert.ok(rendererSource.includes('this.presentationRevision'), 'Foundry cache must track TileMap revision changes.');

console.log('Skirmish Arena 2.4.3.3 Foundry visual checks passed: unchanged competitive geometry, symmetric nonblocking metadata, 44 culled sources, 102 fixed particle slots, deterministic revision-aware caches, and hidden-tab suspension.');
