# Build 1.8 v1 Test Plan

## Automated gate
Run `npm run check` and require all Build 1.41 through 1.8 regressions to pass.

## Menu visual pass
- Main Menu uses flat launcher palette and UT mark.
- No large decorative gradient backgrounds.
- Active navigation uses cyan edge marker, not pill containers.
- Settings, bindings, Weapon Info, Loadouts, Pause, round-break selector and Postgame share the same visual language.
- Training Complex artwork stays subtle and never reduces text readability.

## Flow pass
1. Launch to Main Menu.
2. Open Settings and Weapon Info; ESC returns HOME.
3. Open Loadouts in management mode; Back/ESC returns Main Menu.
4. PLAY -> select saved loadout -> START MATCH.
5. Pause -> Settings -> change a setting/bind -> resume and verify gameplay input still works.
6. Complete a round and select a different saved loadout during the 10-second break.
7. Complete a full match and verify one postgame screen appears with real K/D/A, damage, crits, best streak, duration and round history.
8. MAIN MENU returns cleanly with no match overlay left visible.
9. Main Menu LAST status reflects the completed match.
10. Relaunch and confirm the LAST result, settings, keybinds and loadouts persist.
11. Complete another match and choose REMATCH; verify a fresh match starts with reset match stats and no duplicate postgame runtime.

## Regression invariants
- No weapon-stat changes.
- No movement/dash/health changes.
- AI multipliers remain 0.80 / 1.00 / 1.35 / 1.75.
- Pathfinding and spawn behavior remain unchanged.
