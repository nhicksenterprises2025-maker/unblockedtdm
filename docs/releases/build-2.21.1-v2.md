# Skirmish Arena 2.21.1 — Build 2

## Packaged UI Startup Repair

Build 2 repairs a production-only startup regression found in 2.21.1 Build 1 where the packaged game could expose the legacy Build 1.6 shell instead of booting the modern Skirmish Arena front end.

### Fixed
- Added a dedicated `ui-boot.js` ES-module entrypoint for the complete modern UI stack.
- `index.html` now loads the modern UI bootstrap directly instead of depending only on the legacy debug loader's dynamic imports.
- The old debug import chain remains as a compatibility path, but it is no longer the sole route to the current UI.
- Added a release regression gate that fails if the packaged shell no longer references the modern UI bootstrap or if any required phase is missing from it.

### Preserved from 2.21.1
- Dedicated full-screen Weapon Info catalog with all eight weapons.
- Actual gameplay weapon models and gameplay crosshair-spread previews.
- Exact canonical weapon statistics.
- Supplied metallic Skirmish Arena home logo.
- Weapon Info isolation from the Home screen.

### Gameplay
- No balance or gameplay changes from 2.21.1 Build 1.
- Shotgun remains full damage through 2.0 tiles, falloff through 2.5 tiles, and no damage beyond 2.5 tiles.
- Map and Scoreboard rebinds remain unchanged.
