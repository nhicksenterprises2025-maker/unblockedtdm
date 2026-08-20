# Build 1.7 v1 Test Plan

## Automated release-gate tests

### Rebound controls
- Save a non-default movement binding and confirm Input resolves it during gameplay.
- Simulate a hidden UI element retaining focus and confirm the live gameplay key is still accepted.
- Confirm suspended/menu input clears transient keyboard and mouse state.
- Preserve reserved ESC/F1/F11 behavior.

### Bot accuracy
- Assert Beginner/Average/Sweat/Pro multipliers remain exactly 0.80/1.00/1.35/1.75.
- Assert the Build 1.7 AI-only aim-error scale is present.
- Assert extra moving-target aim error is present.
- Do not modify canonical weapon data for the accuracy change.

### Postgame data
- Apply real DamageSystem damage and verify applied amount is available to stat tracking.
- Verify canonical critical damage is recognized as a critical event.
- Verify kills/deaths/assists stat structure remains intact.
- Verify damage, criticals, current streak and best streak tracking.
- Verify match completion generates a final postgame snapshot.
- Verify round history is included.
- Verify postgame UI contains K/D/A, damage, crits, best streak, Rematch and Main Menu contracts.

### Launcher visual contract
- Verify LAUNCH GAME remains the dominant CTA.
- Verify UT logo and Training Complex art are referenced.
- Verify compact status strip exists.
- Verify PLAY / BUILDS / SETTINGS / DIAGNOSTICS navigation exists.
- Verify launch button has a LAUNCHING state.
- Reject decorative radial/linear gradient usage in the launcher stylesheet.
- Reject repeated 10px/14px/16px/999px launcher corner radii.

### Regression chain
- Build 1.41 A* navigation tests.
- Build 1.5 loadout persistence and between-round legality tests.
- Build 1.6 settings/keybind persistence and UI-input suspension tests.
- Full JavaScript syntax validation.

## Manual packaged-runtime checklist

### Controls
1. Change Move Up from W to I in Main Menu Settings.
2. Start a match without clicking the canvas first.
3. Verify I moves up immediately and W no longer acts as Move Up.
4. Repeat with Sprint, Dash, Reload, Primary and Secondary.
5. Pause, change one binding, resume, and verify the changed binding works without restarting.
6. Verify Fire/ADS mouse bindings do not activate when clicking launcher/game UI controls.

### Bot accuracy
1. Run encounters on Average and compare to Build 1.6.
2. Confirm bots miss more while targets strafe/sprint/dash.
3. Verify Pro remains more accurate/reactive than Sweat, Sweat > Average, Average > Beginner.
4. Confirm weapon damage and movement speed are unchanged.

### Postgame
1. Complete a first-to-five match.
2. Verify winner and round score.
3. Check all six player rows.
4. Verify local K/D/A, damage, K/D ratio, crits and best streak are plausible against observed play.
5. Verify round history entries.
6. Click REMATCH and confirm scores/stats reset.
7. Complete/exit another match and click MAIN MENU; verify the application returns to the real front end.

### Launcher
1. Install the Build 1.7 installer to update the launcher itself.
2. Verify the narrow navigation rail and edge-marker active state.
3. Verify no giant blue gradient or stacked rounded-card dashboard remains.
4. Verify the UT logo and subtle Training Complex artwork appear.
5. Verify LAUNCH GAME is visually dominant and changes to LAUNCHING while starting the game.
6. Verify Installed/Latest/Status/Files strip.
7. Verify progress is hidden when idle and appears during an update download.
8. Verify Build Archive, Settings and Diagnostics remain functional.
