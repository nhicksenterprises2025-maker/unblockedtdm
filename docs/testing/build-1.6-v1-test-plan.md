# Build 1.6 v1 Runtime Test Plan

## Boot / main menu
1. Launch game and confirm the Main Menu opens before any match.
2. Verify PLAY, LOADOUTS, SETTINGS, WEAPON INFO, HOME and QUIT respond to clicks.
3. Open Weapon Info and select all eight weapons; numerical data must render for each.

## Loadout navigation
1. PLAY -> loadout screen -> Back to Main Menu.
2. PLAY -> loadout screen -> ESC -> Main Menu.
3. LOADOUTS -> modify/rename a slot -> Save & Back -> Main Menu.
4. Reopen LOADOUTS and verify the edited slot persisted.
5. PLAY using that slot and verify the exact Primary/Secondary are equipped.
6. Verify in-match loadout changes remain unavailable outside round break.

## Pause interaction regression
1. Start a match and press ESC.
2. Click MATCH and SETTINGS tabs repeatedly.
3. Move sensitivity slider.
4. Change AI difficulty.
5. Change minimap orientation.
6. Toggle Screen Shake and Damage Vignette.
7. Toggle Fullscreen.
8. Reset gameplay settings.
9. Return to Match tab.
10. Resume via button and ESC.
11. Confirm no fire/ADS/key state leaks into gameplay after resume.
12. Confirm F1 debug panel does not appear over pause.

## Key rebinding
1. Rebind movement, sprint, dash, reload, Primary, Secondary, Fire and ADS.
2. Verify each new input works in gameplay.
3. Bind one action to another action's key and verify the old action receives the displaced binding.
4. Attempt ESC, F1 and F11; they must remain reserved.
5. Restart game and confirm custom bindings persist.
6. Reset Keybinds and confirm canonical defaults return.
7. Verify arrow keys still provide movement fallback and mouse wheel still switches slots.

## Existing-system regression
- Run Build 1.41 spawn-to-spawn A* route test.
- Run Build 1.5 25-loadout persistence and legality test.
- Confirm weapon stat files are unchanged.
- Confirm match/dash/health constants are unchanged.
