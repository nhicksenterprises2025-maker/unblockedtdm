export function lowAmmoThresholdRounds(weapon) {
  const magazineSize = Math.max(0, Number(weapon?.magazineSize) || 0);
  if (magazineSize <= 1) return 0;
  return Math.max(1, Math.round(magazineSize * 0.10));
}

export function lowAmmoState(weapon, ammo) {
  const threshold = lowAmmoThresholdRounds(weapon);
  const magazine = Math.max(0, Number(ammo?.magazine) || 0);
  const eligible = Number(weapon?.magazineSize) > 0;
  const active = eligible && magazine <= threshold;
  return {
    active,
    threshold,
    magazine,
    progress: active && threshold > 0 ? Math.max(0, Math.min(1, magazine / threshold)) : 0
  };
}
