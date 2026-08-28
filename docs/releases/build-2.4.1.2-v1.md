# Skirmish Arena 2.4.1.2 — Build 1

## Round HUD + Team Scoreboard

A small presentation hotfix on top of the stable 2.4.1 balance/readability release.

### Match strip
- The center round counter is slightly larger for faster readability.
- The round timer is slightly larger and more prominent.
- Blue/Red rounds and kill counters retain their existing scale and team-color treatment.

### Scoreboard
- Global Top 3 and #1 MVP presentation remains.
- The mixed six-player ranking table is replaced by two explicit team sections.
- BLUE TEAM and RED TEAM appear side-by-side on desktop.
- Each team section independently ranks its three players by kills, damage, deaths and ID tiebreak order.
- Both sections retain K / D / A / K/D / DMG columns.
- Custom gamertags and team-color identity from 2.4.1 remain intact.
- Narrow layouts stack the two team sections vertically without changing gameplay.

### Compatibility
- No weapon-balance changes.
- No AI, movement, damage, Career, progression, loadout or match-rule changes.
- Dash remains independent from stamina.
- 2.4.1 low-ammo warning, pump shotgun, custom bot gamertags and team-colored kill feed remain intact.
- Deterministic startup and packaged Windows EXE smoke tests remain release-blocking requirements.
