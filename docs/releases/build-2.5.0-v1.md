# Skirmish Arena 2.5.0 — Build 1

## Presentation and Map Overhaul

Skirmish Arena 2.5.0 completes a game-wide presentation pass without replacing the established tactical interface or changing competitive balance. Home progression, emblems, weapons, characters, Settings, Loadouts, match selection, both battlegrounds and in-match control surfaces now follow one restrained metallic visual language with sharper hierarchy, clearer purpose and bounded runtime cost.

### Build 1 refinement and integrity repair

The final Build 1 asset refresh keeps the existing 2.5.0 identity, Build 1 number, `build-2.5.0-v1` tag and live sequence 57. It incorporates the post-release visual review and codebase sweep into the same launcher-visible release instead of inventing a second build or a parallel update route.

- The Home wordmark was rebuilt again around a physically separate command shield and a wider, cleaner typographic lockup. The crest can no longer cover the word “Skirmish,” and the small 3v3 descriptor, steel hierarchy and cyan rules remain legible at the actual Home scale.
- Pause is now a larger five-section match console with a dedicated navigation rail and more working room for Scoreboard, Loadout, Controls and the full Settings panel. The Match view keeps round score, active loadout and ruleset immediately visible while map, mode, side, weapon and objective move into an intentional Match Intel disclosure, reducing the previous all-at-once density.
- Loadouts now behaves as a focused arsenal workspace: a horizontal saved-slot rail, one unambiguous Primary/Secondary selector, a scrollable weapon list, larger authored side-view models and an inspection stage with four real weapon-stat facts. Compact-height and narrow-window rules keep naming, selection and save/deploy controls reachable.
- The selected Casual/Arena route is restored after every Loadout re-render, so changing a slot, weapon, name or reset state can no longer silently remove the real match-mode indicator.
- User-authored Loadout names and status text are escaped in all rebuilt markup, including the between-round picker, closing the remaining unsafe generated-markup path without changing stored names.
- Reset Gameplay, Reset Keybinds and Reset All now batch their storage writes and emit one coherent settings update instead of producing a cascade of partially reset intermediate states.
- Pausing or hiding the game no longer resets the active Tactical HUD session. Scoreboard and kill-feed state survive a normal resume, hidden/paused surfaces stop unnecessary hydration, and the live timer is explicitly released during shutdown.
- Low-ammunition presentation now suspends while the document is hidden, uses a less aggressive refresh interval and synchronizes immediately when visibility returns.
- Opaque Home and Pause surfaces reuse a frozen arena frame instead of redrawing the full world, actors and Foundry effects every animation frame. Live play resumes normal rendering immediately, with map, viewport and display scale included in the static-frame key.
- Dynamic presentation observers are scoped to the menu, Loadout, weapon-list and round-switcher surfaces that they actually own. The global 2.5 observer filters additions to weapon, emblem, logo and mode-selector targets and coalesces overlapping roots, preventing routine HUD and scoreboard changes from triggering document-wide rescans.
- Launcher archive entries are no longer considered playable merely because a same-tag executable exists on disk. Cached builds are streamed through SHA-256 verification against the current `versions.json` entry; missing, stale and unverifiable copies remain non-playable, stale copies are labeled **Repair**, and Play rechecks integrity before launch.
- Archive download and launch requests now resolve the canonical live entry by tag instead of trusting renderer-supplied URLs or hashes. Replacements are staged, verified and only then copied over a stale cache, while the managed latest-version updater retains its established equal-sequence hash-repair behavior.
- Regression coverage now includes the refined logo, progressive Pause layout, authored Loadout inspection surface and the launcher’s missing, valid, stale and unverifiable archive-cache states.

### Home, progression and brand presentation

- The Home Arena strip now follows the same grid, padding, baseline and progress rhythm as Career while preserving Arena rank, season, record, win rate, seasonal K/D, kills, matches, Arena Points, next-rank/reset data and recent AP results.
- Recent Career and Arena result chips have stable spacing, flexible widths and a dedicated action column instead of compressing result text.
- All 26 Career emblems were redrawn around five controlled service-insignia families. Early ranks use shields and bars, middle ranks gain disciplined command geometry and late ranks progress into premium crests without uncontrolled decoration.
- All 14 Arena emblems were redrawn as a separate competitive family spanning entry, tiered, command, crystal and apex silhouettes. Omnipotent receives a distinct final-rank frame while remaining readable at strip size.
- The large Home wordmark is now a native vector asset with crisp steel lettering, a compact command crest and restrained cyan edge accents. It no longer depends on a softened raster source.
- Weapon Info, Settings and Quit now use one authored metallic command-icon family matched to the existing Play treatment. The approved Loadouts weapon icon remains unchanged.

### Dedicated weapon and character presentation

- Menu and reference screens now use an explicit eight-model side-view presentation set.
- Live gameplay now uses a separate, purpose-built eight-model top-down set for Assault Rifle, SMG, Sniper Rifle, Shotgun, LMG, Pistol, Launcher and Melee.
- The top-down silhouettes keep their longitudinal axis on the actor's aim direction and include weapon-specific stocks, receivers, barrels, magazines, optics, pump furniture, box ammunition, launcher tube and melee blade geometry.
- Gameplay models retain real recoil, casing/slide/bolt/pump motion, reload movement, swap arcs, launcher insertion and melee swing feedback. The shotgun remains visibly pump-action.
- The menu sniper optic was rebuilt in side profile and every menu canvas is normalized before painting, removing the unexplained circular halo while preserving weapon detail, shadows and selected-card borders.
- Player and bot presentation preserves existing hitboxes and team palettes while adding a compact operator identifier to the existing articulated legs, tactical armor, support-arm posture, locomotion, sprint/dash, recoil, spawn-protection, low-ammo and death states.

### Modern Settings and real interface controls

- Settings now has five focused tabs: Gameplay, Controls, Display, Audio and HUD.
- Existing Aim Sensitivity, AI Difficulty, Minimap Orientation, Screen Shake, Damage Vignette, Fullscreen, Auto Sprint, Game Audio, Master Volume, key rebinding and all reset actions remain available.
- New settings are fully persisted and applied by real systems: Minimap Scale, Minimap Opacity, Screen Shake Strength, Damage Vignette Intensity, HUD Scale, Kill Feed Scale and Show FPS.
- Every numeric setting is bounded on both write and read, so legacy or malformed local values cannot create unusable UI states.
- Existing installations migrate naturally: legacy keys retain their values and every new key receives a safe default.
- Rebinding still prevents reserved Escape/F1/F11 conflicts and automatically swaps ordinary conflicts. Reset Settings, Reset Keybinds and Reset All update both visible Settings instances immediately.
- The FPS option now exposes the live frame counter in ordinary gameplay instead of requiring debug mode.

### Loadouts and deployment flow

- The redundant Primary and Secondary summary boxes have been removed from the Loadouts header.
- The header now carries a compact active-slot index, while saved-slot names and complete primary/secondary weapon names are larger and easier to scan.
- Add Slot, Save Name and Reset Slot remain intact; three default slots, manual expansion and the 25-slot ceiling are unchanged.
- User-authored slot names are escaped wherever they enter generated UI markup.
- The Casual/Arena selector has been rebuilt as two deliberate deployment routes rather than generic oversized cards.
- Casual clearly identifies Training Complex, standard 3v3 play, continued Career progression and no ranked AP.
- Arena clearly identifies Foundry Zero, ranked 3v3, the current Arena rank and AP context.
- The existing Play → mode → Loadout → match flow remains unchanged, with bounded panel height and compact-height/mobile fallbacks preventing the previous clipping and excess-space failure.

### Training Complex and Foundry Zero

- Training Complex keeps its exact collision, navigation and six spawn coordinates while gaining a purpose-built training-facility presentation.
- Its brighter material plan now distinguishes deployment concrete, calibrated asphalt lanes, concrete work areas and restrained grass boundaries.
- Range ticks, firing-lane marks, deployment rails, training halls, control terminals, cover modules, supply crates and mirrored team identifiers give every major structure an operational role.
- Foundry Zero keeps the exact approved competitive geometry, sightlines, navigation and all six spawn coordinates.
- Every flame now sits in a visible pipe burner or furnace throat. Burner placement, central forge machinery, closed-loop coolant blocks, connected pipework and mirrored forge halls make the industrial layout read as one coherent facility.
- Animated flames, embers, sparks, heat shimmer, warm light, smoke, steam, fans, gears and pistons remain presentation-only. They do not add damage, collision or random hazards.
- Environmental animation is camera-culled, deterministic, suspended while hidden or reduced-motion mode is active and constrained by the existing fixed source/particle budgets.

### Pause hub and match presentation

- Pause is now a five-tab match console: Match, Scoreboard, Loadout, Controls and Settings.
- Match displays the live map, mode, side, match state, round, round kills, round wins, active loadout, active weapon, ruleset and objective reminder.
- Scoreboard separates Blue and Red rosters with live kills, deaths, assists, K/D, damage, team totals, local-player emphasis and a current top-performer line.
- Loadout shows the equipped primary and secondary, active weapon, real magazine/reserve state, melee availability and every saved configuration. Switching remains disabled except during the real between-round window.
- Controls shows every current binding plus fixed mouse-wheel weapon cycling and Escape pause behavior.
- Settings reuses the same five-tab, persisted Settings system as the main menu.
- Resume Match and Return to Main Menu remain direct and reliable.
- Complex Pause roster/loadout markup is hydrated only while paused; it is no longer rebuilt by the 20 Hz live HUD update.
- HUD, minimap and kill-feed scaling, reduced-motion behavior, visibility suspension and one coalesced/disconnected presentation observer keep the overhaul bounded.

### Validation

The dedicated 2.5.0 gate and full historical suite cover:

- all 26 Career and 14 Arena emblem registrations and source assets
- stable Home Career/Arena strip ownership and unclipped recent-result layout
- the native Home logo asset and all three replacement command icons
- halo-free side-view menu canvases and all eight dedicated top-down gameplay models
- every old and new Settings value, persistence, legacy defaults, bounds, reset behavior and key rebinding
- Loadout naming, reset, persistence, expansion and the 25-slot limit
- Casual/Training Complex and Arena/Foundry Zero routing
- unchanged map geometry, symmetric spawns, navigation and non-damaging Foundry ambience
- five working Pause tabs, live roster/loadout/control data, Resume and Return to Main Menu
- Career/Arena isolation, monthly reset ownership, Arena AP/ranks, postgame progression and historical combat/HUD behavior
- deterministic boot ownership, one visible menu view and 2.5 surface integrity
- the packaged Windows executable boot path and existing launcher/update pipeline

The initial Build 1 release qualification completed with 115 syntax checks and 35 regression suites before packaging, followed by the real packaged executable smoke test. The refinement repair adds archive-integrity coverage and reruns the complete syntax, historical regression, Windows packaging and packaged-executable gates before replacing the live assets.

### Gameplay and launcher compatibility

This release does **not** change weapon balance, hitboxes, player health, movement values, four-charge dash behavior, AI difficulty multipliers, 3v3 team size, 1:30 round timing, the 12-kill round target, first-to-five match rules, sudden death, Career XP, Career levels 1–1000, Arena AP values, Arena thresholds, monthly reset rules or competitive map geometry.

The existing Skirmish Arena launcher, installer, manifest format and GitHub Actions release workflow remain authoritative. The workflow replaces the three assets on the existing GitHub release, regenerates `latest.json` and the current `versions.json` entry from the packaged files, and publishes their new hashes without changing sequence 57. No alternate launcher, repository, build system or update route was introduced.
