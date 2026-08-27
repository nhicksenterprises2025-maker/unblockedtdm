const common = {
  extraMagazines: 3,
  postReloadDelay: 0.3,
  stationarySpreadMultiplier: 0.85,
  adsSpreadMultiplier: 0.80,
  adsMovementMultiplier: 0.60,
  reloadMovementMultiplier: 0.50,
  swapMovementMultiplier: 0.85
};

export const WEAPONS = {
  assaultRifle: {
    ...common,
    id: 'assault-rifle', name: 'Assault Rifle', shortName: 'AR', slot: 'primary', kind: 'hitscan', fireMode: 'auto',
    damage: 20, critChance: 0.02, critDamage: 32, fireInterval: 0.30, magazineSize: 32, reloadTime: 2.5,
    fullDamageRangeTiles: 13.5, falloffDamage: 13, baseSpreadDegrees: 4, movingSpreadDegrees: 4.6,
    adsTime: 0.4, movementMultiplier: 0.80, swapTier: 2, swapTime: 0.8,
    render: { muzzleForward: 67, shoulderSide: 10.5, adsForwardShift: 4, adsSideShift: 2.0, kick: 3.2 }
  },
  smg: {
    ...common,
    id: 'smg', name: 'SMG', shortName: 'SMG', slot: 'primary', kind: 'hitscan', fireMode: 'auto',
    damage: 11, critChance: 0.018, critDamage: 19, fireInterval: 0.14, magazineSize: 40, reloadTime: 2.1,
    fullDamageRangeTiles: 10, falloffDamage: 7, baseSpreadDegrees: 4.5, movingSpreadDegrees: 5,
    adsTime: 0.25, movementMultiplier: 1, swapTier: 1, swapTime: 0.45,
    render: { muzzleForward: 53, shoulderSide: 9.5, adsForwardShift: 5, adsSideShift: 2.5, kick: 2.4 }
  },
  sniper: {
    ...common,
    id: 'sniper', name: 'Sniper Rifle', shortName: 'SNIPER', slot: 'primary', kind: 'projectile', projectileType: 'sniper', fireMode: 'semi',
    damage: 145, critChance: 0.35, critDamage: 200, fireInterval: 1.4, magazineSize: 4, reloadTime: 3.5,
    fullDamageRangeTiles: 25, falloffDamage: 112, baseSpreadDegrees: 2, movingSpreadDegrees: 8,
    adsTime: 0.8, movementMultiplier: 0.60, swapTier: 3, swapTime: 1.3, projectileSpeedTiles: 25,
    render: { muzzleForward: 88, shoulderSide: 9, adsForwardShift: 3, adsSideShift: 2.5, kick: 5.2 }
  },
  shotgun: {
    ...common,
    id: 'shotgun', name: 'Shotgun', shortName: 'SHOTGUN', slot: 'both', kind: 'shotgun', fireMode: 'semi',
    damage: 16, critChance: 0.007, critDamage: 21, fireInterval: 0.8, magazineSize: 6, reloadTime: 1.0, reloadStyle: 'shell',
    fullDamageRangeTiles: 2, maxRangeTiles: 2.5, falloffDamage: 5, baseSpreadDegrees: 6, movingSpreadDegrees: 7.5, pelletCount: 8,
    adsTime: 0.55, movementMultiplier: 0.80, swapTier: 3, swapTime: 1.3,
    render: { muzzleForward: 70, shoulderSide: 10.5, adsForwardShift: 3, adsSideShift: 2.2, kick: 5.5 }
  },
  lmg: {
    ...common,
    id: 'lmg', name: 'LMG', shortName: 'LMG', slot: 'primary', kind: 'hitscan', fireMode: 'auto',
    damage: 24, critChance: 0.025, critDamage: 51, fireInterval: 0.5, magazineSize: 75, reloadTime: 4.3,
    fullDamageRangeTiles: 16, falloffDamage: 13, baseSpreadDegrees: 5.5, movingSpreadDegrees: 10,
    adsTime: 0.6, movementMultiplier: 0.60, swapTier: 4, swapTime: 1.7,
    render: { muzzleForward: 75, shoulderSide: 12, adsForwardShift: 2.5, adsSideShift: 2.0, kick: 4.3 }
  },
  pistol: {
    ...common,
    id: 'pistol', name: 'Pistol', shortName: 'PISTOL', slot: 'secondary', kind: 'hitscan', fireMode: 'semi',
    damage: 15, critChance: 0.05, critDamage: 30, fireInterval: 0, magazineSize: 10, reloadTime: 1.7,
    fullDamageRangeTiles: 8, falloffDamage: 10, baseSpreadDegrees: 3, movingSpreadDegrees: 6,
    adsTime: 0.2, movementMultiplier: 1, swapTier: 1, swapTime: 0.45,
    render: { muzzleForward: 42, shoulderSide: 7.5, adsForwardShift: 5, adsSideShift: 2.5, kick: 3.0 }
  },
  launcher: {
    ...common,
    id: 'launcher', name: 'Launcher', shortName: 'LAUNCHER', slot: 'secondary', kind: 'projectile', projectileType: 'launcher', fireMode: 'semi',
    damage: 125, critChance: 0, critDamage: 125, fireInterval: 2.5, magazineSize: 1, reloadTime: 2.5,
    fullDamageRangeTiles: Infinity, falloffDamage: 125, baseSpreadDegrees: 0, movingSpreadDegrees: 0,
    adsTime: 0.7, movementMultiplier: 0.60, swapTier: 4, swapTime: 1.7, projectileSpeedTiles: 17.5, blastRadiusTiles: 2.5,
    render: { muzzleForward: 67, shoulderSide: 12.5, adsForwardShift: 2, adsSideShift: 1.8, kick: 3.5 }
  },
  melee: {
    id: 'melee', name: 'Melee', shortName: 'MELEE', slot: 'secondary', kind: 'melee', fireMode: 'semi',
    damage: 75, critChance: 0.10, critDamage: 150, fireInterval: 0.9, magazineSize: 0, extraMagazines: 0, reloadTime: 0,
    postReloadDelay: 0, fullDamageRangeTiles: 2, falloffDamage: 75, baseSpreadDegrees: 0, movingSpreadDegrees: 0,
    stationarySpreadMultiplier: 1, adsSpreadMultiplier: 1, adsTime: 0, canADS: false, adsMovementMultiplier: 1,
    movementMultiplier: 1.05, reloadMovementMultiplier: 1, swapMovementMultiplier: 0.85, swapTier: 1, swapTime: 0.45,
    render: { muzzleForward: 45, shoulderSide: 8, adsForwardShift: 0, adsSideShift: 0, kick: 0 }
  }
};

export const WEAPON_LIST = Object.values(WEAPONS);
export const PRIMARY_WEAPONS = WEAPON_LIST.filter((weapon) => weapon.slot === 'primary' || weapon.slot === 'both');
export const SECONDARY_WEAPONS = WEAPON_LIST.filter((weapon) => weapon.slot === 'secondary' || weapon.slot === 'both');

export const DEFAULT_LOADOUT = {
  primary: WEAPONS.assaultRifle,
  secondary: WEAPONS.pistol
};

export function canEquipInSlot(weapon, slot) {
  if (!weapon) return false;
  return weapon.slot === slot || weapon.slot === 'both';
}

export function formatWeaponStats(weapon) {
  const rows = [];
  if (weapon.kind === 'shotgun') rows.push(['Damage', `${weapon.damage} × ${weapon.pelletCount} pellets`]);
  else rows.push(['Damage', `${weapon.damage}`]);
  if (weapon.critChance > 0) rows.push(['Critical', `${(weapon.critChance * 100).toFixed(1)}% → ${weapon.critDamage}`]);
  else rows.push(['Critical', 'None']);
  rows.push(['Fire', weapon.fireMode === 'semi' ? (weapon.kind === 'melee' ? `${weapon.fireInterval.toFixed(1)}s swing` : weapon.fireInterval > 0 ? `${weapon.fireInterval.toFixed(2).replace(/0+$/,'').replace(/\.$/,'')}s / shot` : 'Semi-auto') : `${weapon.fireInterval.toFixed(2).replace(/0+$/,'').replace(/\.$/,'')}s / shot`]);
  if (weapon.magazineSize > 0) rows.push(['Magazine', `${weapon.magazineSize} + ${weapon.magazineSize * weapon.extraMagazines} reserve`]);
  if (weapon.reloadStyle === 'shell') rows.push(['Reload', `${weapon.reloadTime.toFixed(1)}s per shell`]);
  else if (weapon.reloadTime > 0) rows.push(['Reload', `${weapon.reloadTime.toFixed(1)}s`]);
  if (weapon.kind === 'shotgun') rows.push(['Range', `${weapon.fullDamageRangeTiles} full → ${weapon.maxRangeTiles} max · ${weapon.falloffDamage} falloff`]);
  else if (weapon.kind !== 'launcher') rows.push(['Range', `${weapon.fullDamageRangeTiles} tiles${weapon.kind === 'melee' ? '' : ` → ${weapon.falloffDamage} falloff`}`]);
  if (weapon.kind === 'projectile') rows.push(['Projectile', `${weapon.projectileSpeedTiles} tiles/sec`]);
  if (weapon.blastRadiusTiles) rows.push(['Blast radius', `${weapon.blastRadiusTiles} tiles`]);
  if (weapon.baseSpreadDegrees > 0) rows.push(['Spread', `${weapon.baseSpreadDegrees}° base / ${weapon.movingSpreadDegrees}° moving`]);
  if (weapon.canADS !== false) rows.push(['ADS', `${weapon.adsTime.toFixed(2).replace(/0+$/,'').replace(/\.$/,'')}s`]);
  rows.push(['Movement', `${Math.round((weapon.movementMultiplier - 1) * 100)}%`]);
  rows.push(['Swap', `Tier ${weapon.swapTier} · ${weapon.swapTime}s`]);
  return rows;
}
