import { TILE_SIZE } from '../engine/constants.js';
import { DEFAULT_LOADOUT, canEquipInSlot } from '../data/weapons.js';
import { castHitscan } from './Hitscan.js';

const DEG_TO_RAD = Math.PI / 180;
const lerp = (a, b, t) => a + (b - a) * t;

function freshAmmo(weapon) {
  if (!weapon || weapon.magazineSize <= 0) return null;
  return { magazine: weapon.magazineSize, reserve: weapon.magazineSize * weapon.extraMagazines };
}

function normalizeLoadout(loadout) {
  const primary = loadout?.primary ?? DEFAULT_LOADOUT.primary;
  const secondary = loadout?.secondary ?? DEFAULT_LOADOUT.secondary;
  if (!canEquipInSlot(primary, 'primary')) throw new Error(`${primary?.name ?? 'Unknown'} cannot equip as primary`);
  if (!canEquipInSlot(secondary, 'secondary')) throw new Error(`${secondary?.name ?? 'Unknown'} cannot equip as secondary`);
  if (primary.id === secondary.id) throw new Error('The exact same weapon cannot occupy both slots');
  return { primary, secondary };
}

export class WeaponManager {
  constructor(owner, damageSystem, combatFeedback, projectileSystem = null, loadout = DEFAULT_LOADOUT, callbacks = {}) {
    this.owner = owner;
    this.damageSystem = damageSystem;
    this.feedback = combatFeedback;
    this.projectiles = projectileSystem;
    this.callbacks = callbacks;
    this.loadout = normalizeLoadout(loadout);
    this.currentSlot = 'primary';
    this.pendingSlot = null;
    this.ammo = { primary: freshAmmo(this.loadout.primary), secondary: freshAmmo(this.loadout.secondary) };
    this.fireCooldown = 0; this.postReloadDelay = 0; this.reloadTimer = 0; this.reloadDuration = 0; this.reloadProgress = 0; this.reloadShellsInserted = 0;
    this.switchTimer = 0; this.switchDuration = 0; this.adsProgress = 0; this.fireVisualTimer = 0; this.dryFireTimer = 0; this.meleeVisualTimer = 0; this.lastShotKind = null;
  }
  currentWeapon(){return this.loadout[this.currentSlot];} currentAmmo(){return this.ammo[this.currentSlot];} isReloading(){return this.reloadTimer>0;} isSwitching(){return this.switchTimer>0;} isADSActive(){return this.adsProgress>0.01;} isFullyADS(){return this.adsProgress>=0.999;}
  setLoadout(primary,secondary){this.loadout=normalizeLoadout({primary,secondary});this.currentSlot='primary';this.pendingSlot=null;this.resetForLife();return true;}
  update(dt,input,map,targets=[]){
    this.fireCooldown=Math.max(0,this.fireCooldown-dt);this.postReloadDelay=Math.max(0,this.postReloadDelay-dt);this.fireVisualTimer=Math.max(0,this.fireVisualTimer-dt);this.dryFireTimer=Math.max(0,this.dryFireTimer-dt);this.meleeVisualTimer=Math.max(0,this.meleeVisualTimer-dt);
    if(!this.owner.health.alive){this.cancelReload();this.adsProgress=0;return;} if(this.owner.dashing){this.cancelReload();this.adsProgress=0;return;}
    if(input.slotPrimaryPressed())this.requestSwitch('primary');if(input.slotSecondaryPressed())this.requestSwitch('secondary');
    if(this.isSwitching()){this.switchTimer=Math.max(0,this.switchTimer-dt);if(this.switchTimer<=0&&this.pendingSlot)this.finishSwitch();const w=this.currentWeapon();this.adsProgress=Math.max(0,this.adsProgress-dt/Math.max(.01,w?.adsTime||.4));return;}
    let weapon=this.currentWeapon();if(!weapon)return;let fireIntent=weapon.fireMode==='auto'?input.fireHeld():input.firePressed();
    if(this.isReloading()){const ammo=this.currentAmmo();if(weapon.reloadStyle==='shell'&&fireIntent&&ammo?.magazine>0){this.cancelReload();this.postReloadDelay=0;}else{this.updateReload(dt);return;}}
    if(input.reloadPressed()){this.startReload();if(this.isReloading())return;}
    weapon=this.currentWeapon();const wantsADS=weapon.canADS!==false&&input.adsHeld();const adsDelta=dt/Math.max(.01,weapon.adsTime||.01);this.adsProgress=weapon.canADS===false?0:Math.max(0,Math.min(1,this.adsProgress+(wantsADS?adsDelta:-adsDelta)));if(wantsADS)this.owner.sprinting=false;
    fireIntent=weapon.fireMode==='auto'?input.fireHeld():input.firePressed();if(fireIntent)this.tryFire(map,targets);
  }
  tryFire(map,targets){
    const weapon=this.currentWeapon(),ammo=this.currentAmmo();if(!weapon||!this.owner.canFire()||this.isReloading()||this.isSwitching()||this.postReloadDelay>0||this.fireCooldown>0)return false;
    if(weapon.magazineSize>0&&(!ammo||ammo.magazine<=0)){this.dryFireTimer=.12;return false;} if(weapon.magazineSize>0)ammo.magazine-=1;
    this.fireCooldown=weapon.fireInterval;this.fireVisualTimer=weapon.kind==='melee'?0:.10;this.meleeVisualTimer=weapon.kind==='melee'?Math.min(.32,weapon.fireInterval):0;this.lastShotKind=weapon.kind;if(weapon.kind!=='melee')this.owner.sprinting=false;this.owner.notifyFired();
    if(weapon.kind==='shotgun')return this.fireShotgun(weapon,map,targets);if(weapon.kind==='projectile')return this.fireProjectile(weapon);if(weapon.kind==='melee')return this.fireMelee(weapon,targets);return this.fireHitscan(weapon,map,targets);
  }
  fireHitscan(weapon,map,targets){const spread=this.currentSpreadDegrees(),angle=this.owner.aimAngle+(Math.random()-.5)*spread*DEG_TO_RAD,muzzle=this.muzzleWorldPosition();const hit=castHitscan({origin:muzzle,angle,map,targets,shooter:this.owner,maxDistance:Math.hypot(map.width,map.height)});const crit=Math.random()<weapon.critChance,damage=crit?weapon.critDamage:(hit.distance<=weapon.fullDamageRangeTiles*TILE_SIZE?weapon.damage:weapon.falloffDamage);this.feedback.spawnShot({muzzle,end:hit.point,crit,hit:Boolean(hit.target),type:weapon.id});if(!hit.target)return{applied:false,reason:hit.structure?'structure':'miss'};return this.applyWeaponDamage(hit.target,damage,crit,hit.point,weapon);}
  fireShotgun(weapon,map,targets){const muzzle=this.muzzleWorldPosition(),spread=this.currentSpreadDegrees(),crit=Math.random()<weapon.critChance,aggregate=new Map();for(let i=0;i<weapon.pelletCount;i++){const radial=Math.sqrt(Math.random()),ring=Math.random()*Math.PI*2,angle=this.owner.aimAngle+Math.cos(ring)*radial*(spread*.5)*DEG_TO_RAD,hit=castHitscan({origin:muzzle,angle,map,targets,shooter:this.owner,maxDistance:Math.hypot(map.width,map.height)});this.feedback.spawnShot({muzzle,end:hit.point,crit,hit:Boolean(hit.target),type:'shotgun-pellet'});if(!hit.target)continue;const center=Math.hypot(hit.target.x-this.owner.x,hit.target.y-this.owner.y),pellet=crit?weapon.critDamage:(center<=weapon.fullDamageRangeTiles*TILE_SIZE?weapon.damage:weapon.falloffDamage),r=aggregate.get(hit.target.id)||{target:hit.target,damage:0,point:hit.point};r.damage+=pellet;r.point=hit.point;aggregate.set(hit.target.id,r);}let any=false;for(const r of aggregate.values())any||=Boolean(this.applyWeaponDamage(r.target,r.damage,crit,r.point,weapon).applied);return{applied:any};}
  fireProjectile(weapon){if(!this.projectiles)return{applied:false,reason:'projectile-system-missing'};const spread=this.currentSpreadDegrees(),angle=this.owner.aimAngle+(Math.random()-.5)*spread*DEG_TO_RAD,crit=weapon.projectileType==='sniper'&&Math.random()<weapon.critChance,muzzle=this.muzzleWorldPosition();this.projectiles.spawn({owner:this.owner,weapon,origin:muzzle,angle,crit});this.feedback.spawnLaunch?.({muzzle,angle,type:weapon.projectileType});return{applied:true,reason:'projectile-fired'};}
  fireMelee(weapon,targets){const max=weapon.fullDamageRangeTiles*TILE_SIZE,half=55*DEG_TO_RAD;let best=null;for(const target of targets){if(!target?.health?.alive||target===this.owner||target.team===this.owner.team)continue;const dx=target.x-this.owner.x,dy=target.y-this.owner.y,distance=Math.hypot(dx,dy);if(distance>max+target.radius)continue;let delta=Math.atan2(dy,dx)-this.owner.aimAngle;while(delta>Math.PI)delta-=Math.PI*2;while(delta<-Math.PI)delta+=Math.PI*2;if(Math.abs(delta)>half)continue;if(!best||distance<best.distance)best={target,distance};}this.feedback.spawnMeleeSwing?.({owner:this.owner,range:max,angle:this.owner.aimAngle});if(!best)return{applied:false,reason:'miss'};const crit=Math.random()<weapon.critChance;return this.applyWeaponDamage(best.target,crit?weapon.critDamage:weapon.damage,crit,{x:best.target.x,y:best.target.y},weapon);}
  applyWeaponDamage(target,damage,crit,point,weapon){const result=this.damageSystem.applyDamage({target,amount:damage,sourceId:this.owner.id,sourceTeam:this.owner.team,sourcePosition:{x:this.owner.x,y:this.owner.y},sourceType:weapon.id});if(result.applied){this.feedback.spawnHit({point,damage:result.amount,crit});if(result.killed){target.onDeath();this.callbacks.onKill?.(target,result);}}return result;}
  muzzleWorldPosition(){const weapon=this.currentWeapon();if(!weapon)return{x:this.owner.x,y:this.owner.y};const s=this.animationState(),a=this.owner.visualAimAngle,v=weapon.render||{},forward=(v.muzzleForward||50)+s.ads*(v.adsForwardShift||0)-s.fireKick*(v.kick||0),side=(v.shoulderSide||0)-s.ads*(v.adsSideShift||0);return{x:this.owner.x+Math.cos(a)*forward-Math.sin(a)*side,y:this.owner.y+Math.sin(a)*forward+Math.cos(a)*side};}
  startReload(){const w=this.currentWeapon(),a=this.currentAmmo();if(!w||w.magazineSize<=0||!a||this.isReloading()||this.isSwitching()||this.owner.dashing||a.magazine>=w.magazineSize||a.reserve<=0)return false;this.reloadDuration=w.reloadTime;this.reloadTimer=w.reloadTime;this.reloadProgress=0;this.reloadShellsInserted=0;this.adsProgress=0;return true;}
  updateReload(dt){const w=this.currentWeapon();if(!w||!this.isReloading())return;this.reloadTimer=Math.max(0,this.reloadTimer-dt);this.reloadProgress=1-this.reloadTimer/Math.max(.001,this.reloadDuration);this.adsProgress=0;if(this.reloadTimer>0)return;if(w.reloadStyle==='shell')this.insertShell();else this.finishMagazineReload();}
  insertShell(){const w=this.currentWeapon(),a=this.currentAmmo();if(!w||!a||a.reserve<=0||a.magazine>=w.magazineSize){this.finishShellReload();return;}a.magazine+=1;a.reserve-=1;this.reloadShellsInserted+=1;if(a.magazine>=w.magazineSize||a.reserve<=0)this.finishShellReload();else{this.reloadDuration=w.reloadTime;this.reloadTimer=w.reloadTime;this.reloadProgress=0;}}
  finishShellReload(){const w=this.currentWeapon();this.reloadTimer=0;this.reloadProgress=1;this.postReloadDelay=w?.postReloadDelay||0;}
  finishMagazineReload(){const w=this.currentWeapon(),a=this.currentAmmo();if(!w||!a)return;const needed=w.magazineSize-a.magazine,transferred=Math.min(needed,a.reserve);a.magazine+=transferred;a.reserve-=transferred;this.reloadTimer=0;this.reloadProgress=1;this.postReloadDelay=w.postReloadDelay;}
  cancelReload(){if(!this.isReloading())return false;this.reloadTimer=0;this.reloadProgress=0;return true;}
  requestSwitch(slot){if(slot===this.currentSlot||!this.loadout[slot]||this.owner.dashing||!this.owner.canSwitchWeapon())return false;const next=this.loadout[slot];this.cancelReload();this.adsProgress=0;this.pendingSlot=slot;this.switchDuration=next.swapTime;this.switchTimer=next.swapTime;return true;}
  finishSwitch(){this.currentSlot=this.pendingSlot;this.pendingSlot=null;this.switchTimer=0;}
  resetForLife(){this.ammo={primary:freshAmmo(this.loadout.primary),secondary:freshAmmo(this.loadout.secondary)};this.fireCooldown=0;this.postReloadDelay=0;this.reloadTimer=0;this.reloadDuration=0;this.reloadProgress=0;this.reloadShellsInserted=0;this.switchTimer=0;this.switchDuration=0;this.pendingSlot=null;this.adsProgress=0;this.fireVisualTimer=0;this.dryFireTimer=0;this.meleeVisualTimer=0;}
  currentSpreadDegrees(){const w=this.currentWeapon();if(!w||w.baseSpreadDegrees<=0)return 0;const moving=this.owner.speedTilesPerSecond()>.08;let spread=moving?w.movingSpreadDegrees:w.baseSpreadDegrees*w.stationarySpreadMultiplier;spread*=lerp(1,w.adsSpreadMultiplier,this.adsProgress);return spread;}
  movementMultiplier(input=null){const w=this.currentWeapon();if(!w)return 1;let m=w.movementMultiplier;if(w.canADS!==false){const ads=input?.adsHeld?.()?Math.max(this.adsProgress,.15):this.adsProgress;if(ads>.01)m*=lerp(1,w.adsMovementMultiplier,ads);}if(this.isReloading())m*=w.reloadMovementMultiplier;if(this.isSwitching())m*=w.swapMovementMultiplier;return m;}
  animationState(){const w=this.currentWeapon();return{weaponId:w?.id??null,ads:this.adsProgress,firing:this.fireVisualTimer>0,fireKick:Math.min(1,this.fireVisualTimer/.10),kickScale:w?.render?.kick||1,meleeSwing:this.meleeVisualTimer>0?1-this.meleeVisualTimer/Math.min(.32,w?.fireInterval||.32):0,reloading:this.isReloading(),reloadProgress:this.reloadProgress,shellsInserted:this.reloadShellsInserted,switching:this.isSwitching(),switchProgress:this.switchDuration>0?1-this.switchTimer/this.switchDuration:1};}
}
