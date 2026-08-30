import fs from 'node:fs';
import assert from 'node:assert/strict';
import { GameSettings } from '../game/src/engine/GameSettings.js';
import { resolveHudLayoutMetrics } from '../game/src/ui/HudLayout.js';
import { Camera } from '../game/src/world/Camera.js';
import { TileMap } from '../game/src/world/TileMap.js';
import { MAP_01 } from '../game/src/world/map01.js';
import { MAP_02 } from '../game/src/world/map02.js';

const read = (relative) => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const index = read('game/src/index.html');
const loader = read('game/src/debug-tuning.js');
const main = read('game/src/main.js');
const standaloneSmoke = read('.github/workflows/smoke-packaged-game.yml');
const runtime = read('game/src/phase260-runtime.js');
const css = read('game/src/ui-2.6.0.css');
const renderer = read('game/src/render/WorldRenderer.js');
const legacyMapLayer = read('game/src/phase7-runtime.js');
const tacticalHud = read('game/src/ui/TacticalHUD.js');
const playerSource = read('game/src/actors/Player.js');
const legacyFlow = read('game/src/flow-v18.js');
const onlineArchitecture = read('docs/architecture/online-social-extension-points.md');

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

// Foundry is meaningful playable area, not padded border.
const mapAreaRatio = (MAP_02.cols * MAP_02.rows) / (MAP_01.cols * MAP_01.rows);
assert.ok(mapAreaRatio >= 1.25 && mapAreaRatio <= 1.35, `Foundry area ratio ${mapAreaRatio} must stay approximately 1.3x.`);
assert.equal(MAP_02.cols, 38);
assert.equal(MAP_02.rows, 24);
assert.equal(MAP_02.presentation.scale.areaRatio, mapAreaRatio);
assert.equal(MAP_02.presentation.architecture.openCombatAreas, true);
assert.equal(MAP_02.presentation.architecture.routes.length, 3);
assert.equal(MAP_02.presentation.architecture.zones.length, 7);

const interiorBlockerArea = (definition) => definition.structures
  .filter((item) => !String(item.label || '').includes('Perimeter'))
  .reduce((total, item) => total + item.w * item.h, 0);
const foundryBlockerDensity = interiorBlockerArea(MAP_02) /
  (MAP_02.cols * MAP_02.rows * MAP_02.tileSize * MAP_02.tileSize);
assert.ok(foundryBlockerDensity < .16, 'Foundry must preserve intentional open combat areas rather than cover spam.');

for (let index = 0; index < 3; index += 1) {
  const blue = MAP_02.spawns.blue[index];
  const red = MAP_02.spawns.red[index];
  assert.equal(blue.y, red.y);
  assert.ok(Math.abs(blue.x + red.x - MAP_02.cols * MAP_02.tileSize) < .001);
}

// Runtime bounds follow the selected map across camera, player collision and minimap.
const liveMap = new TileMap(MAP_01);
const trainingRevision = liveMap.revision;
assert.equal(liveMap.width, MAP_01.cols * MAP_01.tileSize);
liveMap.setDefinition(MAP_02);
assert.equal(liveMap.width, MAP_02.cols * MAP_02.tileSize);
assert.equal(liveMap.height, MAP_02.rows * MAP_02.tileSize);
assert.equal(liveMap.revision, trainingRevision + 1);
globalThis.innerWidth = 1720;
globalThis.innerHeight = 1080;
const camera = new Camera(MAP_01.cols * MAP_01.tileSize, MAP_01.rows * MAP_01.tileSize);
camera.resize(1720, 1080);
camera.setWorldBounds(liveMap.width, liveMap.height, { preservePosition:false });
assert.equal(camera.worldWidth, liveMap.width);
assert.equal(camera.worldHeight, liveMap.height);
assert.equal(camera.x, liveMap.width / 2);
for (const token of ['Number(map?.width) || WORLD_WIDTH', 'Number(map?.height) || WORLD_HEIGHT']) {
  assert.ok(playerSource.includes(token), `Player collision must use active-map bounds: ${token}`);
}

// Visual systems are authored, connected, deterministic and budgeted.
const fixtures = MAP_02.presentation.fixtures;
const ambience = MAP_02.presentation.ambience;
const fixtureCount = Object.values(fixtures).reduce((total, entries) => total + entries.length, 0);
const ambientCount = Object.values(ambience).reduce((total, entries) => total + entries.length, 0);
const particleSlots = [...ambience.emberEmitters, ...ambience.smokeEmitters, ...ambience.steamVents]
  .reduce((total, emitter) => total + emitter.slots, 0);
assert.ok(fixtureCount <= MAP_02.presentation.budgets.maxStaticFixtures);
assert.ok(ambientCount <= MAP_02.presentation.budgets.maxAmbientSources);
assert.ok(particleSlots <= MAP_02.presentation.budgets.maxParticleSlots);
assert.equal(fixtures.burnerHousings.length, ambience.flames.length);
assert.equal(MAP_02.presentation.safety.fireCollision, false);
assert.equal(MAP_02.presentation.safety.fireDamage, false);
for (const rect of [...fixtures.floorPlates, ...fixtures.warningBands, ...fixtures.burnerHousings]) {
  assert.ok(rect.x >= 0 && rect.y >= 0);
  assert.ok(rect.x + rect.w <= MAP_02.cols * MAP_02.tileSize + .01);
  assert.ok(rect.y + rect.h <= MAP_02.rows * MAP_02.tileSize + .01);
}
for (const run of fixtures.pipes) {
  for (const [x, y] of run.points) {
    assert.ok(x >= 0 && x <= MAP_02.cols * MAP_02.tileSize);
    assert.ok(y >= 0 && y <= MAP_02.rows * MAP_02.tileSize);
  }
}

// Training keeps its layout but reads as a functional facility.
assert.equal(MAP_01.presentation.architecture.decorativeBlueBars, false);
for (const token of ['neutralVentilation', 'utilityAprons', 'drainageChannels']) {
  assert.ok(MAP_01.presentation.systems.includes(token));
}
for (const token of ['drawTrainingFacilityPresentation', 'drawTrainingStructureDetail', 'RANGE HALL N', 'Calibrated range ticks']) {
  assert.ok(renderer.includes(token));
}
assert.equal(renderer.includes('rgba(202,231,239,.18)'), false, 'Artificial pale-blue warehouse bars must remain removed.');
assert.ok(legacyMapLayer.includes('A recessed shutter grille replaces the old cyan decorative stripe.'));
assert.ok(legacyMapLayer.includes('Training halls are neutral facility architecture.'));
assert.equal(legacyMapLayer.includes("left ? 'rgba(74,190,239,.66)' : 'rgba(255,104,125,.60)'"), false, 'Training halls must not inherit team-coloured decorative bars.');
assert.equal(
  legacyMapLayer.includes('ctx.fillRect(item.x + 22, item.y + 25, 38, 3)'),
  false,
  'The legacy structure-detail layer must not repaint the removed cyan warehouse stripe.'
);

// HUD Scale persists to 140%, and responsive component metrics stay collision-free.
const storage = new MemoryStorage();
const settings = new GameSettings(storage);
settings.setGameplay('hudScale', 1.4);
assert.equal(new GameSettings(storage).gameplay().hudScale, 1.4);
settings.setGameplay('hudScale', 9);
assert.equal(settings.gameplay().hudScale, 1.4);
settings.setGameplay('hudScale', .1);
assert.equal(settings.gameplay().hudScale, .8);

const viewports = [[1920, 1080], [1720, 1080], [1366, 768], [1280, 720], [960, 600]];
for (const [width, height] of viewports) {
  for (const hudScale of [.8, 1, 1.4]) {
    const metrics = resolveHudLayoutMetrics(
      { hudScale, minimapScale:1.25, killFeedScale:1.2 },
      { width, height }
    );
    assert.ok(metrics.anchors.topMinimapGap >= -.01, `HUD/minimap overlap at ${width}x${height} scale ${hudScale}`);
    assert.ok(metrics.anchors.feedVerticalGap > 0, `Kill feed collides with match strip at ${width}x${height}`);
    assert.ok(metrics.anchors.topWidth <= width);
    assert.ok(metrics.minimap <= 1.65);
    assert.ok(metrics.feed <= 1.65);
  }
}

for (const token of [
  '--sa26-top-kill-col',
  '--sa26-minimap-size',
  '--sa26-feed-name',
  'data-stat="kills"',
  'data-stat="kd"',
  'color:var(--sa26-blue)!important',
  'color:var(--sa26-red)!important',
  'font-size:var(--sa26-timer-value)!important',
  'transform:none!important'
]) assert.ok(css.includes(token) || tacticalHud.includes(token), `2.6 interface contract missing ${token}`);
assert.ok(runtime.includes("root.style.setProperty('--sa26-hud-layout-scale'"));
assert.ok(runtime.includes('resolveHudLayoutMetrics'));
assert.equal(css.includes('transform:scale(var(--sa26-hud-scale))'), false);

// Pause keeps the approved vertical five-tab structure, only larger and icon-assisted.
assert.equal((index.match(/data-pause-tab=/g) || []).length, 5);
for (const tab of ['match', 'scoreboard', 'loadout', 'controls', 'settings']) {
  assert.ok(runtime.includes(`${tab}:[`) || runtime.includes(`  ${tab}:[`));
}
for (const token of [
  "width:min(1520px,97vw)!important",
  "height:min(930px,96vh)!important",
  'grid-template-columns:270px minmax(0,1fr)!important',
  'data-icon-family="sa-tactical-metal"'
]) assert.ok(css.includes(token) || runtime.includes(token));

// The 2.6 layer is deterministic boot ownership and packaged-smoke ownership.
assert.ok(loader.includes("import('./phase260-runtime.js')"));
assert.ok(loader.includes("document.body.classList.contains('ui-260')"));
assert.ok(loader.includes("document.body.dataset.phase260Ready==='true'"));
for (const token of ['phase260:', 'phase260Integrity:', 'state.phase260 &&', 'state.phase260Integrity &&']) assert.ok(main.includes(token));
assert.ok(main.includes('#mainSettingsPanel[data-settings-version="2.6"]'), 'Packaged smoke must probe the live 2.6 Settings ownership marker.');
for (const token of [
  'SKIRMISH_SMOKE_TEST',
  'SKIRMISH_SMOKE_RESULT_PATH',
  "$result.stage -ne 'pass'",
  '$null -ne $result.exitCode'
]) assert.ok(standaloneSmoke.includes(token), `Standalone packaged smoke is missing the current terminal-result contract: ${token}`);
assert.equal(standaloneSmoke.includes('SKIRMISH_SMOKE_SENTINEL'), false);
assert.equal(standaloneSmoke.includes('result.uiReady'), false);
for (const token of ['sequence: buildInfo.sequence', 'tag: buildInfo.tag']) assert.ok(main.includes(token));
assert.ok(legacyFlow.includes('if (settingsPanel?.dataset.settingsVersion)'), 'Legacy category stamps must defer to versioned Settings navigation.');
assert.ok(legacyFlow.includes("card.classList.remove('phase2-group-start')"), 'Versioned Settings must clear stale positional group stamps.');
for (const token of ['PlayerProfile', 'Party roster', 'Match roster', 'MatchTransport', 'authoritative server outcome', 'No fake friends']) {
  assert.ok(onlineArchitecture.includes(token), `Future online/social architecture is missing the documented extension point: ${token}`);
}

console.log('Skirmish Arena 2.6 interface/map checks passed: active-map bounds, 1.295x Foundry, bounded logical FX, Training detail, collision-free HUD scaling, enlarged Pause and stat-first scoreboard.');
