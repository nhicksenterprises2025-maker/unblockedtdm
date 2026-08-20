import { TEAM_PALETTES } from './PlayerRenderer.js';

const SKIN='#dfb293',SKIN_DARK='#9b7157',OUTLINE='#102732';

export class WeaponRenderer {
  constructor(ctx){this.ctx=ctx;}

  draw(player,manager){
    const weapon=manager.currentWeapon();if(!player.health.alive||!weapon)return;
    const state=manager.animationState(),ctx=this.ctx,angle=player.visualAimAngle,visual=weapon.render||{};
    const side=(visual.shoulderSide||0)-state.ads*(visual.adsSideShift||0);
    const adsForward=state.ads*(visual.adsForwardShift||0);
    const kick=state.fireKick*(visual.kick||0);
    const switchArc=state.switching?Math.sin(Math.PI*state.switchProgress):0;
    const switchDrop=switchArc*(weapon.swapTier>=3?14:10);
    const switchTilt=switchArc*(weapon.swapTier>=3?.35:.24);
    const reload=state.reloading?state.reloadProgress:0;
    const meleeSwing=weapon.kind==='melee'?Math.sin(Math.PI*Math.min(1,state.meleeSwing))*1.15:0;

    ctx.save();ctx.translate(player.x,player.y);ctx.rotate(angle+switchTilt+meleeSwing);ctx.translate(4+adsForward-kick,side+switchDrop);
    this.drawWeaponArms(ctx,player,weapon,state,reload);
    switch(weapon.id){
      case'assault-rifle':this.drawAR(ctx,state,reload);break;
      case'smg':this.drawSMG(ctx,state,reload);break;
      case'sniper':this.drawSniper(ctx,state,reload);break;
      case'shotgun':this.drawShotgun(ctx,state,reload);break;
      case'lmg':this.drawLMG(ctx,state,reload);break;
      case'pistol':this.drawPistol(ctx,state,reload);break;
      case'launcher':this.drawLauncher(ctx,state,reload);break;
      case'melee':this.drawMelee(ctx,state);break;
    }
    ctx.restore();
  }

  drawWeaponArms(ctx,player,weapon,state,reload){
    const p=TEAM_PALETTES[player.team]||TEAM_PALETTES.blue;
    let rear={x:7,y:4.8},front={x:29,y:4.5};
    if(weapon.id==='pistol'){rear={x:7,y:3.8};front={x:12,y:-3.8};}
    if(weapon.id==='sniper'){rear={x:5,y:4.8};front={x:38,y:4.3};}
    if(weapon.id==='lmg'){rear={x:7,y:5.7};front={x:35,y:6};}
    if(weapon.id==='launcher'){rear={x:2,y:6};front={x:33,y:6};}
    if(weapon.id==='shotgun'){rear={x:6,y:5};front={x:35,y:5};}
    if(weapon.id==='melee'){rear={x:8,y:2};front={x:25,y:1};}
    if(state.reloading){
      if(weapon.reloadStyle==='shell') front={x:15+Math.sin(reload*Math.PI*2)*5,y:12};
      else if(weapon.id==='launcher') front={x:-7,y:12+Math.sin(Math.PI*reload)*9};
      else front={x:10,y:9+Math.sin(Math.PI*reload)*13};
    }
    const rearShoulder={x:-4,y:-8.7},frontShoulder={x:-2,y:8.7};
    this.arm(ctx,rearShoulder,{x:1,y:-10},rear,7,p.uniform,SKIN);
    this.arm(ctx,frontShoulder,{x:9,y:11},front,7,p.uniformMid,SKIN);
  }

  arm(ctx,shoulder,elbow,hand,width,sleeve,skin){
    ctx.strokeStyle=OUTLINE;ctx.lineWidth=width+2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(shoulder.x,shoulder.y);ctx.lineTo(elbow.x,elbow.y);ctx.stroke();
    ctx.strokeStyle=sleeve;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(shoulder.x,shoulder.y);ctx.lineTo(elbow.x,elbow.y);ctx.stroke();
    ctx.strokeStyle=SKIN_DARK;ctx.lineWidth=width-1;ctx.beginPath();ctx.moveTo(elbow.x,elbow.y);ctx.lineTo(hand.x,hand.y);ctx.stroke();
    ctx.strokeStyle=skin;ctx.lineWidth=width-2.2;ctx.beginPath();ctx.moveTo(elbow.x,elbow.y);ctx.lineTo(hand.x,hand.y);ctx.stroke();
    ctx.fillStyle=skin;ctx.strokeStyle=SKIN_DARK;ctx.lineWidth=1;ctx.beginPath();ctx.arc(hand.x,hand.y,3.5,0,Math.PI*2);ctx.fill();ctx.stroke();
  }

  gunOutline(ctx){ctx.strokeStyle=OUTLINE;ctx.lineWidth=1.8;ctx.stroke();}

  drawAR(ctx,state,reload){
    ctx.fillStyle='#223640';ctx.beginPath();ctx.roundRect(-17,-5.5,20,11,5);ctx.fill();this.gunOutline(ctx);
    ctx.fillStyle='#39515d';ctx.beginPath();ctx.roundRect(0,-6,25,12,3);ctx.fill();this.gunOutline(ctx);
    ctx.fillStyle='#172b36';ctx.fillRect(5,-8,13,2.4);ctx.fillRect(9,-11,5,3);
    this.drawMagazine(ctx,8,5,reload,16,'#1b303a');
    ctx.fillStyle='#476571';ctx.beginPath();ctx.roundRect(23,-4.5,20,9,2.5);ctx.fill();
    ctx.fillStyle='#172a34';ctx.fillRect(41,-2,18,4);ctx.fillStyle='#101f27';ctx.fillRect(58,-1.5,7,3);ctx.fillStyle='#72d3f2';ctx.fillRect(2,-2,9,2);
  }

  drawSMG(ctx,state,reload){
    ctx.fillStyle='#213641';ctx.beginPath();ctx.roundRect(-11,-5,15,10,4);ctx.fill();this.gunOutline(ctx);
    ctx.fillStyle='#3c5965';ctx.beginPath();ctx.roundRect(0,-6.3,24,12.6,4);ctx.fill();this.gunOutline(ctx);
    ctx.fillStyle='#1a2d36';ctx.fillRect(5,-9,11,3);ctx.fillStyle='#5c8290';ctx.beginPath();ctx.roundRect(21,-4,13,8,2);ctx.fill();
    this.drawMagazine(ctx,9,5,reload,18,'#172b35');ctx.fillStyle='#142831';ctx.fillRect(33,-1.8,15,3.6);ctx.fillRect(47,-1.2,5,2.4);
  }

  drawSniper(ctx,state,reload){
    ctx.fillStyle='#273b45';ctx.beginPath();ctx.roundRect(-18,-5,22,10,5);ctx.fill();this.gunOutline(ctx);
    ctx.fillStyle='#465d66';ctx.beginPath();ctx.roundRect(0,-5.5,31,11,3);ctx.fill();this.gunOutline(ctx);
    this.drawMagazine(ctx,9,5,reload,13,'#1a2c35');
    ctx.fillStyle='#172a34';ctx.beginPath();ctx.roundRect(7,-11,24,6,3);ctx.fill();ctx.fillStyle='#74b9d0';ctx.beginPath();ctx.arc(21,-8,4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#536d76';ctx.beginPath();ctx.roundRect(29,-3.8,28,7.6,2);ctx.fill();ctx.fillStyle='#172931';ctx.fillRect(55,-1.7,27,3.4);ctx.fillStyle='#0d1e25';ctx.fillRect(81,-1.2,6,2.4);
    if(state.firing){ctx.strokeStyle='#9bdff5';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(3,-7);ctx.lineTo(-5,-14);ctx.stroke();}
  }

  drawShotgun(ctx,state,reload){
    ctx.fillStyle='#4b3627';ctx.beginPath();ctx.roundRect(-15,-5,22,10,4);ctx.fill();this.gunOutline(ctx);
    ctx.fillStyle='#354c55';ctx.beginPath();ctx.roundRect(3,-5.2,25,10.4,3);ctx.fill();this.gunOutline(ctx);
    ctx.fillStyle='#8a6139';ctx.beginPath();ctx.roundRect(27,-5.8,18,11.6,3);ctx.fill();ctx.strokeStyle='#5b3e25';ctx.stroke();
    ctx.fillStyle='#172a32';ctx.fillRect(43,-2.1,23,4.2);ctx.fillStyle='#0d1d24';ctx.fillRect(65,-1.5,5,3);
    if(state.reloading){const shellY=9+Math.sin(reload*Math.PI)*5;ctx.fillStyle='#d84835';ctx.beginPath();ctx.roundRect(11,shellY,9,4,2);ctx.fill();ctx.fillStyle='#d8b45b';ctx.fillRect(18,shellY,2,4);}
  }

  drawLMG(ctx,state,reload){
    ctx.fillStyle='#253943';ctx.beginPath();ctx.roundRect(-17,-6,21,12,4);ctx.fill();this.gunOutline(ctx);
    ctx.fillStyle='#405963';ctx.beginPath();ctx.roundRect(0,-7.2,31,14.4,3);ctx.fill();this.gunOutline(ctx);
    ctx.fillStyle='#172b34';ctx.fillRect(5,-10,18,3);ctx.fillStyle='#5f7a83';ctx.beginPath();ctx.roundRect(29,-5,24,10,2);ctx.fill();
    const boxDrop=state.reloading?Math.sin(Math.PI*reload)*20:0;ctx.fillStyle='#263d47';ctx.strokeStyle=OUTLINE;ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(5,6+boxDrop,22,18,3);ctx.fill();ctx.stroke();
    ctx.fillStyle='#14262e';ctx.fillRect(51,-2.4,18,4.8);ctx.fillRect(68,-1.5,7,3);
  }

  drawPistol(ctx,state,reload){
    ctx.fillStyle='#2b414b';ctx.beginPath();ctx.roundRect(-3,-5.5,27,11,3);ctx.fill();this.gunOutline(ctx);ctx.fillStyle='#536b74';ctx.fillRect(1,-7,18,2);
    const magDrop=state.reloading?Math.sin(Math.PI*reload)*17:0;ctx.save();ctx.translate(7,5+magDrop);ctx.rotate(.18);ctx.fillStyle='#172b34';ctx.beginPath();ctx.roundRect(-2,0,8,16,2);ctx.fill();ctx.restore();
    ctx.fillStyle='#14262e';ctx.fillRect(23,-1.7,14,3.4);ctx.fillRect(36,-1.1,5,2.2);
  }

  drawLauncher(ctx,state,reload){
    ctx.fillStyle='#263e45';ctx.strokeStyle=OUTLINE;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-16,-8,58,16,7);ctx.fill();ctx.stroke();
    ctx.fillStyle='#60776d';ctx.beginPath();ctx.roundRect(10,-9.5,25,19,5);ctx.fill();ctx.stroke();ctx.fillStyle='#1b2c30';ctx.beginPath();ctx.ellipse(42,0,6,7,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#4c626a';ctx.beginPath();ctx.roundRect(-6,7,11,16,3);ctx.fill();
    if(state.reloading){const rocketX=-22+reload*25;ctx.fillStyle='#d3a548';ctx.beginPath();ctx.roundRect(rocketX,-4,19,8,4);ctx.fill();ctx.fillStyle='#8e4937';ctx.beginPath();ctx.moveTo(rocketX, -4);ctx.lineTo(rocketX-7,0);ctx.lineTo(rocketX,4);ctx.closePath();ctx.fill();}
  }

  drawMelee(ctx,state){
    ctx.fillStyle='#273b45';ctx.strokeStyle=OUTLINE;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-8,-4,27,8,4);ctx.fill();ctx.stroke();
    ctx.fillStyle='#a7bcc4';ctx.beginPath();ctx.moveTo(17,-5);ctx.lineTo(43,-2);ctx.lineTo(49,0);ctx.lineTo(43,2);ctx.lineTo(17,5);ctx.closePath();ctx.fill();ctx.strokeStyle='#526b75';ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle='#d6edf4';ctx.fillRect(23,-1,19,2);
  }

  drawMagazine(ctx,x,y,reload,length,color){const phase=reload<.5?reload/.5:(1-reload)/.5,drop=reload?phase*17:0;ctx.save();ctx.translate(x,y+drop);ctx.rotate(.22+phase*.18);ctx.fillStyle=color;ctx.strokeStyle=OUTLINE;ctx.lineWidth=1.2;ctx.beginPath();ctx.roundRect(-3,0,9,length,2);ctx.fill();ctx.stroke();ctx.restore();}

  drawMuzzleFlash(player,manager){
    if(manager.fireVisualTimer<=0)return;const weapon=manager.currentWeapon();if(!weapon||weapon.kind==='melee')return;
    const ctx=this.ctx,a=player.visualAimAngle,m=manager.muzzleWorldPosition();ctx.save();ctx.translate(m.x,m.y);ctx.rotate(a);ctx.globalAlpha=Math.min(1,manager.fireVisualTimer/.045);
    const length=weapon.id==='shotgun'?23:weapon.id==='sniper'?20:weapon.id==='launcher'?13:15,width=weapon.id==='shotgun'?8:5;
    ctx.fillStyle='#fff1ad';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(length,-width);ctx.lineTo(length*.62,0);ctx.lineTo(length,width);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ffb33b';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(length*.65,-2);ctx.lineTo(length*.45,0);ctx.lineTo(length*.65,2);ctx.closePath();ctx.fill();ctx.restore();
  }
}
