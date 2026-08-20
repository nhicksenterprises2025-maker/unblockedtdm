# UnblockedTDM Build 1.5 — Version 1

## Midpoint / Persistent Loadouts / Pause Settings

Build 1.5 Version 1 is the midpoint quality update for the 1.x development cycle. It does not rebalance the canonical gameplay rules. Instead it turns temporary development-facing systems into persistent, player-facing systems and strengthens the in-match UX.

### 25 persistent loadouts
- Adds exactly 25 saved loadout slots.
- Every slot stores its own name, Primary weapon and Secondary weapon.
- Saved data persists through game restarts and launcher updates via local user storage.
- The currently active loadout slot is also persisted.
- Existing weapon-slot legality is validated before a loadout can be stored.
- Shotgun remains legal in Primary or Secondary.
- The exact same weapon still cannot occupy both slots.
- Invalid or corrupted saved data safely falls back to the canonical AR + Pistol default rather than breaking startup.
- Weapon edits on the pre-match screen save immediately to the selected slot.
- Loadout slots can be renamed or reset.
- The pre-match screen retains the exact numerical weapon-stat panel and SELECT behavior.

### Between-round loadout changes
- A compact 25-slot quick-loadout panel appears only during the existing 10-second round break.
- Selecting a saved slot immediately equips that loadout for the next round.
- The next round reset refreshes ammo and weapon state normally.
- Loadout switching is explicitly rejected during active combat, Sudden Death, countdown, death/respawn and match-over states.
- Mid-round deaths still cannot be used to change loadout.
- The match manager now exposes a dedicated loadout-change eligibility rule so later UI cannot accidentally bypass the restriction.

### Pause menu upgrade
Pressing ESC now opens a real pause hub rather than a static PAUSED card.

The MATCH tab shows:
- Current round.
- Current Blue/Red kill score.
- Active saved-loadout slot and name.
- Resume control.
- Direct access to the Settings tab.

The SETTINGS tab exposes only controls backed by real game systems:
- Aim Sensitivity: 0.35x–2.50x.
- AI Difficulty: Beginner 0.80x / Average 1.00x / Sweat 1.35x / Pro 1.75x.
- Minimap Orientation: North Up / Rotate With Aim.
- Screen Shake: on/off.
- Damage Vignette: on/off.
- Toggle Fullscreen.
- Reset gameplay settings to defaults.

All applicable settings persist through game restarts. The pause settings and F1 debug tuning panel synchronize through the same stored values.

### Feedback/settings implementation cleanup
- Screen Shake now controls camera shake without affecting the actual explosion or projectile mechanics.
- Damage Vignette now controls only the red screen-edge vignette.
- The directional damage indicator remains active when the vignette is disabled.
- No dead Audio or Keybind controls are exposed before those systems are ready.

### Existing systems preserved
- 3v3 Blue vs Red match rules.
- 1:30 rounds and first to 12 kills.
- Sudden Death on tied timer expiration.
- First to 5 round wins, maximum 9 rounds.
- 5-second round countdown and 10-second round break.
- Directional four-charge dash and all stamina rules.
- 150 HP, health regeneration rules, respawn and spawn protection.
- All eight canonical weapon stat blocks and movement modifiers.
- A* bot pathfinding and all four AI difficulty multipliers.
- Circular minimap enemy firing reveal remains 1.5 seconds.
- Existing aim-accuracy / no-aim-assist behavior remains intact.
- Zero friendly fire.

### Validation gate
The Windows release workflow validates all JavaScript before packaging and now also runs `scripts/test-build-1.5.mjs`.

The Build 1.5 test verifies:
- Exactly 25 saved loadout slots exist.
- Legal loadouts persist and restore correctly.
- Active slot persistence works.
- Renaming persists.
- Invalid Primary assignments are rejected.
- Duplicate identical weapons across both slots are rejected.
- Loadout changes are allowed during round break and rejected during active/Sudden Death play.
- The Build 1.41 collision-safe A* spawn-to-spawn navigation test continues to run.
