# UnblockedTDM Build 1.9.2 — Version 1

## Loadout UI Hotfix

Build 1.9.2 Version 1 is a focused UI/persistence hotfix for saved loadout slots. Gameplay balance and the Build 1.9 release-candidate HUD are unchanged.

### Loadout slot behavior
- Fresh profiles now start with 3 created loadout slots instead of displaying all 25 immediately.
- A dedicated `+ ADD SLOT` action creates the next loadout slot on demand.
- Players can expand progressively up to the existing hard cap of 25 slots.
- The add action disappears into a MAX SLOTS state once all 25 are created.
- The loadout footer now reports created slots versus maximum capacity.
- The pre-match and management screens use the same created-slot list.
- The between-round quick loadout selector automatically shows only created slots because it reads the same store list.

### Save compatibility
- Internal storage still retains capacity for all 25 slots.
- Existing customized higher-numbered slots are detected and preserved when upgrading from Build 1.9.
- An existing active higher-numbered slot is also preserved and remains visible.
- The created-slot count persists across restarts after the first Build 1.9.2 migration.
- No existing weapon selection, loadout name, settings, keybind or last-match data is intentionally cleared.

### Preserved systems
Build 1.9.2 does not change weapon stats, health, movement, sprint, dash, AI, pathfinding, spawn rules, match rules, HUD gameplay presentation, launcher UI or postgame behavior.

### Validation gate
Windows packaging begins only after the complete historical regression chain passes plus Build 1.9.2 checks for the 3-slot default, manual expansion, 25-slot cap, restart persistence, legacy higher-slot preservation and add-slot UI contract.
