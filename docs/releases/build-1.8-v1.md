# UnblockedTDM Build 1.8 — Version 1

## Flow Integration / Unified Game UI

Build 1.8 Version 1 hardens the complete game flow and applies the authored Build 1.7 launcher visual language to every major in-game menu. Canonical gameplay balance is unchanged.

### Unified UnblockedTDM menu language
The in-game UI now uses the same product language as the redesigned launcher:
- Base palette: `#080c11`, `#0d131b`, `#111925`, `#222d3a`, `#f1f4f7`, `#778595`, `#37b8ff`.
- No large decorative blue gradients.
- Flatter desktop geometry with mostly 0–4px radii.
- Thin dividers and whitespace replace unnecessary card containers.
- Cyan is reserved for active markers, important actions and technical status.
- Technical/build metadata uses monospace-style typography.
- Sidebar/navigation selection uses edge markers instead of rounded pills.
- Shared `UNBLOCKED // TDM` naming, UT logo and Training Complex technical artwork.

The style applies to:
- Main Menu.
- Loadouts / pre-match selection.
- Settings and control rebinding.
- Weapon Info.
- Pause / match controls.
- Between-round loadout selector.
- Postgame / scoreboards / round history.

### Game-flow hardening
- Build 1.8 replaces the older standalone postgame runtime with one authoritative flow runtime.
- Match-complete events now open the real postgame screen through the same UI layer.
- Postgame suppresses the underlying match-over overlay so two result UIs do not compete visually.
- REMATCH clears postgame state, damage-stat carryover and stale UI focus before starting a fresh match.
- MAIN MENU clears postgame state and returns through the existing real main-menu path.
- ESC on Settings or Weapon Info returns to HOME instead of leaving the user trapped in a submenu.
- Loadout copy/build metadata stays synchronized even though the loadout DOM rerenders dynamically.
- The dynamic observer is scoped only to the loadout surface; it does not watch live gameplay classes or interfere with Settings/keybind/debug interaction.

### Persistence / UX
- The most recent completed match summary is stored locally.
- Main Menu status now shows the previous match winner and final round score after returning/relaunching.
- Existing persistent settings, keybinds, 25 loadouts and active loadout remain unchanged.

### Shared assets
- The game now ships the same UT mark used by the launcher.
- The game now ships the same subtle Training Complex technical artwork used by the launcher.

### Existing systems preserved
Build 1.8 does not change canonical:
- Weapon damage, crits, spread, reload, ranges or movement modifiers.
- 150 HP / regeneration behavior.
- Dash distance, charges, stamina, cooldown or invulnerability.
- Base movement / sprint values.
- Beginner 0.80x / Average 1.00x / Sweat 1.35x / Pro 1.75x AI multipliers.
- 3v3 composition.
- 1:30 rounds / first to 12 kills.
- Sudden Death.
- First to 5 rounds / maximum 9.
- Spawn rules or A* pathfinding.

### Validation gate
Windows packaging begins only after:
- Full JavaScript syntax checks.
- Build 1.41 pathfinding regression.
- Build 1.5 loadout persistence regression.
- Build 1.6 menu/settings/keybind regression.
- Build 1.7 control/bot/postgame/launcher regression.
- Build 1.8 unified menu, postgame integration, persistence and UI-style regression.
