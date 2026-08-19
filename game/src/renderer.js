import { Player } from './actors/Player.js';
import { GameLoop } from './engine/GameLoop.js';
import { Input } from './engine/Input.js';
import { AIM_CAMERA_LEAD_TILES, DASH_CHARGES_MAX, TILE_SIZE } from './engine/constants.js';
import { PlayerRenderer } from './render/PlayerRenderer.js';
import { WorldRenderer } from './render/WorldRenderer.js';
import { Camera } from './world/Camera.js';
import { MAP_01 } from './world/map01.js';
import { TileMap } from './world/TileMap.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
const input = new Input(window);
const map = new TileMap(MAP_01);
const camera = new Camera();
const worldRenderer = new WorldRenderer(ctx, map);
const playerRenderer = new PlayerRenderer(ctx);
const player = new Player(MAP_01.spawns.blue[1], 'blue');

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
camera.x = player.x;
camera.y = player.y;
camera.clamp();

function update(dt) {
  if (input.wasPressed('F1')) debug = !debug;
  if (input.wasPressed('F11')) window.gameAPI.toggleFullscreen();

  player.update(dt, input, map, camera);

  const lead = AIM_CAMERA_LEAD_TILES * TILE_SIZE;
  const cameraTargetX = player.x + Math.cos(player.aimAngle) * lead;
  const cameraTargetY = player.y + Math.sin(player.aimAngle) * lead;
  camera.follow(cameraTargetX, cameraTargetY, dt);

  statusClock += dt;
  if (statusClock >= 0.06) {
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
  worldRenderer.drawBase(camera, debug);
  playerRenderer.draw(player);
  worldRenderer.drawForeground(player, debug);
  if (debug) playerRenderer.drawDebug(player);
  camera.end(ctx);

  if (isPaused) {
    ctx.fillStyle = 'rgba(5, 13, 19, .38)';
    ctx.fillRect(0, 0, innerWidth, innerHeight);
  }
}

function updateDashHud() {
  const root = document.getElementById('dashRoot');
  root.classList.toggle('active', player.dashing);
  root.classList.toggle('denied', player.dashDeniedTimer > 0);
  root.classList.toggle('invulnerable', player.isInvulnerable());

  for (let index = 0; index < DASH_CHARGES_MAX; index += 1) {
    const pip = document.getElementById(`dashPip${index}`);
    pip.classList.toggle('spent', index >= player.dashCharges);
  }

  document.getElementById('dashCount').textContent = `${player.dashCharges}/${DASH_CHARGES_MAX}`;
}

function updateDiagnostics() {
  const tile = map.tileAtWorld(player.x, player.y);
  document.getElementById('coords').textContent = `Tile ${tile.col}, ${tile.row}`;
  document.getElementById('camera').textContent = `${(camera.x / TILE_SIZE).toFixed(1)}, ${(camera.y / TILE_SIZE).toFixed(1)}`;
  document.getElementById('debugState').textContent = debug ? 'COLLISION ON' : 'COLLISION OFF';
  document.getElementById('moveState').textContent = player.state.toUpperCase();
  document.getElementById('speed').textContent = `${player.speedTilesPerSecond().toFixed(1)} T/S`;
  document.getElementById('staminaValue').textContent = `${Math.round(player.stamina)}`;
  document.getElementById('staminaFill').style.width = `${Math.round(player.staminaPercent() * 100)}%`;
  document.getElementById('staminaRoot').classList.toggle('sprinting', player.sprinting);
  document.getElementById('staminaRoot').classList.toggle('recovering', !player.sprinting && player.staminaRegenDelay > 0);
  document.getElementById('dashState').textContent = player.dashing ? 'DASHING' : player.dashCooldown > 0 ? `${player.dashCooldown.toFixed(2)}S` : 'READY';
  document.getElementById('invulnState').textContent = player.isInvulnerable() ? `${player.invulnerabilityTimer.toFixed(2)}S` : 'OFF';
  updateDashHud();
}

const loop = new GameLoop(update, render);

window.addEventListener('keydown', (event) => {
  if (event.code === 'Escape') {
    paused = !paused;
    loop.setPaused(paused);
    document.getElementById('pausePanel').classList.toggle('visible', paused);
    input.endFrame();
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
