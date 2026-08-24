import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const flow = read('game/src/flow-v18.js');
const runtime = read('game/src/phase3-runtime.js');
const tactical = read('game/src/ui/TacticalHUD.js');
const css = read('game/src/ui-phase3.css');
const minimap = read('game/src/render/MinimapRenderer.js');
const renderer = read('game/src/renderer.js');
const menu = read('game/src/ui/MainMenu.js');
const weapons = read('game/src/data/weapons.js');
const constants = read('game/src/engine/constants.js');
const match = read('game/src/match/MatchManager.js');

assert.ok(flow.includes("ensureStyle('ui-phase3.css')"), 'Phase 3 stylesheet must load from the established UI flow.');
assert.ok(flow.includes("import('./phase3-runtime.js')"), 'Phase 3 tactical runtime must load from the established UI flow.');
assert.ok(flow.includes("document.body.classList.add('ui-v18', 'ui-v19');"), 'Build 1.9 compatibility marker must remain exact.');
assert.ok(flow.includes("const order = ['play', 'loadouts', 'weapon-info', 'settings', 'quit'];"), 'Phase 2 menu hierarchy must remain intact.');
assert.ok(menu.includes("this.root.addEventListener('click'"), 'Phase 2 delegated menu click controller must remain intact.');
assert.ok(renderer.includes("const mainMenu = new MainMenu(document.getElementById('mainMenu')"), 'Established renderer menu wiring must remain intact.');

for (const forbidden of ['.main-menu', '.loadout-screen', '.phase2-nav-button', '#mainMenu']) {
  assert.equal(css.includes(forbidden), false, `Phase 3 CSS must not target front-end control surface ${forbidden}.`);
}
assert.ok(css.includes('.phase3-tactical-hud'), 'Phase 3 must have an isolated tactical HUD root.');
assert.ok(css.includes('pointer-events:none'), 'Tactical overlays must not capture mouse input.');

for (const token of [
  'TACTICAL MAP',
  'SCOREBOARD',
  'K/D',
  'DMG',
  '#1 OVERALL = MVP',
  'CRITICAL',
  'REVEALED ENEMY',
  "event.code === 'Tab'",
  "event.code === 'KeyM'"
]) assert.ok(tactical.includes(token), `Phase 3 tactical HUD missing ${token}.`);

assert.ok(runtime.includes('MatchManager.prototype.recordElimination'), 'Kill feed must hook the existing elimination pipeline without replacing it.');
assert.ok(runtime.includes("window.addEventListener('unblockedtdm:damage-applied'"), 'Scoreboard damage must use the existing damage event stream.');
assert.ok(runtime.includes('matchRef.statsSnapshot()'), 'Scoreboard must use canonical MatchManager statistics.');
assert.ok(minimap.includes('const ENEMY_REVEAL_SECONDS = 1.5;'), 'Enemy tactical reveal must remain 1.5 seconds.');
assert.ok(minimap.includes('drawFullMap(canvas'), 'M must render the full tactical map.');
for (const color of ['#ffffff', '#61cfff', '#ff6273']) assert.ok(minimap.includes(color), `Tactical map missing required actor color ${color}.`);

for (const token of [
  'damage: 20, critChance: 0.02, critDamage: 32',
  'damage: 145, critChance: 0.35, critDamage: 200',
  'damage: 125, critChance: 0, critDamage: 125'
]) assert.ok(weapons.includes(token), `Canonical weapon contract changed: ${token}`);
for (const token of ['PLAYER_SPEED_TILES = 5', 'SPRINT_SPEED_MULTIPLIER = 1.35', 'DASH_CHARGES_MAX = 4', 'DASH_DISTANCE_TILES = 3']) {
  assert.ok(constants.includes(token), `Canonical movement contract changed: ${token}`);
}
for (const token of ['const ROUND_DURATION = 90;', 'const ROUND_KILL_TARGET = 12;', 'const ROUND_WINS_TO_MATCH = 5;']) {
  assert.ok(match.includes(token), `Canonical match contract changed: ${token}`);
}

console.log('Phase 3 checks passed: tactical HUD, scoreboard, kill feed, full map, limited enemy reveal, front-end isolation, and unchanged gameplay contracts.');
