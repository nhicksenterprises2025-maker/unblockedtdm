# UnblockedTDM Build 1.13 — Version 1

## Weapon Framework / Assault Rifle

Build 1.13 Version 1 adds the permanent firearm architecture and the first fully implemented weapon: the Assault Rifle.

### Assault Rifle
- 20 normal damage.
- 2% critical-hit chance.
- 32 fixed critical damage.
- 0.30-second automatic fire interval.
- 32-round magazine plus 3 additional magazines (96 reserve rounds).
- 2.5-second reload.
- 0.3-second post-reload firing delay.
- Full damage through 13.5 tiles; 13 damage beyond that cutoff.
- 4-degree base spread.
- Moving spread +15%.
- Standing still tightens spread 15%.
- ADS tightens spread 20%.
- 0.4-second ADS transition.
- -20% movement while held.
- ADS applies the universal -40% movement modifier.
- Swap Tier 2 / 0.8 seconds.

### Weapon systems
- Primary/secondary loadout slots with independent per-slot ammo state.
- Automatic-fire cooldown and magazine/reserve accounting.
- Early reload preserves ammunition instead of discarding the partial magazine.
- Reload, dash, ADS, switching and firing state rules are connected to player movement.
- Reload can continue while sprinting and applies the -50% reload movement modifier.
- Dash cancels reload; firing and ADS cancel sprint; reload cancels ADS.
- Spawn protection ends when a real shot is fired.
- Hitscan raycasting is blocked by map collision geometry.
- Range cutoff selects full or falloff damage with no gradual falloff.
- Random fixed-damage critical hits; no headshot system.
- Dynamic four-part crosshair reflects current spread.
- Tracers, muzzle flash, impact effects, floating damage numbers and normal/critical hitmarkers.
- Dedicated drawn AR model with stock, receiver, rail/sight, magazine, handguard and barrel.
- AR-specific fire kick, reload magazine motion, ADS positioning and switch animation hooks.

### Combat verification target
- The red-side development player is a real Player/HealthState target, not a fake hitbox.
- It takes the exact weapon damage through the common DamageSystem, displays damage-only health bars, dies with the standard team-colored particle burst, and follows the standard 3-second respawn/1-second protection rules.

### Controls
- Left Mouse: fire.
- Right Mouse: ADS.
- R: reload.
- 1: primary slot.
- 2: secondary slot when one exists in later builds.
- F2/F3/F4: retained self-damage verification.
- G: friendly-fire rejection test.
- F6: round-reset verification.
