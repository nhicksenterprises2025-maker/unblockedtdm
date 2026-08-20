# UnblockedTDM Build 1.13 — Version 2

## Weapon Framework / Input & Visual Polish

Build 1.13 Version 2 is a corrective and presentation-focused update to the first weapon build. It keeps the existing Assault Rifle balance and combat rules while fixing simultaneous ADS/fire input, correcting the rifle mount on the player body, and upgrading Training Complex from blockout-like rendering to a more finished competitive-map presentation.

### Fixed
- RMB ADS and LMB fire now work simultaneously. Mouse button state uses native mouse down/up events instead of Pointer Events, which did not reliably emit a second pointerdown when another mouse button was already held.
- ADS remains fully compatible with automatic Assault Rifle fire.
- Rifle muzzle/tracer origin now follows the visible shoulder-mounted rifle instead of the player centerline.
- Muzzle flash now uses the exact same shoulder-mounted muzzle position as shot feedback.

### Weapon presentation
- Assault Rifle moved off the character/head centerline and onto a proper shoulder-side mount.
- Stock, receiver, handguard, barrel, rail and magazine proportions refined.
- Visible trigger and support hands now grip the rifle.
- Support hand follows the magazine during reload animation.
- ADS pulls the rifle slightly inward toward the shoulder without crossing over the player's head.
- Fire kick and muzzle flash remain aligned with the rendered weapon.

### Training Complex visual pass
- Removed the strong checkerboard/blockout feel from ground tiles while keeping the 64px tile gameplay grid intact.
- Added deterministic surface variation so the environment remains consistent every launch.
- Grass now has distributed blade/tuft detail.
- Asphalt now includes aggregate specks and occasional cracks.
- Concrete now includes subtle wear and surface marks.
- Center-lane borders and lane paint have improved depth and readability.
- Spawn zones now use cleaner translucent fills and corner-bracket markings.
- Crates now have inset framing, cross bracing and hardware detail.
- Barriers now have hazard-style diagonal surface detailing and support feet.
- Steel cover now has panel seams and fastener details.
- Warehouses now include roof seams, skylight panels and roof vents.
- Structure shadows, highlights and bevels were improved to separate cover from the floor without changing collision geometry.
- Tall-cover fading and all existing map collision remain unchanged.

### Preserved
- Assault Rifle canonical stats and balance.
- 150 HP, regeneration, damage feedback, death, respawn and spawn protection.
- Naturalized player movement and animation.
- Sprint and stamina rules.
- Four-charge dash system and dash invulnerability.
- Hitscan, critical hits, falloff, ammo, reload, ADS and weapon movement penalties.
- Launcher, installer, updater, rollback, repair and Version Archive infrastructure.
