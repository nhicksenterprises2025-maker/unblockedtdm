# UnblockedTDM Build 1.2 — Version 1

## Complete Weapon Roster / Loadout Select

Build 1.2 Version 1 turns the existing weapon framework into the complete first weapon roster and adds a mandatory pre-match loadout screen with exact numerical weapon stats. It also includes another player-model and weapon-pose polish pass based on live testing feedback.

### Complete weapon roster
- Assault Rifle preserved at its canonical Build 1.13 values.
- SMG: 11 damage, 1.8% crit, 19 crit damage, 0.14s fire interval, 40 rounds, 2.1s reload, 10-tile full range, 7 falloff, 4.5° base / 5° moving spread, 0.25s ADS, swap tier 1 and neutral weapon movement.
- Sniper Rifle: physical 25 tiles/sec projectile, 145 damage, 35% crit, 200 crit damage, 1.4s fire interval, 4 rounds, 3.5s reload, 25-tile full range, 112 falloff, 2° base / 8° moving spread, 0.8s ADS, swap tier 3 and -40% weapon movement.
- Shotgun: eight pellets per shot, 16 damage per pellet, one 0.7% critical roll for the whole blast, 21 crit damage per pellet, 0.8s fire interval, 6-shell tube, 1.0s per-shell reload, 6-tile full range, 5 falloff per pellet, 6° base / 7.5° moving spread, 0.55s ADS, swap tier 3 and -20% movement.
- LMG: 24 damage, 2.5% crit, 51 crit damage, 0.5s fire interval, 75 rounds, 4.3s reload, 16-tile full range, 13 falloff, 5.5° base / 10° moving spread, 0.6s ADS, swap tier 4 and -40% movement.
- Pistol: 15 damage, 5% crit, 30 crit damage, true click-driven semi-auto behavior, 10 rounds, 1.7s reload, 8-tile full range, 10 falloff, 3° base / 6° moving spread, 0.2s ADS, swap tier 1 and neutral movement.
- Launcher: physical 17.5 tiles/sec explosive projectile, 125 direct/splash damage, 1-round magazine, 2.5s fire interval, 2.5s reload, 2.5-tile blast radius, 0.7s ADS, swap tier 4 and -40% movement.
- Melee: 75 damage, 10% crit, 150 crit damage, 0.9s attack interval, 2-tile reach, no lunge, swap tier 1 and +5% movement.

### Weapon-specific systems
- Primary pool: Assault Rifle, SMG, Sniper Rifle, Shotgun and LMG.
- Secondary pool: Pistol, Shotgun, Launcher and Melee.
- Shotgun may occupy either slot but the exact same weapon cannot be equipped twice.
- 1 switches to primary and 2 switches to secondary using the canonical swap tiers.
- Magazine weapons preserve unused ammunition when reloading.
- Shotgun reloads one shell at a time and can interrupt the reload to fire shells already inserted.
- Physical sniper projectile stops on players or map collision and does not pierce.
- Launcher explosion has no splash falloff, walls block splash, owner takes full self-damage, teammates take zero damage and there is no knockback.
- Melee uses a forward two-tile strike with no lunge and remains usable while sprinting.
- Hitscan remains active for AR, SMG, Shotgun pellets, LMG and Pistol.

### Pre-match weapon selection
- New full-screen loadout screen appears before entering the Training Complex.
- Separate Primary and Secondary tabs show only legal weapons for each slot.
- Every weapon has an exact stat panel instead of vague bars.
- Each weapon has a SELECT button.
- Current primary and secondary selections remain visible at the top of the screen.
- START MATCH applies the chosen loadout and enters the live arena.
- Duplicate exact-weapon loadouts are rejected.

### Player and animation polish
- Player silhouette refined again with a more readable chest, vest, shoulders, neck, head, face direction, ears, hair, legs and boots.
- Armed players no longer use the old floating generic arm pose; weapon-specific arms connect shoulders, elbows and hands directly to the current weapon grips.
- Every weapon now has its own drawn silhouette and handling proportions.
- Every weapon has distinct equip/swap, fire and reload presentation.
- AR/SMG/Sniper/Shotgun/LMG/Pistol use weapon-specific magazine or shell motion.
- Launcher visibly loads a rocket.
- Melee has a dedicated swing animation.
- Weapon muzzle positions and muzzle flashes are aligned to the actual rendered barrels.

### Validation before publish
- All eight weapon data definitions and slot pools were verified.
- Behavior tests passed for AR ammo/damage, true semi-auto pistol configuration, shell-by-shell shotgun reload, physical sniper projectile spawning, launcher self-damage/friendly-fire behavior and two-tile melee strikes.
- 488 rendered weapon/player animation states were stress-tested across hip, ADS, fire, reload and switch transitions.
- A full visual pose sheet for all eight weapons was reviewed before the release branch was created.
