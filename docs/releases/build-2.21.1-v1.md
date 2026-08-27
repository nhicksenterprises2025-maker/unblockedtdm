# Skirmish Arena 2.21.1

## Weapon Reference + Main Branding Repair

2.21.1 corrects the Weapon Info architecture and integrates the supplied metallic Skirmish Arena logo into the approved home-screen hero area.

### Weapon Info
- Weapon Info is now a true dedicated full-screen page and no longer appears beneath or inside the Home view.
- The old selectable weapon rail + single selected-weapon detail layout has been retired from the live interface.
- All eight live weapons are presented together in one continuous catalog:
  - Assault Rifle
  - SMG
  - Sniper Rifle
  - Shotgun
  - LMG
  - Pistol
  - Launcher
  - Melee
- Every weapon card uses the actual gameplay `WeaponRenderer` model pipeline rather than a separate drawing.
- Every card includes its role/class, description, gameplay stat bars, actual gameplay crosshair spread states, and exact canonical numerical data.
- The catalog is arranged as a readable two-column desktop reference and collapses to one column on narrower windows.
- Weapon Info owns one normal vertical page scrollbar when the complete detailed catalog exceeds the viewport.
- A direct **Back to Main Menu** control remains available at the top of the reference page.

### Home Screen
- Replaced the plain text `SKIRMISH ARENA //` hero wordmark with the metallic Skirmish Arena logo supplied for the game.
- The logo is packaged with the game as a transparent image asset and rendered directly in the existing hero position.
- Weapon Info content is hard-isolated from Home, Settings and Career so it cannot bleed into the main menu again.
- The approved Home layout, left navigation, match summary, loadout summary, AI summary and Career strip otherwise remain intact.

### Gameplay
- No weapon balance, movement, AI, map, spawn or match-rule changes are included in 2.21.1.
- The 2.2.1 Shotgun contract remains unchanged: full damage through 2.0 tiles, falloff through the hard 2.5-tile maximum, and no damage beyond 2.5 tiles.
- The 2.2.1 Map and Scoreboard rebinds remain unchanged.
