# Build 1.5 v1 Runtime Test Plan

## Persistent loadouts
1. Launch to pre-match loadout screen.
2. Confirm 25 slots are visible.
3. Edit Slot 01 Primary and Secondary, rename it, start the match, close the game, relaunch, and confirm the same slot/name/weapons restore.
4. Edit a second slot and verify switching between saved slots restores the correct weapon pair.
5. Verify selecting Shotgun in both slots simultaneously is rejected because identical copies are not allowed.
6. Verify legal Shotgun Primary + a different Secondary works.

## Between-round switching
1. Start a match with Slot 01.
2. During live combat confirm no saved-loadout selector is available.
3. Die and confirm respawn does not expose loadout changing.
4. Finish a round and confirm the 25-slot quick selector appears during the 10-second break.
5. Select another saved slot and verify the HUD updates.
6. Confirm the next round begins with the selected Primary/Secondary and full life ammo.
7. Confirm the quick selector disappears when countdown/live play begins.

## Pause / settings
1. Press ESC during a live round and confirm gameplay freezes.
2. Confirm MATCH tab shows round, kill score, and active loadout.
3. Open SETTINGS and change sensitivity; resume and verify aim response changes.
4. Change AI difficulty; resume and verify F1 diagnostics report the same mode.
5. Change minimap orientation and confirm the minimap updates.
6. Disable Screen Shake and fire/observe launcher explosions; verify explosion visuals remain while camera shake is suppressed.
7. Disable Damage Vignette, take damage, and verify the red edge vignette is suppressed while the directional damage indicator still appears.
8. Toggle fullscreen from Settings.
9. Restart and verify settings persist.
10. Use RESET GAMEPLAY SETTINGS and verify defaults restore.

## Regression
- Run the Build 1.41 A* spawn-pair path test.
- Verify all eight weapons still use canonical stats.
- Verify directional dash rules and dash charges are unchanged.
- Verify 1:30 / 12-kill / Sudden Death / first-to-5 match rules are unchanged.
- Verify F1 debug panel still works and remains synchronized with pause settings.
