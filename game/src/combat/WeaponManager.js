import { TILE_SIZE } from '../engine/constants.js';
import { DEFAULT_LOADOUT } from '../data/weapons.js';
import { castHitscan } from './Hitscan.js';

const DEG_TO_RAD = Math.PI / 180;
const lerp = (a,b,t) => a + (b-a)*t;
const RIFLE_MUZZLE_FORWARD = 67;
const RIFLE_SHOULDER_SIDE = 12.5;
const RIFLE_ADS_SIDE_SHIFT = 2.5;

function freshAmmo(weapon) {
  return weapon ? { magazine: weapon.magazineSize, reserve: weapon.magazineSize * weapon.extraMagazines } : null;
}

export class WeaponManager {
  constructor(owner, damageSystem, combatFeedback, loadout=DEFAULT_LOADOUT, callbacks={}) {
    this.owner=owner; this.damageSystem=damageSystem; this.feedback=combatFeedback; this.callbacks=callbacks;
    this.loadout={...loadout}; this.currentSlot=this.loadout.primary?'primary':'secondary'; this.pendingSlot=null;
    this.ammo={ primary:freshAmmo(this.loadout.primary), secondary:freshAmmo(this.loadout.secondary) };
    this.fireCooldown=0; this.postReloadDelay=0; this.reloadTimer=0; this.reloadDuration=0; this.reloadProgress=0;
    this.switchTimer=0; this.switchDuration=0; this.adsProgress=0; this.fireVisualTimer=0; this.dryFireTimer=0;
  }

  currentWeapon(){ return this.loadout[this.currentSlot]; }
  currentAmmo(){ return this.ammo[this.currentSlot]; }
  isReloading(){ return this.reloadTimer>0; }
  isSwitching(){ return this.switchTimer>0; }
  isADSActive(){ return this.adsProgress>0.01; }
  isFullyADS(){ return this.adsProgress>=0.999; }

  update(dt,input,map,targets=[]) {
    this.fireCooldown=Math.max(0,this.fireCooldown-dt); this.postReloadDelay=Math.max(0,this.postReloadDelay-dt);
    this.fireVisualTimer=Math.max(0,this.fireVisualTimer-dt); this.dryFireTimer=Math.max(0,this.dryFireTimer-dt);

    if(!this.owner.health.alive){ this.cancelReload(); this.adsProgress=0; return; }
    if(this.owner.dashing){ this.cancelReload(); this.adsProgress=0; return; }

    if(input.slotPrimaryPressed()) this.requestSwitch('primary');
    if(input.slotSecondaryPressed()) this.requestSwitch('secondary');

    if(this.isSwitching()){
      this.switchTimer=Math.max(0,this.switchTimer-dt);
      if(this.switchTimer<=0&&this.pendingSlot) this.finishSwitch();
      this.adsProgress=Math.max(0,this.adsProgress-dt/Math.max(0.01,this.currentWeapon()?.adsTime||0.4));
      return;
    }

    if(input.reloadPressed()) this.startReload();
    if(this.isReloading()){
      this.reloadTimer=Math.max(0,this.reloadTimer-dt); this.reloadProgress=1-this.reloadTimer/this.reloadDuration; this.adsProgress=0;
      if(this.reloadTimer<=0) this.finishReload();
      return;
    }

    const weapon=this.currentWeapon(); if(!weapon)return;
    const wantsADS=input.adsHeld();
    const adsDelta=dt/Math.max(0.01,weapon.adsTime);
    this.adsProgress=Math.max(0,Math.min(1,this.adsProgress+(wantsADS?adsDelta:-adsDelta)));
    if(wantsADS)this.owner.sprinting=false;

    // Firing is independent from ADS state. Holding RMB and then pressing/holding
    // LMB must continuously feed this path just like hip-fire.
    if(input.fireHeld()) this.tryFire(map,targets);
  }

  tryFire(map,targets){
    const weapon=this.currentWeapon(), ammo=this.currentAmmo();
    if(!weapon||!ammo||!this.owner.canFire()||this.isReloading()||this.isSwitching()||this.postReloadDelay>0||this.fireCooldown>0)return false;
    if(ammo.magazine<=0){ this.dryFireTimer=0.12; return false; }

    ammo.magazine-=1; this.fireCooldown=weapon.fireInterval; this.fireVisualTimer=0.09; this.owner.sprinting=false; this.owner.notifyFired();
    const spread=this.currentSpreadDegrees();
    const shotAngle=this.owner.aimAngle+(Math.random()-0.5)*spread*DEG_TO_RAD;
    const origin={x:this.owner.x,y:this.owner.y};
    const muzzle=this.muzzleWorldPosition();
    const hit=castHitscan({origin,angle:shotAngle,map,targets,shooter:this.owner,maxDistance:Math.hypot(map.width,map.height)});
    const crit=Math.random()<weapon.critChance;
    const damage=crit?weapon.critDamage:(hit.distance<=weapon.fullDamageRangeTiles*TILE_SIZE?weapon.damage:weapon.falloffDamage);
    this.feedback.spawnShot({muzzle,end:hit.point,crit,hit:Boolean(hit.target)});

    if(!hit.target)return {applied:false,reason:hit.structure?'structure':'miss'};
    const result=this.damageSystem.applyDamage({target:hit.target,amount:damage,sourceId:this.owner.id,sourceTeam:this.owner.team,sourcePosition:origin,sourceType:weapon.id});
    if(result.applied){
      this.feedback.spawnHit({point:hit.point,damage:result.amount,crit});
      if(result.killed){ hit.target.onDeath(); this.callbacks.onKill?.(hit.target,result); }
    }
    return result;
  }

  muzzleWorldPosition(){
    const state=this.animationState();
    const angle=this.owner.visualAimAngle;
    const forward=RIFLE_MUZZLE_FORWARD+(state.ads*4)-(state.fireKick*3);
    const side=RIFLE_SHOULDER_SIDE-(state.ads*RIFLE_ADS_SIDE_SHIFT);
    return {
      x:this.owner.x+Math.cos(angle)*forward-Math.sin(angle)*side,
      y:this.owner.y+Math.sin(angle)*forward+Math.cos(angle)*side
    };
  }

  startReload(){
    const weapon=this.currentWeapon(),ammo=this.currentAmmo();
    if(!weapon||!ammo||this.isReloading()||this.isSwitching()||this.owner.dashing||ammo.magazine>=weapon.magazineSize||ammo.reserve<=0)return false;
    this.reloadDuration=weapon.reloadTime; this.reloadTimer=weapon.reloadTime; this.reloadProgress=0; this.adsProgress=0; return true;
  }

  finishReload(){
    const weapon=this.currentWeapon(),ammo=this.currentAmmo(); if(!weapon||!ammo)return;
    const needed=weapon.magazineSize-ammo.magazine, transferred=Math.min(needed,ammo.reserve);
    ammo.magazine+=transferred; ammo.reserve-=transferred; this.reloadTimer=0; this.reloadProgress=1; this.postReloadDelay=weapon.postReloadDelay;
  }

  cancelReload(){ if(!this.isReloading())return false; this.reloadTimer=0; this.reloadProgress=0; return true; }

  requestSwitch(slot){
    if(slot===this.currentSlot||!this.loadout[slot]||this.owner.dashing||!this.owner.canSwitchWeapon())return false;
    const next=this.loadout[slot]; this.cancelReload(); this.adsProgress=0; this.pendingSlot=slot; this.switchDuration=next.swapTime; this.switchTimer=next.swapTime; return true;
  }
  finishSwitch(){ this.currentSlot=this.pendingSlot; this.pendingSlot=null; this.switchTimer=0; }

  resetForLife(){
    this.ammo={primary:freshAmmo(this.loadout.primary),secondary:freshAmmo(this.loadout.secondary)};
    this.fireCooldown=0; this.postReloadDelay=0; this.reloadTimer=0; this.reloadDuration=0; this.reloadProgress=0;
    this.switchTimer=0; this.switchDuration=0; this.pendingSlot=null; this.adsProgress=0; this.fireVisualTimer=0; this.dryFireTimer=0;
  }

  currentSpreadDegrees(){
    const weapon=this.currentWeapon(); if(!weapon)return 0; let spread=weapon.baseSpreadDegrees;
    spread*=this.owner.speedTilesPerSecond()>0.08?weapon.movingSpreadMultiplier:weapon.stationarySpreadMultiplier;
    spread*=lerp(1,weapon.adsSpreadMultiplier,this.adsProgress); return spread;
  }

  movementMultiplier(input=null){
    const weapon=this.currentWeapon(); if(!weapon)return 1; let m=weapon.movementMultiplier;
    const adsIntent=input?.adsHeld?.()?Math.max(this.adsProgress,0.15):this.adsProgress;
    if(adsIntent>0.01)m*=lerp(1,weapon.adsMovementMultiplier,adsIntent);
    if(this.isReloading())m*=weapon.reloadMovementMultiplier;
    if(this.isSwitching())m*=weapon.swapMovementMultiplier;
    return m;
  }

  animationState(){return {ads:this.adsProgress,firing:this.fireVisualTimer>0,fireKick:Math.min(1,this.fireVisualTimer/0.09),reloading:this.isReloading(),reloadProgress:this.reloadProgress,switching:this.isSwitching(),switchProgress:this.switchDuration>0?1-this.switchTimer/this.switchDuration:1};}
}
