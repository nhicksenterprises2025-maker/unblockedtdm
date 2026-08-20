export const WEAPONS = {
  assaultRifle: {
    id: 'assault-rifle',
    name: 'Assault Rifle',
    shortName: 'AR',
    slot: 'primary',
    fireMode: 'auto',
    damage: 20,
    critChance: 0.02,
    critDamage: 32,
    fireInterval: 0.30,
    magazineSize: 32,
    extraMagazines: 3,
    reloadTime: 2.5,
    postReloadDelay: 0.3,
    fullDamageRangeTiles: 13.5,
    falloffDamage: 13,
    baseSpreadDegrees: 4,
    movingSpreadMultiplier: 1.15,
    stationarySpreadMultiplier: 0.85,
    adsSpreadMultiplier: 0.80,
    adsTime: 0.4,
    adsMovementMultiplier: 0.60,
    movementMultiplier: 0.80,
    reloadMovementMultiplier: 0.50,
    swapMovementMultiplier: 0.85,
    swapTier: 2,
    swapTime: 0.8,
    hitscan: true
  }
};

export const DEFAULT_LOADOUT = {
  primary: WEAPONS.assaultRifle,
  secondary: null
};
