import assert from 'node:assert/strict';
import { LoadoutStore, LOADOUT_SLOT_COUNT, DEFAULT_LOADOUT_SLOT_COUNT } from '../game/src/data/LoadoutStore.js';
import { WEAPONS } from '../game/src/data/weapons.js';
import { MatchManager } from '../game/src/match/MatchManager.js';

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

const storage = new MemoryStorage();
const store = new LoadoutStore(storage);
assert.equal(LOADOUT_SLOT_COUNT, 25);
assert.equal(DEFAULT_LOADOUT_SLOT_COUNT, 3);
assert.equal(store.capacity(), 25);
assert.equal(store.all().length, 3);
assert.equal(store.get().primary.id, 'assault-rifle');
assert.equal(store.get().secondary.id, 'pistol');

const saved = store.save(7, { name: 'Long Range', primary: WEAPONS.sniper, secondary: WEAPONS.launcher });
assert.equal(saved.index, 7);
assert.equal(saved.name, 'Long Range');
assert.equal(saved.primary.id, 'sniper');
assert.equal(saved.secondary.id, 'launcher');
assert.equal(store.activeIndex, 7);
assert.equal(store.all().length, 8, 'Saving a higher legacy slot should preserve and reveal it.');

const restored = new LoadoutStore(storage);
assert.equal(restored.activeIndex, 7);
assert.equal(restored.all().length, 8);
assert.equal(restored.get().name, 'Long Range');
assert.equal(restored.get().primary.id, 'sniper');
assert.equal(restored.get().secondary.id, 'launcher');

restored.rename(7, 'Precision');
assert.equal(new LoadoutStore(storage).get(7).name, 'Precision');

assert.throws(() => restored.save(1, { name: 'Invalid', primary: WEAPONS.pistol, secondary: WEAPONS.launcher }));
assert.throws(() => restored.save(1, { name: 'Duplicate', primary: WEAPONS.shotgun, secondary: WEAPONS.shotgun }));

const match = new MatchManager({ players: [], spawnSystem: { map: { definition: { spawns: { blue: [], red: [] } } } }, projectileSystem: null });
match.state = 'active';
assert.equal(match.canChangeLoadout(), false);
match.state = 'round-break';
assert.equal(match.canChangeLoadout(), true);
match.state = 'sudden-death';
assert.equal(match.canChangeLoadout(), false);

console.log('Build 1.5 tests passed: 25-slot capacity, persistent loadouts, validation, restore, and round-break-only switching.');
