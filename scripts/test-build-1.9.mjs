import fs from 'node:fs';
import assert from 'node:assert/strict';

const hudCss = fs.readFileSync(new URL('../game/src/ui-v19.css', import.meta.url), 'utf8');
const flow = fs.readFileSync(new URL('../game/src/flow-v18.js', import.meta.url), 'utf8');
const weapons = fs.readFileSync(new URL('../game/src/data/weapons.js', import.meta.url), 'utf8');
const constants = fs.readFileSync(new URL('../game/src/engine/constants.js', import.meta.url), 'utf8');
const match = fs.readFileSync(new URL('../game/src/match/MatchManager.js', import.meta.url), 'utf8');

for (const selector of ['.match-hud', '.minimap-shell', '.health-hud', '.stamina-hud', '.weapon-hud', '.dash-hud', '.round-overlay']) {
  assert.ok(hudCss.includes(selector), `Build 1.9 HUD layer missing ${selector}`);
}
for (const token of ['--hud-blue:#5ed2ff', '--hud-red:#ff7180', '--hud-green:#62e5a6', 'ui-monospace', 'border-radius:50%']) {
  assert.ok(hudCss.includes(token), `Build 1.9 visual contract missing ${token}`);
}
assert.ok(flow.includes("ensureStyle('ui-v19.css')"), 'Build 1.9 HUD stylesheet must be loaded by the active flow runtime.');
assert.ok(flow.includes("classList.add('ui-v18', 'ui-v19')"), 'Build 1.9 body marker missing.');

assert.ok(weapons.includes('assaultRifle'), 'Canonical weapons file must remain present.');
assert.ok(constants.includes('DASH_CHARGES_MAX = 4'), 'Dash charge rule changed unexpectedly.');
assert.ok(constants.includes('DASH_DISTANCE_TILES = 3'), 'Dash distance changed unexpectedly.');
assert.ok(match.includes('const ROUND_DURATION = 90;'), 'Round duration changed unexpectedly.');
assert.ok(match.includes('const ROUND_KILL_TARGET = 12;'), 'Round kill target changed unexpectedly.');
assert.ok(match.includes('const ROUND_WINS_TO_MATCH = 5;'), 'Match win target changed unexpectedly.');

console.log('Build 1.9 release-candidate HUD and canonical-rule checks passed.');
