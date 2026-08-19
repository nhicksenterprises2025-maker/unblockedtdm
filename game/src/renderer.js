import { Player } from './actors/Player.js';
import { DamageSystem } from './combat/DamageSystem.js';
import { GameLoop } from './engine/GameLoop.js';
import { Input } from './engine/Input.js';
import { AIM_CAMERA_LEAD_TILES, DASH_CHARGES_MAX, TILE_SIZE } from './engine/constants.js';
import { DamageFeedbackRenderer } from './render/DamageFeedbackRenderer.js';
import { PlayerRenderer } from './render/PlayerRenderer.js';
import { WorldRenderer } from './render/WorldRenderer.js';
import { Camera } from './world/Camera.js';
import { MAP_01 } from './world/map01.js';
import { SpawnSystem } from './world/SpawnSystem.js';
import { TileMap } from './world/TileMap.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
const input = new Input(window);
const map = new TileMap(MAP_01);
const camera = new Camera();
const worldRenderer = new WorldRenderer(ctx, map);
const playerRenderer = new PlayerRenderer(ctx);
const damageFeedback = new DamageFeedbackRenderer(ctx);
const damageSystem = new DamageSystem();
const spawnSystem = new SpawnSystem(map);
const player = new Player(MAP_01.spawns.blue[1], 'blue', 'local-blue');

let debug = false;
let paused = false;
let fps = 0;
let frames = 0;
let fpsClock = 0;
let statusClock = 0;
let dpr = 1;
let devMessage = 'READY';
let devMessageTimer = 0;

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

function sourceAtPointer() {
  const pointer = input.pointerPosition();
  return camera.screenToWorld(pointer.x, pointer.y);
}

function setDevMessage(message, seconds = 1.3) {
  devMessage = message;
  devMessageTimer = seconds;
}

function applyDevDamage(amount, sourceTeam = 'red') {
  const result = damageSystem.applyDamage({
    target: player,
    amount,
    sourceId: sourceTeam === 'blue' ? 'friendly-test' : 'enemy-test',
    sourceTeam,
    sourcePosition: sourceAtPointer(),
    sourceType: 'development-test'
  });

  if (result.applied) {
    setDevMessage(result.killed ? `LETHAL ${Math.round(result.amount)}` : `-${Math.round(result.amount)} HP`);
    if (result.killed) {
      player.onDeath();
      damageFeedback.spawnDeathBurst(player);
    }
  } else {
    const labels = {
      'friendly-fire': 'FRIENDLY FIRE BLOCKED',
      'spawn-protection': 'SPAWN PROTECTED',
      'dash-invulnerability': 'DASH INVULNERABLE',
      dead: 'PLAYER DEAD'
    };
    setDevMessage(labels[result.reason] || result.reason.toUpperCase());
  }
}

function resetRoundForTest() {
  const spawn = MAP_01.spawns.blue[1];
  player.resetForRound(spawn);
  camera.x = player.x;
  camera.y = player.y;
  camera.clamp();
  setDevMessage('ROUND RESET');
}

function handleDevelopmentInputs() {
  if (input.wasPressed('F2')) applyDevDamage(25);
  if (input.wasPressed('F3')) applyDevDamage(75);
  if (input.wasPressed('F4')) applyDevDamage(999);
  if (input.wasPressed('KeyG')) applyDevDamage(50, 'blue');
  if (input.wasPressed('KeyR')) resetRoundForTest();
}

function respawnIfReady() {
  if (!player.health.readyToRespawn()) return;
  const spawn = spawnSystem.chooseSpawn(player.team);
  player.respawn(spawn);
  camera.x = player.x;
  camera.y = player.y;
  camera.clamp();
  setDevMessage(`RESPAWNED · SPAWN ${spawn.index + 1}`);
}

function update(dt) {
  if (input.wasPressed('F1')) debug = !debug;
  if (input.wasPressed('F11')) window.gameAPI.toggleFullscreen();

  player.update(dt, input, map, camera);
  handleDevelopmentInputs();
  respawnIfReady();
  damageFeedback.update(dt);

  if (player.health.alive) {
    const lead = AIM_CAMERA_LEAD_TILES * TILE_SIZE;
    const cameraTargetX = player.x + Math.cos(player.aimAngle) * lead;
    const cameraTargetY = player.y + Math.sin(player.aimAngle) * lead;
    camera.follow(cameraTargetX, cameraTargetY, dt);
  }

  devMessageTimer = Math.max(0, devMessageTimer - dt);
  if (devMessageTimer <= 0) devMessage = 'READY';

  statusClock += dt;
  if (statusClock >= 0.05) {
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
  damageFeedback.drawWorld();

  if (player.health.alive) {
    playerRenderer.draw(player);
    damageFeedback.drawPlayerFeedback(player);
    if (debug) playerRenderer.drawDebug(player);
  }

  worldRenderer.drawForeground(player.health.alive ? player : null, debug);
  camera.end(ctx);

  damageFeedback.drawScreen(player, innerWidth, innerHeight);

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

function updateHealthHud() {
  const health = player.health;
  const root = document.getElementById('healthRoot');
  root.classList.toggle('dead', !health.alive);
  root.classList.toggle('protected', health.isSpawnProtected());
  document.getElementById('healthValue').textContent = health.alive ? `${Math.ceil(health.health)}` : '0';
  document.getElementById('healthFill').style.width = `${Math.round(health.healthPercent() * 100)}%`;
  document.getElementById('healthStatus').textContent = health.isSpawnProtected()
    ? `PROTECTED ${health.spawnProtectionTimer.toFixed(1)}S`
    : health.alive && health.timeSinceDamage < 7
      ? `REGEN IN ${Math.max(0, 7 - health.timeSinceDamage).toFixed(1)}S`
      : health.alive && health.health < 75
        ? 'REGENERATING'
        : '150 MAX · REGEN CAP 75';

  const respawn = document.getElementById('respawnRoot');
  respawn.classList.toggle('visible', !health.alive);
  document.getElementById('respawnValue').textContent = `${Math.max(0, health.respawnTimer).toFixed(1)}`;
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
  document.getElementById('invulnState').textContent = player.isInvulnerable()
    ? player.health.isSpawnProtected()
      ? `SPAWN ${player.health.spawnProtectionTimer.toFixed(2)}S`
      : `DASH ${player.invulnerabilityTimer.toFixed(2)}S`
    : 'OFF';
  document.getElementById('damageTestState').textContent = devMessage;
  updateDashHud();
  updateHealthHud();
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
