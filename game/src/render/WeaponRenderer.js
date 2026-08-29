import { TEAM_PALETTES } from './PlayerRenderer.js';

const OUTLINE = '#0b1b23';
const DEEP_METAL = '#13262f';
const DARK_METAL = '#1d333d';
const MID_METAL = '#36505b';
const LIGHT_METAL = '#718993';
const EDGE_METAL = '#9eb0b7';
const BLACK_POLYMER = '#111f26';
const BROWN_POLYMER = '#3b2d24';
const WOOD = '#765033';
const WOOD_LIGHT = '#a47749';
const SIGHT = '#79d8ee';
const BRASS = '#d5a94d';
const SHELL_RED = '#b9362e';
const SKIN = '#dfb293';
const SKIN_DARK = '#9b7157';

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, Number(value) || 0));
const smooth = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

function metalGradient(ctx, x, y, width, height, top = LIGHT_METAL, bottom = DARK_METAL) {
  const gradient = ctx.createLinearGradient(x, y, x, y + Math.max(1, height));
  gradient.addColorStop(0, top);
  gradient.addColorStop(0.42, MID_METAL);
  gradient.addColorStop(1, bottom);
  return gradient;
}

function roundedPanel(ctx, x, y, width, height, radius, fill, stroke = OUTLINE, lineWidth = 1.6) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
  ctx.stroke();
}

function fastener(ctx, x, y, radius = 1.25) {
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(210,228,234,.42)';
  ctx.lineWidth = 0.55;
  ctx.beginPath();
  ctx.moveTo(x - radius * 0.55, y);
  ctx.lineTo(x + radius * 0.55, y);
  ctx.stroke();
}

function rail(ctx, x, y, length, teeth = 5) {
  ctx.fillStyle = BLACK_POLYMER;
  ctx.fillRect(x, y, length, 2.2);
  const spacing = length / Math.max(1, teeth);
  for (let index = 0; index < teeth; index += 1) {
    ctx.fillRect(x + index * spacing + 0.7, y - 1.4, Math.max(1.2, spacing - 1.5), 1.8);
  }
}

function ventSlots(ctx, x, y, count, spacing = 5.2, height = 3.4) {
  ctx.fillStyle = '#0b1d25';
  for (let index = 0; index < count; index += 1) {
    ctx.beginPath();
    ctx.roundRect(x + index * spacing, y, 2.5, height, 1);
    ctx.fill();
  }
}

function triggerGuard(ctx, x, y, width = 10, height = 8) {
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#7e929a';
  ctx.lineWidth = 1.15;
  ctx.beginPath();
  ctx.moveTo(x - 0.5, y - 2.5);
  ctx.quadraticCurveTo(x + 2.4, y, x + 0.5, y + 2.5);
  ctx.stroke();
}

function grip(ctx, x, y, width = 8, height = 14, angle = 0.12, color = BLACK_POLYMER) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  roundedPanel(ctx, -width / 2, 0, width, height, 2.3, color, OUTLINE, 1.35);
  ctx.strokeStyle = 'rgba(149,174,183,.22)';
  ctx.lineWidth = 0.8;
  for (let py = 4; py < height - 1; py += 3.2) {
    ctx.beginPath();
    ctx.moveTo(-width / 2 + 1.5, py);
    ctx.lineTo(width / 2 - 1.5, py - 1.5);
    ctx.stroke();
  }
  ctx.restore();
}

export class WeaponRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  draw(player, manager) {
    const weapon = manager.currentWeapon();
    if (!player.health.alive || !weapon) return;

    const state = manager.animationState();
    const ctx = this.ctx;
    const angle = player.visualAimAngle;
    const visual = weapon.render || {};
    const side = (visual.shoulderSide || 0) - state.ads * (visual.adsSideShift || 0);
    const adsForward = state.ads * (visual.adsForwardShift || 0);
    const kick = state.fireKick * (visual.kick || 0);
    const switchArc = state.switching ? Math.sin(Math.PI * state.switchProgress) : 0;
    const switchDrop = switchArc * (weapon.swapTier >= 3 ? 14 : 10);
    const switchTilt = switchArc * (weapon.swapTier >= 3 ? 0.35 : 0.24);
    const reload = state.reloading ? state.reloadProgress : 0;
    const meleeSwing = weapon.kind === 'melee' ? Math.sin(Math.PI * Math.min(1, state.meleeSwing)) * 1.15 : 0;

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(angle + switchTilt + meleeSwing);
    ctx.translate(4 + adsForward - kick, side + switchDrop);
    this.drawWeaponArms(ctx, player, weapon, state, reload);

    switch (weapon.id) {
      case 'assault-rifle': this.drawAR(ctx, state, reload); break;
      case 'smg': this.drawSMG(ctx, state, reload); break;
      case 'sniper': this.drawSniper(ctx, state, reload); break;
      case 'shotgun': this.drawShotgun(ctx, state, reload); break;
      case 'lmg': this.drawLMG(ctx, state, reload); break;
      case 'pistol': this.drawPistol(ctx, state, reload); break;
      case 'launcher': this.drawLauncher(ctx, state, reload); break;
      case 'melee': this.drawMelee(ctx, state); break;
      default: break;
    }
    ctx.restore();
  }

  drawWeaponArms(ctx, player, weapon, state, reload) {
    const palette = TEAM_PALETTES[player.team] || TEAM_PALETTES.blue;
    const recoil = clamp(state.fireKick);
    let rear = { x: 7 - recoil * 1.5, y: 4.8 };
    let front = { x: 29 - recoil * 2, y: 4.5 };

    if (weapon.id === 'pistol') { rear = { x: 7, y: 3.8 }; front = { x: 12, y: -3.8 }; }
    if (weapon.id === 'sniper') { rear = { x: 5, y: 4.8 }; front = { x: 38, y: 4.3 }; }
    if (weapon.id === 'lmg') { rear = { x: 7, y: 5.7 }; front = { x: 35, y: 6 }; }
    if (weapon.id === 'launcher') { rear = { x: 2, y: 6 }; front = { x: 33, y: 6 }; }
    if (weapon.id === 'shotgun') { rear = { x: 6, y: 5 }; front = { x: 35, y: 5 }; }
    if (weapon.id === 'melee') { rear = { x: 8, y: 2 }; front = { x: 25, y: 1 }; }

    if (state.reloading) {
      if (weapon.reloadStyle === 'shell') front = { x: 15 + Math.sin(reload * Math.PI * 2) * 5, y: 12 };
      else if (weapon.id === 'launcher') front = { x: -7, y: 12 + Math.sin(Math.PI * reload) * 9 };
      else front = { x: 10, y: 9 + Math.sin(Math.PI * reload) * 13 };
    }

    const rearShoulder = { x: -4 - recoil * 1.2, y: -8.7 };
    const frontShoulder = { x: -2 - recoil * 0.7, y: 8.7 };
    this.arm(ctx, rearShoulder, { x: 1, y: -10 }, rear, 7, palette.uniform, palette.uniformDark);
    this.arm(ctx, frontShoulder, { x: 9, y: 11 }, front, 7, palette.uniformMid, palette.uniformDark);
  }

  arm(ctx, shoulder, elbow, hand, width, sleeve, cuff) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = width + 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(shoulder.x, shoulder.y);
    ctx.lineTo(elbow.x, elbow.y);
    ctx.stroke();
    ctx.strokeStyle = sleeve;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(shoulder.x, shoulder.y);
    ctx.lineTo(elbow.x, elbow.y);
    ctx.stroke();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(elbow.x, elbow.y);
    ctx.lineTo(hand.x, hand.y);
    ctx.stroke();
    ctx.strokeStyle = cuff;
    ctx.lineWidth = width - 2;
    ctx.stroke();
    ctx.fillStyle = SKIN;
    ctx.strokeStyle = SKIN_DARK;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(hand.x, hand.y, 3.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = BLACK_POLYMER;
    ctx.beginPath();
    ctx.roundRect(hand.x - 2.6, hand.y - 2.3, 5.2, 4.6, 1.5);
    ctx.fill();
  }

  gunOutline(ctx, width = 1.8) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  drawAR(ctx, state = {}, reload = 0) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.1;
    ctx.beginPath();
    ctx.moveTo(-24, -6.4); ctx.lineTo(-10, -4.5); ctx.lineTo(-2, -2.5);
    ctx.moveTo(-24, 6.4); ctx.lineTo(-10, 4.5); ctx.lineTo(-2, 2.5);
    ctx.stroke();
    roundedPanel(ctx, -27, -7.8, 6, 15.6, 2.5, '#243b45', OUTLINE, 1.6);
    roundedPanel(ctx, -14, -5.2, 17, 10.4, 3.5, BROWN_POLYMER, OUTLINE, 1.5);
    roundedPanel(ctx, -1, -7, 30, 14, 3.2, metalGradient(ctx, -1, -7, 30, 14), OUTLINE, 1.8);
    ctx.fillStyle = '#172b34';
    ctx.beginPath(); ctx.roundRect(7, -4.6, 13, 5.1, 1.2); ctx.fill();
    ctx.fillStyle = EDGE_METAL; ctx.fillRect(8, -3.8, 8, 0.9);
    fastener(ctx, 2.5, 3.5); fastener(ctx, 24, 3.5);
    triggerGuard(ctx, 7, 7.2, 11, 7.5);
    grip(ctx, 4, 5.2, 8, 14, 0.15);
    this.drawMagazine(ctx, 15, 5.1, reload, 18, '#182c35', Boolean(state.reloading), { curve: 0.12, width: 9 });
    rail(ctx, 2, -9.2, 24, 7);
    roundedPanel(ctx, 9, -13.2, 9, 4.8, 1.6, '#263d46', OUTLINE, 1.1);
    ctx.fillStyle = SIGHT; ctx.fillRect(12.5, -13.8, 2.1, 1.5);
    roundedPanel(ctx, 28, -5.3, 21, 10.6, 2.4, '#425e68', OUTLINE, 1.55);
    ventSlots(ctx, 32, -2, 3, 5.3, 4);
    ctx.strokeStyle = 'rgba(186,211,218,.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(31, -3.9); ctx.lineTo(46, -3.9); ctx.stroke();
    ctx.fillStyle = DEEP_METAL; ctx.fillRect(48, -2.2, 14, 4.4);
    ctx.fillStyle = '#09171d'; ctx.fillRect(61, -1.7, 5, 3.4);
    ctx.fillStyle = LIGHT_METAL; ctx.fillRect(63, -0.5, 3, 1);
    this.drawCasing(ctx, 18, -7, state, 0.9);
  }

  drawSMG(ctx, state = {}, reload = 0) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-19, -5.5); ctx.lineTo(-5, -3.3); ctx.lineTo(1, 0);
    ctx.moveTo(-19, 5.5); ctx.lineTo(-5, 3.3); ctx.lineTo(1, 0);
    ctx.stroke();
    roundedPanel(ctx, -22, -7, 5, 14, 2, '#2d4650', OUTLINE, 1.4);
    roundedPanel(ctx, -5, -6.8, 32, 13.6, 4, metalGradient(ctx, -5, -6.8, 32, 13.6, '#67818b', '#20353f'), OUTLINE, 1.75);
    ctx.fillStyle = '#13262f';
    ctx.beginPath(); ctx.roundRect(3, -4.5, 11, 4.7, 1.1); ctx.fill();
    ctx.fillStyle = '#b5c3c8'; ctx.fillRect(4, -3.6, 6, 0.8);
    rail(ctx, 0, -9, 21, 6);
    roundedPanel(ctx, 7.5, -12, 7, 3.7, 1.3, BLACK_POLYMER, OUTLINE, 1);
    ctx.fillStyle = SIGHT; ctx.fillRect(10, -12.6, 2, 1.2);
    triggerGuard(ctx, 4, 7, 9, 7);
    grip(ctx, 2, 5.4, 7.5, 13, 0.1);
    this.drawMagazine(ctx, 14, 5.5, reload, 20, '#142832', Boolean(state.reloading), { curve: 0.04, width: 8 });
    roundedPanel(ctx, 27, -4.9, 15, 9.8, 2.5, '#506d77', OUTLINE, 1.45);
    ventSlots(ctx, 30.5, -1.8, 2, 5, 3.6);
    ctx.fillStyle = '#10232b'; ctx.fillRect(41, -2, 8, 4);
    ctx.fillStyle = '#07171d'; ctx.fillRect(48, -1.4, 4, 2.8);
    fastener(ctx, 23, 3.8, 1.05);
    this.drawCasing(ctx, 18, -7, state, 0.75);
  }

  drawSniper(ctx, state = {}, reload = 0) {
    const boltTravel = clamp(state.fireKick) * 5;
    roundedPanel(ctx, -25, -7.5, 8, 15, 2.5, '#263d46', OUTLINE, 1.7);
    ctx.fillStyle = BROWN_POLYMER;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(-18, -6.2); ctx.lineTo(-3, -5.2); ctx.lineTo(5, -2.5); ctx.lineTo(5, 4.5);
    ctx.lineTo(-3, 6.2); ctx.lineTo(-18, 5.4); ctx.closePath(); ctx.fill(); ctx.stroke();
    roundedPanel(ctx, -15, -8.7, 14, 4.1, 1.5, '#4b3b31', OUTLINE, 1.2);
    roundedPanel(ctx, 0, -6.4, 33, 12.8, 3, metalGradient(ctx, 0, -6.4, 33, 12.8, '#7b9098', '#253b44'), OUTLINE, 1.8);
    ctx.fillStyle = '#162a33';
    ctx.beginPath(); ctx.roundRect(8, -4.5, 14, 4.7, 1.2); ctx.fill();
    fastener(ctx, 4, 3.7); fastener(ctx, 28, 3.7);
    this.drawMagazine(ctx, 13, 5.2, reload, 14, '#172b34', Boolean(state.reloading), { curve: 0, width: 9 });
    triggerGuard(ctx, 4.5, 7.1, 11, 7.3);
    grip(ctx, 1, 5, 8.3, 14, 0.13, BROWN_POLYMER);
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(7, -7); ctx.lineTo(7, -10); ctx.moveTo(27, -7); ctx.lineTo(27, -10); ctx.stroke();
    roundedPanel(ctx, 3, -13.2, 31, 7.2, 3.4, '#142831', OUTLINE, 1.5);
    ctx.fillStyle = '#29434e';
    ctx.beginPath(); ctx.ellipse(4, -9.6, 3.4, 4.7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(34, -9.6, 4.1, 5.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = SIGHT; ctx.globalAlpha = 0.72;
    ctx.beginPath(); ctx.ellipse(34.7, -9.6, 2.2, 3.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    roundedPanel(ctx, 17, -16.5, 5, 4, 1.2, '#233a44', OUTLINE, 1);
    ctx.fillStyle = EDGE_METAL; ctx.fillRect(25 - boltTravel, 5.6, 9, 1.8);
    ctx.beginPath(); ctx.arc(34 - boltTravel, 6.5, 2.2, 0, Math.PI * 2); ctx.fill();
    roundedPanel(ctx, 32, -4.6, 27, 9.2, 2.2, '#536d76', OUTLINE, 1.5);
    ventSlots(ctx, 36, -1.7, 4, 4.7, 3.4);
    ctx.fillStyle = DEEP_METAL; ctx.fillRect(58, -2, 19, 4);
    ctx.fillStyle = '#081820'; ctx.fillRect(76, -2.6, 8, 5.2);
    ctx.fillStyle = LIGHT_METAL;
    for (const x of [77, 80.5]) ctx.fillRect(x, -3.5, 1.2, 7);
    this.drawCasing(ctx, 24, -7.5, state, 1.05);
  }

  drawShotgun(ctx, state = {}, reload = 0) {
    const pumpSlide = Math.max(0, Math.min(6, clamp(state.fireKick) * 7));
    ctx.fillStyle = WOOD;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-24, -6.5); ctx.lineTo(-8, -5.2); ctx.lineTo(2, -3.4); ctx.lineTo(2, 3.4);
    ctx.lineTo(-8, 5.2); ctx.lineTo(-24, 8); ctx.lineTo(-29, 4.4); ctx.lineTo(-29, -4.4);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = WOOD_LIGHT; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-21, -4); ctx.lineTo(-4, -2.5); ctx.stroke();
    roundedPanel(ctx, -2, -6.4, 30, 12.8, 3, metalGradient(ctx, -2, -6.4, 30, 12.8, '#697e86', '#213841'), OUTLINE, 1.8);
    ctx.fillStyle = '#152831'; ctx.beginPath(); ctx.roundRect(8, -4.4, 11, 4.6, 1.3); ctx.fill();
    ctx.fillStyle = EDGE_METAL; ctx.fillRect(2, -1, 8, 2);
    triggerGuard(ctx, 7, 6.5, 12, 7.5);
    grip(ctx, 3, 5.4, 8.5, 13, 0.08, BROWN_POLYMER);
    const pumpX = 28 - pumpSlide;
    roundedPanel(ctx, pumpX, -6.1, 19, 12.2, 3, WOOD_LIGHT, '#51361f', 1.4);
    ctx.strokeStyle = 'rgba(53,32,19,.72)'; ctx.lineWidth = 1;
    for (let x = pumpX + 4; x < pumpX + 18; x += 4) {
      ctx.beginPath(); ctx.moveTo(x, -4.5); ctx.lineTo(x, 4.5); ctx.stroke();
    }
    ctx.fillStyle = DEEP_METAL; ctx.fillRect(44, -3.5, 23, 3.5);
    ctx.fillStyle = MID_METAL; ctx.fillRect(44, 1.1, 20, 3.1);
    ctx.fillStyle = '#081820'; ctx.fillRect(66, -3.1, 5, 2.8);
    ctx.fillStyle = SIGHT; ctx.fillRect(63.5, -4.5, 1.6, 1.6);
    this.drawShotgunShell(ctx, state, reload);
  }

  drawLMG(ctx, state = {}, reload = 0) {
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-25, -7); ctx.lineTo(-8, -4.8); ctx.lineTo(0, -2.5);
    ctx.moveTo(-25, 7); ctx.lineTo(-8, 4.8); ctx.lineTo(0, 2.5);
    ctx.stroke();
    roundedPanel(ctx, -28, -8, 6, 16, 2, '#2c444e', OUTLINE, 1.6);
    roundedPanel(ctx, -10, -7.8, 42, 15.6, 3.2, metalGradient(ctx, -10, -7.8, 42, 15.6, '#708890', '#253a43'), OUTLINE, 2);
    ctx.fillStyle = '#182b34'; ctx.beginPath(); ctx.roundRect(-1, -5.2, 24, 6, 1.6); ctx.fill();
    ctx.strokeStyle = '#8299a1'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(1, -4.2); ctx.lineTo(20, -4.2); ctx.stroke();
    fastener(ctx, -5, 4.7); fastener(ctx, 27, 4.7);
    rail(ctx, -3, -10, 28, 8);
    roundedPanel(ctx, 5, -13.2, 9, 4.3, 1.4, '#263e47', OUTLINE, 1.1);
    ctx.fillStyle = SIGHT; ctx.fillRect(8.5, -13.7, 2, 1.2);
    triggerGuard(ctx, -0.5, 8, 11, 8);
    grip(ctx, -4, 6.3, 9, 15, 0.1);
    const reloadProgress = smooth(reload);
    const boxDrop = state.reloading ? Math.sin(Math.PI * reloadProgress) * 22 : 0;
    ctx.save(); ctx.translate(8, 7 + boxDrop); ctx.rotate(state.reloading ? reloadProgress * 0.18 : 0);
    roundedPanel(ctx, 0, 0, 23, 18, 3, '#243a44', OUTLINE, 1.6);
    ctx.fillStyle = '#314d57'; ctx.fillRect(3, 3, 17, 3);
    ctx.strokeStyle = 'rgba(178,199,206,.26)'; ctx.lineWidth = 1;
    for (let y = 8; y < 16; y += 3) { ctx.beginPath(); ctx.moveTo(3, y); ctx.lineTo(20, y); ctx.stroke(); }
    ctx.restore();
    if (!state.reloading || reload < 0.42) {
      ctx.strokeStyle = BRASS; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(23, 8); ctx.quadraticCurveTo(28, 10, 29, 4); ctx.stroke();
      for (let index = 0; index < 3; index += 1) fastener(ctx, 24.5 + index * 2.1, 8.2 - index * 0.9, 0.8);
    }
    roundedPanel(ctx, 31, -5.6, 24, 11.2, 2.2, '#526b74', OUTLINE, 1.55);
    ventSlots(ctx, 35, -2, 4, 4.5, 4);
    ctx.fillStyle = DEEP_METAL; ctx.fillRect(54, -2.6, 15, 5.2);
    ctx.fillStyle = '#081820'; ctx.fillRect(68, -2, 4, 4);
    ctx.strokeStyle = '#506973'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(58, 3); ctx.lineTo(63, 8); ctx.moveTo(66, 3); ctx.lineTo(63, 8); ctx.stroke();
    this.drawCasing(ctx, 23, -8, state, 1);
  }

  drawPistol(ctx, state = {}, reload = 0) {
    const slideKick = clamp(state.fireKick) * 4.5;
    roundedPanel(ctx, -7 - slideKick, -6.5, 33, 11.5, 2.4, metalGradient(ctx, -7, -6.5, 33, 11.5, '#71868e', '#243a43'), OUTLINE, 1.7);
    ctx.fillStyle = '#162932'; ctx.beginPath(); ctx.roundRect(4 - slideKick, -4.8, 10, 4.2, 1); ctx.fill();
    ctx.fillStyle = '#9eacb1'; ctx.fillRect(5 - slideKick, -4, 6, 0.8);
    ctx.fillStyle = BLACK_POLYMER;
    for (let x = 17 - slideKick; x < 24 - slideKick; x += 2.6) ctx.fillRect(x, -5.2, 1.1, 8.3);
    ctx.fillStyle = '#0a1920'; ctx.fillRect(25 - slideKick, -2.1, 11 + slideKick, 4.2);
    ctx.fillStyle = SIGHT; ctx.fillRect(20 - slideKick, -8, 1.7, 1.8);
    ctx.fillStyle = '#a5b5ba'; ctx.fillRect(-2 - slideKick, -7.4, 2, 1.4);
    triggerGuard(ctx, 4, 5.3, 10, 8);
    grip(ctx, 4.5, 4, 9, 18, 0.16, '#1b3039');
    this.drawMagazine(ctx, 6.5, 5.2, reload, 16, '#10242d', Boolean(state.reloading), { curve: 0, width: 7.2, angle: 0.15 });
    fastener(ctx, 0, 1.5, 0.95);
    this.drawCasing(ctx, 11, -7, state, 0.72);
  }

  drawLauncher(ctx, state = {}, reload = 0) {
    ctx.fillStyle = '#172b31'; ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-24, -9); ctx.lineTo(-14, -7); ctx.lineTo(-8, -5); ctx.lineTo(-8, 5);
    ctx.lineTo(-14, 7); ctx.lineTo(-24, 9); ctx.closePath(); ctx.fill(); ctx.stroke();
    roundedPanel(ctx, -14, -8.7, 55, 17.4, 7, metalGradient(ctx, -14, -8.7, 55, 17.4, '#667c74', '#263b3c'), OUTLINE, 2);
    ctx.fillStyle = '#73887b'; ctx.fillRect(-6, -7.1, 7, 14.2);
    ctx.fillStyle = '#203235'; ctx.fillRect(2, -6.8, 3, 13.6);
    roundedPanel(ctx, 12, -10.2, 17, 20.4, 4.3, '#5b7169', OUTLINE, 1.55);
    ctx.strokeStyle = 'rgba(192,211,202,.32)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(15, -7.5); ctx.lineTo(26, -7.5); ctx.moveTo(15, 7.5); ctx.lineTo(26, 7.5); ctx.stroke();
    ctx.fillStyle = '#13262a'; ctx.beginPath(); ctx.ellipse(41, 0, 7, 7.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#07161a'; ctx.beginPath(); ctx.ellipse(42, 0, 4.2, 5, 0, 0, Math.PI * 2); ctx.fill();
    grip(ctx, -3, 6.7, 10, 17, 0.04, '#304a4b');
    triggerGuard(ctx, 5, 8.3, 11, 8);
    roundedPanel(ctx, 0, -15, 16, 5.2, 1.8, '#1b3034', OUTLINE, 1.2);
    ctx.fillStyle = SIGHT; ctx.beginPath(); ctx.arc(11, -12.4, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5f7772'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(2, -12); ctx.moveTo(14, -9); ctx.lineTo(13, -12); ctx.stroke();
    if (state.reloading) {
      const p = smooth(reload);
      const rocketX = -31 + p * 29;
      ctx.save(); ctx.translate(rocketX, 0); ctx.rotate((1 - p) * -0.1);
      ctx.fillStyle = BRASS; ctx.strokeStyle = '#6e4e25'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.roundRect(0, -4.2, 22, 8.4, 4.2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#934b39'; ctx.beginPath(); ctx.moveTo(1, -4.2); ctx.lineTo(-7, 0); ctx.lineTo(1, 4.2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d8c07a'; ctx.beginPath(); ctx.moveTo(22, -3); ctx.lineTo(27, 0); ctx.lineTo(22, 3); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  drawMelee(ctx, state = {}) {
    const swing = clamp(state.meleeSwing);
    roundedPanel(ctx, -12, -5, 31, 10, 4, '#253b44', OUTLINE, 1.8);
    ctx.fillStyle = '#111f26';
    for (let x = -7; x < 14; x += 5) ctx.fillRect(x, -4, 2, 8);
    ctx.fillStyle = '#758b94'; ctx.fillRect(17, -7, 5, 14);
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.5; ctx.strokeRect(17.5, -6.5, 4, 13);
    ctx.fillStyle = metalGradient(ctx, 20, -6, 31, 12, '#d1e0e4', '#607984');
    ctx.strokeStyle = '#405862'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(21, -5.5); ctx.lineTo(43, -3.2); ctx.lineTo(51, 0);
    ctx.lineTo(43, 3.2); ctx.lineTo(21, 5.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e5f3f5';
    ctx.beginPath(); ctx.moveTo(24, -1); ctx.lineTo(46, -0.5); ctx.lineTo(49, 0); ctx.lineTo(46, 0.5); ctx.lineTo(24, 1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b444e';
    ctx.beginPath(); ctx.moveTo(34, -3.7); ctx.lineTo(40, -2.7); ctx.lineTo(37, 0); ctx.lineTo(31, -0.8); ctx.closePath(); ctx.fill();
    if (swing > 0.05) {
      ctx.globalAlpha = swing * 0.34;
      ctx.strokeStyle = '#bfeefa'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(4, 0, 52, -0.45, 0.45); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  drawMagazine(ctx, x, y, reload, length, color, active = false, options = {}) {
    const progress = clamp(reload);
    const width = Number(options.width) || 9;
    const curve = Number(options.curve) || 0;
    const baseAngle = Number.isFinite(options.angle) ? Number(options.angle) : 0.2;
    let drop = 0;
    let angle = baseAngle;
    let alpha = 1;
    if (active) {
      if (progress < 0.48) {
        const release = smooth(progress / 0.48);
        drop = release * 22;
        angle += release * 0.36;
        alpha = 1 - Math.max(0, release - 0.72) / 0.28;
      } else {
        const insert = smooth((progress - 0.48) / 0.52);
        drop = (1 - insert) * 20;
        angle += (1 - insert) * -0.3;
      }
    }
    ctx.save();
    ctx.globalAlpha *= clamp(alpha);
    ctx.translate(x, y + drop);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-width / 2, 0);
    ctx.lineTo(width / 2, 0);
    ctx.lineTo(width / 2 + curve * length, length - 2);
    ctx.quadraticCurveTo(curve * length, length + 1.5, -width / 2 + curve * length * 0.4, length - 1);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#667d86'; ctx.fillRect(-width / 2 + 1, 1.3, width - 2, 1.5);
    ctx.strokeStyle = 'rgba(150,177,186,.28)'; ctx.lineWidth = 0.8;
    for (let py = 5; py < length - 2; py += 4) {
      ctx.beginPath(); ctx.moveTo(-width / 2 + 1.5, py); ctx.lineTo(width / 2 - 1.5, py); ctx.stroke();
    }
    ctx.restore();
  }

  drawShotgunShell(ctx, state, reload) {
    if (!state.reloading) return;
    const insert = Math.sin(clamp(reload) * Math.PI);
    const shellY = 11 + insert * 6;
    const shellX = 11 + Math.sin(clamp(reload) * Math.PI * 2) * 2;
    ctx.save(); ctx.translate(shellX, shellY); ctx.rotate(-0.14 + clamp(reload) * 0.2);
    roundedPanel(ctx, 0, 0, 11, 4.8, 2.2, SHELL_RED, '#5e231f', 1);
    ctx.fillStyle = BRASS; ctx.fillRect(8.7, 0.4, 2.2, 4);
    ctx.restore();
  }

  drawCasing(ctx, x, y, state, scale = 1) {
    if (!state.firing) return;
    const kick = clamp(state.fireKick);
    ctx.save(); ctx.translate(x - kick * 4, y - (1 - kick) * 5); ctx.rotate(-0.55 - kick * 0.7);
    ctx.fillStyle = BRASS; ctx.strokeStyle = '#705523'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.roundRect(-2.8 * scale, -1.05 * scale, 5.6 * scale, 2.1 * scale, 0.8 * scale); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  drawMuzzleFlash(player, manager) {
    if (manager.fireVisualTimer <= 0) return;
    const weapon = manager.currentWeapon();
    if (!weapon || weapon.kind === 'melee') return;
    const ctx = this.ctx;
    const angle = player.visualAimAngle;
    const muzzle = manager.muzzleWorldPosition();
    const timerAlpha = Math.min(1, manager.fireVisualTimer / 0.045);
    const dimensions = {
      'assault-rifle': [18, 5.2], smg: [14, 4.8], sniper: [24, 4.2], shotgun: [25, 9],
      lmg: [20, 6], pistol: [14, 4.5], launcher: [13, 7]
    }[weapon.id] || [16, 5];
    const [length, width] = dimensions;
    ctx.save(); ctx.translate(muzzle.x, muzzle.y); ctx.rotate(angle);
    ctx.globalAlpha = timerAlpha;
    ctx.globalCompositeOperation = 'lighter';
    const bloom = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 1.8);
    bloom.addColorStop(0, 'rgba(255,248,205,.95)');
    bloom.addColorStop(0.35, 'rgba(255,185,65,.55)');
    bloom.addColorStop(1, 'rgba(255,123,31,0)');
    ctx.fillStyle = bloom;
    ctx.beginPath(); ctx.arc(0, 0, width * 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffc45a';
    ctx.beginPath();
    ctx.moveTo(-2, 0); ctx.lineTo(length * 0.42, -width * 0.42); ctx.lineTo(length * 0.62, -width);
    ctx.lineTo(length * 0.76, -width * 0.25); ctx.lineTo(length, 0); ctx.lineTo(length * 0.68, width * 0.28);
    ctx.lineTo(length * 0.48, width); ctx.lineTo(length * 0.35, width * 0.32); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff7d7';
    ctx.beginPath(); ctx.moveTo(-1, 0); ctx.lineTo(length * 0.65, -width * 0.2); ctx.lineTo(length * 0.84, 0); ctx.lineTo(length * 0.6, width * 0.2); ctx.closePath(); ctx.fill();
    if (weapon.id === 'shotgun') {
      ctx.strokeStyle = 'rgba(255,206,105,.78)'; ctx.lineWidth = 1.4;
      for (const offset of [-0.26, 0.26]) {
        ctx.beginPath(); ctx.moveTo(3, 0); ctx.lineTo(length * 0.82, width * offset); ctx.stroke();
      }
    }
    ctx.restore();
  }
}
