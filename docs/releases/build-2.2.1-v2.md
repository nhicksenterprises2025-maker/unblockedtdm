# Skirmish Arena 2.2.1 — Build 2

## Known-Good Rollback + Weapon Info Hotfix

This build intentionally restores the complete game runtime from the confirmed working `build-2.2.1-v1` release and removes the later 2.21.1 home/logo/startup runtime stack that caused broken menu interaction, missing Career presentation and visual regressions.

### Restored from the known-good 2.2.1 build
- Working clickable Main Menu and navigation flow.
- Full Career progression system with Levels 1–1000, ranks, XP and lifetime statistics.
- Existing Career persistence and saved progression data.
- Original 2.2.1 home-screen layout and interaction behavior.
- Silver Play treatment.
- Loadouts tile using live in-game weapon models.
- Silver Settings gear treatment.
- Existing Quit tile and navigation.
- Full-screen Weapon Info page behavior from 2.2.1.
- Rebindable Tactical Map / Scoreboard controls.
- 2.2.1 Shotgun range contract.
- All 2.2.1 gameplay, AI, movement, health, map and match behavior.

### Weapon Info hotfix
- Weapon Info tile now uses a dedicated blue blueprint/manual gun sketch instead of relying on the later broken home/logo runtime.
- Weapon Info navigation is explicitly kept clickable and forces the correct dedicated Weapon Info view when selected.
- Weapon Info opens at the top of its page and preserves the existing 2.2.1 detailed weapon data, models, crosshair/spread information and scrolling behavior.
- Added the hotfix as an isolated runtime so the rest of the known-good 2.2.1 menu remains untouched.

### Release safety
- The game runtime is rolled back, but the current hardened launcher and release infrastructure are preserved.
- Release sequence advances to 45 so existing launchers on later broken builds are offered this rollback as an update.
- No 2.21.1 home-logo, modern-UI bootstrap or packaged-shell patches are included in the game runtime.

### Gameplay
- No new weapon damage, critical chance, fire rate, magazine, reload, spread or movement balance changes.
- No new player movement, sprint, dash, health, AI, map, spawn or match-rule changes.
- Career XP requirements, rank thresholds and milestone rewards are restored exactly from the working 2.2.1 line.
