import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const presentation = read('game/src/ui/WeaponPresentation.js');
const runtime = read('game/src/phase2011-runtime.js');
const css = read('game/src/ui-2.01.1.css');
const debug = read('game/src/debug-tuning.js');
const renderer = read('game/src/render/WeaponRenderer.js');
const weapons = read('game/src/data/weapons.js');
const constants = read('game/src/engine/constants.js');
const match = read('game/src/match/MatchManager.js');

assert.ok(debug.includes("import('./phase2011-runtime.js')"), '2.01.1 runtime must load after the existing release stack.');
assert.ok(presentation.includes("import { WeaponRenderer } from '../render/WeaponRenderer.js';"), 'UI previews must reuse the gameplay WeaponRenderer.');
assert.ok(presentation.includes('canvas[data-game-weapon-model]') || presentation.includes('data-game-weapon-model'), 'Weapon UI must emit gameplay-model canvas targets.');
assert.ok(presentation.includes('renderer[method](ctx, state, 0)'), 'Weapon UI previews must invoke the real gameplay renderer methods.');
assert.equal(presentation.includes('legacyWeaponModelSvg'), false, '2.01.1 must not retain a fake SVG weapon fallback.');
assert.equal(presentation.includes('function modelShape'), false, '2.01.1 must not retain separate authored SVG weapon silhouettes.');
assert.equal(presentation.includes('<svg class="phase2-weapon-svg'), false, '2.01.1 previews must be gameplay-rendered canvases, not SVG drawings.');

for (const method of ['drawAR', 'drawSMG', 'drawSniper', 'drawShotgun', 'drawLMG', 'drawPistol', 'drawLauncher', 'drawMelee']) {
  assert.ok(presentation.includes(`'${method}'`) || presentation.includes(`: '${method}'`), `2.01.1 preview mapping missing ${method}.`);
  assert.ok(renderer.includes(`${method}(ctx`), `Gameplay renderer missing canonical ${method}.`);
}

for (const token of [
  'enhanceWeaponInfoList',
  'phase2011-list-model',
  'enhanceRoundLoadoutSwitcher',
  'phase2011-round-models',
  'weaponModelSvg(slot.primary',
  'weaponModelSvg(slot.secondary',
  'hydrateWeaponModelCanvases'
]) assert.ok(runtime.includes(token), `2.01.1 UI runtime missing ${token}.`);

for (const token of [
  '.phase2011-weapon-canvas',
  '.phase2011-list-canvas',
  '#roundLoadoutGrid button',
  '.phase2011-round-models',
  '.phase2011-round-canvas'
]) assert.ok(css.includes(token), `2.01.1 presentation missing ${token}.`);

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

console.log('Skirmish Arena 2.01.1 checks passed: weapon info, loadouts and round-break switcher reuse the actual gameplay weapon models, fake SVG previews are forbidden, and gameplay contracts are unchanged.');
