import { DASH_DISTANCE_TILES, TILE_SIZE } from '../engine/constants.js';

export const TEAM_PALETTES = {
  blue: { ring:'#4aaeff', ringGlow:'rgba(74,174,255,.32)', uniform:'#4d96cf', uniformMid:'#397dad', uniformDark:'#245574', accent:'#9ee1ff', vest:'#203f52' },
  red: { ring:'#ff5f73', ringGlow:'rgba(255,95,115,.30)', uniform:'#d95c6a', uniformMid:'#b54858', uniformDark:'#84313e', accent:'#ffc0c8', vest:'#572d38' }
};

const SKIN='#dfb293', SKIN_LIGHT='#f2c7a8', SKIN_DARK='#9b7157', BOOT='#172d39', HAIR='#263946', OUTLINE='#15303d';

export class PlayerRenderer {
  constructor(ctx){this.ctx=ctx;}

  draw(player, weaponManager=null){
    this.drawTrail(player);
    this.drawDashGroundStreak(player);
    this.drawShadowAndRing(player);
    this.drawLegs(player);
    this.drawUpperBody(player, weaponManager);
  }

  drawTrail(player){
    const ctx=this.ctx,p=TEAM_PALETTES[player.team]||TEAM_PALETTES.blue;
    for(const ghost of player.trail){
      const ratio=Math.max(0,ghost.life/ghost.maxLife),dash=ghost.type==='dash';
      ctx.save();ctx.globalAlpha=ratio*(dash?.17:.06);ctx.translate(ghost.x,ghost.y);ctx.rotate(ghost.aimAngle);
      ctx.fillStyle=p.uniform;ctx.beginPath();ctx.ellipse(-1,0,dash?19:15,dash?11:9,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=p.accent;ctx.beginPath();ctx.arc(8,-1,dash?8:6,0,Math.PI*2);ctx.fill();ctx.restore();
    }
  }

  drawDashGroundStreak(player){
    if(player.dashBlend<.03)return;const ctx=this.ctx,p=TEAM_PALETTES[player.team]||TEAM_PALETTES.blue,length=62*player.dashBlend;
    ctx.save();ctx.globalAlpha=.14+player.dashBlend*.17;ctx.strokeStyle=p.accent;ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();
    ctx.moveTo(player.x-Math.cos(player.dashDirection)*8,player.y-Math.sin(player.dashDirection)*8);
    ctx.lineTo(player.x-Math.cos(player.dashDirection)*length,player.y-Math.sin(player.dashDirection)*length);ctx.stroke();ctx.restore();
  }

  drawShadowAndRing(player){
    const ctx=this.ctx,p=TEAM_PALETTES[player.team]||TEAM_PALETTES.blue,d=player.dashBlend;
    ctx.save();ctx.translate(player.x,player.y);ctx.fillStyle='rgba(3,10,15,.29)';ctx.beginPath();ctx.ellipse(3,14,player.radius*1.18,player.radius*.64,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=p.ringGlow;ctx.lineWidth=7+d*3;ctx.beginPath();ctx.arc(0,5,player.radius+7+d*2,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle=p.ring;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,5,player.radius+7,0,Math.PI*2);ctx.stroke();
    if(player.isInvulnerable()){ctx.globalAlpha=.28;ctx.strokeStyle=p.accent;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,5,player.radius+12,0,Math.PI*2);ctx.stroke();}ctx.restore();
  }

  drawLegs(player){
    const ctx=this.ctx,p=TEAM_PALETTES[player.team]||TEAM_PALETTES.blue,phase=player.animationPhase*Math.PI*2;
    const stride=Math.sin(phase),amp=(7.8+player.sprintBlend*5.4+player.dashBlend*1.5)*player.motionBlend;
    const bob=Math.abs(Math.sin(phase))*(.9+player.sprintBlend*.7)*player.motionBlend;
    ctx.save();ctx.translate(player.x-2,player.y+7+bob);ctx.rotate(player.visualMoveAngle);
    this.drawLeg(ctx,p,-1,stride*amp,Math.max(0,Math.cos(phase))*player.motionBlend,player.dashBlend);
    this.drawLeg(ctx,p,1,-stride*amp,Math.max(0,-Math.cos(phase))*player.motionBlend,player.dashBlend);ctx.restore();
  }

  drawLeg(ctx,p,side,stride,lift,dash){
    const hipX=-5-dash*2,hipY=side*6.4,kneeX=hipX+stride*.52+4,kneeY=side*(7.2+lift*1.1),footX=hipX+stride+2,footY=side*(7.6+lift*1.4);
    this.segment(ctx,hipX,hipY,kneeX,kneeY,8.4,p.uniformDark);this.segment(ctx,kneeX,kneeY,footX,footY,7.1,p.uniformMid);
    ctx.fillStyle=p.uniformDark;ctx.beginPath();ctx.arc(kneeX,kneeY,4,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.translate(footX,footY);ctx.rotate(Math.max(-.28,Math.min(.28,stride*.018)));ctx.fillStyle=BOOT;ctx.strokeStyle=OUTLINE;ctx.lineWidth=1.3;ctx.beginPath();ctx.roundRect(-2,-4.2,12,8.4,4);ctx.fill();ctx.stroke();ctx.restore();
  }

  drawUpperBody(player,weaponManager){
    const ctx=this.ctx,p=TEAM_PALETTES[player.team]||TEAM_PALETTES.blue,phase=player.animationPhase*Math.PI*2;
    const locomotionBob=Math.abs(Math.sin(phase))*.72*player.motionBlend,breath=Math.sin(player.animationTime*2.1)*.4*(1-player.motionBlend),lean=player.bodyLean*4.7;
    ctx.save();ctx.translate(player.x,player.y-locomotionBob);ctx.rotate(player.visualAimAngle);

    // Back/shoulder silhouette gives the body a readable humanoid shape at game scale.
    ctx.fillStyle=p.uniformDark;ctx.strokeStyle=OUTLINE;ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-14-lean,-8);ctx.quadraticCurveTo(-5-lean,-14.5,7-lean,-12);ctx.lineTo(12-lean,-7.5);ctx.lineTo(12-lean,7.5);ctx.quadraticCurveTo(-5-lean,14.5,-14-lean,8);ctx.closePath();ctx.fill();ctx.stroke();

    // Shirt/chest and vest panel.
    ctx.fillStyle=p.uniform;ctx.beginPath();ctx.roundRect(-9-lean,-9.5,20,19,7);ctx.fill();
    ctx.fillStyle=p.vest;ctx.beginPath();ctx.roundRect(-5-lean,-7.2,14,14.4,4);ctx.fill();
    ctx.fillStyle=p.accent;ctx.globalAlpha=.82;ctx.fillRect(-4-lean,-1.5,10,3);ctx.globalAlpha=1;
    ctx.strokeStyle='rgba(10,30,40,.35)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(0-lean,-7);ctx.lineTo(0-lean,7);ctx.stroke();

    // Shoulder pads sit where weapon arms actually originate.
    for(const side of [-1,1]){ctx.fillStyle=p.uniformMid;ctx.strokeStyle=OUTLINE;ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(1-lean,side*10.2,6.5,4.6,0,0,Math.PI*2);ctx.fill();ctx.stroke();}

    if(!weaponManager?.currentWeapon?.()) this.drawRelaxedArms(ctx,p,lean,phase,player.motionBlend);

    // Neck and head are slightly forward of the chest, but no longer dominate the silhouette.
    ctx.fillStyle=SKIN_DARK;ctx.beginPath();ctx.ellipse(4-lean,0,5.5,6.2,0,0,Math.PI*2);ctx.fill();
    const headX=8.5-lean+player.bodyLean*.8;
    ctx.fillStyle=SKIN;ctx.strokeStyle=SKIN_DARK;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(headX,0,10.2,9.2,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    // Ear + nose/face direction make aim orientation obvious.
    ctx.fillStyle=SKIN_LIGHT;ctx.beginPath();ctx.arc(headX-1,-8.2,2.3,0,Math.PI*2);ctx.arc(headX-1,8.2,2.3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=SKIN_DARK;ctx.beginPath();ctx.moveTo(headX+8,-2.4);ctx.lineTo(headX+12,0);ctx.lineTo(headX+8,2.4);ctx.closePath();ctx.fill();
    ctx.fillStyle=HAIR;ctx.beginPath();ctx.arc(headX-3,0,8.8,Math.PI*.55,Math.PI*1.45);ctx.quadraticCurveTo(headX+1,-8.8,headX+4,-6.5);ctx.lineTo(headX+2.5,0);ctx.lineTo(headX+4,6.5);ctx.quadraticCurveTo(headX+1,8.8,headX-3,8.6);ctx.closePath();ctx.fill();
    ctx.fillStyle='#1c303b';ctx.beginPath();ctx.arc(headX+5.4,-3,1,0,Math.PI*2);ctx.arc(headX+5.4,3,1,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  drawRelaxedArms(ctx,p,lean,phase,motion){
    const swing=Math.sin(phase)*4*motion;
    for(const side of [-1,1]){const shoulderX=0-lean,shoulderY=side*10.4,elbowX=-5-swing,elbowY=side*14,handX=2-swing,handY=side*15;
      this.segment(ctx,shoulderX,shoulderY,elbowX,elbowY,7,p.uniform);this.segment(ctx,elbowX,elbowY,handX,handY,5.7,SKIN);ctx.fillStyle=SKIN;ctx.beginPath();ctx.arc(handX,handY,3.3,0,Math.PI*2);ctx.fill();}
  }

  segment(ctx,x1,y1,x2,y2,width,color){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}

  drawDebug(player){const ctx=this.ctx;ctx.save();ctx.strokeStyle='rgba(94,235,255,.9)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(player.x,player.y,player.radius,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='rgba(255,242,121,.9)';ctx.beginPath();ctx.moveTo(player.x,player.y);ctx.lineTo(player.x+Math.cos(player.aimAngle)*TILE_SIZE*.8,player.y+Math.sin(player.aimAngle)*TILE_SIZE*.8);ctx.stroke();
    const x=player.x+Math.cos(player.aimAngle)*TILE_SIZE*DASH_DISTANCE_TILES,y=player.y+Math.sin(player.aimAngle)*TILE_SIZE*DASH_DISTANCE_TILES;ctx.setLineDash([8,6]);ctx.strokeStyle=player.dashDeniedTimer>0?'rgba(255,91,111,.95)':'rgba(174,120,255,.82)';ctx.beginPath();ctx.moveTo(player.x,player.y);ctx.lineTo(x,y);ctx.stroke();ctx.restore();}
}
