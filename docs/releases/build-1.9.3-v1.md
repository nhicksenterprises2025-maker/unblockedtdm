# Skirmish Arena 1.9.3 — Phase 1

Phase 1 begins the Skirmish Arena rebrand from the stable 1.9.2 codebase.

## Included
- Visible product identity changed to **Skirmish Arena**.
- New **SA** compact mark added for the game and launcher.
- New Skirmish Arena wordmark asset added.
- Main menu, HUD branding, pause branding, and loadout-client branding updated through the existing 1.9.2 front-end flow.
- Launcher visible identity updated to Skirmish Arena while preserving the existing launcher structure and update behavior.
- Game window title updated to Skirmish Arena.

## Front-end protection
- The 1.9.2 main-menu DOM and action order remain unchanged.
- Existing Play, Loadouts, Settings, Weapon Info, Home, and Quit wiring is preserved.
- No pointer-event overrides were added.
- No Phase 2, Phase 3, or Phase 4 runtime files are included.

## Gameplay
No weapon balance, movement values, dash rules, AI tuning, map geometry, spawn rules, health rules, match timing, or win conditions were changed.

## Compatibility
The internal executable names and public update path remain on the proven 1.9.2 launcher architecture for this patch so existing installations can update normally through the launcher.
