import { DASH_DISTANCE_TILES, TILE_SIZE } from '../engine/constants.js';

const TEAM = {
  blue: {
    ring: '#4aaeff',
    ringGlow: 'rgba(74,174,255,.32)',
    uniform: '#4d96cf',
    uniformMid: '#397dad',
    uniformDark: '#245574',
    accent: '#9ee1ff'
  },
  red: {
    ring: '#ff5f73',
    ringGlow: 'rgba(255,95,115,.30)',
    uniform: '#d95c6a',
    uniformMid: '#b54858',
    uniformDark: '#84313e',
    accent: '#ffc0c8'
  }
};

const SKIN = '#dfb293';
const SKIN_DARK = '#9b7157';
const BOOT = '#172d39';
const HAIR = '#263946';

export class PlayerRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  draw(player) {
    this.drawTrail(player);
    this.drawDashGroundStreak(player);
    this.drawShadowAndRing(player);
    this.drawLegs(player);
    this.drawUpperBody(player);
  }

  drawTrail(player) {
    const ctx = this.ctx;
    const palette = TEAM[player.team] || TEAM.blue;

    for (const ghost of player.trail) {
      const ratio = Math.max(0, ghost.life / ghost.maxLife);
      const dash = ghost.type === 'dash';
      ctx.save();
      ctx.globalAlpha = ratio * (dash ? 0.19 : 0.075);
      ctx.translate(ghost.x, ghost.y);
      ctx.rotate(ghost.aimAngle);

      ctx.fillStyle = palette.accent;
      ctx.beginPath();
      ctx.ellipse(-3, 0, dash ? 19 : 15, dash ? 12 : 10, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = palette.uniform;
      ctx.beginPath();
      ctx.arc(8, 0, dash ? 9 : 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawDashGroundStreak(player) {
    if (player.dashBlend < 0.03) return;
    const ctx = this.ctx;
    const palette = TEAM[player.team] || TEAM.blue;
    const length = 58 * player.dashBlend;

    ctx.save();
    ctx.globalAlpha = 0.16 + player.dashBlend * 0.18;
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(
      player.x - Math.cos(player.dashDirection) * 8,
      player.y - Math.sin(player.dashDirection) * 8
    );
    ctx.lineTo(
      player.x - Math.cos(player.dashDirection) * length,
      player.y - Math.sin(player.dashDirection) * length
    );
    ctx.stroke();
    ctx.restore();
  }

  drawShadowAndRing(player) {
    const ctx = this.ctx;
    const palette = TEAM[player.team] || TEAM.blue;
    const dashBoost = player.dashBlend;

    ctx.save();
    ctx.translate(player.x, player.y);

    ctx.fillStyle = 'rgba(3,10,15,.30)';
    ctx.beginPath();
    ctx.ellipse(5, 13, player.radius * 1.18, player.radius * 0.68, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = palette.ringGlow;
    ctx.lineWidth = 8 + dashBoost * 3;
    ctx.beginPath();
    ctx.arc(0, 4, player.radius + 7 + dashBoost * 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = palette.ring;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 4, player.radius + 7, 0, Math.PI * 2);
    ctx.stroke();

    if (player.isInvulnerable()) {
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 4, player.radius + 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawLegs(player) {
    const ctx = this.ctx;
    const palette = TEAM[player.team] || TEAM.blue;
    const phase = player.animationPhase * Math.PI * 2;
    const strideWave = Math.sin(phase);
    const liftWave = Math.max(0, Math.cos(phase));
    const amplitude = (8.5 + player.sprintBlend * 5 + player.dashBlend * 2) * player.motionBlend;
    const bob = Math.abs(Math.sin(phase)) * (1.1 + player.sprintBlend * 0.7) * player.motionBlend;

    ctx.save();
    ctx.translate(player.x, player.y + bob);
    ctx.rotate(player.visualMoveAngle);

    this.drawLeg(ctx, palette, -1, strideWave * amplitude, liftWave * player.motionBlend, player.dashBlend);
    this.drawLeg(ctx, palette, 1, -strideWave * amplitude, Math.max(0, -Math.cos(phase)) * player.motionBlend, player.dashBlend);

    ctx.restore();
  }

  drawLeg(ctx, palette, side, stride, lift, dashBlend) {
    const hipX = -5 - dashBlend * 2;
    const hipY = side * 6.2;
    const kneeX = hipX + stride * 0.55 + 4;
    const kneeY = side * (7.2 + lift * 1.3);
    const footX = hipX + stride + 1;
    const footY = side * (7.8 + lift * 1.8);

    this.segment(ctx, hipX, hipY, kneeX, kneeY, 8.2, palette.uniformDark);
    this.segment(ctx, kneeX, kneeY, footX, footY, 7.2, palette.uniformMid);

    ctx.fillStyle = palette.uniformDark;
    ctx.beginPath();
    ctx.arc(kneeX, kneeY, 4.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(footX, footY);
    ctx.rotate(Math.max(-0.28, Math.min(0.28, stride * 0.018)));
    ctx.fillStyle = BOOT;
    ctx.beginPath();
    ctx.roundRect(-2, -4.1, 11, 8.2, 4);
    ctx.fill();
    ctx.restore();
  }

  drawUpperBody(player) {
    const ctx = this.ctx;
    const palette = TEAM[player.team] || TEAM.blue;
    const phase = player.animationPhase * Math.PI * 2;
    const locomotionBob = Math.abs(Math.sin(phase)) * 0.9 * player.motionBlend;
    const breathing = Math.sin(player.animationTime * 2.2) * 0.45 * (1 - player.motionBlend);
    const lean = player.bodyLean * 5.5;
    const shoulderRoll = Math.sin(phase) * 1.2 * player.motionBlend * (1 - player.dashBlend * 0.5);

    ctx.save();
    ctx.translate(player.x, player.y - locomotionBob);
    ctx.rotate(player.visualAimAngle);

    ctx.fillStyle = palette.uniformDark;
    ctx.beginPath();
    ctx.moveTo(-13 - lean, -7.5);
    ctx.quadraticCurveTo(-4 - lean, -14, 7 - lean, -10.5);
    ctx.lineTo(12 - lean, -6.5);
    ctx.lineTo(12 - lean, 6.5);
    ctx.quadraticCurveTo(-4 - lean, 14, -13 - lean, 7.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = palette.uniform;
    ctx.beginPath();
    ctx.moveTo(-9 - lean, -7.5);
    ctx.quadraticCurveTo(0 - lean, -11.5 - breathing, 9 - lean, -7.5);
    ctx.lineTo(10 - lean, 7.5);
    ctx.quadraticCurveTo(0 - lean, 11.5 + breathing, -9 - lean, 7.5);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#173b4e';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.roundRect(-7 - lean, -2.2, 14, 4.4, 2);
    ctx.fill();

    const frontReach = 23 - player.dashBlend * 3;
    const elbowReach = 11 - player.dashBlend * 1.5;
    this.drawArm(ctx, palette, -1, -1 + shoulderRoll, elbowReach, frontReach, player.sprintBlend, player.dashBlend, lean);
    this.drawArm(ctx, palette, 1, 1 - shoulderRoll, elbowReach, frontReach, player.sprintBlend, player.dashBlend, lean);

    ctx.fillStyle = SKIN_DARK;
    ctx.beginPath();
    ctx.arc(3 - lean, 0, 6.1, 0, Math.PI * 2);
    ctx.fill();

    const headX = 9 - lean + player.bodyLean * 1.2;
    ctx.fillStyle = SKIN;
    ctx.strokeStyle = SKIN_DARK;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(headX, 0, 10.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = HAIR;
    ctx.beginPath();
    ctx.arc(headX - 2.5, 0, 9.4, Math.PI * 0.58, Math.PI * 1.42);
    ctx.quadraticCurveTo(headX + 1, -9.2, headX + 4.8, -6.6);
    ctx.quadraticCurveTo(headX + 1, 0, headX + 4.8, 6.6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#263944';
    ctx.beginPath();
    ctx.arc(headX + 5.8, -3.2, 1.05, 0, Math.PI * 2);
    ctx.arc(headX + 5.8, 3.2, 1.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawArm(ctx, palette, side, swing, elbowReach, frontReach, sprintBlend, dashBlend, lean) {
    const shoulderX = 1 - lean;
    const shoulderY = side * 10.3;
    const elbowX = elbowReach + swing + sprintBlend * 1.5;
    const elbowY = side * (13.2 - dashBlend * 2.2);
    const handX = frontReach + swing * 0.5;
    const handY = side * (6.8 + sprintBlend * 1.8 - dashBlend * 1.6);

    this.segment(ctx, shoulderX, shoulderY, elbowX, elbowY, 7.3, palette.uniform);
    this.segment(ctx, elbowX, elbowY, handX, handY, 6.2, SKIN);

    ctx.fillStyle = palette.uniformDark;
    ctx.beginPath();
    ctx.arc(elbowX, elbowY, 3.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = SKIN;
    ctx.strokeStyle = SKIN_DARK;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(handX, handY, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  segment(ctx, x1, y1, x2, y2, width, color) {
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

    const dashEndX = player.x + Math.cos(player.aimAngle) * TILE_SIZE * DASH_DISTANCE_TILES;
    const dashEndY = player.y + Math.sin(player.aimAngle) * TILE_SIZE * DASH_DISTANCE_TILES;
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = player.dashDeniedTimer > 0 ? 'rgba(255,91,111,.95)' : 'rgba(174,120,255,.82)';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(dashEndX, dashEndY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }
}
