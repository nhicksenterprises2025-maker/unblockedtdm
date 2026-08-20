import { TILE_SIZE } from '../engine/constants.js';
import { castHitscan } from './Hitscan.js';

function lineBlocked(map, from, to) {
  const dx=to.x-from.x,dy=to.y-from.y,distance=Math.hypot(dx,dy);if(distance<=.001)return false;
  const hit=castHitscan({origin:from,angle:Math.atan2(dy,dx),map,targets:[],shooter:{team:'__none__'},maxDistance:distance});
  return Boolean(hit.structure&&hit.distance>2&&hit.distance<distance-1);
}

export class ProjectileSystem {
  constructor(damageSystem,feedback,callbacks={}){this.damageSystem=damageSystem;this.feedback=feedback;this.callbacks=callbacks;this.projectiles=[];}
  spawn({owner,weapon,origin,angle,crit=false}){this.projectiles.push({id:`${weapon.id}-${performance.now()}-${Math.random()}`,type:weapon.projectileType,owner,weapon,x:origin.x,y:origin.y,angle,speed:weapon.projectileSpeedTiles*TILE_SIZE,traveled:0,crit,life:8});}
  update(dt,map,targets=[]){const survivors=[];for(const p of this.projectiles){p.life-=dt;if(p.life<=0){if(p.type==='launcher')this.explode(p,map,targets,{x:p.x,y:p.y});continue;}const step=p.speed*dt,origin={x:p.x,y:p.y},hit=castHitscan({origin,angle:p.angle,map,targets,shooter:p.owner,maxDistance:step}),actual=(hit.target||hit.structure)?hit.distance:step;p.x+=Math.cos(p.angle)*actual;p.y+=Math.sin(p.angle)*actual;p.traveled+=actual;if(hit.target||hit.structure){if(p.type==='sniper')this.impactSniper(p,hit);else this.explode(p,map,targets,hit.point);continue;}survivors.push(p);}this.projectiles=survivors;}
  impactSniper(p,hit){const {weapon,owner}=p;this.feedback.spawnProjectileImpact?.({point:hit.point,type:'sniper',hit:Boolean(hit.target),crit:p.crit});if(!hit.target)return;const damage=p.crit?weapon.critDamage:(p.traveled<=weapon.fullDamageRangeTiles*TILE_SIZE?weapon.damage:weapon.falloffDamage),result=this.damageSystem.applyDamage({target:hit.target,amount:damage,sourceId:owner.id,sourceTeam:owner.team,sourcePosition:{x:owner.x,y:owner.y},sourceType:weapon.id});if(result.applied){this.feedback.suppressHitmarker=!owner.isLocal;this.feedback.spawnHit({point:hit.point,damage:result.amount,crit:p.crit});this.feedback.suppressHitmarker=false;if(result.killed){hit.target.onDeath();this.callbacks.onKill?.(owner,hit.target,result);}}}
  explode(p,map,targets,point){const {weapon,owner}=p,radius=weapon.blastRadiusTiles*TILE_SIZE;this.feedback.spawnExplosion?.({point,radius});const seen=new Set();for(const target of [owner,...targets].filter(Boolean)){if(seen.has(target.id))continue;seen.add(target.id);if(!target.health?.alive)continue;const distance=Math.hypot(target.x-point.x,target.y-point.y);if(distance>radius+target.radius)continue;const self=target.id===owner.id;if(!self&&target.team===owner.team)continue;if(lineBlocked(map,point,target))continue;const result=this.damageSystem.applyDamage({target,amount:weapon.damage,sourceId:owner.id,sourceTeam:owner.team,sourcePosition:point,sourceType:weapon.id,selfDamage:self});if(result.applied){this.feedback.suppressHitmarker=!owner.isLocal;this.feedback.spawnHit({point:{x:target.x,y:target.y},damage:result.amount,crit:false});this.feedback.suppressHitmarker=false;if(result.killed){target.onDeath();this.callbacks.onKill?.(owner,target,result);}}}}
  reset(){this.projectiles.length=0;}
}
