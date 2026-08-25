import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const presentation = read('game/src/ui/WeaponPresentation.js');
const runtime = read('game/src/phase2012-runtime.js');
const css = read('game/src/ui-2.01.2.css');
const debug = read('game/src/debug-tuning.js');
const feedback = read('game/src/render/CombatFeedbackRenderer.js');
const weapons = read('game/src/data/weapons.js');
const constants = read('game/src/engine/constants.js');
const match = read('game/src/match/MatchManager.js');

assert.ok(debug.includes("import('./phase2012-runtime.js')"), '2.01.2 runtime must load after 2.01.1.');
assert.ok(runtime.includes("ensureStyle('ui-2.01.2.css')"), '2.01.2 runtime must load the new stylesheet.');
assert.ok(runtime.includes("classList.toggle('weapon-info-open'"), 'Weapon Info viewport lock must only activate while that view is open.');
assert.ok(runtime.includes('hydrateGameplayCrosshairCanvases'), '2.01.2 runtime must hydrate gameplay crosshair canvases.');

assert.ok(presentation.includes("import { CombatFeedbackRenderer } from '../render/CombatFeedbackRenderer.js';"), 'Spread visualizer must reuse the gameplay CombatFeedbackRenderer.');
assert.ok(presentation.includes('renderer.drawCrosshair('), 'Spread visualizer must call the actual gameplay drawCrosshair method.');
assert.ok(presentation.includes('data-game-crosshair-spread'), 'Spread visualizer must emit live crosshair canvas targets.');
for (const state of ["['BASE', base, false]", "['MOVING', moving, false]", "['ADS', ads, true]"]) {
  assert.ok(presentation.includes(state), `Missing real crosshair state: ${state}`);
}
assert.equal(presentation.includes('phase2-spread-visual'), false, 'Old wedge-style spread visualizer must not return.');

assert.ok(feedback.includes("gap=w.kind==='melee'?11:7+spread*2.2"), 'Canonical live crosshair gap formula changed.');
assert.ok(feedback.includes("len=manager.isFullyADS()?7:8"), 'Canonical live ADS crosshair length changed.');

for (const token of [
  'weapon-info-open .main-content',
  'overflow:hidden!important',
  'grid-template-rows:repeat(8,minmax(0,1fr))',
  'weapon-info-open .weapon-info-detail',
  'weapon-info-open .weapon-info-stats',
  'grid-template-columns:repeat(4,minmax(0,1fr))',
  '.phase2012-crosshair-states'
]) assert.ok(css.includes(token), `2.01.2 no-scroll/crosshair layout missing: ${token}`);

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

console.log('Skirmish Arena 2.01.2 checks passed: actual gameplay crosshair spread is reused and Weapon Info is viewport-locked without gameplay changes.');
