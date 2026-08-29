# Skirmish Arena 2.4.3.3 — Build 1

## Arena Phase 3 — Competitive Finalization

Phase 3 completes the Arena milestone with a game-wide correctness, presentation and release-quality pass. It keeps the approved Skirmish Arena structure and balance while making Arena, Foundry Zero, weapons, characters, rank identity and postgame flow operate as one coherent product.

### Arena integrity and season ownership

- Arena Point rewards and all 14 promotion thresholds remain exactly unchanged.
- A match that crosses midnight on the first day of a month now remains owned by the season in which it started. Its postgame result is shown against that season, then the completed season is archived and the new month begins at Prospect / 0 AP.
- Offline crash recovery follows the same rule: an abandoned match is recorded as a forfeit in its start season before the current month is opened.
- Multi-month offline gaps advance directly to the current month without manufacturing empty season-history rows.
- Device-clock rollback cannot rewind an Arena profile into an older season or duplicate an archive.
- The completed-match ledger now lasts for the full current season instead of dropping IDs after 120 results.
- Duplicate results remain protected after a season is archived, and a delayed duplicate can no longer clear a different live rematch.
- Snapshots no longer expose mutable Arena history, recent-result, match-ID, active-match or rank objects to UI consumers.
- Impossible or corrupt match telemetry is bounded to real 3v3 match-rule limits and reports its corrections.
- Local persistence health is exposed diagnostically instead of silently presenting a failed write as durable progress.
- Team-wipe telemetry now detects the simultaneous alive-to-eliminated team transition and awards once per wipe. The latch reopens only after all three opponents are alive again (or a new round begins), so staggered single respawns cannot become fake team wipes; any three remembered local kills are no longer treated as a wipe either.

### Deterministic Arena Point calibration

The new `scripts/simulate-arena-2433.mjs` utility runs a seeded, machine-readable Monte Carlo model using the real Arena scoring function. It varies player skill, K/D, win rate, assists, round records, MVP frequency, streaks, critical eliminations, sweeps, comebacks, team wipes and sudden-death clutches while preserving the first-to-five / nine-round match rules.

Calibration configuration:

- Seed: `2433`
- Trials: `1,200` per archetype
- Target: Omnipotent at `4,200 AP`
- Time definition: active Arena match time; queue, menu and break time are excluded
- Match duration model: 78 seconds per played round on average, including countdown and round-break time, with bounded per-match variation

| Archetype | Hours p10 | Median hours | Hours p90 | Median matches | Median applied AP / match |
|---|---:|---:|---:|---:|---:|
| Weak | 111.43 | 170.23 | 292.60 | 1,086 | 3.87 |
| Average | 33.86 | 39.67 | 47.50 | 245 | 17.20 |
| Good | 22.88 | 25.41 | 28.61 | 158 | 26.60 |
| Elite | 16.23 | 17.83 | 19.53 | 115 | 36.73 |

The modeled good-player median is 25.41 active hours, 15.3% from the approximate 30-hour target and inside the documented ±20% calibration band. Weak players struggle, average players progress substantially more slowly and elite players climb faster. Because the model does not show a material miss, Arena rewards and thresholds were preserved exactly rather than changed speculatively.

### Foundry Zero — live forge presentation

Foundry Zero keeps the exact Phase 2 competitive geometry and all six spawn coordinates while gaining a deterministic, presentation-only industrial layer:

- animated furnace, forge-core, pipe and vent flames
- fixed-slot embers and sparks
- subtle localized heat shimmer
- restrained warm light flicker
- low-opacity source-local smoke and haze
- periodic steam bursts
- rotating hall fans and gears
- oscillating pistons and forge machinery
- heated smelter, core, rail, vent and anvil surfaces
- detailed service plates, drains, warning bands, pipe runs, joints, scorch marks and ore stacks
- stronger but symmetrical Blue/Red spawn presentation
- richer north/south halls, flank machinery and central Forge Core silhouettes

The presentation is nonblocking and non-damaging. No random hazard, collision record, match rule or sightline geometry was added.

Runtime bounds are explicit and regression-tested:

- 44 authored ambient source records under a 48-source cap
- 102 fixed analytic particle slots under a 112-slot cap
- maximum 8 slots per emitter
- maximum 192-pixel warm-light radius
- 40 static fixtures under a 64-fixture cap
- camera culling for fixtures, lights, flames, particles and moving machinery
- hidden-window ambience suspension
- revision-aware cache teardown when switching to Training Complex and deterministic rebuild when returning to Foundry Zero
- no `Math.random`, unbounded particle arrays, canvas blur or thick sightline smoke

### Weapons and character presentation

- All eight weapons still use the same renderer in gameplay, Loadouts and Weapon Info.
- Assault Rifle, SMG, Sniper, Shotgun, LMG, Pistol, Launcher and Melee now have stronger individual silhouettes, improved proportions and authored receivers, stocks, grips, magazines, barrels, sights, rails, vents, fasteners and material layers.
- Weapon-specific live mechanics include recoil, casing ejection, pistol slide travel, sniper bolt movement, pump-action shotgun cycling and shells, magazine removal/insertion, the LMG box and ammunition belt, launcher rocket insertion and bounded muzzle-flash shapes.
- The Shotgun remains unmistakably pump-action.
- Player and bot models gain articulated legs, boots, knee protection, layered uniforms and armor, equipment, helmet detail, weapon-state posture, locomotion, sprint/dash treatment, spawn protection and stronger team rings.
- Blue and Red palette identity remains explicit, while gameplay hitboxes, movement and collision are unchanged.

### Rank and UI polish

- All 14 Arena emblems retain distinct authored geometry and now have stronger frames, backplates, tier marks, highlights, depth and family-specific progression from Prospect through Omnipotent.
- Omnipotent has a dedicated apex frame and singularity/crown identity.
- All 26 permanent Career emblems remain registered through their separate authored sprite set.
- Career uses a permanent account-progression treatment; Arena uses a monthly competitive treatment, so the two systems remain visually distinct.
- Mode selection, Arena ranks, Home progression, Loadouts, Weapon Info, scoreboard, kill feed, postgame and Arena results receive restrained tactical/metallic spacing, border, focus, selected-state and readability improvements.
- Match intro, round transition, critical elimination and MVP feedback use short-lived class states with bounded timers rather than mutation loops or per-event presentation nodes.
- Stale mode state is cleared on Home return, direct navigation and rematch transitions.
- Delayed Arena promotion/demotion overlays are canceled when postgame is no longer active.
- Visible legacy branding in the shell and postgame has been corrected to Skirmish Arena.
- The UI contains no emoji, Japanese lettering, giant rounded cards or generic generated-looking gradient treatment.

### Validation

The dedicated 2.4.3.3 gate covers:

- every Arena threshold, promotion, demotion and the zero AP floor
- approved AP arithmetic, stacked -18 AP loss penalty and impossible telemetry bounds
- ordinary, year, multi-month offline, live-boundary and crash-recovery season transitions
- full-season and archived duplicate-match protection
- snapshot isolation and persistence diagnostics
- deterministic weak / average / good / elite progression calibration
- Casual / Training Complex and Arena / Foundry Zero map invariants
- all six collision-safe, symmetric Foundry spawns and navigation to all three lanes in both directions
- first-tick bot route invalidation after map switching
- exact Foundry blocker and spawn snapshots
- deterministic Foundry presentation bounds, culling, hidden-window suspension and cache lifecycle
- all eight shared weapon renderers through idle, firing and reload states
- player live, spawn-protected, low-ammo and dead presentation states
- all 14 Arena and all 26 Career emblem registrations
- Arena/Career persistence isolation
- Loadout and Settings persistence
- packaged boot integrity for Skirmish Arena branding, Career, Arena, Foundry Zero, both emblem systems, all eight weapons and the bounded Phase 3 presentation contract
- every historical regression test and both real packaged Windows executable smoke paths

### No gameplay or launcher architecture changes

This release does **not** change weapon balance, player health, movement, four-charge dash behavior, AI difficulty multipliers, 3v3 rules, 1:30 round timing, the 12-kill round target, first-to-five match rules, sudden death, Career progression, Career levels 1–1000, Loadout rules, settings, Arena AP values or Arena thresholds.

The existing Skirmish Arena launcher, installer, update manifest format and GitHub release pipeline remain authoritative; no alternate launcher or download system was introduced.
