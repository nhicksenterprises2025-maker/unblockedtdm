import { WeaponRenderer } from '../render/WeaponRenderer.js';

const PREVIEW_METHODS = Object.freeze({
  'assault-rifle': 'drawAR',
  smg: 'drawSMG',
  sniper: 'drawSniper',
  shotgun: 'drawShotgun',
  lmg: 'drawLMG',
  pistol: 'drawPistol',
  launcher: 'drawLauncher',
  melee: 'drawMelee'
});

export function weaponModelSvg(weapon, className = '') {
  const safeId = String(weapon?.id || 'assault-rifle').replace(/[^a-z0-9-]/gi, '');
  const safeName = String(weapon?.name || 'Weapon').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return `<canvas class="phase2-weapon-svg phase2011-weapon-canvas ${className}" width="660" height="220" data-game-weapon-model="${safeId}" role="img" aria-label="${safeName} in-game model"></canvas>`;
}

export function paintGameplayWeaponModel(canvas) {
  if (!(canvas instanceof HTMLCanvasElement)) return false;
  const weaponId = canvas.dataset.gameWeaponModel;
  const method = PREVIEW_METHODS[weaponId];
  if (!method) return false;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return false;

  const renderer = new WeaponRenderer(ctx);
  const state = { firing: false, reloading: false };
  const scale = Math.min(canvas.width / 142, canvas.height / 58);
  const centerX = weaponId === 'sniper' ? 33 : weaponId === 'melee' ? 21 : 25;
  const centerY = weaponId === 'lmg' ? 5 : weaponId === 'launcher' ? 5 : 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2 - centerX * scale, canvas.height / 2 - centerY * scale);
  ctx.scale(scale, scale);
  renderer[method](ctx, state, 0);
  ctx.restore();
  canvas.dataset.weaponHydrated = 'true';
  return true;
}

export function hydrateWeaponModelCanvases(root = document) {
  const canvases = root instanceof HTMLCanvasElement
    ? [root]
    : [...root.querySelectorAll?.('canvas[data-game-weapon-model]') || []];
  for (const canvas of canvases) paintGameplayWeaponModel(canvas);
  return canvases.length;
}

function clamp(value, min = 0, max = 1) { return Math.min(max, Math.max(min, value)); }

export function weaponBarData(weapon) {
  const burstDamage = weapon.kind === 'shotgun' ? weapon.damage * (weapon.pelletCount || 1) : weapon.damage;
  const rate = weapon.fireInterval > 0 ? 1 / weapon.fireInterval : 7;
  const range = Number.isFinite(weapon.fullDamageRangeTiles) ? weapon.fullDamageRangeTiles : 25;
  const spread = weapon.movingSpreadDegrees || weapon.baseSpreadDegrees || 0;
  return [
    ['POWER', Math.round(clamp(burstDamage / 160) * 100)],
    ['RATE', Math.round(clamp(rate / 8) * 100)],
    ['RANGE', Math.round(clamp(range / 25) * 100)],
    ['CONTROL', Math.round(clamp(1 - spread / 12) * 100)]
  ];
}

export function statBarsHtml(weapon) {
  return `<div class="phase2-stat-bars">${weaponBarData(weapon).map(([label, value]) => `<div class="phase2-stat-bar"><span>${label}</span><div class="phase2-stat-track"><i style="width:${value}%"></i></div></div>`).join('')}</div>`;
}

export function spreadVisualHtml(weapon) {
  const base = Number(weapon.baseSpreadDegrees || 0);
  const moving = Number(weapon.movingSpreadDegrees || 0);
  const angle = Math.min(28, moving * 2.4);
  return `<div class="phase2-spread"><div class="phase2-spread-visual" style="--spread-angle:${angle}deg"><i></i><i></i></div><div><strong>SPREAD VISUALIZER</strong><small>${base}° BASE · ${moving}° MOVING${weapon.adsSpreadMultiplier != null ? ` · ${Math.round(weapon.adsSpreadMultiplier * 100)}% ADS` : ''}</small></div></div>`;
}
