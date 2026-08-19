import { GameLoop } from './engine/GameLoop.js';
import { Input } from './engine/Input.js';
import { PROBE_RADIUS_TILES, PROBE_SPEED_TILES, TILE_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from './engine/constants.js';
import { Camera } from './world/Camera.js';
import { moveCircle } from './world/Collision.js';
import { MAP_01 } from './world/map01.js';
import { TileMap } from './world/TileMap.js';
import { WorldRenderer } from './render/WorldRenderer.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
const input = new Input(window);
const map = new TileMap(MAP_01);
const camera = new Camera();
const worldRenderer = new WorldRenderer(ctx, map);
const probeSpawn = MAP_01.spawns.blue[1];
const probe = { x: probeSpawn.x, y: probeSpawn.y, radius: PROBE_RADIUS_TILES * TILE_SIZE };
let debug = false;
let paused = false;
let fps = 0;
let frames = 0;
let fpsClock = 0;
let statusClock = 0;
let dpr = 1;

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(innerWidth * dpr));
  canvas.height = Math.max(1, Math.floor(innerHeight * dpr));
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  camera.resize(innerWidth, innerHeight);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
camera.x = probe.x;
camera.y = probe.y;
camera.clamp();

function update(dt) {
  if (input.wasPressed('F1')) debug = !debug;
  if (input.wasPressed('F11')) window.gameAPI.toggleFullscreen();
  const axis = input.axis();
  const speed = PROBE_SPEED_TILES * TILE_SIZE;
  moveCircle(probe, axis.x * speed * dt, axis.y * speed * dt, map.blockers, { w: WORLD_WIDTH, h: WORLD_HEIGHT });
  camera.follow(probe.x, probe.y, dt);
  statusClock += dt;
  if (statusClock >= 0.1) {
    statusClock = 0;
    updateDiagnostics();
  }
  input.endFrame();
}

function render(dt, now, isPaused) {
  frames += 1;
  fpsClock += dt;
  if (fpsClock >= 0.5) {
    fps = Math.round(frames / Math.max(fpsClock, 0.001));
    frames = 0;
    fpsClock = 0;
    document.getElementById('fps').textContent = `${fps} FPS`;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#142b36';
  ctx.fillRect(0, 0, innerWidth, innerHeight);
  camera.begin(ctx);
  worldRenderer.draw(camera, probe, debug);
  camera.end(ctx);
  if (isPaused) {
    ctx.fillStyle = 'rgba(5, 13, 19, .38)';
    ctx.fillRect(0, 0, innerWidth, innerHeight);
  }
}

function updateDiagnostics() {
  const tile = map.tileAtWorld(probe.x, probe.y);
  document.getElementById('coords').textContent = `Tile ${tile.col}, ${tile.row}`;
  document.getElementById('camera').textContent = `${(camera.x / TILE_SIZE).toFixed(1)}, ${(camera.y / TILE_SIZE).toFixed(1)}`;
  document.getElementById('debugState').textContent = debug ? 'COLLISION ON' : 'COLLISION OFF';
}

const loop = new GameLoop(update, render);
window.addEventListener('keydown', (event) => {
  if (event.code === 'Escape') {
    paused = !paused;
    loop.setPaused(paused);
    document.getElementById('pausePanel').classList.toggle('visible', paused);
  }
});

(async () => {
  const buildInfo = await window.gameAPI.getBuildInfo();
  document.getElementById('buildLabel').textContent = `BUILD ${buildInfo.gameVersion} · VERSION ${buildInfo.build}`;
  document.getElementById('phaseLabel').textContent = buildInfo.phase;
  document.getElementById('mapLabel').textContent = `${MAP_01.name.toUpperCase()} · ${MAP_01.cols}×${MAP_01.rows} TILES`;
  updateDiagnostics();
  loop.start();
})();
