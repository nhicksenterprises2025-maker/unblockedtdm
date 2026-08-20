import { DamageSystem } from './combat/DamageSystem.js';
import { ProjectileSystem } from './combat/ProjectileSystem.js';
import { WeaponManager } from './combat/WeaponManager.js';
import { DEFAULT_LOADOUT } from './data/weapons.js';
import { GameLoop } from './engine/GameLoop.js';
import { Input } from './engine/Input.js';
import { AIM_CAMERA_LEAD_TILES,DASH_CHARGES_MAX,TILE_SIZE } from './engine/constants.js';
import { MatchManager,MATCH_STATE } from './match/MatchManager.js';
import { MatchRoster } from './match/MatchRoster.js';
import { CombatFeedbackRenderer } from './render/CombatFeedbackRenderer.js';
import { DamageFeedbackRenderer } from './render/DamageFeedbackRenderer.js';
import { PlayerRenderer } from './render/PlayerRenderer.js';
import { WeaponRenderer } from './render/WeaponRenderer.js';
import { WorldRenderer } from './render/WorldRenderer.js';
import { LoadoutScreen } from './ui/LoadoutScreen.js';
import { Camera } from './world/Camera.js';
import { MAP_01 } from './world/map01.js';
import { SpawnSystem } from './world/SpawnSystem.js';
import { TileMap } from './world/TileMap.js';

const canvas=document.getElementById('gameCanvas');
const ctx=canvas.getContext('2d',{alpha:false,desynchronized:true});
const input=new Input(window),map=new TileMap(MAP_01),camera=new Camera();
const worldRenderer=new WorldRenderer(ctx,map),playerRenderer=new PlayerRenderer(ctx),weaponRenderer=new WeaponRenderer(ctx);
const damageFeedback=new DamageFeedbackRenderer(ctx),combatFeedback=new CombatFeedbackRenderer(ctx),damageSystem=new DamageSystem(),spawnSystem=new SpawnSystem(map);
const roster=new MatchRoster(MAP_01,damageSystem,combatFeedback),player=roster.local();
let localWeapons=null,projectiles=null;
let debug=false,paused=false,matchStarted=false,fps=0,frames=0,fpsClock=0,statusClock=0,dpr=1,devMessage='LOADOUT REQUIRED',devMessageTimer=0;
let killStreak=0,recentKills=[],combatBannerTimer=0,streakBannerTimer=0,lastRoundSeen=1,lastState=null;
const combatBanner=document.getElementById('combatBanner'),streakBanner=document.getElementById('streakBanner'),matchOverlay=document.getElementById('matchOverlay');

function showCombatBanner(text,crit=false,duration=.8){combatBanner.textContent=text;combatBanner.classList.toggle('crit',crit);combatBanner.classList.add('visible');combatBannerTimer=duration;}
function showStreakBanner(text,duration=1.15){streakBanner.textContent=text;streakBanner.classList.add('visible');streakBannerTimer=duration;}
function registerLocalKill(victim){
  if(!match.registerKill('blue'))return;
  const now=performance.now()/1000;killStreak+=1;recentKills=recentKills.filter((t)=>now-t<=3);recentKills.push(now);
  showCombatBanner('ELIMINATED');
  if(recentKills.length>=4)showStreakBanner(recentKills.length===4?'QUAD KILL':`${recentKills.length}X MULTI KILL`);
  if(killStreak===10)showStreakBanner('10 KILL STREAK',1.5);
  damageFeedback.spawnDeathBurst(victim);
}
function localKilled(){if(match.isCombatLive())match.registerKill('red');killStreak=0;recentKills=[];damageFeedback.spawnDeathBurst(player);}

const match=new MatchManager();
projectiles=new ProjectileSystem(damageSystem,combatFeedback,{onKill:(victim)=>registerLocalKill(victim)});
localWeapons=new WeaponManager(player,damageSystem,combatFeedback,projectiles,DEFAULT_LOADOUT,{onKill:(victim)=>registerLocalKill(victim)});
player.setWeaponManager(localWeapons);

function resizeCanvas(){dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.max(1,Math.floor(innerWidth*dpr));canvas.height=Math.max(1,Math.floor(innerHeight*dpr));canvas.style.width=`${innerWidth}px`;canvas.style.height=`${innerHeight}px`;camera.resize(innerWidth,innerHeight);}window.addEventListener('resize',resizeCanvas);resizeCanvas();camera.x=player.x;camera.y=player.y;camera.clamp();

new LoadoutScreen(document.getElementById('loadoutScreen'),({primary,secondary})=>{
  localWeapons.setLoadout(primary,secondary);match.resetMatch();roster.resetForRound(false);projectiles.reset();lastRoundSeen=1;lastState=null;
  matchStarted=true;paused=false;document.body.classList.add('match-started');camera.x=player.x;camera.y=player.y;camera.clamp();
  showCombatBanner(`${primary.shortName} + ${secondary.shortName} EQUIPPED`,false,1.0);updateDiagnostics();
});

function physicalSpawnTeam(actor){return match.roundSideFlip?(actor.team==='blue'?'red':'blue'):actor.team;}
function respawnActor(actor){
  const spawnTeam=physicalSpawnTeam(actor);
  const enemies=roster.enemiesOf(actor),teammates=roster.teammatesOf(actor).filter((p)=>p.health.alive);
  const spawn=spawnSystem.chooseSpawn(spawnTeam,{enemies,teammates});actor.respawn(spawn);
  if(actor.isLocal){camera.x=actor.x;camera.y=actor.y;camera.clamp();}
}
function resetRoundActors(){roster.resetForRound(match.roundSideFlip);projectiles.reset();camera.x=player.x;camera.y=player.y;camera.clamp();killStreak=0;recentKills=[];}
function updatePassiveActors(dt){
  roster.updatePassive(dt);
  for(const actor of roster.players){if(actor.isLocal)continue;if(!actor.health.alive&&actor.health.readyToRespawn()&&match.isCombatLive())respawnActor(actor);}
}
function updateAnnouncements(dt){combatBannerTimer=Math.max(0,combatBannerTimer-dt);streakBannerTimer=Math.max(0,streakBannerTimer-dt);combatBanner.classList.toggle('visible',combatBannerTimer>0);streakBanner.classList.toggle('visible',streakBannerTimer>0);}
function setDevMessage(message,seconds=1.2){devMessage=message;devMessageTimer=seconds;}
function sourceAtPointer(){const p=input.pointerPosition();return camera.screenToWorld(p.x,p.y);}
function applyDevDamage(amount,sourceTeam='red'){
  if(!match.isCombatLive())return;
  const result=damageSystem.applyDamage({target:player,amount,sourceId:'match-test',sourceTeam,sourcePosition:sourceAtPointer(),sourceType:'development-test'});
  if(result.applied){setDevMessage(result.killed?'LOCAL PLAYER DOWN':`-${Math.round(result.amount)} HP`);if(result.killed){player.onDeath();localKilled();}}
}
function handleDevelopmentInputs(){if(input.wasPressed('F2'))applyDevDamage(25);if(input.wasPressed('F3'))applyDevDamage(75);if(input.wasPressed('F4'))applyDevDamage(999);}

function processMatchTransitions(){
  if(match.roundNumber!==lastRoundSeen){lastRoundSeen=match.roundNumber;resetRoundActors();showCombatBanner(`ROUND ${match.roundNumber}`,false,1.0);}
  if(match.state!==lastState){
    if(match.state===MATCH_STATE.SUDDEN_DEATH)showStreakBanner('SUDDEN DEATH',1.4);
    if(match.state===MATCH_STATE.ROUND_BREAK)showCombatBanner(`${match.lastRoundWinner?.toUpperCase()} WINS ROUND`,false,1.5);
    if(match.state===MATCH_STATE.MATCH_OVER)showStreakBanner(`${match.winner?.toUpperCase()} WINS MATCH`,3);
    lastState=match.state;
  }
}

function update(dt){
  if(input.wasPressed('F11'))window.gameAPI.toggleFullscreen();
  if(!matchStarted){input.endFrame();return;}
  if(input.wasPressed('F1'))debug=!debug;
  match.update(dt);processMatchTransitions();
  if(match.isCombatLive()){
    player.update(dt,input,map,camera);localWeapons.update(dt,input,map,roster.team('red'));projectiles.update(dt,map,roster.team('red'));handleDevelopmentInputs();
    if(!player.health.alive&&player.health.readyToRespawn())respawnActor(player);
  }else{
    player.health.update(dt);player.sprinting=false;if(player.dashing)player.endDash();
  }
  updatePassiveActors(dt);damageFeedback.update(dt);combatFeedback.update(dt);updateAnnouncements(dt);
  if(player.health.alive){const lead=AIM_CAMERA_LEAD_TILES*TILE_SIZE;camera.follow(player.x+Math.cos(player.aimAngle)*lead,player.y+Math.sin(player.aimAngle)*lead,dt);}
  devMessageTimer=Math.max(0,devMessageTimer-dt);if(devMessageTimer<=0)devMessage=match.state.toUpperCase();
  statusClock+=dt;if(statusClock>=.05){statusClock=0;updateDiagnostics();updateMatchHud();}
  input.endFrame();
}

function drawActor(actor){
  if(!actor.health.alive)return;
  const manager=actor.isLocal?localWeapons:actor.weaponManager;
  playerRenderer.draw(actor,manager);if(manager)weaponRenderer.draw(actor,manager);damageFeedback.drawPlayerFeedback(actor);if(debug)playerRenderer.drawDebug(actor);
}
function render(dt,now,isPaused){
  frames+=1;fpsClock+=dt;if(fpsClock>=.5){fps=Math.round(frames/Math.max(fpsClock,.001));frames=0;fpsClock=0;document.getElementById('fps').textContent=`${fps} FPS`;}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#142b36';ctx.fillRect(0,0,innerWidth,innerHeight);
  const shake=combatFeedback.shakeOffset();ctx.save();ctx.translate(shake.x,shake.y);camera.begin(ctx);worldRenderer.drawBase(camera,debug);damageFeedback.drawWorld();combatFeedback.drawProjectiles(projectiles.projectiles);combatFeedback.drawWorld();
  for(const actor of roster.players.filter((p)=>p!==player))drawActor(actor);drawActor(player);
  if(player.health.alive){weaponRenderer.drawMuzzleFlash(player,localWeapons);}worldRenderer.drawForeground(player.health.alive?player:null,debug);camera.end(ctx);ctx.restore();
  if(matchStarted){damageFeedback.drawScreen(player,innerWidth,innerHeight);const pointer=input.pointerPosition();combatFeedback.drawCrosshair(pointer,localWeapons);combatFeedback.drawHitmarker(pointer);}if(isPaused&&matchStarted){ctx.fillStyle='rgba(5,13,19,.38)';ctx.fillRect(0,0,innerWidth,innerHeight);}
}

function formatTimer(seconds){if(!Number.isFinite(seconds))return'∞';const total=Math.max(0,Math.ceil(seconds));return`${Math.floor(total/60)}:${String(total%60).padStart(2,'0')}`;}
function updateMatchHud(){
  document.getElementById('roundValue').textContent=`ROUND ${match.roundNumber}`;
  document.getElementById('roundWins').textContent=`BLUE ${match.roundWins.blue}  —  ${match.roundWins.red} RED`;
  document.getElementById('killScore').textContent=`${match.roundKills.blue}  —  ${match.roundKills.red}`;
  document.getElementById('roundTimer').textContent=match.state===MATCH_STATE.SUDDEN_DEATH?'SUDDEN DEATH':formatTimer(match.timer);
  let overlay='';if(match.state===MATCH_STATE.PRE_ROUND)overlay=match.timer<=1?'GO':`${Math.max(1,Math.ceil(match.timer))}`;else if(match.state===MATCH_STATE.ROUND_BREAK)overlay=`ROUND ${match.lastRoundWinner?.toUpperCase()} · NEXT ${Math.ceil(match.timer)}`;else if(match.state===MATCH_STATE.MATCH_OVER)overlay=`${match.winner?.toUpperCase()} WINS`;
  matchOverlay.textContent=overlay;matchOverlay.classList.toggle('visible',Boolean(overlay));
}
function updateDashHud(){const root=document.getElementById('dashRoot');root.classList.toggle('active',player.dashing);root.classList.toggle('denied',player.dashDeniedTimer>0);root.classList.toggle('invulnerable',player.isInvulnerable());for(let i=0;i<DASH_CHARGES_MAX;i++)document.getElementById(`dashPip${i}`).classList.toggle('spent',i>=player.dashCharges);document.getElementById('dashCount').textContent=`${player.dashCharges}/${DASH_CHARGES_MAX}`;}
function updateHealthHud(){const h=player.health,root=document.getElementById('healthRoot');root.classList.toggle('dead',!h.alive);root.classList.toggle('protected',h.isSpawnProtected());document.getElementById('healthValue').textContent=h.alive?`${Math.ceil(h.health)}`:'0';document.getElementById('healthFill').style.width=`${Math.round(h.healthPercent()*100)}%`;document.getElementById('healthStatus').textContent=h.isSpawnProtected()?`PROTECTED ${h.spawnProtectionTimer.toFixed(1)}S`:h.alive&&h.timeSinceDamage<7?`REGEN IN ${Math.max(0,7-h.timeSinceDamage).toFixed(1)}S`:h.alive&&h.health<75?'REGENERATING':'150 MAX · REGEN CAP 75';document.getElementById('respawnRoot').classList.toggle('visible',!h.alive);document.getElementById('respawnValue').textContent=`${Math.max(0,h.respawnTimer).toFixed(1)}`;}
function updateWeaponHud(){const w=localWeapons.currentWeapon(),a=localWeapons.currentAmmo(),root=document.getElementById('weaponRoot');document.getElementById('weaponSlot').textContent=localWeapons.currentSlot.toUpperCase();document.getElementById('weaponName').textContent=w?.name?.toUpperCase()||'UNARMED';document.getElementById('ammoMagazine').textContent=w?.magazineSize>0?(a?.magazine??0):'—';document.getElementById('ammoReserve').textContent=w?.magazineSize>0?(a?.reserve??0):'—';document.getElementById('weaponState').textContent=localWeapons.isReloading()?`${w.reloadStyle==='shell'?'LOAD SHELL':'RELOAD'} ${localWeapons.reloadTimer.toFixed(1)}S`:localWeapons.isSwitching()?`SWAP → ${(localWeapons.pendingSlot||'').toUpperCase()}`:localWeapons.isADSActive()?`ADS ${Math.round(localWeapons.adsProgress*100)}%`:'READY';document.getElementById('spreadState').textContent=`${localWeapons.currentSpreadDegrees().toFixed(2)}°`;document.getElementById('aimNote').textContent=`DASH = HELD MOVE DIRECTION · NO INPUT = AIM DIRECTION`;root.classList.toggle('reloading',localWeapons.isReloading());root.classList.toggle('ads',localWeapons.isADSActive());}
function updateDiagnostics(){const tile=map.tileAtWorld(player.x,player.y);document.getElementById('coords').textContent=`Tile ${tile.col}, ${tile.row}`;document.getElementById('camera').textContent=`${(camera.x/TILE_SIZE).toFixed(1)}, ${(camera.y/TILE_SIZE).toFixed(1)}`;document.getElementById('debugState').textContent=debug?'COLLISION ON':'COLLISION OFF';document.getElementById('moveState').textContent=player.state.toUpperCase();document.getElementById('speed').textContent=`${player.speedTilesPerSecond().toFixed(1)} T/S`;document.getElementById('staminaValue').textContent=`${Math.round(player.stamina)}`;document.getElementById('staminaFill').style.width=`${Math.round(player.staminaPercent()*100)}%`;document.getElementById('dashState').textContent=player.dashing?'DASHING':player.dashCooldown>0?`${player.dashCooldown.toFixed(2)}S`:'READY';document.getElementById('invulnState').textContent=player.isInvulnerable()?'ON':'OFF';document.getElementById('damageTestState').textContent=devMessage;updateDashHud();updateHealthHud();updateWeaponHud();}

const loop=new GameLoop(update,render);window.addEventListener('keydown',(event)=>{if(event.code==='Escape'&&matchStarted){paused=!paused;loop.setPaused(paused);document.getElementById('pausePanel').classList.toggle('visible',paused);input.endFrame();}});
(async()=>{const buildInfo=await window.gameAPI.getBuildInfo();document.getElementById('buildLabel').textContent=`BUILD ${buildInfo.gameVersion} · VERSION ${buildInfo.build}`;document.getElementById('phaseLabel').textContent=buildInfo.phase;document.getElementById('mapLabel').textContent=`${MAP_01.name.toUpperCase()} · 3V3`;updateDiagnostics();updateMatchHud();loop.start();})();
