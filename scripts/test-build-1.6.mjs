import fs from 'node:fs';
import assert from 'node:assert/strict';
import { DEFAULT_BINDINGS, GameSettings } from '../game/src/engine/GameSettings.js';
import { Input, isUiTarget } from '../game/src/engine/Input.js';
import { LoadoutStore } from '../game/src/data/LoadoutStore.js';
import { WEAPONS } from '../game/src/data/weapons.js';
import { MatchManager } from '../game/src/match/MatchManager.js';

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

const storage = new MemoryStorage();
const settings = new GameSettings(storage);
assert.equal(settings.gameplay().sensitivity, 1);
assert.equal(settings.gameplay().aiDifficulty, 'Average');
settings.setGameplay('sensitivity', 1.75);
settings.setGameplay('aiDifficulty', 'Pro');
assert.equal(settings.gameplay().sensitivity, 1.75);
assert.equal(settings.gameplay().aiDifficulty, 'Pro');

const oldFire = settings.binding('fire');
const oldAds = settings.binding('ads');
assert.equal(oldFire, DEFAULT_BINDINGS.fire);
assert.equal(oldAds, DEFAULT_BINDINGS.ads);
const swap = settings.setBinding('fire', oldAds);
assert.equal(swap.ok, true);
assert.equal(swap.swappedAction, 'ads');
assert.equal(settings.binding('fire'), oldAds);
assert.equal(settings.binding('ads'), oldFire);
settings.resetBindings();
assert.equal(settings.binding('fire'), DEFAULT_BINDINGS.fire);

assert.equal(isUiTarget({ closest: () => ({}) }), true);
assert.equal(isUiTarget({ closest: () => null }), false);

globalThis.innerWidth = 1280;
globalThis.innerHeight = 720;
const fakeTarget = { addEventListener() {} };
const input = new Input(fakeTarget, settings);
input.down.add('KeyW');
assert.equal(input.axis().y, -1);
input.clearTransientState();
settings.setBinding('moveUp', 'KeyI');
input.down.add('KeyI');
assert.equal(input.axis().y, -1);
input.mouseDown.add(0);
assert.equal(input.fireHeld(), true);
input.setSuspended(true);
assert.equal(input.down.size, 0);
assert.equal(input.mouseDown.size, 0);

const loadoutStorage = new MemoryStorage();
const loadouts = new LoadoutStore(loadoutStorage);
assert.equal(loadouts.all().length, 25);
loadouts.save(4, { name: 'Aggro', primary: WEAPONS.smg, secondary: WEAPONS.shotgun });
loadouts.setActive(4);
const reloaded = new LoadoutStore(loadoutStorage);
assert.equal(reloaded.get().name, 'Aggro');
assert.equal(reloaded.get().primary.id, 'smg');
assert.equal(reloaded.get().secondary.id, 'shotgun');

const match = new MatchManager({ players: [], spawnSystem: null, projectileSystem: { reset() {} } });
match.state = 'active';
assert.equal(match.canChangeLoadout(), false);
match.state = 'round-break';
assert.equal(match.canChangeLoadout(), true);

const html = fs.readFileSync(new URL('../game/src/index.html', import.meta.url), 'utf8');
const renderer = fs.readFileSync(new URL('../game/src/renderer.js', import.meta.url), 'utf8');
const requiredHtml = [
  'data-menu-action="play"',
  'data-menu-action="loadouts"',
  'data-menu-action="settings"',
  'data-menu-action="weapon-info"',
  'data-menu-action="quit"',
  'id="pausePanel"',
  'id="resumeButton"',
  'id="pauseSettingsButton"',
  'id="settingsBackButton"',
  'data-bindings-grid',
  'data-ui-surface'
];
for (const token of requiredHtml) assert.ok(html.includes(token), `Missing UI contract: ${token}`);
for (const token of ['new MainMenu(', 'new SettingsPanel(', 'input.setSuspended(paused)', "addEventListener('click', () => setPaused(false))"]) {
  assert.ok(renderer.includes(token), `Missing runtime wiring: ${token}`);
}

console.log('Build 1.6 settings, bindings, loadout persistence, menu contract and pause-input checks passed.');
