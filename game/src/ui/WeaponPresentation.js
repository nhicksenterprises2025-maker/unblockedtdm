import { CombatFeedbackRenderer } from '../render/CombatFeedbackRenderer.js';
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

export function paintGameplayCrosshairPreview(canvas) {
  if (!(canvas instanceof HTMLCanvasElement)) return false;
  const spread = Number(canvas.dataset.gameCrosshairSpread || 0);
  const kind = String(canvas.dataset.gameCrosshairKind || 'hitscan');
  const ads = canvas.dataset.gameCrosshairAds === 'true';
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return false;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const renderer = new CombatFeedbackRenderer(ctx);
  renderer.drawCrosshair(
    { x: canvas.width / 2, y: canvas.height / 2 },
    {
      currentWeapon: () => ({ kind }),
      currentSpreadDegrees: () => spread,
      isFullyADS: () => ads
    }
  );
  canvas.dataset.crosshairHydrated = 'true';
  return true;
}

export function hydrateGameplayCrosshairCanvases(root = document) {
  const canvases = root instanceof HTMLCanvasElement
    ? [root]
    : [...root.querySelectorAll?.('canvas[data-game-crosshair-spread]') || []];
  for (const canvas of canvases) paintGameplayCrosshairPreview(canvas);
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
  const adsMultiplier = Number.isFinite(Number(weapon.adsSpreadMultiplier)) ? Number(weapon.adsSpreadMultiplier) : 1;
  const ads = base * adsMultiplier;
  const kind = String(weapon.kind || 'hitscan').replace(/[^a-z0-9-]/gi, '');
  const states = [
    ['BASE', base, false],
    ['MOVING', moving, false],
    ['ADS', ads, true]
  ];

  return `<div class="phase2-spread phase2012-spread">
    <div class="phase2012-spread-copy"><strong>IN-GAME CROSSHAIR SPREAD</strong><small>Same reticle renderer used during live gameplay.</small></div>
    <div class="phase2012-crosshair-states">${states.map(([label, spread, isAds]) => `<div class="phase2012-crosshair-state"><canvas width="140" height="70" data-game-crosshair-spread="${spread}" data-game-crosshair-kind="${kind}" data-game-crosshair-ads="${isAds}" role="img" aria-label="${label} crosshair at ${spread.toFixed(2)} degrees"></canvas><span>${label}</span><small>${spread.toFixed(2)}°</small></div>`).join('')}</div>
  </div>`;
}
