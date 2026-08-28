# Skirmish Arena 2.4.3.2 — Build 1

## Arena Phase 2 — Foundry Zero + Final Rank Emblems

Phase 2 completes the visual/content half of the Arena ranked foundation introduced in 2.4.3.1.

### New Arena-exclusive map: Foundry Zero

- Arena now loads **Foundry Zero** instead of Training Complex.
- Casual remains on **Training Complex**.
- Foundry Zero uses the proven 32×22 world footprint so camera, minimap, collision and match timing stay stable.
- New symmetrical competitive geometry includes:
  - protected three-player spawn pockets
  - north and south forge halls
  - split center-core structures
  - dedicated center-lane rail cover
  - fast north/south flank gates
  - mirrored contest angles for Blue and Red
- Foundry Zero is marked `arenaOnly` and cannot replace the Casual map accidentally.
- Tactical-map naming and Home map status now follow the live map.

### Dynamic map architecture

- `TileMap` can switch definitions without rebuilding the entire renderer.
- Map switches increment a revision value.
- Bot grid navigation automatically rebuilds when the map revision changes.
- Arena rematches remain on Foundry Zero.
- Returning to Casual restores Training Complex and refreshes pathfinding.

### Final 14 Arena rank emblems

The generic Phase-1 chevron badge has been removed. Every Arena rank now has distinct authored SVG emblem geometry:

1. Prospect
2. Rookie I
3. Rookie II
4. Bronze Tier I
5. Bronze Tier II
6. Bronze Tier III
7. Silver Tier I
8. Silver Tier II
9. Gold
10. Platinum
11. Diamond
12. Pink Diamond
13. Dark Opal
14. Omnipotent

The visual ladder progresses from raw-steel marks into military crests, prestige crowns/hex geometry, crystal ranks, Dark Opal, and a unique Omnipotent singularity/crown emblem.

### Arena presentation

- Casual and Arena mode cards now show their actual map assignment.
- Arena selection identifies **Foundry Zero** before loadout/deployment.
- Ranked round overlays identify Arena + Foundry Zero.
- Tactical map headers use the active map name.
- Arena rank cards and Home rank presentation use the new authored emblems.

### Validation

Release regression coverage verifies:

- all 14 rank IDs have distinct authored emblem markup
- Foundry Zero contains complete competitive geometry
- all six Foundry Zero spawn positions are collision safe
- every Blue spawn can navigate to every Red spawn
- pathfinding rebuilds after switching maps
- returning to Training Complex remains navigable
- Arena Phase 1 AP/persistence contracts remain intact
- all historical gameplay/UI regression tests still pass
- packaged Windows smoke validation requires the Phase-2 runtime, Foundry Zero registration and all 14 emblem IDs

### No balance changes

This release does **not** change weapon damage, range, fire rate, health, movement, dash, Career XP, Arena AP values, AI difficulty multipliers or match rules.
