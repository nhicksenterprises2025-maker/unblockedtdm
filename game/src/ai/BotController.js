import { castHitscan } from '../combat/Hitscan.js';
import { TILE_SIZE } from '../engine/constants.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const norm=(x,y)=>{const l=Math.hypot(x,y);return l>.0001?{x:x/l,y:y/l}:{x:0,y:0};};
const angleDiff=(a,b)=>{let d=a-b;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;};
export const AI_DIFFICULTIES=Object.freeze({Beginner:{label:'Beginner',multiplier:.80},Average:{label:'Average',multiplier:1},Sweat:{label:'Sweat',multiplier:1.35},Pro:{label:'Pro',multiplier:1.75}});
function preferred(w){switch(w?.id){case'melee':return 1.35;case'shotgun':return 3.4;case'smg':return 5.6;case'pistol':return 6.5;case'assault-rifle':return 8.5;case'launcher':return 9;case'lmg':return 10.5;case'sniper':return 14.5;default:return 8;}}
function practical(w){switch(w?.id){case'melee':return 2.05;case'shotgun':return 6.5;case'smg':return 11;case'pistol':return 10;case'launcher':return 15;case'sniper':return 25;default:return 18;}}
function jitterBase(w){return w?.id==='sniper'?5:w?.id==='shotgun'?14:w?.id==='smg'?12:w?.id==='lmg'?10:8;}

export class BotController{
  constructor(player,weaponManager,seed=0,difficulty='Average'){
    this.player=player;this.weaponManager=weaponManager;this.seed=seed;this.camera=null;this.aimWorld={x:player.x+100,y:player.y};this.moveAxis={x:0,y:0};
    this.fire=false;this.firePulse=false;this.ads=false;this.sprint=false;this.dashPulse=false;this.reloadPulse=false;this.primaryPulse=false;this.secondaryPulse=false;
    this.shotTimer=0;this.dashThinkTimer=.8+seed*.17;this.strafeClock=seed*.71;this.target=null;this.targetDecisionTimer=0;this.targetLockTimer=0;this.lastX=player.x;this.lastY=player.y;this.stuckTimer=0;this.routeFlip=seed%2===0?1:-1;this.setDifficulty(difficulty);
  }
  setDifficulty(name){const d=AI_DIFFICULTIES[name]||AI_DIFFICULTIES.Average;this.difficultyName=d.label;this.skillMultiplier=d.multiplier;return d;}
  resetTransient(){this.fire=false;this.firePulse=false;this.dashPulse=false;this.reloadPulse=false;this.primaryPulse=false;this.secondaryPulse=false;}
  chooseTarget(enemies,targetCounts){let best=null,score=Infinity;for(const e of enemies){if(!e.health?.alive)continue;const dist=Math.hypot(e.x-this.player.x,e.y-this.player.y)/TILE_SIZE,hp=e.health.health/Math.max(1,e.health.maxHealth),focus=(targetCounts.get(e.id)||0)*2.8,s=dist+hp*2.5+focus;if(s<score){score=s;best=e;}}return best;}
  hasLOS(target,map){const dx=target.x-this.player.x,dy=target.y-this.player.y,d=Math.hypot(dx,dy);const hit=castHitscan({origin:{x:this.player.x,y:this.player.y},angle:Math.atan2(dy,dx),map,targets:[target],shooter:this.player,maxDistance:d+target.radius+4});return hit.target===target;}
  slotScore(slot,distanceTiles){const w=this.weaponManager.loadout[slot];if(!w)return 999;const ammo=this.weaponManager.ammo?.[slot];if(w.magazineSize>0&&ammo&&ammo.magazine<=0&&ammo.reserve<=0)return 999;let s=Math.abs(distanceTiles-preferred(w))/Math.max(1,preferred(w));if(w.id==='launcher'&&distanceTiles<3.2)s+=3;if(w.id==='melee'&&distanceTiles>3)s+=2;return s;}
  maybeSwitch(distanceTiles){if(this.weaponManager.isSwitching()||this.weaponManager.isReloading())return;const cur=this.weaponManager.currentSlot,other=cur==='primary'?'secondary':'primary';if(this.slotScore(other,distanceTiles)+.24<this.slotScore(cur,distanceTiles)){if(other==='primary')this.primaryPulse=true;else this.secondaryPulse=true;}}
  update(dt,{camera,enemies=[],teammates=[],map,targetCounts=new Map()}){
    this.resetTransient();this.camera=camera;const skill=this.skillMultiplier;this.shotTimer=Math.max(0,this.shotTimer-dt);this.dashThinkTimer-=dt;this.targetDecisionTimer-=dt;this.strafeClock+=dt;
    if(!this.player.health.alive){this.moveAxis={x:0,y:0};this.sprint=false;this.ads=false;this.target=null;this.targetLockTimer=0;return;}
    if(!this.target?.health?.alive||this.targetDecisionTimer<=0){const next=this.chooseTarget(enemies,targetCounts);if(next!==this.target)this.targetLockTimer=0;this.target=next;this.targetDecisionTimer=clamp(.34/skill,.08,.48);}
    if(!this.target){this.moveAxis={x:0,y:0};this.sprint=false;this.ads=false;return;}
    this.targetLockTimer+=dt;
    let weapon=this.weaponManager.currentWeapon(),ammo=this.weaponManager.currentAmmo();const dx=this.target.x-this.player.x,dy=this.target.y-this.player.y,distance=Math.hypot(dx,dy),distanceTiles=distance/TILE_SIZE,toward=norm(dx,dy),los=this.hasLOS(this.target,map);
    this.maybeSwitch(distanceTiles);weapon=this.weaponManager.currentWeapon();ammo=this.weaponManager.currentAmmo();
    const jitter=jitterBase(weapon)/clamp(skill,.65,2.2)+Math.min(7,(this.target.speedTilesPerSecond?.()||0)*1.25)/skill;const desired={x:this.target.x+Math.cos(this.strafeClock*1.83+this.seed)*jitter,y:this.target.y+Math.sin(this.strafeClock*1.39+this.seed*.7)*jitter};const blend=1-Math.exp(-(4.8+5.4*skill)*dt);this.aimWorld.x+=(desired.x-this.aimWorld.x)*blend;this.aimWorld.y+=(desired.y-this.aimWorld.y)*blend;
    const pref=preferred(weapon),low=this.player.health.health<=55&&this.player.health.timeSinceDamage<4.5,sign=(this.seed%2===0?1:-1)*(Math.sin(this.strafeClock*(.58+.12*skill))>=0?1:-1);let mx=0,my=0;
    if(low){mx=-toward.x*.9-toward.y*sign*.45;my=-toward.y*.9+toward.x*sign*.45;}
    else if(!los){const lane=((this.seed+Math.floor(this.strafeClock/8))%3===0?11:(this.routeFlip>0?6.5:15.5))*TILE_SIZE,center=16*TILE_SIZE,wp=Math.abs(this.player.x-center)>TILE_SIZE*1.4?{x:center,y:lane}:{x:this.target.x,y:lane},r=norm(wp.x-this.player.x,wp.y-this.player.y);mx=r.x;my=r.y;}
    else if(distanceTiles>pref*1.18){mx=toward.x;my=toward.y;}
    else if(distanceTiles<pref*(weapon?.id==='launcher' ? .62 : .50)){mx=-toward.x;my=-toward.y;}
    else{const radial=clamp((distanceTiles-pref)/Math.max(1,pref),-.35,.35);mx=-toward.y*sign+toward.x*radial;my=toward.x*sign+toward.y*radial;}
    for(const mate of teammates){if(!mate.health?.alive||mate===this.player)continue;const x=this.player.x-mate.x,y=this.player.y-mate.y,d=Math.hypot(x,y);if(d>0&&d<TILE_SIZE*1.7){const s=(1-d/(TILE_SIZE*1.7))*.85;mx+=x/d*s;my+=y/d*s;}}
    const moved=Math.hypot(this.player.x-this.lastX,this.player.y-this.lastY);if(moved<1.3&&Math.hypot(this.moveAxis.x,this.moveAxis.y)>.45)this.stuckTimer+=dt;else this.stuckTimer=Math.max(0,this.stuckTimer-dt*2);if(this.stuckTimer>.65){this.routeFlip*=-1;mx+=sign*.9;my-=sign*.65;this.stuckTimer=0;}this.lastX=this.player.x;this.lastY=this.player.y;
    this.moveAxis=norm(mx,my);this.sprint=((!los&&distanceTiles>8.5)||low)&&this.player.stamina>30;this.ads=los&&weapon?.canADS!==false&&distanceTiles>(weapon?.id==='shotgun'?2.2:3);
    if(weapon?.magazineSize>0&&ammo&&ammo.reserve>0&&!this.weaponManager.isReloading()){const lowAmmo=ammo.magazine<=Math.max(1,Math.floor(weapon.magazineSize*(.12+.08/skill)));if(ammo.magazine===0||(lowAmmo&&(!los||distanceTiles>pref*1.35)))this.reloadPulse=true;}
    const actual=Math.atan2(dy,dx),aimError=Math.abs(angleDiff(this.player.aimAngle,actual)),reaction=this.targetLockTimer>=clamp(.30/skill,.07,.42),tolerance=clamp(.16/skill,.035,.20),safeLauncher=weapon?.id!=='launcher'||distanceTiles>=3.2,wantsFire=los&&distanceTiles<=practical(weapon)&&reaction&&aimError<=tolerance&&safeLauncher;
    if(wantsFire&&!this.reloadPulse){if(weapon?.fireMode==='auto')this.fire=true;else if(this.shotTimer<=0){this.firePulse=true;const base=weapon?.id==='pistol' ? .22 : Math.max(.16,weapon?.fireInterval||.24);this.shotTimer=clamp(base/skill,.09,base);}}
    if(this.dashThinkTimer<=0){this.dashThinkTimer=clamp((2.7+((this.seed*.37+this.strafeClock*.13)%1.5))/skill,1.05,4.2);if(los&&(distanceTiles<pref*.85||low)&&this.player.dashCharges>0&&this.player.stamina>=15)this.dashPulse=true;}
  }
  axis(){return{...this.moveAxis};}sprintHeld(){return this.sprint;}dashPressed(){return this.dashPulse;}reloadPressed(){return this.reloadPulse;}slotPrimaryPressed(){return this.primaryPulse;}slotSecondaryPressed(){return this.secondaryPulse;}fireHeld(){return this.fire;}firePressed(){return this.firePulse;}adsHeld(){return this.ads;}aimSensitivity(){return clamp(this.skillMultiplier,.65,2.1);}
  pointerPosition(){if(!this.camera)return{x:0,y:0,inside:true};return{x:(this.aimWorld.x-this.camera.x)*this.camera.zoom+this.camera.width/2,y:(this.aimWorld.y-this.camera.y)*this.camera.zoom+this.camera.height/2,inside:true};}
  wasPressed(){return false;}endFrame(){this.resetTransient();}
}
