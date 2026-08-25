# Skirmish Arena 2.01.1 — Gameplay Weapon Models in UI

2.01.1 replaces the remaining simplified weapon preview artwork with the same Canvas2D weapon models used during live gameplay.

## Weapon Presentation
- Weapon Info now renders the real in-game Assault Rifle, SMG, Sniper Rifle, Shotgun, LMG, Pistol, Launcher and Melee models.
- The main Loadouts screen now uses the same gameplay weapon models in weapon cards and the selected-weapon preview.
- The between-round quick loadout switcher now shows the actual Primary and Secondary weapon models for each saved loadout.
- Removed the legacy SVG weapon-silhouette fallback so UI previews cannot silently fall back to separate fake drawings.
- Future visual changes to gameplay weapon models automatically carry into these UI previews because they share the same WeaponRenderer implementation.

## Scope
- Weapon damage, fire rates, magazines, reloads, spread, movement penalties and swap timings are unchanged.
- Player movement, dash, AI, map geometry, spawns and match rules are unchanged.
- This is a weapon-presentation consistency update only.
