# UnblockedTDM Build 1.21 — Version 1

## Combat Presentation / Input Fixes

Build 1.21 Version 1 is a corrective and presentation-focused update to the complete weapon roster. It fixes the two loadout/switching problems reported in Build 1.2 and upgrades combat readability and impact without changing the canonical weapon balance.

### Loadout fixes
- Clicking a weapon card now equips that weapon immediately instead of only previewing it.
- The detailed weapon-stat panel and SELECT button remain available.
- The active PRIMARY / SECONDARY tab is more explicit.
- Current Primary and Secondary selections are always shown with full weapon names.
- Exact duplicate weapons across both slots remain blocked.
- START MATCH applies the exact displayed selection.

### Weapon switching fixes
- Primary can be selected with keyboard 1, Numpad 1, or mouse-wheel up.
- Secondary can be selected with keyboard 2, Numpad 2, or mouse-wheel down.
- In-match HUD and diagnostics now display those controls prominently.
- Existing canonical weapon swap times and swap movement penalties remain unchanged.
- Swap state now displays the destination slot in the HUD while the animation is running.

### Combat presentation
- Weapon classes now use differentiated tracer weight, lifetime and color treatment.
- Shotgun pellets have distinct short-lived pellet tracers and impact sparks.
- LMG impacts are heavier and produce more visible spark debris.
- Sniper projectiles use a brighter multi-layer high-speed trail and stronger impact burst.
- Launcher rockets now carry a visible smoke train.
- Launcher firing creates muzzle smoke and launcher explosions now have layered fire, flash, shock-ring, sparks and smoke.
- Launcher explosions apply subtle world-camera shake; critical hits and sniper impacts can apply much lighter shake.
- Melee attacks have a clearer double-layer swing arc.
- Damage numbers float upward with a short pop animation.
- Critical damage numbers and hitmarkers are larger and more visually distinct.
- Impact sparks and residual smoke are simulated as short-lived particles.

### Kill feedback framework
- Confirmed kills display ELIMINATED.
- Special multi-kill presentation begins at QUAD KILL and continues for higher chains.
- A dedicated 10 KILL STREAK announcement triggers at ten consecutive kills.
- The streak framework resets when the local player dies.

### Preserved
- All eight canonical weapon stat blocks.
- No friendly fire.
- Launcher full self-damage and wall-blocked splash.
- Physical sniper and launcher projectiles.
- Eight-pellet shotgun behavior and shell-by-shell reload.
- 150 HP, regeneration, death, respawn and spawn protection.
- Sprint, stamina, dash and dash invulnerability.
- Training Complex geometry and current collision.
- Launcher, installer, updater, rollback, repair and Version Archive infrastructure.

### Validation before publish
- Changed JavaScript files passed Node syntax validation locally.
- Input simulation passed for top-row 1/2, Numpad 1/2, mouse-wheel up Primary and mouse-wheel down Secondary.
- Loadout state simulation verified changing Primary, changing Secondary and deploying the exact selected pair.
- Combat-feedback render paths were exercised with hitscan, critical hit, sniper projectile, launcher projectile/explosion and melee-effect states using a mock Canvas context.
