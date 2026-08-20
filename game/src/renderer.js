import { Player } from './actors/Player.js';
import { BotController } from './ai/BotController.js';
import { DamageSystem } from './combat/DamageSystem.js';
import { ProjectileSystem } from './combat/ProjectileSystem.js';
import { WeaponManager } from './combat/WeaponManager.js';
import { DEFAULT_LOADOUT, WEAPONS } from './data/weapons.js';
import { GameLoop } from './engine/GameLoop.js';
import { Input } from './engine/Input.js';
import { AIM_CAMERA_LEAD_TILES,DASH_CHARGES_MAX,TILE_SIZE } from './engine/constants.js';
import { MatchManager } from './match/MatchManager.js';
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

const player=new Player(MAP_01.spawns.blue[1],'blue','local-blue');
player.isLocal=true;player.controlsCamera=true;
const blueBot1=new Player(MAP_01.spawns.blue[0],'blue','blue-bot-1');
const blueBot2=new Player(MAP_01.spawns.blue[2],'blue','blue-bot-2');
const redBot1=new Player(MAP_01.spawns.red[0],'red','red-bot-1');
const redBot2=new Player(MAP_01.spawns.red[1],'red','red-bot-2');
const redBot3=new Player(MAP_01.spawns.red[2],'red','red-bot-3');
const bots=[blueBot1,blueBot2,redBot1,redBot2,redBot3];
for(const bot of bots)bot.controlsCamera=false;
const players=[player,...bots];

let match=null;
let killStreak=0,recentKills=[],combatBannerTimer=0,streakBannerTimer=0;
const combatBanner=document.getElementById('combatBanner'),streakBanner=document.getElementById('streakBanner');
function showCombatBanner(text,crit=false,duration=.8){combatBanner.textContent=text;combatBanner.classList.toggle('crit',crit);combatBanner.classList.add('visible');combatBannerTimer=duration;}
function showStreakBanner(text,duration=1.15){streakBanner.textContent=text;streakBanner.classList.add('visible');streakBannerTimer=duration;}
function registerLocalKill(){const now=performance.now()/1000;killStreak+=1;recentKills=recentKills.filter((t)=>now-t<=3);recentKills.push(now);showCombatBanner('ELIMINATED');if(recentKills.length>=4)showStreakBanner(recentKills.length===4?'QUAD KILL':`${recentKills.length}X MULTI KILL`);if(killStreak===10)showStreakBanner('10 KILL STREAK',1.5);}
function onMatchKill(event){if(event.victim?.id===player.id){killStreak=0;recentKills=[];}if(event.credited&&event.attacker?.id===player.id)registerLocalKill();}
function handleElimination(attacker,victim,result){damageFeedback.spawnDeathBurst(victim);match?.recordElimination(attacker,victim,result);}

const projectiles=new ProjectileSystem(damageSystem,combatFeedback,{onKill:(owner,victim,result)=>handleElimination(owner,victim,result)});
function attachWeapons(actor,loadout){const manager=new WeaponManager(actor,damageSystem,combatFeedback,projectiles,loadout,{onKill:(victim,result)=>handleElimination(actor,victim,result)});actor.setWeaponManager(manager);return manager;}
const weapons=attachWeapons(player,DEFAULT_LOADOUT);
attachWeapons(blueBot1,{primary:WEAPONS.smg,secondary:WEAPONS.pistol});
attachWeapons(blueBot2,{primary:WEAPONS.sniper,secondary:WEAPONS.shotgun});
attachWeapons(redBot1,{primary:WEAPONS.assaultRifle,secondary:WEAPONS.launcher});
attachWeapons(redBot2,{primary:WEAPONS.lmg,secondary:WEAPONS.pistol});
attachWeapons(redBot3,{primary:WEAPONS.shotgun,secondary:WEAPONS.melee});
const botBrains=new Map(bots.map((bot,index)=>[bot.id,new BotController(bot,bot.weaponManager,index+1)]));

match=new MatchManager({
  players,spawnSystem,projectileSystem:projectiles,onKill:onMatchKill,
  onRoundReset:()=>{camera.x=player.x;camera.y=player.y;camera.clamp();showCombatBanner(`ROUND ${match?.round||1}`,false,.8);},
  onRoundEnd:({winner})=>showStreakBanner(`${winner.toUpperCase()} WINS ROUND`,1.2),
  onMatchEnd:({winner})=>showStreakBanner(`${winner.toUpperCase()} TEAM WINS`,2.2)
});

let debug=false,paused=false,matchStarted=false,fps=0,frames=0,fpsClock=0,statusClock=0,dpr=1;
function resizeCanvas(){dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.max(1,Math.floor(innerWidth*dpr));canvas.height=Math.max(1,Math.floor(innerHeight*dpr));canvas.style.width=`${innerWidth}px`;canvas.style.height=`${innerHeight}px`;camera.resize(innerWidth,innerHeight);}window.addEventListener('resize',resizeCanvas);resizeCanvas();camera.x=player.x;camera.y=player.y;camera.clamp();

new LoadoutScreen(document.getElementById('loadoutScreen'),({primary,secondary})=>{weapons.setLoadout(primary,secondary);matchStarted=true;paused=false;document.body.classList.add('match-started');match.startMatch();showCombatBanner(`${primary.shortName} + ${secondary.shortName} EQUIPPED`,false,1.0);updateDiagnostics();});

function opponentsOf(actor){return players.filter((other)=>other!==actor&&other.team!==actor.team&&other.health.alive);}
function teammatesOf(actor){return players.filter((other)=>other!==actor&&other.team===actor.team&&other.health.alive);}
function enemyCollisionRects(actor){return opponentsOf(actor).map((enemy)=>({x:enemy.x-enemy.radius,y:enemy.y-enemy.radius,w:enemy.radius*2,h:enemy.radius*2,kind:'player'}));}
function respawnReadyPlayers(){for(const actor of players){if(!actor.health.readyToRespawn())continue;const spawn=match.respawnPlayer(actor);if(!spawn)continue;if(actor.isLocal){camera.x=actor.x;camera.y=actor.y;camera.clamp();showCombatBanner('RESPAWNED',false,.55);}}}
function updateBotBrains(dt){for(const bot of bots)botBrains.get(bot.id).update(dt,{camera,enemies:opponentsOf(bot),teammates:teammatesOf(bot),map});}
function updateActors(dt){
  updateBotBrains(dt);player.update(dt,input,map,camera,enemyCollisionRects(player));for(const bot of bots)bot.update(dt,botBrains.get(bot.id),map,camera,enemyCollisionRects(bot));
  for(const actor of players){if(!match.isLive())break;combatFeedback.suppressHitmarker=!actor.isLocal;const actorInput=actor.isLocal?input:botBrains.get(actor.id);actor.weaponManager.update(dt,actorInput,map,players);combatFeedback.suppressHitmarker=false;}
  if(match.isLive())projectiles.update(dt,map,players);respawnReadyPlayers();
}

function updateAnnouncements(dt){combatBannerTimer=Math.max(0,combatBannerTimer-dt);streakBannerTimer=Math.max(0,streakBannerTimer-dt);combatBanner.classList.toggle('visible',combatBannerTimer>0);streakBanner.classList.toggle('visible',streakBannerTimer>0);}
function update(dt){
  if(input.wasPressed('F11'))window.gameAPI.toggleFullscreen();if(!matchStarted){input.endFrame();return;}if(input.wasPressed('F1'))debug=!debug;if(match.state==='match-over'&&input.wasPressed('Enter')){killStreak=0;recentKills=[];match.startMatch();}
  match.update(dt);if(match.isLive())updateActors(dt);damageFeedback.update(dt);combatFeedback.update(dt);updateAnnouncements(dt);
  if(player.health.alive){const lead=AIM_CAMERA_LEAD_TILES*TILE_SIZE;camera.follow(player.x+Math.cos(player.aimAngle)*lead,player.y+Math.sin(player.aimAngle)*lead,dt);}statusClock+=dt;if(statusClock>=.05){statusClock=0;updateDiagnostics();updateMatchHud();}input.endFrame();
}

function render(dt,now,isPaused){
  frames+=1;fpsClock+=dt;if(fpsClock>=.5){fps=Math.round(frames/Math.max(fpsClock,.001));frames=0;fpsClock=0;document.getElementById('fps').textContent=`${fps} FPS`;}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#142b36';ctx.fillRect(0,0,innerWidth,innerHeight);const shake=combatFeedback.shakeOffset();ctx.save();ctx.translate(shake.x,shake.y);
  camera.begin(ctx);worldRenderer.drawBase(camera,debug);damageFeedback.drawWorld();combatFeedback.drawProjectiles(projectiles.projectiles);combatFeedback.drawWorld();const drawOrder=players.filter((actor)=>actor.health.alive).sort((a,b)=>a.y-b.y);for(const actor of drawOrder){playerRenderer.draw(actor,actor.weaponManager);weaponRenderer.draw(actor,actor.weaponManager);weaponRenderer.drawMuzzleFlash(actor,actor.weaponManager);damageFeedback.drawPlayerFeedback(actor);if(debug)playerRenderer.drawDebug(actor);}worldRenderer.drawForeground(player.health.alive?player:null,debug);camera.end(ctx);ctx.restore();
  if(matchStarted){damageFeedback.drawScreen(player,innerWidth,innerHeight);const pointer=input.pointerPosition();combatFeedback.drawCrosshair(pointer,weapons);combatFeedback.drawHitmarker(pointer);}if(isPaused&&matchStarted){ctx.fillStyle='rgba(5,13,19,.38)';ctx.fillRect(0,0,innerWidth,innerHeight);}
}

function updateDashHud(){const root=document.getElementById('dashRoot');root.classList.toggle('active',player.dashing);root.classList.toggle('denied',player.dashDeniedTimer>0);root.classList.toggle('invulnerable',player.isInvulnerable());for(let i=0;i<DASH_CHARGES_MAX;i++)document.getElementById(`dashPip${i}`).classList.toggle('spent',i>=player.dashCharges);document.getElementById('dashCount').textContent=`${player.dashCharges}/${DASH_CHARGES_MAX}`;}
function updateHealthHud(){const h=player.health,root=document.getElementById('healthRoot');root.classList.toggle('dead',!h.alive);root.classList.toggle('protected',h.isSpawnProtected());document.getElementById('healthValue').textContent=h.alive?`${Math.ceil(h.health)}`:'0';document.getElementById('healthFill').style.width=`${Math.round(h.healthPercent()*100)}%`;document.getElementById('healthStatus').textContent=h.isSpawnProtected()?`PROTECTED ${h.spawnProtectionTimer.toFixed(1)}S`:h.alive&&h.timeSinceDamage<7?`REGEN IN ${Math.max(0,7-h.timeSinceDamage).toFixed(1)}S`:h.alive&&h.health<75?'REGENERATING':'150 MAX · REGEN CAP 75';document.getElementById('respawnRoot').classList.toggle('visible',!h.alive&&match.isLive());document.getElementById('respawnValue').textContent=`${Math.max(0,h.respawnTimer).toFixed(1)}`;}
function updateWeaponHud(){const w=weapons.currentWeapon(),a=weapons.currentAmmo(),root=document.getElementById('weaponRoot');document.getElementById('weaponSlot').textContent=weapons.currentSlot.toUpperCase();document.getElementById('weaponName').textContent=w?.name?.toUpperCase()||'UNARMED';document.getElementById('ammoMagazine').textContent=w?.magazineSize>0?(a?.magazine??0):'—';document.getElementById('ammoReserve').textContent=w?.magazineSize>0?(a?.reserve??0):'—';document.getElementById('weaponState').textContent=weapons.isReloading()?`${w.reloadStyle==='shell'?'LOAD SHELL':'RELOAD'} ${weapons.reloadTimer.toFixed(1)}S`:weapons.isSwitching()?`SWAP → ${(weapons.pendingSlot||'').toUpperCase()}`:weapons.postReloadDelay>0?`READY ${weapons.postReloadDelay.toFixed(1)}S`:weapons.isADSActive()?`ADS ${Math.round(weapons.adsProgress*100)}%`:'READY';document.getElementById('spreadState').textContent=`${weapons.currentSpreadDegrees().toFixed(2)}°`;document.getElementById('aimNote').textContent='MOVE + SPACE = DIRECTIONAL DASH · NO MOVE + SPACE = AIM DASH';root.classList.toggle('reloading',weapons.isReloading());root.classList.toggle('ads',weapons.isADSActive());root.classList.toggle('empty',w?.magazineSize>0&&(a?.magazine??0)<=0);}
function updateMatchHud(){const s=match.snapshot();document.getElementById('roundLabel').textContent=`ROUND ${s.round} / 9`;document.getElementById('roundTimer').textContent=s.timerLabel;document.getElementById('blueRoundWins').textContent=s.wins.blue;document.getElementById('redRoundWins').textContent=s.wins.red;document.getElementById('blueKills').textContent=s.kills.blue;document.getElementById('redKills').textContent=s.kills.red;const overlay=document.getElementById('roundOverlay'),text=document.getElementById('roundOverlayText'),sub=document.getElementById('roundOverlaySub');const message=s.overlay;overlay.classList.toggle('visible',Boolean(message));overlay.classList.toggle('sudden',s.state==='sudden-death');text.textContent=message;sub.textContent=s.state==='round-break'?`NEXT ROUND IN ${Math.ceil(s.stateTimer)} · SIDES SWAP`:s.state==='match-over'?'PRESS ENTER TO RUN IT BACK':s.state==='countdown'?'GET READY':s.state==='sudden-death'?'NEXT CREDITED KILL WINS THE ROUND':'';}
function updateDiagnostics(){const tile=map.tileAtWorld(player.x,player.y);document.getElementById('coords').textContent=`Tile ${tile.col}, ${tile.row}`;document.getElementById('camera').textContent=`${(camera.x/TILE_SIZE).toFixed(1)}, ${(camera.y/TILE_SIZE).toFixed(1)}`;document.getElementById('debugState').textContent=debug?'COLLISION ON':'COLLISION OFF';document.getElementById('moveState').textContent=player.state.toUpperCase();document.getElementById('speed').textContent=`${player.speedTilesPerSecond().toFixed(1)} T/S`;document.getElementById('staminaValue').textContent=`${Math.round(player.stamina)}`;document.getElementById('staminaFill').style.width=`${Math.round(player.staminaPercent()*100)}%`;document.getElementById('staminaRoot').classList.toggle('sprinting',player.sprinting);document.getElementById('staminaRoot').classList.toggle('recovering',!player.sprinting&&player.staminaRegenDelay>0);document.getElementById('dashState').textContent=player.dashing?'DASHING':player.dashCooldown>0?`${player.dashCooldown.toFixed(2)}S`:'READY';document.getElementById('invulnState').textContent=player.isInvulnerable()?(player.health.isSpawnProtected()?`SPAWN ${player.health.spawnProtectionTimer.toFixed(2)}S`:`DASH ${player.invulnerabilityTimer.toFixed(2)}S`):'OFF';document.getElementById('damageTestState').textContent=`${players.filter((p)=>p.health.alive).length}/6 ALIVE`;updateDashHud();updateHealthHud();updateWeaponHud();}

const loop=new GameLoop(update,render);window.addEventListener('keydown',(event)=>{if(event.code==='Escape'&&matchStarted){paused=!paused;loop.setPaused(paused);document.getElementById('pausePanel').classList.toggle('visible',paused);input.endFrame();}});
(async()=>{const buildInfo=await window.gameAPI.getBuildInfo();document.getElementById('buildLabel').textContent=`BUILD ${buildInfo.gameVersion} · VERSION ${buildInfo.build}`;document.getElementById('phaseLabel').textContent=buildInfo.phase;document.getElementById('mapLabel').textContent=`${MAP_01.name.toUpperCase()} · ${MAP_01.cols}×${MAP_01.rows} TILES`;updateDiagnostics();updateMatchHud();loop.start();})();
