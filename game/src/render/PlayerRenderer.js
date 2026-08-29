import { DASH_DISTANCE_TILES, TILE_SIZE } from '../engine/constants.js';
import { lowAmmoState } from '../combat/AmmoState.js';

export const TEAM_PALETTES = {
  blue: {
    ring: '#4aaeff',
    ringGlow: 'rgba(74,174,255,.32)',
    uniform: '#4d96cf',
    uniformMid: '#397dad',
    uniformDark: '#245574',
    accent: '#b5eaff',
    vest: '#203f52',
    armor: '#315f78',
    armorLight: '#69bce7',
    marker: '#d9f5ff'
  },
  red: {
    ring: '#ff5f73',
    ringGlow: 'rgba(255,95,115,.30)',
    uniform: '#d95c6a',
    uniformMid: '#b54858',
    uniformDark: '#84313e',
    accent: '#ffd0d6',
    vest: '#572d38',
    armor: '#743c48',
    armorLight: '#ea8290',
    marker: '#ffe7ea'
  }
};

const SKIN = '#dfb293';
const SKIN_LIGHT = '#f2c7a8';
const SKIN_DARK = '#9b7157';
const BOOT = '#122832';
const BOOT_EDGE = '#071820';
const HAIR = '#263946';
const OUTLINE = '#0c222c';
const WEBBING = '#172d37';
const HELMET = '#253e49';

export const CHARACTER_PRESENTATION = Object.freeze({
  version:'2.5.0',
  role:'gameplay-top-down-operator',
  authored:true,
  features:Object.freeze(['directional-helmet', 'layered-armor', 'team-shoulders', 'locomotion-legs', 'weapon-support-arms', 'unit-identifier']),
  teamPalettes:Object.freeze(['blue', 'red'])
});

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, Number(value) || 0));

export class PlayerRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  draw(player, weaponManager = null) {
    if (!player?.health) return;
    if (!player.health.alive) {
      this.drawDeathMarker(player);
      return;
    }

    this.drawTrail(player);
    this.drawDashGroundStreak(player);
    this.drawShadowAndRing(player);
    this.drawLegs(player);
    this.drawUpperBody(player, weaponManager);
    this.drawUnitIdentifier(player);
    this.drawSpawnProtection(player);
    this.drawLowAmmoIndicator(player, weaponManager);
  }

  drawTrail(player) {
    const ctx = this.ctx;
    const palette = TEAM_PALETTES[player.team] || TEAM_PALETTES.blue;
    for (const ghost of player.trail) {
      const ratio = Math.max(0, ghost.life / ghost.maxLife);
      const dash = ghost.type === 'dash';
      ctx.save();
      ctx.globalAlpha = ratio * (dash ? 0.19 : 0.065);
      ctx.translate(ghost.x, ghost.y);
      ctx.rotate(ghost.aimAngle);
      ctx.scale(dash ? 1.16 : 1, dash ? 0.9 : 1);
      ctx.fillStyle = palette.uniformDark;
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = dash ? 1.6 : 1;
      ctx.beginPath();
      ctx.moveTo(-14, -8); ctx.quadraticCurveTo(-5, -13, 8, -10);
      ctx.lineTo(13, -5); ctx.lineTo(13, 5); ctx.lineTo(8, 10);
      ctx.quadraticCurveTo(-5, 13, -14, 8); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = palette.armorLight;
      ctx.beginPath(); ctx.roundRect(-4, -6, 12, 12, 4); ctx.fill();
      ctx.fillStyle = palette.marker;
      ctx.beginPath(); ctx.moveTo(-1, -4); ctx.lineTo(6, 0); ctx.lineTo(-1, 4); ctx.lineTo(1, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = HELMET;
      ctx.beginPath(); ctx.ellipse(10, 0, 8, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  drawDashGroundStreak(player) {
    if (player.dashBlend < 0.03) return;
    const ctx = this.ctx;
    const palette = TEAM_PALETTES[player.team] || TEAM_PALETTES.blue;
    const length = 68 * player.dashBlend;
    const dx = Math.cos(player.dashDirection);
    const dy = Math.sin(player.dashDirection);
    const px = -dy;
    const py = dx;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.12 + player.dashBlend * 0.16;
    ctx.strokeStyle = palette.ringGlow;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(player.x - dx * 7, player.y - dy * 7);
    ctx.lineTo(player.x - dx * length, player.y - dy * length);
    ctx.stroke();

    ctx.globalAlpha = 0.3 + player.dashBlend * 0.28;
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 2;
    for (const offset of [-5, 5]) {
      ctx.beginPath();
      ctx.moveTo(player.x - dx * 9 + px * offset, player.y - dy * 9 + py * offset);
      ctx.lineTo(player.x - dx * (length * 0.82) + px * offset * 0.35, player.y - dy * (length * 0.82) + py * offset * 0.35);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawShadowAndRing(player) {
    const ctx = this.ctx;
    const palette = TEAM_PALETTES[player.team] || TEAM_PALETTES.blue;
    const dash = player.dashBlend;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.fillStyle = 'rgba(3,10,15,.32)';
    ctx.beginPath(); ctx.ellipse(3 - dash * 3, 14, player.radius * (1.2 + dash * 0.12), player.radius * 0.62, 0, 0, Math.PI * 2); ctx.fill();

    ctx.globalAlpha = 0.78;
    ctx.strokeStyle = palette.ringGlow;
    ctx.lineWidth = 7 + dash * 3;
    ctx.beginPath(); ctx.arc(0, 5, player.radius + 7 + dash * 2, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = palette.ring;
    ctx.lineWidth = 2.8;
    ctx.beginPath(); ctx.arc(0, 5, player.radius + 7, 0, Math.PI * 2); ctx.stroke();

    // Four hard ticks retain team identity when effects or cover cross the ring.
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 2.2;
    for (let index = 0; index < 4; index += 1) {
      const angle = index * Math.PI / 2;
      ctx.beginPath();
      ctx.arc(0, 5, player.radius + 9.5, angle - 0.12, angle + 0.12);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawSpawnProtection(player) {
    if (!player.isInvulnerable()) return;
    const ctx = this.ctx;
    const palette = TEAM_PALETTES[player.team] || TEAM_PALETTES.blue;
    const spawnProtected = player.health.isSpawnProtected();
    const pulse = 0.5 + Math.sin(player.animationTime * 8) * 0.5;
    const radius = player.radius + (spawnProtected ? 13 : 10) + pulse * 1.5;
    ctx.save();
    ctx.translate(player.x, player.y + 4);
    ctx.globalAlpha = spawnProtected ? 0.38 + pulse * 0.18 : 0.25;
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = spawnProtected ? 2.4 : 1.7;
    ctx.setLineDash(spawnProtected ? [10, 7] : [5, 7]);
    ctx.lineDashOffset = -player.animationTime * (spawnProtected ? 20 : 12);
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
    if (spawnProtected) {
      ctx.setLineDash([]);
      ctx.fillStyle = palette.marker;
      ctx.globalAlpha = 0.52 + pulse * 0.25;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(-4, side * radius); ctx.lineTo(0, side * (radius - 5)); ctx.lineTo(4, side * radius); ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
  }

  drawUnitIdentifier(player) {
    const ctx = this.ctx;
    const palette = TEAM_PALETTES[player.team] || TEAM_PALETTES.blue;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.visualAimAngle);
    ctx.fillStyle = 'rgba(5,17,23,.88)';
    ctx.strokeStyle = palette.armorLight;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-11.5, -5.2, 7.5, 10.4, 1.6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = palette.marker;
    for (const y of [-2.8, 0, 2.8]) ctx.fillRect(-9.7, y - .55, 4.2, 1.1);
    if (player.isLocal) {
      ctx.fillStyle = palette.ring;
      ctx.beginPath();ctx.arc(-7.6, 0, 1.2, 0, Math.PI * 2);ctx.fill();
    }
    ctx.restore();
  }

  drawLowAmmoIndicator(player, weaponManager) {
    if (!player?.isLocal || !player.health?.alive || !weaponManager) return;
    const weapon = weaponManager.currentWeapon?.();
    const ammo = weaponManager.currentAmmo?.();
    const state = lowAmmoState(weapon, ammo);
    if (!state.active) return;
    const ctx = this.ctx;
    const width = 42;
    const height = 4;
    const x = player.x - width / 2;
    const y = player.y + player.radius + 20;
    ctx.save();
    ctx.fillStyle = 'rgba(36,5,8,.78)'; ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = 'rgba(255,71,84,.72)'; ctx.lineWidth = 1; ctx.strokeRect(x - 0.5, y - 0.5, width + 1, height + 1);
    if (state.progress > 0) { ctx.fillStyle='#ff4658'; ctx.fillRect(x, y, width * state.progress, height); }
    ctx.restore();
  }

  drawLegs(player) {
    const ctx = this.ctx;
    const palette = TEAM_PALETTES[player.team] || TEAM_PALETTES.blue;
    const phase = player.animationPhase * Math.PI * 2;
    const stride = Math.sin(phase);
    const amplitude = (7.8 + player.sprintBlend * 5.4 + player.dashBlend * 2.2) * player.motionBlend;
    const bob = Math.abs(Math.sin(phase)) * (0.9 + player.sprintBlend * 0.7) * player.motionBlend;
    ctx.save();
    ctx.translate(player.x - 2 - player.bodyLean * 1.5, player.y + 7 + bob);
    ctx.rotate(player.visualMoveAngle);
    this.drawLeg(ctx, palette, -1, stride * amplitude, Math.max(0, Math.cos(phase)) * player.motionBlend, player.dashBlend);
    this.drawLeg(ctx, palette, 1, -stride * amplitude, Math.max(0, -Math.cos(phase)) * player.motionBlend, player.dashBlend);
    ctx.restore();
  }

  drawLeg(ctx, palette, side, stride, lift, dash) {
    const hipX = -5 - dash * 2;
    const hipY = side * 6.4;
    const kneeX = hipX + stride * 0.52 + 4;
    const kneeY = side * (7.2 + lift * 1.1);
    const footX = hipX + stride + 2;
    const footY = side * (7.6 + lift * 1.4);

    this.segment(ctx, hipX, hipY, kneeX, kneeY, 8.6, palette.uniformDark, OUTLINE);
    this.segment(ctx, kneeX, kneeY, footX, footY, 7.2, palette.uniformMid, OUTLINE);
    ctx.fillStyle = palette.armor;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(kneeX, kneeY, 4.6, 3.7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = palette.armorLight;
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(kneeX - 2, kneeY); ctx.lineTo(kneeX + 2, kneeY); ctx.stroke();

    ctx.save();
    ctx.translate(footX, footY);
    ctx.rotate(Math.max(-0.28, Math.min(0.28, stride * 0.018)));
    ctx.fillStyle = BOOT;
    ctx.strokeStyle = BOOT_EDGE;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(-3, -4.4, 13, 8.8, 3.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#37505a'; ctx.fillRect(4, -3.2, 4, 6.4);
    ctx.restore();
  }

  drawUpperBody(player, weaponManager) {
    const ctx = this.ctx;
    const palette = TEAM_PALETTES[player.team] || TEAM_PALETTES.blue;
    const phase = player.animationPhase * Math.PI * 2;
    const state = weaponManager?.animationState?.() || {};
    const recoil = clamp(state.fireKick);
    const locomotionBob = Math.abs(Math.sin(phase)) * 0.72 * player.motionBlend;
    const breath = Math.sin(player.animationTime * 2.1) * 0.4 * (1 - player.motionBlend);
    const lean = player.bodyLean * 4.7;

    ctx.save();
    ctx.translate(player.x - recoil * 1.6, player.y - locomotionBob + breath * 0.22);
    ctx.rotate(player.visualAimAngle - recoil * 0.012);

    // Rear pack and waist pouches create a readable armored silhouette.
    ctx.fillStyle = '#172e39';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.roundRect(-16 - lean, -8, 10, 16, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = palette.uniformDark;
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.roundRect(-10 - lean, side * 8.2 - 3.1, 8, 6.2, 2); ctx.fill(); ctx.stroke();
    }

    ctx.fillStyle = palette.uniformDark;
    ctx.beginPath();
    ctx.moveTo(-14 - lean, -8); ctx.quadraticCurveTo(-5 - lean, -14.5, 7 - lean, -12);
    ctx.lineTo(12 - lean, -7.5); ctx.lineTo(12 - lean, 7.5);
    ctx.quadraticCurveTo(-5 - lean, 14.5, -14 - lean, 8); ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = palette.uniform;
    ctx.beginPath(); ctx.roundRect(-9 - lean, -9.7, 20, 19.4, 6.5); ctx.fill();
    ctx.fillStyle = palette.vest;
    ctx.beginPath(); ctx.roundRect(-6 - lean, -7.7, 16, 15.4, 3.8); ctx.fill();
    ctx.strokeStyle = 'rgba(9,24,31,.66)'; ctx.lineWidth = 1.1;
    ctx.strokeRect(-4.8 - lean, -6.5, 13.6, 13);

    // Center plate and webbing are geometric and restrained at gameplay scale.
    ctx.fillStyle = palette.armor;
    ctx.beginPath();
    ctx.moveTo(-3.5 - lean, -5.5); ctx.lineTo(7 - lean, -4); ctx.lineTo(7 - lean, 4);
    ctx.lineTo(-3.5 - lean, 5.5); ctx.lineTo(-6 - lean, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = palette.accent;
    ctx.globalAlpha = 0.92;
    ctx.fillRect(-3.5 - lean, -1.35, 9, 2.7);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = WEBBING; ctx.lineWidth = 1.25;
    ctx.beginPath(); ctx.moveTo(-1 - lean, -7); ctx.lineTo(-1 - lean, 7); ctx.moveTo(5 - lean, -6); ctx.lineTo(5 - lean, 6); ctx.stroke();
    ctx.fillStyle = '#0d2029';
    for (const y of [-4, 4]) { ctx.beginPath(); ctx.arc(2 - lean, y, 1.2, 0, Math.PI * 2); ctx.fill(); }

    // Shoulder armor remains one of the largest team-color reads after the ground ring.
    for (const side of [-1, 1]) {
      ctx.fillStyle = palette.armorLight;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(1 - lean, side * 10.3, 7.2, 4.9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = palette.marker;
      ctx.beginPath();
      ctx.moveTo(-1 - lean, side * 10.3); ctx.lineTo(3 - lean, side * 8.5); ctx.lineTo(3 - lean, side * 12.1); ctx.closePath(); ctx.fill();
    }

    if (!weaponManager?.currentWeapon?.()) this.drawRelaxedArms(ctx, palette, lean, phase, player.motionBlend);

    ctx.fillStyle = SKIN_DARK;
    ctx.beginPath(); ctx.ellipse(4 - lean, 0, 5.7, 6.4, 0, 0, Math.PI * 2); ctx.fill();
    const headX = 8.5 - lean + player.bodyLean * 0.8 - recoil * 0.6;
    this.drawHeadAndHelmet(ctx, palette, headX);
    ctx.restore();
  }

  drawHeadAndHelmet(ctx, palette, headX) {
    ctx.fillStyle = SKIN;
    ctx.strokeStyle = SKIN_DARK;
    ctx.lineWidth = 1.35;
    ctx.beginPath(); ctx.ellipse(headX, 0, 10, 8.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = SKIN_LIGHT;
    ctx.beginPath(); ctx.arc(headX - 1, -8, 2.1, 0, Math.PI * 2); ctx.arc(headX - 1, 8, 2.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = SKIN_DARK;
    ctx.beginPath(); ctx.moveTo(headX + 7.6, -2.2); ctx.lineTo(headX + 11.4, 0); ctx.lineTo(headX + 7.6, 2.2); ctx.closePath(); ctx.fill();

    // Low-profile helmet leaves the face direction legible while adding armor detail.
    ctx.fillStyle = HELMET;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(headX - 2.8, 0, 8.8, Math.PI * 0.54, Math.PI * 1.46);
    ctx.quadraticCurveTo(headX + 0.5, -9.2, headX + 4.5, -6.6);
    ctx.lineTo(headX + 3.1, 0); ctx.lineTo(headX + 4.5, 6.6);
    ctx.quadraticCurveTo(headX + 0.5, 9.2, headX - 2.8, 8.8); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = palette.armorLight; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(headX - 5.5, -6.5); ctx.lineTo(headX + 1.8, -6.8); ctx.moveTo(headX - 5.5, 6.5); ctx.lineTo(headX + 1.8, 6.8); ctx.stroke();
    ctx.fillStyle = palette.marker;
    ctx.beginPath(); ctx.roundRect(headX - 4.8, -2.5, 6.5, 5, 1.3); ctx.fill();

    ctx.fillStyle = HAIR;
    ctx.beginPath(); ctx.arc(headX + 4.9, -2.8, 1, 0, Math.PI * 2); ctx.arc(headX + 4.9, 2.8, 1, 0, Math.PI * 2); ctx.fill();
  }

  drawRelaxedArms(ctx, palette, lean, phase, motion) {
    const swing = Math.sin(phase) * 4 * motion;
    for (const side of [-1, 1]) {
      const shoulderX = -lean;
      const shoulderY = side * 10.4;
      const elbowX = -5 - swing;
      const elbowY = side * 14;
      const handX = 2 - swing;
      const handY = side * 15;
      this.segment(ctx, shoulderX, shoulderY, elbowX, elbowY, 7, palette.uniform, OUTLINE);
      this.segment(ctx, elbowX, elbowY, handX, handY, 5.7, palette.uniformDark, OUTLINE);
      ctx.fillStyle = SKIN; ctx.strokeStyle = SKIN_DARK; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(handX, handY, 3.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  }

  drawDeathMarker(player) {
    const ctx = this.ctx;
    const palette = TEAM_PALETTES[player.team] || TEAM_PALETTES.blue;
    const fade = clamp((Number(player.health.respawnTimer) || 0) / 3, 0.35, 1);
    ctx.save();
    ctx.translate(player.x, player.y + 5);
    ctx.rotate(player.visualAimAngle + 0.35);
    ctx.globalAlpha = 0.24 + fade * 0.32;
    ctx.fillStyle = 'rgba(2,9,13,.48)';
    ctx.beginPath(); ctx.ellipse(0, 5, 24, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = palette.uniformDark;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(-15, -8, 28, 16, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = palette.armorLight;
    ctx.fillRect(-4, -6, 10, 12);
    ctx.fillStyle = HELMET;
    ctx.beginPath(); ctx.ellipse(13, 1, 8, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = palette.ring;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 7]);
    ctx.beginPath(); ctx.arc(0, 4, player.radius + 8, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  segment(ctx, x1, y1, x2, y2, width, color, outline = OUTLINE) {
    ctx.strokeStyle = outline;
    ctx.lineWidth = width + 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  drawDebug(player) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(94,235,255,.9)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,242,121,.9)';
    ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.lineTo(player.x + Math.cos(player.aimAngle) * TILE_SIZE * 0.8, player.y + Math.sin(player.aimAngle) * TILE_SIZE * 0.8); ctx.stroke();
    const x = player.x + Math.cos(player.aimAngle) * TILE_SIZE * DASH_DISTANCE_TILES;
    const y = player.y + Math.sin(player.aimAngle) * TILE_SIZE * DASH_DISTANCE_TILES;
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = player.dashDeniedTimer > 0 ? 'rgba(255,91,111,.95)' : 'rgba(174,120,255,.82)';
    ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.lineTo(x, y); ctx.stroke();
    ctx.restore();
  }
}
