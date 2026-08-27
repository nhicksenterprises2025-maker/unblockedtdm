# Skirmish Arena 2.2.1

## UI Readability, Tactical Controls & Shotgun Range

2.2.1 focuses on making the front end easier to read and navigate while adding two missing tactical keybinds and tightening the Shotgun's intended close-range role.

### Weapon Info
- Weapon Info now opens as its own full-screen page instead of being constrained beside the main-menu command rail.
- Added a direct **Back to Main Menu** control.
- Preserved the actual in-game weapon model previews and actual gameplay crosshair spread visualizer.
- Increased weapon-list, stat, helper and detail text sizes.
- At normal 1080p layouts, the page is designed to show the important weapon data without forcing excessive page scrolling.

### Loadouts
- Preserved the existing approved Loadouts structure and one-page behavior.
- Increased weapon names, stat values, helper copy, slot tabs, saved-loadout controls and action buttons from the previous compressed scale.
- Increased weapon-card and weapon-preview sizes while continuing to use the actual gameplay WeaponRenderer models.
- Short displays reduce spacing/model height before reducing typography.

### Menu Artwork
- Play now uses an authored polished silver play emblem.
- Loadouts now uses a posed composition made from the actual in-game Assault Rifle, Shotgun and Pistol models.
- Weapon Info now uses the actual in-game Pistol model paired with an authored technical manual emblem.
- Settings now uses an authored polished silver gear emblem.
- Quit remains unchanged.

### Settings & Tactical Controls
- Added a fully rebindable **Tactical Map** control, default **M**.
- Added a fully rebindable **Scoreboard** control, default **TAB**.
- The live HUD now reads the saved bindings rather than hard-coding M/TAB.
- Tactical HUD key labels update automatically after a rebind.
- Keyboard and mouse bindings use the same Settings binding system.

### Shotgun Balance
- Shotgun full-damage range: **2.0 tiles**.
- Shotgun maximum damage range: **2.5 tiles**.
- From 2.0 to 2.5 tiles, non-critical pellet damage falls to the existing **5 damage per pellet** falloff value.
- Pellets cannot damage targets beyond 2.5 tiles.
- Damage, pellet count, fire rate, magazine, reload, spread, ADS, movement and swap values are otherwise unchanged.

### Readability
- Increased text scale on Weapon Info, Loadouts, Settings and the dedicated Career page.
- The approved 2.1.1 home/menu composition remains unchanged apart from the requested tab artwork.

### Gameplay
- No AR, SMG, Sniper, LMG, Pistol, Launcher or Melee balance values changed.
- No movement, AI, map geometry, spawn or match-rule values changed.
