# UnblockedTDM Build 1.6 — Version 1

## Front End / Main Menu / Settings / Keybinds

Build 1.6 Version 1 converts the remaining development-style boot flow into a functional game front end and fixes the Build 1.5 pause-menu interaction failure. Existing combat balance and match rules are preserved.

### Pause-menu interaction fix
- Gameplay mouse capture no longer intercepts buttons, selects, sliders, checkboxes or other UI surfaces.
- Gameplay input is explicitly suspended while the main menu, loadout UI or pause menu owns focus.
- Resume clears transient input state so held mouse/keyboard inputs do not leak back into the match.
- Pause MATCH / SETTINGS tabs, Resume, Back, Fullscreen, Reset controls, sliders, selects and checkboxes are all wired through UI-safe event handling.
- F1 debug tuning no longer opens over the main menu or pause menu.

### Main menu
The game now boots to a real main menu instead of directly entering the loadout/development flow.

Functional actions:
- PLAY — opens the saved-loadout deployment screen.
- LOADOUTS — opens the same 25-slot system in management mode without starting a match.
- SETTINGS — opens the persistent game settings screen.
- WEAPON INFO — opens exact numerical information for all eight canonical weapons.
- QUIT — exits the Electron game process through the existing game API.
- HOME — returns to the main menu overview.

### Loadout flow enhancement
- The existing 25 persistent slots remain unchanged.
- PLAY and LOADOUTS now use the same saved-data source instead of separate temporary selections.
- Management mode saves changes without starting a match.
- PLAY mode starts the match with the exact selected saved slot.
- The loadout screen has a real Back to Main Menu action.
- ESC also returns safely to the main menu before a match starts.
- Existing round-break-only switching remains unchanged.

### Settings completion
Settings are now available both from the main menu and the in-match pause menu.

Existing functional settings remain:
- Aim Sensitivity: 0.35x–2.50x.
- AI Difficulty: Beginner 0.80x / Average 1.00x / Sweat 1.35x / Pro 1.75x.
- Minimap Orientation: North Up / Rotate With Aim.
- Screen Shake: on/off.
- Damage Vignette: on/off.
- Fullscreen toggle.
- Gameplay-settings reset.

Both settings panels use the same persistent store and synchronize immediately with F1 debug tuning.

### Control rebinding
Build 1.6 adds persistent bindings for:
- Move Up.
- Move Down.
- Move Left.
- Move Right.
- Sprint.
- Dash.
- Reload.
- Primary Weapon.
- Secondary Weapon.
- Fire.
- ADS.

Rules:
- Click a binding and press a keyboard key or mouse button.
- Binding conflicts swap automatically rather than silently duplicating the same input.
- ESC, F1 and F11 remain reserved system controls.
- Arrow-key movement remains as a fixed fallback.
- Mouse wheel remains a fixed convenience switch for Primary/Secondary.
- Bindings persist through restarts and launcher updates.
- Reset Keybinds restores the canonical defaults.

### Weapon Info
- Adds a player-facing Weapon Info screen for all eight weapons.
- Uses the real canonical numeric data already consumed by the weapon framework.
- Shows damage, crits, fire cadence, magazine/reserve, reload, range/falloff, spread, ADS, movement modifier, swap tier/time and projectile/blast data when applicable.
- No abstract bars or invented values are used.

### Existing systems enhanced, not rebalanced
Build 1.6 does not change:
- 150 HP or health regeneration rules.
- Directional dash distance, charges, stamina cost, cooldown or invulnerability.
- Base movement or sprint values.
- Any canonical weapon damage, crit, fire rate, spread, reload, range or movement modifier.
- 3v3 team composition.
- 1:30 round timer.
- First-to-12 round kill target.
- Sudden Death rules.
- First-to-5 / maximum-nine-round match structure.
- AI difficulty multipliers.
- Friendly-fire rules.
- A* pathfinding behavior from Build 1.41.

### Validation gate
The release workflow runs:
- Full JavaScript syntax validation including GameSettings, MainMenu and SettingsPanel.
- Build 1.41 A* navigation regression tests.
- Build 1.5 persistent-loadout and round-break legality tests.
- Build 1.6 settings/binding persistence tests.
- Binding-conflict swap tests.
- Rebound movement/fire input tests.
- Input-suspension clearing tests.
- Main-menu/pause/settings DOM contract checks.

Windows packaging only begins after these checks pass.
