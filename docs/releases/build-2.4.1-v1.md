# Skirmish Arena 2.4.1 — Build 1

## Combat Readability + Arsenal Balance

2.4.1 combines the player-authored weapon balance pass already committed to the canonical weapon table with focused combat-readability and identity improvements. The deterministic boot, Career system, 2.3.4 transparent HUD foundation, loadout flow and packaged-EXE smoke protections remain intact.

## Arsenal balance

### Assault Rifle
- Damage: 20
- Critical: 2% → 32
- Fire interval: 0.22s
- Magazine: 36
- Reload: 2.7s
- Full-damage range: 9.5 tiles
- Falloff damage: 11.5

### SMG
- Damage: 9
- Critical: 1.8% → 20
- Fire interval: 0.11s
- Magazine: 44
- Reload: 2.2s
- Full-damage range: 7 tiles
- Falloff damage: 7.5

### Sniper Rifle
- Damage: 148
- Critical: 35% → 200
- Fire interval: 1.3s
- Magazine: 6
- Reload: 3.2s
- Projectile speed: 40 tiles/sec

### Shotgun
- 16 damage × 8 pellets
- Fire interval: 0.8s
- 6-shell tube
- 1.0s per-shell reload
- Full-damage range: 3.5 tiles
- Maximum range: 4 tiles
- Falloff damage: 5 per pellet

### LMG
- Damage: 24
- Critical: 2.5% → 56
- Fire interval: 0.36s
- Magazine: 75
- Reload: 4.3s
- Full-damage range: 10 tiles
- Falloff damage: 10.5
- Moving spread: 9°

Pistol, Launcher and Melee retain their current canonical values.

## Low-ammo warning

- The final 10% of a magazine now activates a shared low-ammo state.
- A thin red bar appears beneath the local player and depletes with the remaining rounds.
- The bottom-right magazine count turns red from the same threshold.
- Single-round weapons do not show the warning until empty.
- The world indicator and HUD use one shared threshold helper so they cannot disagree.

## Team identity

- BLUE ROUNDS text is now blue and RED ROUNDS text is red in the match strip.
- Kill-feed attacker and victim names are color-coded by team.
- Bots receive gamer-style display names rather than BLUE 2 / RED 1 identifiers.
- The authored naming system supports 1,536 unique tag combinations.
- Per-match names propagate into the live scoreboard, Top 3 presentation and postgame results.

## Pump shotgun presentation

- The shared shotgun renderer now has a clearer pump-action silhouette.
- New model treatment includes a wood stock, steel receiver, ejection port, ribbed pump/fore-end, long barrel, magazine tube and front sight.
- The fore-end visibly shifts with recoil.
- Shell-loading presentation remains visible during reload.
- Because UI previews use the same gameplay WeaponRenderer, the model automatically appears consistently in-game, Loadouts and Weapon Info.

## Compatibility and release safety

- Dash remains independent of stamina (`DASH_STAMINA_COST = 0`).
- Career Level 1–1000 and progression persistence are unchanged.
- Match rules remain 3v3, 1:30 rounds, first to 12 kills, first to 5 round wins.
- Historical regression tests now protect the weapon roster/schema and their actual system responsibilities without blocking intentional future balance changes.
- Validation is centralized through `scripts/check-all.mjs`.
- Deterministic startup and packaged Windows EXE smoke testing remain release-blocking requirements.
