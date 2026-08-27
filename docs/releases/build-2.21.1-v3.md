# Skirmish Arena 2.21.1 — Build 3

## Production Packaging Hardening

Build 3 is the final production-hardening pass for the 2.21.1 release line. It preserves the complete Weapon Info catalog and packaged UI startup repair from Builds 1–2 while correcting Windows package identity and adding regression coverage for branded production artifacts.

### Windows Packaging
- Added authored Skirmish Arena Windows icon assets for both the game executable and launcher installer.
- Game and launcher Electron builders now explicitly use the Skirmish Arena icon instead of the default Electron icon.
- Added intentional Skirmish Arena package descriptions and author metadata for both applications.
- The release metadata sync now stamps the current `gameVersion` into the packaged game package so Windows application metadata follows the live release line instead of remaining at the original prototype package version.

### Release Regression Coverage
- 2.21.1 validation now verifies both Windows ICO assets exist and are valid ICO containers.
- Validation verifies both Electron builders reference the branded icons.
- Validation verifies the game and launcher package metadata remains branded and intentional.
- Validation verifies build synchronization continues to stamp the package version from `release-plan.json`.
- Existing deterministic modern-UI bootstrap checks remain mandatory.

### Preserved from 2.21.1 Builds 1–2
- Dedicated full-screen all-weapons Weapon Info catalog.
- Actual gameplay `WeaponRenderer` models for every weapon card.
- Actual gameplay crosshair spread states and exact canonical weapon statistics.
- Supplied metallic Skirmish Arena home logo.
- Hard isolation of Weapon Info from Home, Settings and Career.
- Direct `ui-boot.js` modern UI bootstrap for packaged Electron builds.

### Gameplay
- No weapon damage, critical chance, fire rate, magazine, reload, spread or movement changes.
- Shotgun remains full damage through 2.0 tiles, falloff through 2.5 tiles, and no damage beyond 2.5 tiles.
- No player movement, sprint, dash, health, AI, map, spawn or match-rule changes.
- Career progression and lifetime statistics are unchanged.
