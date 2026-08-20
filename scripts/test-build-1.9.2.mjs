import fs from 'node:fs';
import assert from 'node:assert/strict';
import { LoadoutStore, LOADOUT_SLOT_COUNT, DEFAULT_LOADOUT_SLOT_COUNT } from '../game/src/data/LoadoutStore.js';
import { WEAPONS } from '../game/src/data/weapons.js';

class MemoryStorage {
  constructor(seed = {}) { this.values = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)])); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

const freshStorage = new MemoryStorage();
const fresh = new LoadoutStore(freshStorage);
assert.equal(DEFAULT_LOADOUT_SLOT_COUNT, 3);
assert.equal(LOADOUT_SLOT_COUNT, 25);
assert.equal(fresh.count(), 3);
assert.equal(fresh.all().length, 3);
assert.equal(fresh.canAddSlot(), true);

const fourth = fresh.addSlot();
assert.equal(fourth.index, 3);
assert.equal(fresh.count(), 4);
assert.equal(fresh.all().length, 4);
assert.equal(new LoadoutStore(freshStorage).count(), 4, 'Created slot count must persist across restarts.');

while (fresh.canAddSlot()) fresh.addSlot();
assert.equal(fresh.count(), 25);
assert.equal(fresh.all().length, 25);
assert.equal(fresh.addSlot(), null);
assert.equal(fresh.canAddSlot(), false);

const legacyEntries = Array.from({ length: 25 }, (_, index) => ({
  name: index === 0 ? 'Balanced' : `Loadout ${String(index + 1).padStart(2, '0')}`,
  primaryId: 'assault-rifle',
  secondaryId: 'pistol'
}));
legacyEntries[9] = { name: 'Legacy Ten', primaryId: WEAPONS.sniper.id, secondaryId: WEAPONS.launcher.id };
const legacyStorage = new MemoryStorage({
  'unblockedtdm.loadouts.v1': JSON.stringify(legacyEntries),
  'unblockedtdm.activeLoadout': '9'
});
const legacy = new LoadoutStore(legacyStorage);
assert.equal(legacy.count(), 10, 'Legacy customized/active higher slots must remain visible after migration.');
assert.equal(legacy.get(9).name, 'Legacy Ten');
assert.equal(legacy.get(9).primary.id, 'sniper');
assert.equal(legacy.get(9).secondary.id, 'launcher');

const screenSource = fs.readFileSync(new URL('../game/src/ui/LoadoutScreen.js', import.meta.url), 'utf8');
for (const token of ['addSavedSlot()', 'id="addLoadoutSlot"', '+', 'ADD SLOT', 'Three slots are available by default']) {
  assert.ok(screenSource.includes(token), `Build 1.9.2 loadout UI missing ${token}`);
}
const hotfixCss = fs.readFileSync(new URL('../game/src/ui-v192.css', import.meta.url), 'utf8');
assert.ok(hotfixCss.includes('.loadout-add-slot'), 'Build 1.9.2 add-slot action must have intentional styling.');
const flow = fs.readFileSync(new URL('../game/src/flow-v18.js', import.meta.url), 'utf8');
assert.ok(flow.includes("ensureStyle('ui-v192.css')"), 'Build 1.9.2 hotfix stylesheet must load.');

console.log('Build 1.9.2 tests passed: 3-slot default, manual expansion, 25-slot cap, persistence and legacy preservation.');
