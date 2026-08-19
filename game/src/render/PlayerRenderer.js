import { TILE_SIZE } from '../engine/constants.js';

const TEAM = {
  blue: {
    ring: '#4aaeff',
    ringGlow: 'rgba(74,174,255,.32)',
    uniform: '#4d96cf',
    uniformDark: '#286087',
    accent: '#8dd8ff'
  },
  red: {
    ring: '#ff5f73',
    ringGlow: 'rgba(255,95,115,.30)',
    uniform: '#d95c6a',
    uniformDark: '#8e3441',
    accent: '#ffacb6'
  }
};

export class PlayerRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  draw(player) {
    this.drawTrail(player);
    this.drawShadowAndRing(player);
    this.drawLegs(player);
    this.drawUpperBody(player);
  }

  drawTrail(player) {
    const ctx = this.ctx;
    const palette = TEAM[player.team] || TEAM.blue;
    for (const ghost of player.trail) {
      const alpha = Math.max(0, ghost.life / ghost.maxLife) * 0.11;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(ghost.x, ghost.y);
      ctx.fillStyle = palette.accent;
      ctx.beginPath();
      ctx.ellipse(0, 4, 19, 13, ghost.aimAngle, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawShadowAndRing(player) {
    const ctx = this.ctx;
    const palette = TEAM[player.team] || TEAM.blue;

    ctx.save();
    ctx.translate(player.x, player.y);

    ctx.fillStyle = 'rgba(3,10,15,.30)';
    ctx.beginPath();
    ctx.ellipse(5, 13, player.radius * 1.18, player.radius * 0.68, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = palette.ringGlow;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 4, player.radius + 7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = palette.ring;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 4, player.radius + 7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  drawLegs(player) {
    const ctx = this.ctx;
    const palette = TEAM[player.team] || TEAM.blue;
    const moving = player.state !== 'idle';
    const sprinting = player.state === 'sprint';
    const wave = Math.sin(player.animationPhase * Math.PI * 2);
    const stride = moving ? wave * (sprinting ? 7 : 4.5) : Math.sin(player.animationTime * 2.2) * 0.7;

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.moveAngle - Math.PI / 2);

    const leanBack = sprinting ? -4 : 0;
    this.limb(ctx, -7 + stride * 0.22, 4 + leanBack, -10 + stride, 19 + leanBack, 8, palette.uniformDark);
    this.limb(ctx, 7 - stride * 0.22, 4 + leanBack, 10 - stride, 19 + leanBack, 8, palette.uniformDark);

    ctx.fillStyle = '#1b303d';
    ctx.beginPath();
    ctx.ellipse(-10 + stride, 21 + leanBack, 6, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(10 - stride, 21 + leanBack, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawUpperBody(player) {
    const ctx = this.ctx;
    const palette = TEAM[player.team] || TEAM.blue;
    const sprinting = player.state === 'sprint';
    const breathing = player.state === 'idle' ? Math.sin(player.animationTime * 2.1) * 0.8 : 0;
    const lean = sprinting ? 4.5 : 0;

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.aimAngle);

    ctx.fillStyle = palette.uniformDark;
    ctx.beginPath();
    ctx.ellipse(-2 - lean, 0, 18, 14 + breathing * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = palette.uniform;
    ctx.beginPath();
    ctx.ellipse(1 - lean, -2, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#163b50';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    const armReach = sprinting ? 19 : 22;
    const armSwing = player.state === 'idle' ? 0 : Math.sin(player.animationPhase * Math.PI * 2) * (sprinting ? 3 : 1.5);
    this.limb(ctx, 4 - lean, -10, armReach, -10 + armSwing, 7, palette.uniform);
    this.limb(ctx, 4 - lean, 10, armReach, 10 - armSwing, 7, palette.uniform);

    ctx.fillStyle = '#d7ad8f';
    ctx.beginPath();
    ctx.arc(armReach + 3, -10 + armSwing, 4.5, 0, Math.PI * 2);
    ctx.arc(armReach + 3, 10 - armSwing, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e4b99a';
    ctx.strokeStyle = '#8d684f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(6 - lean, 0, 11.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#263b48';
    ctx.beginPath();
    ctx.arc(3 - lean, -1, 10, Math.PI * 1.03, Math.PI * 1.93);
    ctx.lineTo(10 - lean, -8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.arc(-7 - lean, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  limb(ctx, x1, y1, x2, y2, width, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  drawDebug(player) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(94,235,255,.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,242,121,.9)';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + Math.cos(player.aimAngle) * TILE_SIZE * 0.8, player.y + Math.sin(player.aimAngle) * TILE_SIZE * 0.8);
    ctx.stroke();
    ctx.restore();
  }
}
