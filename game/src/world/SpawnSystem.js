import { TILE_SIZE } from '../engine/constants.js';

function pointInsideRect(x,y,r){return x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;}
function lineBlocked(ax,ay,bx,by,blockers){const d=Math.hypot(bx-ax,by-ay),steps=Math.max(1,Math.ceil(d/14));for(let i=1;i<steps;i++){const t=i/steps,x=ax+(bx-ax)*t,y=ay+(by-ay)*t;if(blockers.some(r=>pointInsideRect(x,y,r)))return true;}return false;}

export class SpawnSystem{
  constructor(map){this.map=map;this.rotation={blue:0,red:0};this.lastSpawn={blue:-1,red:-1};}
  chooseSpawn(team,context={}){
    const spawns=this.map.definition.spawns[team]||[];if(!spawns.length)throw new Error(`No ${team} spawn points are defined.`);
    const enemies=(context.enemies||[]).filter(e=>!e.health||e.health.alive),teammates=(context.teammates||[]).filter(t=>!t.health||t.health.alive),recent=context.recentCombat||[];
    if(!enemies.length&&!teammates.length&&!recent.length){const index=this.rotation[team]%spawns.length;this.rotation[team]=(index+1)%spawns.length;this.lastSpawn[team]=index;return{...spawns[index],index,score:0,reason:'safe-rotation'};}
    let best=null;
    for(let index=0;index<spawns.length;index++){
      const s=spawns[index];let score=index===this.lastSpawn[team]?-12:0,visibleEnemies=0,nearestEnemy=Infinity;
      for(const e of enemies){const tiles=Math.hypot(s.x-e.x,s.y-e.y)/TILE_SIZE;nearestEnemy=Math.min(nearestEnemy,tiles);score+=Math.min(tiles,20)*4.5;if(tiles<6)score-=(6-tiles)*28;const blocked=lineBlocked(s.x,s.y,e.x,e.y,this.map.blockers);if(!blocked){visibleEnemies++;score-=110+Math.max(0,8-tiles)*12;}else score+=18;}
      if(visibleEnemies>=2)score-=visibleEnemies*55;if(nearestEnemy>=9)score+=25;
      for(const mate of teammates){const tiles=Math.hypot(s.x-mate.x,s.y-mate.y)/TILE_SIZE;if(tiles<=3)score+=4;else if(tiles<=7)score+=16;else if(tiles>12)score-=5;}
      for(const event of recent){const ageWeight=Math.max(0,1-(event.age||0)/8),tiles=Math.hypot(s.x-event.x,s.y-event.y)/TILE_SIZE;if(tiles<7)score-=(7-tiles)*11*ageWeight;}
      const candidate={...s,index,score,reason:visibleEnemies?'dynamic-risk-score':'dynamic-safe-score'};if(!best||candidate.score>best.score)best=candidate;
    }
    this.lastSpawn[team]=best.index;return best;
  }
}
