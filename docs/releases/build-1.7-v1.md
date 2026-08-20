# UnblockedTDM Build 1.7 — Version 1

## Postgame / Launcher / Controls

Build 1.7 Version 1 closes the remaining 1.6 control defect, completes the first player-facing postgame flow, reduces bot aim precision without changing the canonical difficulty multipliers, and replaces the launcher dashboard aesthetic with a flatter authored UnblockedTDM desktop-client visual language.

### Rebound controls now drive gameplay
Build 1.6 persisted and displayed bindings correctly, but a hidden UI control could retain DOM focus after leaving a menu. Keyboard events then looked like menu input and were discarded even though the match was live.

Build 1.7 fixes that ownership model:
- Keyboard gameplay ownership is controlled by the explicit suspended/live input state rather than a hidden focused menu element.
- Entering or resuming a match clears stale held inputs and blurs old UI focus.
- Rebound movement, sprint, dash, reload, Primary and Secondary keys are read directly from the persistent binding store in live gameplay.
- Mouse Fire/ADS bindings continue to respect UI surfaces so menu clicks cannot leak into combat.
- Arrow-key movement and mouse-wheel weapon switching remain fixed convenience fallbacks.
- ESC, F1 and F11 remain reserved system controls.

### Lower bot accuracy
The four difficulty multipliers are unchanged:
- Beginner — 0.80x.
- Average — 1.00x.
- Sweat — 1.35x.
- Pro — 1.75x.

Bot weapon damage, health, movement and canonical weapon spread are also unchanged.

Instead, Build 1.7 makes bot aim less laser-like by:
- Increasing the AI-only aim-error envelope by 1.65x.
- Adding extra aim error against moving targets.
- Slightly reducing aim-settle speed while preserving the existing reaction/difficulty hierarchy.
- Keeping higher difficulty modes meaningfully more accurate than lower modes without making Pro perfectly centered.

### Full postgame screen
A completed match now opens a real results screen instead of relying on the development Enter-key flow.

The results screen includes:
- Winning team.
- Final Blue/Red round score.
- All six players grouped by team.
- Kills.
- Deaths.
- Assists.
- Enemy damage dealt.
- K/D.
- Critical-hit count.
- Highest kill streak.
- Match duration.
- Local-player row highlight.
- Round-by-round history including Blue/Red kill score and Sudden Death rounds.
- REMATCH.
- MAIN MENU.

Damage and critical totals are driven by applied combat events from the real DamageSystem. Self-damage and friendly-fire rejections are not counted as enemy damage dealt.

REMATCH resets match statistics and starts a fresh first-to-five match using the current game systems. MAIN MENU returns through the Build 1.6 front end instead of restarting the application.

### Authored UnblockedTDM launcher redesign
The launcher no longer uses the previous large-blue-gradient / rounded-dashboard composition.

Visual system:
- Base background #080c11.
- Surface #0d131b.
- Secondary surface #111925.
- Border #222d3a.
- Text #f1f4f7.
- Muted #778595.
- Single primary accent #37b8ff.
- No large decorative gradients.
- Main UI geometry uses flat edges and 2–4px control radii instead of repeated large rounded cards.
- Status indicators use small dots and technical metadata rather than pill badges.
- Sans typography carries primary UI; monospace typography carries builds/status/client metadata.

Launcher structure:
- Narrow UT navigation rail.
- PLAY / BUILDS / SETTINGS / DIAGNOSTICS navigation.
- Active section shown by an edge marker rather than a rounded navigation pill.
- One dominant LAUNCH GAME action.
- LAUNCHING state while the game process starts.
- Compact INSTALLED / LATEST / STATUS / FILES strip.
- Update details shown as a simple information line instead of multiple status cards.
- Download progress remains hidden until an actual download/update occurs.
- Build Archive uses dense desktop rows rather than card tiles.
- Settings and Diagnostics use dividers and whitespace instead of unnecessary containers.

### New UnblockedTDM visual assets
- Adds a custom UT launcher/site mark and uses it as the launcher favicon/brand mark.
- Adds subtle Training Complex technical artwork behind the current-build launch area.
- Uses recurring `//`, bracket/build-code, thin-line and status-dot motifs to make the client visually specific to UnblockedTDM.

### Important launcher installation note
The current launcher update architecture updates the game executable but does not yet replace the installed launcher's own application files.

Therefore:
- The existing launcher can still detect/install/play Build 1.7 v1 normally.
- To receive the new Build 1.7 launcher visual redesign itself, run `UnblockedTDM-Setup-1.7-v1.exe` once after the release is published.
- Future game updates continue to work through the launcher after that installation.

### Existing gameplay preserved
Except for the explicitly requested lower bot accuracy, Build 1.7 does not rebalance:
- Player HP/regeneration.
- Movement or sprint speeds.
- Dash distance, charges, stamina cost, cooldown or invulnerability.
- Weapon damage, critical values, fire rates, reloads, range, falloff or spread.
- 3v3 team composition.
- 1:30 round timer.
- First-to-12 kill target.
- Sudden Death.
- First-to-5 / maximum-nine-round match structure.
- Friendly-fire rules.
- A* navigation/pathfinding rules.

### Validation gate
Before Windows packaging, `npm run check` now validates:
- Full JavaScript syntax including the postgame runtime and PostgameScreen.
- Build 1.41 A* pathfinding regression checks.
- Build 1.5 persistent-loadout / round-break legality checks.
- Build 1.6 settings/keybind persistence checks.
- Build 1.7 rebound-key gameplay handling even when a hidden UI element still has focus.
- Input suspension behavior.
- Exact AI difficulty multiplier preservation.
- Lower-accuracy bot aim constants.
- Applied-damage and critical-hit stat tracking.
- Postgame K/D/A/damage/streak/round-history contracts.
- Launcher logo/art/status/Launch Game contracts.
- Absence of the previous decorative launcher gradients and oversized repeated border radii.
