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

assert.ok(debug.includes("import('./phase2012-runtime.js')"));
assert.ok(runtime.includes("ensureStyle('ui-2.01.2.css')"));
assert.ok(runtime.includes("classList.toggle('weapon-info-open'"));
assert.ok(runtime.includes('hydrateGameplayCrosshairCanvases'));
assert.ok(presentation.includes("import { CombatFeedbackRenderer } from '../render/CombatFeedbackRenderer.js';"));
assert.ok(presentation.includes('renderer.drawCrosshair('));
assert.ok(presentation.includes('data-game-crosshair-spread'));
for (const state of ["['BASE', base, false]", "['MOVING', moving, false]", "['ADS', ads, true]"]) assert.ok(presentation.includes(state), `Missing crosshair state ${state}.`);
assert.equal(presentation.includes('phase2-spread-visual'), false);
assert.ok(feedback.includes("gap=w.kind==='melee'?11:7+spread*2.2"));
assert.ok(feedback.includes("len=manager.isFullyADS()?7:8"));
for (const token of ['weapon-info-open .main-content','overflow:hidden!important','grid-template-rows:repeat(8,minmax(0,1fr))','weapon-info-open .weapon-info-detail','weapon-info-open .weapon-info-stats','grid-template-columns:repeat(4,minmax(0,1fr))','.phase2012-crosshair-states']) assert.ok(css.includes(token), `2.01.2 layout missing ${token}.`);
for (const id of ['assault-rifle','smg','sniper','shotgun','lmg','pistol','launcher','melee']) assert.ok(weapons.includes(`id: '${id}'`), `Weapon roster missing ${id}.`);
for (const field of ['damage:', 'critChance:', 'fireInterval:', 'magazineSize:', 'baseSpreadDegrees:', 'movingSpreadDegrees:']) assert.ok(weapons.includes(field), `Weapon schema missing ${field}`);
for (const token of ['PLAYER_SPEED_TILES = 5','SPRINT_SPEED_MULTIPLIER = 1.35','DASH_CHARGES_MAX = 4','DASH_DISTANCE_TILES = 3']) assert.ok(constants.includes(token));
for (const token of ['const ROUND_DURATION = 90;','const ROUND_KILL_TARGET = 12;','const ROUND_WINS_TO_MATCH = 5;']) assert.ok(match.includes(token));

console.log('Skirmish Arena 2.01.2 checks passed: real gameplay crosshair spread is reused with balance-ready weapon data.');
