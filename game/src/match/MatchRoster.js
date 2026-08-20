import { Player } from '../actors/Player.js';
import { WeaponManager } from '../combat/WeaponManager.js';
import { DEFAULT_LOADOUT } from '../data/weapons.js';

export class MatchRoster {
  constructor(mapDefinition,damageSystem,combatFeedback){
    this.mapDefinition=mapDefinition;
    this.players=[];
    for(const team of ['blue','red']){
      const spawns=mapDefinition.spawns[team];
      for(let i=0;i<3;i+=1){
        const id=team==='blue'&&i===0?'local-blue':`${team}-${i+1}`;
        const actor=new Player(spawns[i%spawns.length],team,id);
        const manager=new WeaponManager(actor,damageSystem,combatFeedback,null,DEFAULT_LOADOUT,{});
        actor.setWeaponManager(manager);
        actor.isLocal=id==='local-blue';
        actor.rosterIndex=i;
        this.players.push(actor);
      }
    }
  }
  local(){return this.players.find((p)=>p.isLocal);}
  team(team){return this.players.filter((p)=>p.team===team);}
  enemiesOf(player){return this.players.filter((p)=>p.team!==player.team);}
  teammatesOf(player){return this.players.filter((p)=>p.team===player.team&&p!==player);}
  spawnTeamForRound(team,sideFlip=false){return sideFlip?(team==='blue'?'red':'blue'):team;}
  resetForRound(sideFlip=false){
    for(const actor of this.players){
      const spawnTeam=this.spawnTeamForRound(actor.team,sideFlip);
      const spawns=this.mapDefinition.spawns[spawnTeam];
      actor.resetForRound(spawns[actor.rosterIndex%spawns.length]);
    }
  }
  updatePassive(dt){
    for(const actor of this.players){
      if(actor.isLocal)continue;
      actor.health.update(dt);
      actor.animationTime+=dt;
      actor.animationPhase=(actor.animationPhase+dt*.75)%1;
      if(!actor.health.alive)continue;
      const enemies=this.enemiesOf(actor).filter((p)=>p.health.alive);
      if(!enemies.length)continue;
      let target=enemies[0],best=Infinity;
      for(const enemy of enemies){const d=Math.hypot(enemy.x-actor.x,enemy.y-actor.y);if(d<best){best=d;target=enemy;}}
      const a=Math.atan2(target.y-actor.y,target.x-actor.x);
      actor.aimAngle=a;actor.visualAimAngle=a;actor.moveAngle=a;actor.visualMoveAngle=a;actor.state='idle';
    }
  }
}
