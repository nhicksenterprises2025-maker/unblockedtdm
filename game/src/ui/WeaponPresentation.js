function modelShape(id) {
  const shapes = {
    'assault-rifle': '<path d="M18 42h40l10-9h54l14 7h34v8h-36l-13 8H78l-9 14H55l5-20H18z"/><path class="accent" d="M93 33v-8h28v8M118 48l7 17h-17l-5-17"/>',
    smg: '<path d="M30 35h62l12 7h34v9h-37l-12 8H54l-9 12H31l8-20h-9z"/><path class="accent" d="M67 59v14h20l-4-14M53 35v-8h27v8"/>',
    sniper: '<path d="M10 40h68l12-7h76l14 7h27v7h-31l-13 7H88l-12 16H58l9-20H10z"/><path class="accent" d="M82 28h58v7H82zM105 54l8 17H95l-4-17"/>',
    shotgun: '<path d="M12 39h75l10-7h90v8h21v8h-23l-8 6H94L83 67H65l8-19H12z"/><path class="accent" d="M108 48h42M118 32v-6h39v6"/>',
    lmg: '<path d="M14 37h52l12-8h74l18 9h30v10h-32l-16 9H82l-12 15H51l8-21H14z"/><path class="accent" d="M94 57h36v19H91zM93 29v-7h39v7"/>',
    pistol: '<path d="M55 31h85l12 8v14H99l-8 24H70l7-28H55z"/><path class="accent" d="M76 53h31l-6 24H70zM65 31v-7h58v7"/>',
    launcher: '<path d="M18 30h161l17 10-17 10H18l-10-10z"/><path class="accent" d="M62 50l-9 23h21l11-23M38 27v26M165 27v26"/>',
    melee: '<path d="M27 56 155 20l34 6-27 17L42 72z"/><path class="accent" d="M38 56 17 67l9 13 25-16M151 21l10 21"/>'
  };
  return shapes[id] || shapes['assault-rifle'];
}

export function weaponModelSvg(weapon, className = '') {
  return `<svg class="phase2-weapon-svg ${className}" viewBox="0 0 220 88" role="img" aria-label="${weapon.name} model">${modelShape(weapon.id)}</svg>`;
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
