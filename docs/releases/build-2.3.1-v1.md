# Skirmish Arena 2.3.1 — Build 1

## UI Identity + Arsenal Reference

2.3.1 is a controlled presentation and reference update built directly on the confirmed working Skirmish Arena 2.2.1 Build 2 runtime. The working Main Menu controller, Career system, save data, match flow and gameplay architecture are preserved. This release does not restore the broken 2.21.1 startup/UI stack.

### Home identity
- Replaces the large plain-text SKIRMISH ARENA hero heading with the supplied metallic Skirmish Arena production logo.
- Keeps the existing compact Skirmish Arena identity in the upper-left command rail.
- Removes the unnecessary `MATCH CLIENT` wording from the hero eyebrow; the hero now displays the current game build only.
- Improves home typography, information density and Career-strip readability without changing Career behavior.

### Main-menu command artwork
- PLAY now uses a lighter gray/silver metallic command surface and the existing silver Play icon at a stronger readable scale.
- LOADOUTS keeps the real gameplay WeaponRenderer models and presents the posed AR / Shotgun / Pistol artwork more prominently.
- WEAPON INFO uses a dedicated blue blueprint/manual gun sketch.
- SETTINGS keeps the authored silver gear and presents it at a stronger readable scale.
- QUIT remains unchanged.
- Existing click/navigation behavior remains owned by the known-good MainMenu controller; 2.3.1 does not add a second competing menu click handler.

### Weapon Info rebuilt correctly
- Weapon Info is now one dedicated full-screen reference page rather than the old selector + single-detail layout.
- All eight live weapons are visible in one continuous catalog:
  - Assault Rifle
  - SMG
  - Sniper Rifle
  - Shotgun
  - LMG
  - Pistol
  - Launcher
  - Melee
- Every card uses the actual in-game WeaponRenderer model pipeline.
- Every card includes exact canonical combat data, readable stat bars, handling context and the real gameplay crosshair renderer for Base / Moving / ADS spread.
- Weapon Info intentionally scrolls vertically because the full detailed arsenal exceeds one viewport.
- Inactive Weapon Info is hard-isolated so it cannot leak underneath Home, Career or Settings.
- Leaving Weapon Info explicitly clears stale 2.2.1 Weapon Info page-state classes.

### Readability and presentation
- Home information and Career summary are larger and easier to scan while still fitting the established full-screen layout.
- The one-page Loadouts interface remains one page; weapon labels/details and live weapon models receive small readability improvements rather than a layout rewrite.
- Tactical Scoreboard presentation is enlarged while preserving Kills, Deaths, Assists, K/D and Damage.
- Tactical Map presentation uses more available screen area while preserving its existing live-map behavior.
- Existing in-game weapon-model UI is retained and polished rather than replaced by placeholder silhouettes.

### Existing systems explicitly preserved
- Career progression remains Levels 1–1000 with the complete rank, XP, milestone and lifetime-stat systems.
- Tactical Map remains a proper rebindable control, default M.
- Scoreboard remains a proper rebindable control, default Tab.
- Fresh profiles still start with 3 created loadout slots and can expand to the 25-slot maximum.
- Shotgun remains full damage through 2.0 tiles, falls off through 2.5 tiles and deals zero damage beyond 2.5 tiles.
- Existing Tactical Map access, Top 3/MVP presentation, kill feed and scoreboard data remain intact.

### Gameplay contract
- No new player movement, sprint, dash, health, AI, map geometry, spawn or match-rule changes.
- No new weapon damage, critical chance, cadence, magazine, reload, ADS or movement-balance changes.
- The already-approved 2.2.1 Shotgun range contract is preserved exactly.
- Career progression remains non-pay-to-win / non-power progression and does not increase combat statistics.

### Release safety
- Adds a dedicated 2.3.1 regression gate covering the supplied logo, all-eight-weapon catalog, real weapon models, gameplay crosshair visualizers, menu page-state cleanup, Career preservation, rebindable Tactical Map/Scoreboard, 3-to-25 loadout contract, scoreboard columns and Shotgun range contract.
