import { Player } from './actors/Player.js';
import { DamageSystem } from './combat/DamageSystem.js';
import { WeaponManager } from './combat/WeaponManager.js';
import { GameLoop } from './engine/GameLoop.js';
import { Input } from './engine/Input.js';
import { AIM_CAMERA_LEAD_TILES,DASH_CHARGES_MAX,TILE_SIZE } from './engine/constants.js';
import { CombatFeedbackRenderer } from './render/CombatFeedbackRenderer.js';
import { DamageFeedbackRenderer } from './render/DamageFeedbackRenderer.js';
import { PlayerRenderer } from './render/PlayerRenderer.js';
import { WeaponRenderer } from './render/WeaponRenderer.js';
import { WorldRenderer } from './render/WorldRenderer.js';
import { Camera } from './world/Camera.js';
import { MAP_01 } from './world/map01.js';
import { SpawnSystem } from './world/SpawnSystem.js';
import { TileMap } from './world/TileMap.js';

const canvas=document.getElementById('gameCanvas');
const ctx=canvas.getContext('2d',{alpha:false,desynchronized:true});
const input=new Input(window); const map=new TileMap(MAP_01); const camera=new Camera();
const worldRenderer=new WorldRenderer(ctx,map); const playerRenderer=new PlayerRenderer(ctx); const weaponRenderer=new WeaponRenderer(ctx);
const damageFeedback=new DamageFeedbackRenderer(ctx); const combatFeedback=new CombatFeedbackRenderer(ctx); const damageSystem=new DamageSystem(); const spawnSystem=new SpawnSystem(map);
const player=new Player(MAP_01.spawns.blue[1],'blue','local-blue');
const target=new Player(MAP_01.spawns.red[1],'red','dev-red');
const weapons=new WeaponManager(player,damageSystem,combatFeedback,undefined,{onKill:(victim)=>damageFeedback.spawnDeathBurst(victim)});
player.setWeaponManager(weapons);

let debug=false,paused=false,fps=0,frames=0,fpsClock=0,statusClock=0,dpr=1,devMessage='AR READY',devMessageTimer=0;

function resizeCanvas(){dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.max(1,Math.floor(innerWidth*dpr));canvas.height=Math.max(1,Math.floor(innerHeight*dpr));canvas.style.width=`${innerWidth}px`;canvas.style.height=`${innerHeight}px`;camera.resize(innerWidth,innerHeight);}
window.addEventListener('resize',resizeCanvas);resizeCanvas();camera.x=player.x;camera.y=player.y;camera.clamp();

function sourceAtPointer(){const p=input.pointerPosition();return camera.screenToWorld(p.x,p.y);}
function setDevMessage(message,seconds=1.2){devMessage=message;devMessageTimer=seconds;}
function applyDevDamage(amount,sourceTeam='red'){
  const result=damageSystem.applyDamage({target:player,amount,sourceId:sourceTeam==='blue'?'friendly-test':'enemy-test',sourceTeam,sourcePosition:sourceAtPointer(),sourceType:'development-test'});
  if(result.applied){setDevMessage(result.killed?`LETHAL ${Math.round(result.amount)}`:`-${Math.round(result.amount)} HP`);if(result.killed){player.onDeath();damageFeedback.spawnDeathBurst(player);}}
  else setDevMessage(({'friendly-fire':'FRIENDLY FIRE BLOCKED','spawn-protection':'SPAWN PROTECTED','dash-invulnerability':'DASH INVULNERABLE',dead:'PLAYER DEAD'})[result.reason]||result.reason.toUpperCase());
}

function resetRoundForTest(){
  player.resetForRound(MAP_01.spawns.blue[1]); target.resetForRound(MAP_01.spawns.red[1]);
  camera.x=player.x;camera.y=player.y;camera.clamp();setDevMessage('ROUND RESET');
}
function handleDevelopmentInputs(){if(input.wasPressed('F2'))applyDevDamage(25);if(input.wasPressed('F3'))applyDevDamage(75);if(input.wasPressed('F4'))applyDevDamage(999);if(input.wasPressed('KeyG'))applyDevDamage(50,'blue');if(input.wasPressed('F6'))resetRoundForTest();}

function respawnPlayerIfReady(){if(!player.health.readyToRespawn())return;const spawn=spawnSystem.chooseSpawn(player.team,{enemies:[target]});player.respawn(spawn);camera.x=player.x;camera.y=player.y;camera.clamp();setDevMessage(`RESPAWNED · SPAWN ${spawn.index+1}`);}
function updateTarget(dt){
  target.health.update(dt); target.animationTime+=dt; target.animationPhase=(target.animationPhase+dt*0.75)%1;
  if(target.health.alive){const angle=Math.atan2(player.y-target.y,player.x-target.x);target.aimAngle=angle;target.visualAimAngle=angle;target.moveAngle=angle;target.visualMoveAngle=angle;}
  else if(target.health.readyToRespawn()){target.respawn(MAP_01.spawns.red[1]);setDevMessage('COMBAT TARGET RESPAWNED');}
}

function update(dt){
  if(input.wasPressed('F1'))debug=!debug;if(input.wasPressed('F11'))window.gameAPI.toggleFullscreen();
  player.update(dt,input,map,camera); updateTarget(dt); handleDevelopmentInputs();
  weapons.update(dt,input,map,[target]); respawnPlayerIfReady(); damageFeedback.update(dt); combatFeedback.update(dt);
  if(player.health.alive){const lead=AIM_CAMERA_LEAD_TILES*TILE_SIZE;camera.follow(player.x+Math.cos(player.aimAngle)*lead,player.y+Math.sin(player.aimAngle)*lead,dt);}
  devMessageTimer=Math.max(0,devMessageTimer-dt);if(devMessageTimer<=0)devMessage='AR READY';
  statusClock+=dt;if(statusClock>=0.05){statusClock=0;updateDiagnostics();} input.endFrame();
}

function render(dt,now,isPaused){
  frames+=1;fpsClock+=dt;if(fpsClock>=0.5){fps=Math.round(frames/Math.max(fpsClock,0.001));frames=0;fpsClock=0;document.getElementById('fps').textContent=`${fps} FPS`;}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#142b36';ctx.fillRect(0,0,innerWidth,innerHeight);
  camera.begin(ctx);worldRenderer.drawBase(camera,debug);damageFeedback.drawWorld();combatFeedback.drawWorld();
  if(target.health.alive){playerRenderer.draw(target);damageFeedback.drawPlayerFeedback(target);if(debug)playerRenderer.drawDebug(target);}
  if(player.health.alive){playerRenderer.draw(player);weaponRenderer.draw(player,weapons);weaponRenderer.drawMuzzleFlash(player,weapons);damageFeedback.drawPlayerFeedback(player);if(debug)playerRenderer.drawDebug(player);}
  worldRenderer.drawForeground(player.health.alive?player:null,debug);camera.end(ctx);
  damageFeedback.drawScreen(player,innerWidth,innerHeight);
  const pointer=input.pointerPosition();combatFeedback.drawCrosshair(pointer,weapons);combatFeedback.drawHitmarker(pointer);
  if(isPaused){ctx.fillStyle='rgba(5,13,19,.38)';ctx.fillRect(0,0,innerWidth,innerHeight);}
}

function updateDashHud(){
  const root=document.getElementById('dashRoot');root.classList.toggle('active',player.dashing);root.classList.toggle('denied',player.dashDeniedTimer>0);root.classList.toggle('invulnerable',player.isInvulnerable());
  for(let i=0;i<DASH_CHARGES_MAX;i++)document.getElementById(`dashPip${i}`).classList.toggle('spent',i>=player.dashCharges);
  document.getElementById('dashCount').textContent=`${player.dashCharges}/${DASH_CHARGES_MAX}`;
}
function updateHealthHud(){
  const h=player.health,root=document.getElementById('healthRoot');root.classList.toggle('dead',!h.alive);root.classList.toggle('protected',h.isSpawnProtected());
  document.getElementById('healthValue').textContent=h.alive?`${Math.ceil(h.health)}`:'0';document.getElementById('healthFill').style.width=`${Math.round(h.healthPercent()*100)}%`;
  document.getElementById('healthStatus').textContent=h.isSpawnProtected()?`PROTECTED ${h.spawnProtectionTimer.toFixed(1)}S`:h.alive&&h.timeSinceDamage<7?`REGEN IN ${Math.max(0,7-h.timeSinceDamage).toFixed(1)}S`:h.alive&&h.health<75?'REGENERATING':'150 MAX · REGEN CAP 75';
  document.getElementById('respawnRoot').classList.toggle('visible',!h.alive);document.getElementById('respawnValue').textContent=`${Math.max(0,h.respawnTimer).toFixed(1)}`;
}
function updateWeaponHud(){
  const w=weapons.currentWeapon(),a=weapons.currentAmmo(),root=document.getElementById('weaponRoot');
  document.getElementById('weaponName').textContent=w?.name?.toUpperCase()||'UNARMED';document.getElementById('ammoMagazine').textContent=a?.magazine??0;document.getElementById('ammoReserve').textContent=a?.reserve??0;
  document.getElementById('weaponState').textContent=weapons.isReloading()?`RELOAD ${weapons.reloadTimer.toFixed(1)}S`:weapons.isSwitching()?'SWAPPING':weapons.postReloadDelay>0?`READY ${weapons.postReloadDelay.toFixed(1)}S`:weapons.isADSActive()?`ADS ${Math.round(weapons.adsProgress*100)}%`:'READY';
  document.getElementById('spreadState').textContent=`${weapons.currentSpreadDegrees().toFixed(2)}°`;
  root.classList.toggle('reloading',weapons.isReloading());root.classList.toggle('ads',weapons.isADSActive());root.classList.toggle('empty',(a?.magazine??0)<=0);
}
function updateDiagnostics(){
  const tile=map.tileAtWorld(player.x,player.y);document.getElementById('coords').textContent=`Tile ${tile.col}, ${tile.row}`;document.getElementById('camera').textContent=`${(camera.x/TILE_SIZE).toFixed(1)}, ${(camera.y/TILE_SIZE).toFixed(1)}`;
  document.getElementById('debugState').textContent=debug?'COLLISION ON':'COLLISION OFF';document.getElementById('moveState').textContent=player.state.toUpperCase();document.getElementById('speed').textContent=`${player.speedTilesPerSecond().toFixed(1)} T/S`;
  document.getElementById('staminaValue').textContent=`${Math.round(player.stamina)}`;document.getElementById('staminaFill').style.width=`${Math.round(player.staminaPercent()*100)}%`;document.getElementById('staminaRoot').classList.toggle('sprinting',player.sprinting);document.getElementById('staminaRoot').classList.toggle('recovering',!player.sprinting&&player.staminaRegenDelay>0);
  document.getElementById('dashState').textContent=player.dashing?'DASHING':player.dashCooldown>0?`${player.dashCooldown.toFixed(2)}S`:'READY';document.getElementById('invulnState').textContent=player.isInvulnerable()?(player.health.isSpawnProtected()?`SPAWN ${player.health.spawnProtectionTimer.toFixed(2)}S`:`DASH ${player.invulnerabilityTimer.toFixed(2)}S`):'OFF';
  document.getElementById('damageTestState').textContent=devMessage; updateDashHud();updateHealthHud();updateWeaponHud();
}

const loop=new GameLoop(update,render);
window.addEventListener('keydown',(event)=>{if(event.code==='Escape'){paused=!paused;loop.setPaused(paused);document.getElementById('pausePanel').classList.toggle('visible',paused);input.endFrame();}});
(async()=>{const buildInfo=await window.gameAPI.getBuildInfo();document.getElementById('buildLabel').textContent=`BUILD ${buildInfo.gameVersion} · VERSION ${buildInfo.build}`;document.getElementById('phaseLabel').textContent=buildInfo.phase;document.getElementById('mapLabel').textContent=`${MAP_01.name.toUpperCase()} · ${MAP_01.cols}×${MAP_01.rows} TILES`;updateDiagnostics();loop.start();})();
