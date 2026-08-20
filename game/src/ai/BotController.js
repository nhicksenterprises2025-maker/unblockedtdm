import { castHitscan } from '../combat/Hitscan.js';
import { TILE_SIZE } from '../engine/constants.js';

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const normalize=(x,y)=>{const l=Math.hypot(x,y);return l>.0001?{x:x/l,y:y/l}:{x:0,y:0};};
const angleDelta=(a,b)=>{let d=a-b;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;};

export const AI_DIFFICULTIES=Object.freeze({
  Beginner:Object.freeze({label:'Beginner',multiplier:.80}),
  Average:Object.freeze({label:'Average',multiplier:1.00}),
  Sweat:Object.freeze({label:'Sweat',multiplier:1.35}),
  Pro:Object.freeze({label:'Pro',multiplier:1.75})
});

function preferredRange(weapon){switch(weapon?.id){case'melee':return 1.35;case'shotgun':return 3.4;case'smg':return 5.6;case'pistol':return 6.5;case'assault-rifle':return 8.5;case'launcher':return 9;case'lmg':return 10.5;case'sniper':return 14.5;default:return 8;}}
function practicalRange(weapon){switch(weapon?.id){case'melee':return 2.05;case'shotgun':return 6.5;case'smg':return 11;case'pistol':return 10;case'launcher':return 15;case'sniper':return 25;default:return 18;}}
function aimJitter(weapon){switch(weapon?.id){case'sniper':return 5;case'shotgun':return 14;case'smg':return 12;case'launcher':return 8;case'lmg':return 10;default:return 8;}}

export class BotController {
  constructor(player,weaponManager,seed=0,difficulty='Average'){
    this.player=player;this.weaponManager=weaponManager;this.seed=seed;this.camera=null;
    this.aimWorld={x:player.x+100,y:player.y};this.moveAxis={x:0,y:0};this.fire=false;this.firePulse=false;this.ads=false;this.sprint=false;this.dashPulse=false;this.reloadPulse=false;this.primaryPulse=false;this.secondaryPulse=false;
    this.shotTimer=0;this.dashThinkTimer=.8+seed*.17;this.strafeClock=seed*.71;this.target=null;this.targetDecisionTimer=0;this.targetLockTimer=0;this.lastX=player.x;this.lastY=player.y;this.stuckTimer=0;this.routeFlip=seed%2===0?1:-1;this.setDifficulty(difficulty);
  }
  setDifficulty(name){const entry=AI_DIFFICULTIES[name]||AI_DIFFICULTIES.Average;this.difficultyName=entry.label;this.skillMultiplier=entry.multiplier;return entry;}
  difficulty(){return AI_DIFFICULTIES[this.difficultyName]||AI_DIFFICULTIES.Average;}
  resetTransient(){this.fire=false;this.firePulse=false;this.dashPulse=false;this.reloadPulse=false;this.primaryPulse=false;this.secondaryPulse=false;}
  chooseTarget(enemies,targetCounts=new Map()){
    const living=enemies.filter(e=>e.health?.alive);if(!living.length)return null;
    let best=null,bestScore=Infinity;
    for(const enemy of living){const distance=Math.hypot(enemy.x-this.player.x,enemy.y-this.player.y)/TILE_SIZE;const hp=enemy.health.health/Math.max(1,enemy.health.maxHealth);const focusPenalty=(targetCounts.get(enemy.id)||0)*2.8;const score=distance+hp*2.5+focusPenalty+((this.seed+enemy.id.length)%3)*.12;if(score<bestScore){bestScore=score;best=enemy;}}
    return best;
  }
  weaponSlotScore(weapon,distanceTiles){if(!weapon)return Infinity;const pref=preferredRange(weapon),rangeError=Math.abs(distanceTiles-pref)/Math.max(1,pref);const ammo=this.weaponManager.ammo?.[weapon===this.weaponManager.loadout.primary?'primary':'secondary'];if(weapon.magazineSize>0&&ammo&&ammo.magazine<=0&&ammo.reserve<=0)return 999;let score=rangeError;if(weapon.id==='launcher'&&distanceTiles<3.2)score+=3;if(weapon.id==='melee'&&distanceTiles>3)score+=2;return score;}
  maybeSwitchWeapon(distanceTiles){if(this.weaponManager.isSwitching()||this.weaponManager.isReloading())return;const current=this.weaponManager.currentSlot,other=current==='primary'?'secondary':'primary';const currentWeapon=this.weaponManager.loadout[current],otherWeapon=this.weaponManager.loadout[other];if(this.weaponSlotScore(otherWeapon,distanceTiles)+.24<this.weaponSlotScore(currentWeapon,distanceTiles)){if(other==='primary')this.primaryPulse=true;else this.secondaryPulse=true;}}
  hasLOS(target,map){const dx=target.x-this.player.x,dy=target.y-this.player.y,distance=Math.hypot(dx,dy);const sight=castHitscan({origin:{x:this.player.x,y:this.player.y},angle:Math.atan2(dy,dx),map,targets:[target],shooter:this.player,maxDistance:distance+target.radius+4});return sight.target===target;}
  update(dt,{camera,enemies=[],teammates=[],map,targetCounts=new Map()}){
    this.resetTransient();this.camera=camera;const skill=this.skillMultiplier;this.shotTimer=Math.max(0,this.shotTimer-dt);this.dashThinkTimer-=dt;this.targetDecisionTimer-=dt;this.strafeClock+=dt;
    if(!this.player.health.alive){this.moveAxis={x:0,y:0};this.sprint=false;this.ads=false;this.target=null;this.targetLockTimer=0;return;}
    if(!this.target?.health?.alive||this.targetDecisionTimer<=0){const next=this.chooseTarget(enemies,targetCounts);if(next!==this.target)this.targetLockTimer=0;this.target=next;this.targetDecisionTimer=clamp(.34/skill,.08,.48);}
    if(!this.target){this.moveAxis={x:0,y:0};this.sprint=false;this.ads=false;return;}
    this.targetLockTimer+=dt;
    let weapon=this.weaponManager.currentWeapon(),ammo=this.weaponManager.currentAmmo();const dx=this.target.x-this.player.x,dy=this.target.y-this.player.y,distance=Math.hypot(dx,dy),distanceTiles=distance/TILE_SIZE,toward=normalize(dx,dy),hasLOS=this.hasLOS(this.target,map);
    this.maybeSwitchWeapon(distanceTiles);weapon=this.weaponManager.currentWeapon();ammo=this.weaponManager.currentAmmo();

    const baseJitter=aimJitter(weapon);const difficultyError=baseJitter/clamp(skill,.65,2.2);const movementError=Math.min(7,this.target.speedTilesPerSecond?.()*1.25||0);const jitter=difficultyError+movementError/skill;
    const desiredAim={x:this.target.x+Math.cos(this.strafeClock*1.83+this.seed)*jitter,y:this.target.y+Math.sin(this.strafeClock*1.39+this.seed*.7)*jitter};
    const aimBlend=1-Math.exp(-(4.8+5.4*skill)*dt);this.aimWorld.x+=(desiredAim.x-this.aimWorld.x)*aimBlend;this.aimWorld.y+=(desiredAim.y-this.aimWorld.y)*aimBlend;

    const preferred=preferredRange(weapon),lowHealth=this.player.health.health<=55&&this.player.health.timeSinceDamage<4.5;const strafeSign=(this.seed%2===0?1:-1)*(Math.sin(this.strafeClock*(.58+.12*skill))>=0?1:-1);let moveX=0,moveY=0;
    if(lowHealth){moveX=-toward.x*.9-toward.y*strafeSign*.45;moveY=-toward.y*.9+toward.x*strafeSign*.45;}
    else if(!hasLOS){const laneY=((this.seed+Math.floor(this.strafeClock/8))%3===0?11:(this.routeFlip>0?6.5:15.5))*TILE_SIZE;const centerX=16*TILE_SIZE;const waypoint=Math.abs(this.player.x-centerX)>TILE_SIZE*1.4?{x:centerX,y:laneY}:{x:this.target.x,y:laneY};const route=normalize(waypoint.x-this.player.x,waypoint.y-this.player.y);moveX=route.x;moveY=route.y;}
    else if(distanceTiles>preferred*1.18){moveX=toward.x;moveY=toward.y;}
    else if(distanceTiles<preferred*(weapon?.id==='launcher'?.62:.50)){moveX=-toward.x;moveY=-toward.y;}
    else{const radial=clamp((distanceTiles-preferred)/Math.max(1,preferred),-.35,.35);moveX=-toward.y*strafeSign+toward.x*radial;moveY=toward.x*strafeSign+toward.y*radial;}

    for(const mate of teammates){if(!mate.health?.alive||mate===this.player)continue;const mx=this.player.x-mate.x,my=this.player.y-mate.y,md=Math.hypot(mx,my);if(md>0&&md<TILE_SIZE*1.7){const strength=(1-md/(TILE_SIZE*1.7))*.85;moveX+=(mx/md)*strength;moveY+=(my/md)*strength;}}
    const moved=Math.hypot(this.player.x-this.lastX,this.player.y-this.lastY);if(moved<1.3&&Math.hypot(this.moveAxis.x,this.moveAxis.y)>.45)this.stuckTimer+=dt;else this.stuckTimer=Math.max(0,this.stuckTimer-dt*2);if(this.stuckTimer>.65){this.routeFlip*=-1;moveX+=strafeSign*.9;moveY-=strafeSign*.65;this.stuckTimer=0;}this.lastX=this.player.x;this.lastY=this.player.y;
    this.moveAxis=normalize(moveX,moveY);this.sprint=(!hasLOS&&distanceTiles>8.5||lowHealth)&&this.player.stamina>30;this.ads=hasLOS&&weapon?.canADS!==false&&distanceTiles>(weapon?.id==='shotgun'?2.2:3.0);

    if(weapon?.magazineSize>0&&ammo&&ammo.reserve>0&&!this.weaponManager.isReloading()){const low=ammo.magazine<=Math.max(1,Math.floor(weapon.magazineSize*(.12+.08/skill)));if(ammo.magazine===0||(low&&(!hasLOS||distanceTiles>preferred*1.35)))this.reloadPulse=true;}
    const actualAngle=Math.atan2(dy,dx),aimError=Math.abs(angleDelta(this.player.aimAngle,actualAngle)),reactionReady=this.targetLockTimer>=clamp(.30/skill,.07,.42),aimTolerance=clamp(.16/skill,.035,.20);const safeLauncher=weapon?.id!=='launcher'||distanceTiles>=3.2;const wantsFire=hasLOS&&distanceTiles<=practicalRange(weapon)&&reactionReady&&aimError<=aimTolerance&&safeLauncher;
    if(wantsFire&&!this.reloadPulse){if(weapon?.fireMode==='auto')this.fire=true;else if(this.shotTimer<=0){this.firePulse=true;const base=weapon?.id==='pistol'?.22:Math.max(.16,weapon?.fireInterval||.24);this.shotTimer=clamp(base/skill,.09,base);}}
    if(this.dashThinkTimer<=0){this.dashThinkTimer=clamp((2.7+((this.seed*.37+this.strafeClock*.13)%1.5))/skill,1.05,4.2);const underPressure=hasLOS&&(distanceTiles<preferred*.85||lowHealth);if(underPressure&&this.player.dashCharges>0&&this.player.stamina>=15)this.dashPulse=true;}
  }
  axis(){return{...this.moveAxis};}sprintHeld(){return this.sprint;}dashPressed(){return this.dashPulse;}reloadPressed(){return this.reloadPulse;}slotPrimaryPressed(){return this.primaryPulse;}slotSecondaryPressed(){return this.secondaryPulse;}fireHeld(){return this.fire;}firePressed(){return this.firePulse;}adsHeld(){return this.ads;}aimSensitivity(){return clamp(this.skillMultiplier,.65,2.1);}
  pointerPosition(){if(!this.camera)return{x:0,y:0,inside:true};return{x:(this.aimWorld.x-this.camera.x)*this.camera.zoom+this.camera.width/2,y:(this.aimWorld.y-this.camera.y)*this.camera.zoom+this.camera.height/2,inside:true};}
  wasPressed(){return false;}endFrame(){this.resetTransient();}
}
