import { Player } from './actors/Player.js';
import { BotController } from './ai/BotController.js';
import { GridPathfinder } from './ai/GridPathfinder.js';
import { DamageSystem } from './combat/DamageSystem.js';
import { ProjectileSystem } from './combat/ProjectileSystem.js';
import { WeaponManager } from './combat/WeaponManager.js';
import { LoadoutStore } from './data/LoadoutStore.js';
import { WEAPONS } from './data/weapons.js';
import { GameLoop } from './engine/GameLoop.js';
import { GameSettings, bindingLabel } from './engine/GameSettings.js';
import { Input } from './engine/Input.js';
import { AIM_CAMERA_LEAD_TILES, DASH_CHARGES_MAX, TILE_SIZE } from './engine/constants.js';
import { MatchManager } from './match/MatchManager.js';
import { CombatFeedbackRenderer } from './render/CombatFeedbackRenderer.js';
import { DamageFeedbackRenderer } from './render/DamageFeedbackRenderer.js';
import { MinimapRenderer } from './render/MinimapRenderer.js';
import { PlayerRenderer } from './render/PlayerRenderer.js';
import { WeaponRenderer } from './render/WeaponRenderer.js';
import { WorldRenderer } from './render/WorldRenderer.js';
import { LoadoutScreen } from './ui/LoadoutScreen.js';
import { MainMenu } from './ui/MainMenu.js';
import { SettingsPanel } from './ui/SettingsPanel.js';
import { Camera } from './world/Camera.js';
import { MAP_01 } from './world/map01.js';
import { SpawnSystem } from './world/SpawnSystem.js';
import { TileMap } from './world/TileMap.js';

const settings = new GameSettings();
let gameplaySettings = settings.gameplay();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
const input = new Input(window, settings);
const map = new TileMap(MAP_01);
const camera = new Camera();
const worldRenderer = new WorldRenderer(ctx, map);
const playerRenderer = new PlayerRenderer(ctx);
const weaponRenderer = new WeaponRenderer(ctx);
const damageFeedback = new DamageFeedbackRenderer(ctx);
const combatFeedback = new CombatFeedbackRenderer(ctx);
const damageSystem = new DamageSystem();
const spawnSystem = new SpawnSystem(map);
const minimapRenderer = new MinimapRenderer(document.getElementById('minimapCanvas'), map);
const loadoutStore = new LoadoutStore();

const player = new Player(MAP_01.spawns.blue[1], 'blue', 'local-blue');
player.isLocal = true;
player.controlsCamera = true;
const blueBot1 = new Player(MAP_01.spawns.blue[0], 'blue', 'blue-bot-1');
const blueBot2 = new Player(MAP_01.spawns.blue[2], 'blue', 'blue-bot-2');
const redBot1 = new Player(MAP_01.spawns.red[0], 'red', 'red-bot-1');
const redBot2 = new Player(MAP_01.spawns.red[1], 'red', 'red-bot-2');
const redBot3 = new Player(MAP_01.spawns.red[2], 'red', 'red-bot-3');
const bots = [blueBot1, blueBot2, redBot1, redBot2, redBot3];
for (const bot of bots) bot.controlsCamera = false;
const players = [player, ...bots];
const pathfinder = new GridPathfinder(map, player.radius);

let match = null;
let killStreak = 0;
let recentKills = [];
let combatBannerTimer = 0;
let streakBannerTimer = 0;
let debug = false;
let paused = false;
let matchStarted = false;
let fps = 0;
let frames = 0;
let fpsClock = 0;
let statusClock = 0;
let dpr = 1;

const combatBanner = document.getElementById('combatBanner');
const streakBanner = document.getElementById('streakBanner');
const pausePanel = document.getElementById('pausePanel');
const pauseMatchView = document.getElementById('pauseMatchView');
const pauseSettingsView = document.getElementById('pauseSettingsView');
const roundLoadoutPanel = document.getElementById('roundLoadoutPanel');
const roundLoadoutGrid = document.getElementById('roundLoadoutGrid');

function showCombatBanner(text, crit = false, duration = 0.8) {
  combatBanner.textContent = text;
  combatBanner.classList.toggle('crit', crit);
  combatBanner.classList.add('visible');
  combatBannerTimer = duration;
}

function showStreakBanner(text, duration = 1.15) {
  streakBanner.textContent = text;
  streakBanner.classList.add('visible');
  streakBannerTimer = duration;
}

function registerLocalKill() {
  const now = performance.now() / 1000;
  killStreak += 1;
  recentKills = recentKills.filter((time) => now - time <= 3);
  recentKills.push(now);
  showCombatBanner('ELIMINATED');
  if (recentKills.length >= 4) showStreakBanner(recentKills.length === 4 ? 'QUAD KILL' : `${recentKills.length}X MULTI KILL`);
  if (killStreak === 10) showStreakBanner('10 KILL STREAK', 1.5);
}

function onMatchKill(event) {
  if (event.victim?.id === player.id) {
    killStreak = 0;
    recentKills = [];
  }
  if (event.credited && event.attacker?.id === player.id) registerLocalKill();
}

function handleElimination(attacker, victim, result) {
  damageFeedback.spawnDeathBurst(victim);
  match?.recordElimination(attacker, victim, result);
}

const projectiles = new ProjectileSystem(damageSystem, combatFeedback, {
  onKill: (owner, victim, result) => handleElimination(owner, victim, result)
});

function attachWeapons(actor, loadout) {
  const manager = new WeaponManager(actor, damageSystem, combatFeedback, projectiles, loadout, {
    onKill: (victim, result) => handleElimination(actor, victim, result)
  });
  actor.setWeaponManager(manager);
  return manager;
}

const initialLoadout = loadoutStore.get();
const weapons = attachWeapons(player, { primary: initialLoadout.primary, secondary: initialLoadout.secondary });
attachWeapons(blueBot1, { primary: WEAPONS.smg, secondary: WEAPONS.pistol });
attachWeapons(blueBot2, { primary: WEAPONS.sniper, secondary: WEAPONS.shotgun });
attachWeapons(redBot1, { primary: WEAPONS.assaultRifle, secondary: WEAPONS.launcher });
attachWeapons(redBot2, { primary: WEAPONS.lmg, secondary: WEAPONS.pistol });
attachWeapons(redBot3, { primary: WEAPONS.shotgun, secondary: WEAPONS.melee });
const botBrains = new Map(bots.map((bot, index) => [bot.id, new BotController(bot, bot.weaponManager, index + 1)]));

match = new MatchManager({
  players,
  spawnSystem,
  projectileSystem: projectiles,
  onKill: onMatchKill,
  onRoundReset: () => {
    camera.x = player.x;
    camera.y = player.y;
    camera.clamp();
    showCombatBanner(`ROUND ${match?.round || 1}`, false, 0.8);
  },
  onRoundEnd: ({ winner }) => showStreakBanner(`${winner.toUpperCase()} WINS ROUND`, 1.2),
  onMatchEnd: ({ winner }) => showStreakBanner(`${winner.toUpperCase()} TEAM WINS`, 2.2)
});

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

function resetBotNavigation() {
  for (const brain of botBrains.values()) brain.resetNavigation(map.revision);
}

function startMatchWithLoadout({ primary, secondary, slotIndex, name }) {
  weapons.setLoadout(primary, secondary);
  loadoutStore.setActive(slotIndex);
  matchStarted = true;
  paused = false;
  input.setSuspended(false);
  document.body.classList.remove('menu-open');
  document.body.classList.add('match-started');
  mainMenu.hide();
  pausePanel.classList.remove('visible');
  match.startMatch();
  resetBotNavigation();
  renderRoundLoadoutPanel();
  showCombatBanner(`${name.toUpperCase()} · ${primary.shortName} + ${secondary.shortName}`, false, 1.0);
  updateDiagnostics();
  updateMatchHud();
}

function openLoadouts(mode) {
  mainMenu.hide();
  document.body.classList.add('menu-open');
  input.setSuspended(true);
  loadoutScreen.open(mode);
}

function returnToMainMenu() {
  paused = false;
  matchStarted = false;
  loop.setPaused(false);
  input.setSuspended(true);
  pausePanel.classList.remove('visible');
  roundLoadoutPanel.classList.remove('visible');
  document.body.classList.remove('match-started');
  document.body.classList.add('menu-open');
  mainMenu.show('home');
}

const loadoutScreen = new LoadoutScreen(document.getElementById('loadoutScreen'), loadoutStore, (result) => {
  if (result.mode === 'manage') {
    document.body.classList.add('menu-open');
    input.setSuspended(true);
    mainMenu.show('home');
    renderRoundLoadoutPanel();
    return;
  }
  startMatchWithLoadout(result);
});

const mainMenu = new MainMenu(document.getElementById('mainMenu'), {
  onPlay: () => openLoadouts('play'),
  onLoadouts: () => openLoadouts('manage'),
  onQuit: () => window.gameAPI.quit()
});

new SettingsPanel(document.getElementById('mainSettingsPanel'), settings, {
  onFullscreen: () => window.gameAPI.toggleFullscreen()
});
new SettingsPanel(pauseSettingsView, settings, {
  onFullscreen: () => window.gameAPI.toggleFullscreen()
});
input.setSuspended(true);

function opponentsOf(actor) {
  return players.filter((other) => other !== actor && other.team !== actor.team && other.health.alive);
}

function teammatesOf(actor) {
  return players.filter((other) => other !== actor && other.team === actor.team && other.health.alive);
}

function enemyCollisionRects(actor) {
  return opponentsOf(actor).map((enemy) => ({
    x: enemy.x - enemy.radius,
    y: enemy.y - enemy.radius,
    w: enemy.radius * 2,
    h: enemy.radius * 2,
    kind: 'player'
  }));
}

function respawnReadyPlayers() {
  for (const actor of players) {
    if (!actor.health.readyToRespawn()) continue;
    const spawn = match.respawnPlayer(actor);
    if (!spawn) continue;
    if (actor.isLocal) {
      camera.x = actor.x;
      camera.y = actor.y;
      camera.clamp();
      showCombatBanner('RESPAWNED', false, 0.55);
    }
  }
}

function updateBotBrains(dt) {
  const targetCounts = new Map();
  for (const bot of bots) {
    const brain = botBrains.get(bot.id);
    brain.update(dt, {
      camera,
      enemies: opponentsOf(bot),
      teammates: teammatesOf(bot),
      map,
      targetCounts,
      pathfinder
    });
    if (brain.target?.health?.alive) targetCounts.set(brain.target.id, (targetCounts.get(brain.target.id) || 0) + 1);
  }
}

function updateActors(dt) {
  updateBotBrains(dt);
  player.update(dt, input, map, camera, enemyCollisionRects(player));
  for (const bot of bots) bot.update(dt, botBrains.get(bot.id), map, camera, enemyCollisionRects(bot));

  for (const actor of players) {
    if (!match.isLive()) break;
    combatFeedback.suppressHitmarker = !actor.isLocal;
    const actorInput = actor.isLocal ? input : botBrains.get(actor.id);
    actor.weaponManager.update(dt, actorInput, map, players);
    combatFeedback.suppressHitmarker = false;
  }

  if (match.isLive()) projectiles.update(dt, map, players);
  respawnReadyPlayers();
}

function updateAnnouncements(dt) {
  combatBannerTimer = Math.max(0, combatBannerTimer - dt);
  streakBannerTimer = Math.max(0, streakBannerTimer - dt);
  combatBanner.classList.toggle('visible', combatBannerTimer > 0);
  streakBanner.classList.toggle('visible', streakBannerTimer > 0);
}

function update(dt) {
  input.updateAimPointer();
  if (input.wasPressed('F11')) window.gameAPI.toggleFullscreen();
  if (!matchStarted) {
    input.endFrame();
    return;
  }
  if (input.wasPressed('F1')) {
    debug = !debug;
    document.body.classList.toggle('debug-visible', debug);
  }
  if (match.state === 'match-over' && input.wasPressed('Enter')) {
    killStreak = 0;
    recentKills = [];
    match.startMatch();
    resetBotNavigation();
  }

  match.update(dt);
  if (match.isLive()) updateActors(dt);
  damageFeedback.update(dt);
  combatFeedback.update(dt);
  updateAnnouncements(dt);

  if (player.health.alive) {
    const lead = AIM_CAMERA_LEAD_TILES * TILE_SIZE;
    camera.follow(player.x + Math.cos(player.aimAngle) * lead, player.y + Math.sin(player.aimAngle) * lead, dt);
  }

  statusClock += dt;
  if (statusClock >= 0.05) {
    statusClock = 0;
    updateDiagnostics();
    updateMatchHud();
  }
  input.endFrame();
}

function drawBotPaths() {
  if (!debug) return;
  ctx.save();
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 7]);
  for (const bot of bots) {
    const brain = botBrains.get(bot.id);
    const path = brain.debugPath || [];
    if (!path.length) continue;
    ctx.strokeStyle = bot.team === 'blue' ? 'rgba(93,211,255,.55)' : 'rgba(255,103,120,.55)';
    ctx.beginPath();
    ctx.moveTo(bot.x, bot.y);
    for (const point of path) ctx.lineTo(point.x, point.y);
    ctx.stroke();
    for (const point of path) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    }
  }
  ctx.restore();
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
  const shake = gameplaySettings.screenShake ? combatFeedback.shakeOffset() : { x: 0, y: 0 };
  ctx.save();
  ctx.translate(shake.x, shake.y);
  camera.begin(ctx);
  worldRenderer.drawBase(camera, debug);
  damageFeedback.drawWorld();
  combatFeedback.drawProjectiles(projectiles.projectiles);
  combatFeedback.drawWorld();
  drawBotPaths();

  // Keep eliminated actors in the ordered presentation pass so the authored
  // death marker remains visible during the respawn window. Live-only weapon
  // effects stay gated below and can never flash from an eliminated actor.
  const drawOrder = players.slice().sort((a, b) => a.y - b.y);
  for (const actor of drawOrder) {
    playerRenderer.draw(actor, actor.weaponManager);
    if (!actor.health.alive) continue;
    weaponRenderer.draw(actor, actor.weaponManager);
    weaponRenderer.drawMuzzleFlash(actor, actor.weaponManager);
    damageFeedback.drawPlayerFeedback(actor);
    if (debug) playerRenderer.drawDebug(actor);
  }
  worldRenderer.drawForeground(player.health.alive ? player : null, debug);
  camera.end(ctx);
  ctx.restore();

  if (matchStarted) {
    damageFeedback.drawScreen(player, innerWidth, innerHeight, { vignette: gameplaySettings.damageVignette });
    const pointer = input.pointerPosition();
    combatFeedback.drawCrosshair(pointer, weapons);
    combatFeedback.drawHitmarker(pointer);
    minimapRenderer.draw({ players, localPlayer: player });
  }

  if (isPaused && matchStarted) {
    ctx.fillStyle = 'rgba(5,13,19,.38)';
    ctx.fillRect(0, 0, innerWidth, innerHeight);
  }
}

function updateDashHud() {
  const root = document.getElementById('dashRoot');
  root.classList.toggle('active', player.dashing);
  root.classList.toggle('denied', player.dashDeniedTimer > 0);
  root.classList.toggle('invulnerable', player.isInvulnerable());
  for (let i = 0; i < DASH_CHARGES_MAX; i += 1) document.getElementById(`dashPip${i}`).classList.toggle('spent', i >= player.dashCharges);
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
      : health.alive && health.health < 75 ? 'REGENERATING' : '150 MAX · REGEN CAP 75';
  document.getElementById('respawnRoot').classList.toggle('visible', !health.alive && match.isLive());
  document.getElementById('respawnValue').textContent = `${Math.max(0, health.respawnTimer).toFixed(1)}`;
}

function updateWeaponHud() {
  const weapon = weapons.currentWeapon();
  const ammo = weapons.currentAmmo();
  const root = document.getElementById('weaponRoot');
  document.getElementById('weaponSlot').textContent = weapons.currentSlot.toUpperCase();
  document.getElementById('weaponName').textContent = weapon?.name?.toUpperCase() || 'UNARMED';
  document.getElementById('ammoMagazine').textContent = weapon?.magazineSize > 0 ? (ammo?.magazine ?? 0) : '—';
  document.getElementById('ammoReserve').textContent = weapon?.magazineSize > 0 ? (ammo?.reserve ?? 0) : '—';
  document.getElementById('weaponState').textContent = weapons.isReloading()
    ? `${weapon.reloadStyle === 'shell' ? 'LOAD SHELL' : 'RELOAD'} ${weapons.reloadTimer.toFixed(1)}S`
    : weapons.isSwitching()
      ? `SWAP → ${(weapons.pendingSlot || '').toUpperCase()}`
      : weapons.postReloadDelay > 0
        ? `READY ${weapons.postReloadDelay.toFixed(1)}S`
        : weapons.isADSActive() ? `ADS ${Math.round(weapons.adsProgress * 100)}%` : 'READY';
  document.getElementById('spreadState').textContent = `${weapons.currentSpreadDegrees().toFixed(2)}°`;
  document.getElementById('aimNote').textContent = `${bindingLabel(settings.binding('dash'))} DASH · ${bindingLabel(settings.binding('fire'))} FIRE · ${bindingLabel(settings.binding('ads'))} ADS · F1 DEBUG`;

  const primaryIndicator = document.getElementById('primarySlotIndicator');
  const secondaryIndicator = document.getElementById('secondarySlotIndicator');
  primaryIndicator.textContent = `${bindingLabel(settings.binding('primary'))} ${weapons.loadout.primary.shortName}`;
  secondaryIndicator.textContent = `${bindingLabel(settings.binding('secondary'))} ${weapons.loadout.secondary.shortName}`;
  primaryIndicator.classList.toggle('active', weapons.currentSlot === 'primary');
  secondaryIndicator.classList.toggle('active', weapons.currentSlot === 'secondary');

  root.classList.toggle('reloading', weapons.isReloading());
  root.classList.toggle('ads', weapons.isADSActive());
  root.classList.toggle('empty', weapon?.magazineSize > 0 && (ammo?.magazine ?? 0) <= 0);
}

function renderRoundLoadoutPanel() {
  const active = loadoutStore.get();
  document.getElementById('roundLoadoutCurrent').textContent = `SLOT ${String(active.index + 1).padStart(2, '0')} · ${active.name.toUpperCase()} · ${active.primary.shortName} + ${active.secondary.shortName}`;
  roundLoadoutGrid.innerHTML = loadoutStore.all().map((slot) => `<button type="button" data-round-loadout="${slot.index}" class="${slot.index === active.index ? 'active' : ''}"><b>${String(slot.index + 1).padStart(2, '0')}</b><span>${slot.name}</span><small>${slot.primary.shortName} + ${slot.secondary.shortName}</small></button>`).join('');
}

roundLoadoutGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-round-loadout]');
  if (!button || !match.canChangeLoadout()) return;
  const saved = loadoutStore.setActive(Number(button.dataset.roundLoadout));
  weapons.setLoadout(saved.primary, saved.secondary);
  renderRoundLoadoutPanel();
  updateWeaponHud();
  showCombatBanner(`NEXT ROUND · ${saved.name.toUpperCase()} · ${saved.primary.shortName} + ${saved.secondary.shortName}`, false, 0.9);
});

function updateMatchHud() {
  const snapshot = match.snapshot();
  document.getElementById('roundLabel').textContent = `ROUND ${snapshot.round || 1} / 9`;
  document.getElementById('roundTimer').textContent = snapshot.timerLabel;
  document.getElementById('blueRoundWins').textContent = snapshot.wins.blue;
  document.getElementById('redRoundWins').textContent = snapshot.wins.red;
  document.getElementById('blueKills').textContent = snapshot.kills.blue;
  document.getElementById('redKills').textContent = snapshot.kills.red;
  const overlay = document.getElementById('roundOverlay');
  const text = document.getElementById('roundOverlayText');
  const sub = document.getElementById('roundOverlaySub');
  overlay.classList.toggle('visible', matchStarted && Boolean(snapshot.overlay));
  overlay.classList.toggle('sudden', snapshot.state === 'sudden-death');
  text.textContent = snapshot.overlay;
  sub.textContent = snapshot.state === 'round-break'
    ? `NEXT ROUND IN ${Math.ceil(snapshot.stateTimer)} · SIDES SWAP · QUICK LOADOUT BELOW`
    : snapshot.state === 'match-over'
      ? 'PRESS ENTER TO RUN IT BACK'
      : snapshot.state === 'countdown'
        ? 'GET READY'
        : snapshot.state === 'sudden-death' ? 'NEXT CREDITED KILL WINS THE ROUND' : '';

  roundLoadoutPanel.classList.toggle('visible', matchStarted && snapshot.canChangeLoadout && !paused);
  const active = loadoutStore.get();
  document.getElementById('roundLoadoutCurrent').textContent = `SLOT ${String(active.index + 1).padStart(2, '0')} · ${active.name.toUpperCase()} · ${active.primary.shortName} + ${active.secondary.shortName}`;
  document.getElementById('pauseRound').textContent = `${snapshot.round || 1} / 9`;
  document.getElementById('pauseScore').textContent = `${snapshot.kills.blue} - ${snapshot.kills.red}`;
  document.getElementById('pauseLoadout').textContent = `${String(active.index + 1).padStart(2, '0')} · ${active.name.toUpperCase()}`;
}

function updateBindingDiagnostics() {
  document.getElementById('moveBindingState').textContent = `${bindingLabel(settings.binding('moveUp'))}${bindingLabel(settings.binding('moveLeft'))}${bindingLabel(settings.binding('moveDown'))}${bindingLabel(settings.binding('moveRight'))} / ARROWS`;
  document.getElementById('sprintBindingState').textContent = bindingLabel(settings.binding('sprint'));
  document.getElementById('dashBindingState').textContent = bindingLabel(settings.binding('dash'));
  document.getElementById('fireBindingState').textContent = `${bindingLabel(settings.binding('fire'))} / ${bindingLabel(settings.binding('ads'))}`;
  document.getElementById('slotBindingState').textContent = `${bindingLabel(settings.binding('primary'))} / ${bindingLabel(settings.binding('secondary'))} + WHEEL`;
  document.getElementById('reloadBindingState').textContent = bindingLabel(settings.binding('reload'));
}

function updateDiagnostics() {
  const tile = map.tileAtWorld(player.x, player.y);
  document.getElementById('coords').textContent = `Tile ${tile.col}, ${tile.row}`;
  document.getElementById('camera').textContent = `${(camera.x / TILE_SIZE).toFixed(1)}, ${(camera.y / TILE_SIZE).toFixed(1)}`;
  document.getElementById('debugState').textContent = debug ? 'DEBUG ON' : 'DEBUG OFF';
  document.getElementById('moveState').textContent = player.state.toUpperCase();
  document.getElementById('speed').textContent = `${player.speedTilesPerSecond().toFixed(1)} T/S`;
  document.getElementById('staminaValue').textContent = `${Math.round(player.stamina)}`;
  document.getElementById('staminaFill').style.width = `${Math.round(player.staminaPercent() * 100)}%`;
  document.getElementById('staminaRoot').classList.toggle('sprinting', player.sprinting);
  document.getElementById('staminaRoot').classList.toggle('recovering', !player.sprinting && player.staminaRegenDelay > 0);
  document.getElementById('dashState').textContent = player.dashing ? 'DASHING' : player.dashCooldown > 0 ? `${player.dashCooldown.toFixed(2)}S` : 'READY';
  document.getElementById('invulnState').textContent = player.isInvulnerable()
    ? player.health.isSpawnProtected() ? `SPAWN ${player.health.spawnProtectionTimer.toFixed(2)}S` : `DASH ${player.invulnerabilityTimer.toFixed(2)}S`
    : 'OFF';
  document.getElementById('damageTestState').textContent = `${players.filter((actor) => actor.health.alive).length}/6 ALIVE`;
  document.getElementById('pathState').textContent = `${bots.filter((bot) => (botBrains.get(bot.id).debugPath || []).length > 0).length}/5`;
  gameplaySettings = settings.gameplay();
  document.getElementById('aiModeState').textContent = `${gameplaySettings.aiDifficulty.toUpperCase()}`;
  document.getElementById('sensState').textContent = `${gameplaySettings.sensitivity.toFixed(2)}X`;
  updateBindingDiagnostics();
  updateDashHud();
  updateHealthHud();
  updateWeaponHud();
}

function showPauseTab(tab) {
  const settingsTab = tab === 'settings';
  pauseMatchView.classList.toggle('active', !settingsTab);
  pauseSettingsView.classList.toggle('active', settingsTab);
  for (const button of document.querySelectorAll('[data-pause-tab]')) button.classList.toggle('active', button.dataset.pauseTab === (settingsTab ? 'settings' : 'match'));
}

function setPaused(value) {
  if (!matchStarted) return;
  paused = Boolean(value);
  loop.setPaused(paused);
  input.setSuspended(paused);
  pausePanel.classList.toggle('visible', paused);
  roundLoadoutPanel.classList.toggle('visible', !paused && match.canChangeLoadout());
  if (paused) {
    showPauseTab('match');
    updateMatchHud();
  }
  input.endFrame();
}

for (const button of document.querySelectorAll('[data-pause-tab]')) button.addEventListener('click', () => showPauseTab(button.dataset.pauseTab));
document.getElementById('pauseSettingsButton').addEventListener('click', () => showPauseTab('settings'));
document.getElementById('settingsBackButton').addEventListener('click', () => showPauseTab('match'));
document.getElementById('resumeButton').addEventListener('click', () => setPaused(false));
document.getElementById('pauseMainMenuButton').addEventListener('click', () => returnToMainMenu());

window.addEventListener('unblockedtdm:settings-change', () => {
  gameplaySettings = settings.gameplay();
  updateBindingDiagnostics();
});

const loop = new GameLoop(update, render);
window.addEventListener('keydown', (event) => {
  if (event.code === 'Escape' && matchStarted && !event.repeat) {
    if (document.querySelector('.binding-row button.listening')) return;
    setPaused(!paused);
  }
});

renderRoundLoadoutPanel();
updateBindingDiagnostics();
updateDiagnostics();
updateMatchHud();

(async () => {
  const buildInfo = await window.gameAPI.getBuildInfo();
  document.getElementById('buildLabel').textContent = `BUILD ${buildInfo.gameVersion} · VERSION ${buildInfo.build}`;
  document.getElementById('phaseLabel').textContent = buildInfo.phase;
  document.getElementById('mapLabel').textContent = `${MAP_01.name.toUpperCase()} · ${MAP_01.cols}×${MAP_01.rows} TILES`;
  document.getElementById('mainBuildLabel').textContent = `BUILD ${buildInfo.gameVersion} · VERSION ${buildInfo.build}`;
  document.getElementById('mainPhaseLabel').textContent = buildInfo.phase;
  loop.start();
})();
