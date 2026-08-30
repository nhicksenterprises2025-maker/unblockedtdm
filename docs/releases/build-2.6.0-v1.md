# Skirmish Arena 2.6.0 — Build 1

Phase: **2.6.0 — Tactical Intelligence and Interface Refinement**

Skirmish Arena 2.6.0 makes the existing local 3v3 game easier to read, more tactically intelligent, and more deliberate from Home through postgame. It preserves the established weapon balance, progression thresholds, match rules, launcher, updater, and distribution format while improving the systems that present and play those rules.

## Tactical AI

- Bots now navigate both Training Complex and Foundry Zero with clearance-aware path nodes, forward collision probes, corner anticipation, local avoidance, stuck detection, bounded repathing, short-range correction, map-revision checks, and safe fallback waypoints.
- Navigation no longer keeps applying movement into a blocking wall. Invalid or obstructed routes are abandoned and corrected immediately, while dash choices are validated against swept geometry and landing clearance.
- Each of the eight weapons has a distinct positioning policy instead of an accuracy-only modifier. Assault Rifle users work medium lanes and hard cover; SMG and Shotgun users close and flank; Snipers preserve protected sightlines; LMG users hold lanes; Pistol users rotate; Launcher users seek safe splash angles; and Melee users use cover and safe dashes to approach.
- Decisions incorporate observable enemy state, effective range, health, ammunition, reload state, teammates, local pressure, lane danger, cover distance, spawn side, map, and available dash charges without giving bots impossible information.
- Existing difficulty choices remain authoritative. Higher difficulty improves reaction, aim discipline, route selection, and tactical evaluation rather than granting cheating accuracy.

## Progression and interface readability

- Arena rank cards remove the redundant material/color subtitles and give rank name, AP threshold, current/locked state, and remaining progress a larger, cleaner hierarchy.
- Career Overview, Ranks, and Milestones plus Arena Overview, Ranks, and History use the available desktop area with larger progression emblems, level/rank values, stat rows, tabs, progress bars, and readable support copy instead of tiny text above a large empty field.
- Career and Arena emblems use an authored geometric family with consistent silhouettes, restrained rank materials, and clear progression at both card and hero sizes.
- The approved five-section Pause console remains intact, is significantly larger, and now uses restrained custom tab glyphs for Match, Scoreboard, Loadout, Controls, and Settings.
- Scoreboards retain Top 3, Blue/Red team separation, and the local-player row while improving numeric hierarchy for kills, deaths, assists, K/D, and damage.
- The global typography pass raises important support labels out of micro-text territory across Home, Career, Arena, Pause, Settings, Loadouts, Weapon Info, mode selection, scoreboards, and postgame.

## Match HUD and settings

- Blue and Red kill totals now carry their team colors, while the timer, round, round wins, kills, kill feed, minimap, health, stamina, dash charges, weapon name, magazine, reserve ammunition, and tactical hints have clearer scale and spacing.
- A real persisted HUD Scale setting supports 80% through 140% and reflows the individual HUD anchors without blurring the game canvas or scaling the entire screen.
- Existing minimap and kill-feed scaling continue to compose with HUD Scale at common 16:9 desktop sizes.
- Auto Reload is a real persisted gameplay option. When enabled, an empty ranged weapon begins a legal reload only when reserve ammunition, life state, swap state, dash state, round state, and weapon-specific reload behavior allow it. Manual reload remains available.
- Settings reset operations are batched into coherent updates, and the legacy settings layer can no longer stamp duplicate headings or cards over the versioned panel.

## Weapons, branding, and Home

- Weapon Info derives DPS from the canonical live damage, pellet, blast, melee, and fire-interval data. Shotgun and Launcher semantics are labeled honestly, and values update automatically when balance data changes.
- The Pistol uses the specified one-shot-per-1/7-second cadence, with its Weapon Info output derived from the same balance configuration.
- Side-view arsenal models remain isolated to menus, while dedicated top-down weapon models remain attached to in-match characters.
- The small brand mark and large Home wordmark now share the exact same readable SA emblem geometry, metallic hierarchy, and restrained cyan construction.
- Home navigation retains Play, Loadouts, Weapon Info, Settings, and Quit while removing the unused 01–05 tile counters.
- Home and opaque Pause surfaces reuse a keyed static world frame, reducing needless world, actor, and Foundry-effect rendering while those menus are open.

## Battlegrounds

- Foundry Zero is expanded to approximately 1.3 times Training Complex's playable area, with three primary approaches, useful cross-routes, protected spawns, clearer open combat zones, longer sightlines, and less cover spam.
- Forge machinery, pipes, vents, furnaces, loading storage, barriers, fire, embers, sparks, steam, rotating mechanisms, heat shimmer, and furnace glow now form logical industrial systems rather than disconnected decoration.
- Foundry's environmental effects remain animated but are bounded for stable runtime cost and cleaner competitive visibility.
- Training Complex preserves its Casual layout while gaining believable facility materials, reinforced architecture, shutters, vents, signage, lane markings, spawn context, and utility detail.
- Artificial blue building bars are removed and replaced with neutral functional building detail; team color is reserved for useful training and deployment markers.
- Dynamic map dimensions now drive player collision limits, camera bounds, minimap projection, world rendering, and bot navigation.

## Postgame and Arena integrity

- The postgame screen is larger and more deliberate, with clearer Victory/Defeat, final rounds, K/D/A, damage, streak, critical hits, MVP, team tables, round history, Career XP, Arena AP, Main Menu, and Rematch hierarchy.
- Career XP animates through every crossed level threshold and finishes on the exact persisted total. The sequence is fast, skippable, and cannot leave the UI on an approximated value.
- Arena AP animates through promotions and demotions with the correct emblem/rank transition and also finishes on the exact persisted value.
- Leaving an active Arena match applies one exact **-50 AP** forfeit, respects the zero-point floor, records the forfeit in Arena history, and cannot double-charge the same match id.
- Returning to Home, quitting during a live Arena match, and recovery after an abandoned/crashed session share the same idempotent transaction. Casual, pre-match menus, and legitimately completed Arena matches are unaffected.

## Launcher and future extension seams

- Archived launcher builds are playable only after their cached executable passes the current published SHA-256. Missing, stale, or unverifiable same-tag files remain non-playable; stale caches are offered as Repair and replacement occurs only after staged verification.
- Archive download and launch requests resolve the canonical live manifest entry by tag instead of trusting renderer-provided URLs or hashes.
- The existing release workflow now treats failed replacement uploads as failures and refreshes the existing release title and notes when assets are replaced.
- Player identity presentation, party roster, match roster, authoritative match snapshots, reconnect outcomes, and future Identity/Friends/Party/Matchmaking/Transport services have documented extension points.
- No fake friends, party, lobby, presence, queue, host, matchmaking, or online controls are exposed. Skirmish Arena remains a complete offline/local game until real services exist.

## Qualification

- Dedicated 2.6 AI, progression/brand, systems, and interface/map gates cover both maps, weapon strategy, HUD scaling, logos, readable progression, DPS, Auto Reload, postgame animation, forfeit recovery, and future-safe identity seams.
- The complete historical regression catalog remains active alongside launcher archive-integrity and workflow-contract coverage.
- Windows qualification builds and smokes both the unpacked and portable packaged game, then builds the existing Skirmish Arena launcher/installer.
- The existing GitHub release and launcher manifest pipeline remains the sole publication route. No alternate launcher, repository, prototype, or update system was introduced.
