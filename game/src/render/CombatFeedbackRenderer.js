const TRACE_STYLE = {
  'assault-rifle': { color:'#eaf7ff', width:1.6, life:.075 },
  smg: { color:'#c9f6ff', width:1.15, life:.055 },
  lmg: { color:'#ffe5a3', width:2.15, life:.09 },
  pistol: { color:'#f4fbff', width:1.45, life:.07 },
  'shotgun-pellet': { color:'#ffd293', width:1.0, life:.05 }
};

export class CombatFeedbackRenderer {
  constructor(ctx){
    this.ctx=ctx;this.tracers=[];this.impacts=[];this.damageNumbers=[];this.explosions=[];this.meleeSwings=[];this.sparks=[];this.muzzleSmoke=[];
    this.hitmarkerTimer=0;this.hitmarkerCrit=false;this.trauma=0;
  }
  spawnShot({muzzle,end,hit,crit,type}){
    const style=TRACE_STYLE[type]||TRACE_STYLE['assault-rifle'];
    this.tracers.push({start:{...muzzle},end:{...end},life:style.life,maxLife:style.life,type,color:style.color,width:style.width});
    this.impacts.push({x:end.x,y:end.y,life:crit?.2:.14,maxLife:crit?.2:.14,hit,crit,type});
    const count=type==='shotgun-pellet'?1:type==='lmg'?4:2;
    for(let i=0;i<count;i++)this.sparks.push({x:end.x,y:end.y,vx:(Math.random()-.5)*75,vy:(Math.random()-.5)*75,life:.16+Math.random()*.08,maxLife:.24,crit});
  }
  spawnLaunch({muzzle,angle,type}){
    const count=type==='launcher'?8:3;
    for(let i=0;i<count;i++)this.muzzleSmoke.push({x:muzzle.x-Math.cos(angle)*i*2,y:muzzle.y-Math.sin(angle)*i*2,vx:-Math.cos(angle)*(18+Math.random()*18)+(Math.random()-.5)*15,vy:-Math.sin(angle)*(18+Math.random()*18)+(Math.random()-.5)*15,life:.3+Math.random()*.2,maxLife:.5,size:type==='launcher'?5+Math.random()*5:2+Math.random()*2});
    if(type==='launcher')this.trauma=Math.max(this.trauma,.22);
  }
  spawnProjectileImpact({point,type,hit,crit}){
    this.impacts.push({x:point.x,y:point.y,life:type==='sniper'?.28:.18,maxLife:type==='sniper'?.28:.18,hit,crit,type});
    const count=type==='sniper'?12:5;
    for(let i=0;i<count;i++)this.sparks.push({x:point.x,y:point.y,vx:(Math.random()-.5)*(type==='sniper'?180:90),vy:(Math.random()-.5)*(type==='sniper'?180:90),life:.18+Math.random()*.15,maxLife:.33,crit});
    if(type==='sniper'&&hit)this.trauma=Math.max(this.trauma,.08);
  }
  spawnExplosion({point,radius}){
    this.explosions.push({x:point.x,y:point.y,radius,life:.58,maxLife:.58});
    for(let i=0;i<30;i++){const a=Math.random()*Math.PI*2,s=70+Math.random()*190;this.sparks.push({x:point.x,y:point.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.3+Math.random()*.35,maxLife:.65,crit:false,explosive:true});}
    for(let i=0;i<12;i++){const a=Math.random()*Math.PI*2,s=20+Math.random()*55;this.muzzleSmoke.push({x:point.x,y:point.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.7+Math.random()*.45,maxLife:1.15,size:9+Math.random()*13});}
    this.trauma=Math.max(this.trauma,.72);
  }
  spawnMeleeSwing({owner,range,angle}){this.meleeSwings.push({x:owner.x,y:owner.y,range,angle,life:.22,maxLife:.22});this.trauma=Math.max(this.trauma,.035);}
  spawnHit({point,damage,crit}){
    this.damageNumbers.push({x:point.x,y:point.y-8,damage:Math.round(damage),crit,life:.82,maxLife:.82,vx:(Math.random()-.5)*12,vy:-34});
    this.hitmarkerTimer=crit?.19:.12;this.hitmarkerCrit=crit;
    if(crit)this.trauma=Math.max(this.trauma,.065);
  }
  update(dt){
    this.hitmarkerTimer=Math.max(0,this.hitmarkerTimer-dt);this.trauma=Math.max(0,this.trauma-dt*1.8);
    for(const item of[...this.tracers,...this.impacts,...this.damageNumbers,...this.explosions,...this.meleeSwings,...this.sparks,...this.muzzleSmoke])item.life-=dt;
    for(const n of this.damageNumbers){n.x+=n.vx*dt;n.y+=n.vy*dt;n.vy+=20*dt;}
    for(const p of this.sparks){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.07,dt);p.vy*=Math.pow(.07,dt);}
    for(const s of this.muzzleSmoke){s.x+=s.vx*dt;s.y+=s.vy*dt;s.vx*=Math.pow(.18,dt);s.vy*=Math.pow(.18,dt);}
    this.tracers=this.tracers.filter(i=>i.life>0);this.impacts=this.impacts.filter(i=>i.life>0);this.damageNumbers=this.damageNumbers.filter(i=>i.life>0);this.explosions=this.explosions.filter(i=>i.life>0);this.meleeSwings=this.meleeSwings.filter(i=>i.life>0);this.sparks=this.sparks.filter(i=>i.life>0);this.muzzleSmoke=this.muzzleSmoke.filter(i=>i.life>0);
  }
  shakeOffset(){const strength=this.trauma*this.trauma*8;return{x:(Math.random()-.5)*strength,y:(Math.random()-.5)*strength};}
  drawProjectiles(projectiles){
    const ctx=this.ctx;ctx.save();
    for(const p of projectiles){
      if(p.type==='sniper'){
        ctx.globalAlpha=.28;ctx.strokeStyle='#76d9ff';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(p.x-Math.cos(p.angle)*52,p.y-Math.sin(p.angle)*52);ctx.lineTo(p.x,p.y);ctx.stroke();
        ctx.globalAlpha=.9;ctx.strokeStyle='#e7fbff';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(p.x-Math.cos(p.angle)*34,p.y-Math.sin(p.angle)*34);ctx.lineTo(p.x,p.y);ctx.stroke();
        ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(p.x,p.y,3.3,0,Math.PI*2);ctx.fill();
      }else{
        for(let i=1;i<=4;i++){ctx.globalAlpha=.12*(5-i);ctx.fillStyle='#a9b7b0';ctx.beginPath();ctx.arc(p.x-Math.cos(p.angle)*(12+i*10),p.y-Math.sin(p.angle)*(12+i*10),4+i*1.4,0,Math.PI*2);ctx.fill();}
        ctx.globalAlpha=1;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle='#d6a84b';ctx.beginPath();ctx.roundRect(-9,-4,18,8,4);ctx.fill();ctx.fillStyle='#8f4436';ctx.beginPath();ctx.moveTo(-8,-4);ctx.lineTo(-15,0);ctx.lineTo(-8,4);ctx.closePath();ctx.fill();ctx.restore();
      }
    }
    ctx.restore();
  }
  drawWorld(){
    const ctx=this.ctx;ctx.save();ctx.lineCap='round';
    for(const t of this.tracers){ctx.globalAlpha=t.life/t.maxLife;ctx.strokeStyle=t.color;ctx.lineWidth=t.width;ctx.beginPath();ctx.moveTo(t.start.x,t.start.y);ctx.lineTo(t.end.x,t.end.y);ctx.stroke();}
    for(const smoke of this.muzzleSmoke){const a=Math.max(0,smoke.life/smoke.maxLife);ctx.globalAlpha=.22*a;ctx.fillStyle='#a8b4ae';ctx.beginPath();ctx.arc(smoke.x,smoke.y,smoke.size*(1+(1-a)*.8),0,Math.PI*2);ctx.fill();}
    for(const e of this.explosions){const a=e.life/e.maxLife,progress=1-a,r=e.radius*(.18+progress*.72);ctx.globalAlpha=.38*a;ctx.fillStyle='#ff7c35';ctx.beginPath();ctx.arc(e.x,e.y,r*.44,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.72*a;ctx.fillStyle='#ffd56c';ctx.beginPath();ctx.arc(e.x,e.y,r*.24,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.62*a;ctx.strokeStyle='#fff0b2';ctx.lineWidth=5;ctx.beginPath();ctx.arc(e.x,e.y,r*.68,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=.25*a;ctx.strokeStyle='#4d5a57';ctx.lineWidth=15;ctx.beginPath();ctx.arc(e.x,e.y,r*.9,0,Math.PI*2);ctx.stroke();}
    for(const s of this.meleeSwings){const a=s.life/s.maxLife;ctx.globalAlpha=.85*a;ctx.strokeStyle='#e8fbff';ctx.lineWidth=7;ctx.beginPath();ctx.arc(s.x,s.y,s.range*.58,s.angle-.82,s.angle+.82);ctx.stroke();ctx.globalAlpha=.34*a;ctx.strokeStyle='#62d7ff';ctx.lineWidth=13;ctx.stroke();}
    for(const p of this.sparks){const a=Math.max(0,p.life/p.maxLife);ctx.globalAlpha=a;ctx.fillStyle=p.explosive?'#ffb248':p.crit?'#ffe56f':'#dff7ff';ctx.beginPath();ctx.arc(p.x,p.y,p.explosive?2.4:1.8,0,Math.PI*2);ctx.fill();}
    for(const i of this.impacts){const a=i.life/i.maxLife;ctx.globalAlpha=a;ctx.strokeStyle=i.hit?(i.crit?'#ffe56b':'#b8f4ff'):'#d1dde3';ctx.lineWidth=i.crit?3.5:2;ctx.beginPath();ctx.arc(i.x,i.y,3+(1-a)*(i.type==='sniper'?11:6),0,Math.PI*2);ctx.stroke();if(i.type==='sniper'){ctx.beginPath();ctx.moveTo(i.x-9*a,i.y);ctx.lineTo(i.x+9*a,i.y);ctx.moveTo(i.x,i.y-9*a);ctx.lineTo(i.x,i.y+9*a);ctx.stroke();}}
    ctx.textAlign='center';ctx.textBaseline='middle';for(const n of this.damageNumbers){const a=Math.min(1,n.life/.22);const pop=1+Math.sin(Math.min(1,(n.maxLife-n.life)/.12)*Math.PI)*.18;ctx.save();ctx.translate(n.x,n.y);ctx.scale(pop,pop);ctx.globalAlpha=a;ctx.font=n.crit?'950 20px ui-monospace,monospace':'900 15px ui-monospace,monospace';ctx.fillStyle=n.crit?'#ffe45f':'#f4fbff';ctx.strokeStyle='rgba(4,12,18,.9)';ctx.lineWidth=5;ctx.strokeText(`${n.damage}`,0,0);ctx.fillText(`${n.damage}`,0,0);ctx.restore();}
    ctx.restore();
  }
  drawCrosshair(pointer,manager){const ctx=this.ctx,w=manager.currentWeapon();if(!w)return;const spread=manager.currentSpreadDegrees(),gap=w.kind==='melee'?11:7+spread*2.2,len=manager.isFullyADS()?7:8,x=pointer.x,y=pointer.y;ctx.save();ctx.strokeStyle='rgba(239,249,255,.94)';ctx.lineWidth=2;ctx.lineCap='round';for(const [x1,y1,x2,y2]of[[x-gap-len,y,x-gap,y],[x+gap,y,x+gap+len,y],[x,y-gap-len,x,y-gap],[x,y+gap,x,y+gap+len]]){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}ctx.restore();}
  drawHitmarker(pointer){if(this.hitmarkerTimer<=0)return;const ctx=this.ctx,x=pointer.x,y=pointer.y,a=Math.min(1,this.hitmarkerTimer/.09),inner=this.hitmarkerCrit?8:6,outer=this.hitmarkerCrit?18:13;ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=this.hitmarkerCrit?'#ffe45f':'#fff';ctx.lineWidth=this.hitmarkerCrit?3.4:2.1;for(const sx of[-1,1])for(const sy of[-1,1]){ctx.beginPath();ctx.moveTo(x+sx*inner,y+sy*inner);ctx.lineTo(x+sx*outer,y+sy*outer);ctx.stroke();}if(this.hitmarkerCrit){ctx.globalAlpha=a*.75;ctx.strokeStyle='#ffae42';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,12+(1-a)*7,0,Math.PI*2);ctx.stroke();}ctx.restore();}
}
