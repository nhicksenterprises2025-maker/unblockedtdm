# Skirmish Arena 2.4.3.1 — Build 1

## Arena Phase 1

This update introduces the complete first-stage Arena ranked framework on top of the stable 2.4.2.1 combat/UI baseline. Career remains permanent and independent.

### Play flow
- PLAY now opens a CASUAL / ARENA mode selector.
- CASUAL uses the proven standard match flow and never changes Arena Points.
- ARENA activates monthly competitive scoring before handing control back to the existing Loadout screen and match flow.
- The mode selector appears every time PLAY is selected, preventing accidental ranked deployment.

### Monthly Arena ladder
- Prospect — 0 AP
- Rookie I — 100 AP
- Rookie II — 250 AP
- Bronze Tier I — 450 AP
- Bronze Tier II — 700 AP
- Bronze Tier III — 1,000 AP
- Silver Tier I — 1,350 AP
- Silver Tier II — 1,750 AP
- Gold — 2,200 AP
- Platinum — 2,700 AP
- Diamond — 3,200 AP
- Pink Diamond — 3,600 AP
- Dark Opal — 3,900 AP
- Omnipotent — 4,200 AP

### Arena Point economy
- Kill: +1 AP
- Critical Kill: +2 AP total
- Assist: +0.5 AP
- Round Win: +2.5 AP
- Match Win: +10 AP
- 5 Kill Streak: +2 AP
- 10 Kill Streak: +5 AP
- 5–0 Victory: +10 AP
- MVP: +5 AP
- Comeback Victory after trailing by at least 3 rounds: +8 AP
- Team Wipe: +2.5 AP
- Sudden Death winning elimination: +2 AP
- Negative K/D: -10 AP
- Match Loss: -8 AP
- Loss and negative-K/D penalties stack.
- Arena Points never fall below 0 and players can demote when they fall below a rank threshold.

### Arena seasons
- Arena resets at local 12:00 AM on the first day of every month.
- Rank and current Arena Points reset to Prospect / 0 AP.
- The previous season is archived instead of deleted.
- Reset logic is checked at startup and while the client remains open, so an offline player still receives the correct reset on the next launch.
- Career level, Career XP, lifetime Career data, loadouts, controls and settings are never reset by Arena.

### Ranked integrity
- Every Arena match receives a unique match ID.
- Completed match IDs are persisted so the same result cannot grant AP twice.
- Active Arena matches are persisted.
- Returning to the main menu during an Arena match records a forfeit.
- A crash or shutdown that leaves an active Arena match is recovered as a forfeit on the next boot.

### Arena UI
- A new Arena progress strip sits directly beneath Career on Home.
- The Arena strip intentionally reuses the Career panel's geometry, spacing, stat columns, progress bar hierarchy and recent-results row.
- The strip shows current monthly rank, record, season K/D, AP progress, next rank and reset date.
- VIEW ARENA opens a dedicated Overview / Ranks / History page.
- Functional scaled Arena emblems are included for Phase 1; the final authored 14-emblem art pass remains scheduled for Phase 2.
- Arena postgame results show the exact AP breakdown, before/after AP and promotion/demotion state.

### Compatibility
- Career Level 1–1000 remains unchanged and continues to progress in both Casual and Arena.
- Existing weapon balance, movement, dash, AI, HUD, Loadouts, Weapon Info and Training Complex remain unchanged.
- The new Arena runtime is additive and uses the existing MatchManager event flow rather than replacing the proven match controller.
- The packaged Windows smoke test now requires Arena readiness in addition to Skirmish Arena branding, Career, Weapon Info and the main logo before a release may publish.
