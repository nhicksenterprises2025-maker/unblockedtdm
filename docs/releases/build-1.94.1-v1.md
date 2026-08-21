# Skirmish Arena 1.94.1 — Phase 2

Phase 2 is the front-end and loadout presentation update built directly on the working 1.9.3 release.

## Main menu
- PLAY is the full-width top action.
- LOADOUTS and WEAPON INFO share the middle tier.
- SETTINGS and QUIT share the bottom tier.
- The visible HOME button has been removed.
- Navigation tiles are substantially larger and scale to fill the available game window.
- The existing 1.9.3 delegated button controller remains in place so click behavior is not replaced by a second UI system.
- ESC from Settings or Weapon Info returns to the existing home presentation through the MainMenu controller.

## Loadouts
- Keeps the 1.9.2/1.9.3 saved-loadout system and three-default-slots / expand-to-25 behavior.
- Adds authored weapon model silhouettes to weapon cards and the selected-weapon preview.
- Adds visual Power, Rate, Range and Control bars derived from canonical weapon data.
- Adds a spread visualizer while continuing to show the exact numeric weapon statistics.

## Weapon Info
- Adds a large authored weapon model preview for all eight weapons.
- Adds visual stat bars and spread visualization alongside the exact canonical values.
- No weapon values were rebalanced.

## Settings
- Main settings presentation now identifies Gameplay and Display sections more clearly.
- Existing controls, bindings and persistence behavior remain unchanged.

## Preserved systems
No changes were made to weapon balance, movement constants, sprint values, dash values, AI tuning, Training Complex geometry, spawn rules, round rules, health values, damage rules, or the public launcher update architecture.
