import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const debug = read('game/src/debug-tuning.js');
const runtime = read('game/src/phase8-runtime.js');
const css = read('game/src/ui-phase8.css');
const phase7 = read('game/src/phase7-runtime.js');
const launcherMain = read('launcher/src/main.js');
const launcherRenderer = read('launcher/src/renderer.js');
const launcherIndex = read('launcher/src/index.html');
const launcherCss = read('launcher/src/phase8.css');
const weapons = read('game/src/data/weapons.js');
const constants = read('game/src/engine/constants.js');
const match = read('game/src/match/MatchManager.js');

assert.ok(debug.includes("import('./phase8-runtime.js')"), 'Phase 8 HUD runtime must load after Phase 7.');
assert.ok(runtime.includes("ensureStyle('ui-phase8.css')"), 'Phase 8 runtime must load its isolated stylesheet.');
assert.ok(runtime.includes("classList.add('ui-phase8')"), 'Phase 8 runtime must mark the document for scoped overrides.');

for (const token of [
  '.health-hud', '.stamina-hud', '.dash-hud', '.weapon-hud', '.minimap-shell',
  '.phase3-kill-feed', '.respawn-panel', '#healthStatus{display:none', '.weapon-controls{display:none'
]) assert.ok(css.includes(token), `Phase 8 professional HUD missing ${token}.`);

for (const label of ['TC // MID', 'BLUE SPAWN', 'RED SPAWN', 'SA // TRAINING', "fillText('SKIRMISH ARENA'"]) {
  assert.equal(phase7.includes(label), false, `Prototype-style map label must remain removed: ${label}`);
}

assert.ok(launcherIndex.includes('phase8.css'), 'Final launcher visual layer must be linked.');
assert.equal(launcherIndex.includes('MATCH CLIENT // 01'), false, 'Final launcher must remove prototype match-client copy.');
for (const token of ['manifestNeedsUpdate', 'latestNeedsInstall', 'verifyFile(currentGamePath(), expected)', "'Cache-Control': 'no-cache'"]) {
  assert.ok(launcherMain.includes(token), `Phase 8 launcher reliability missing ${token}.`);
}
for (const token of ["home: 'PLAY'", "button.textContent = 'PLAY'", "$('#updateStatus').textContent = 'UP TO DATE'"]) {
  assert.ok(launcherRenderer.includes(token), `Phase 8 launcher interaction polish missing ${token}.`);
}
for (const token of ['.build-focus', '.launch-button', '.status-strip', '.launcher-shell']) {
  assert.ok(launcherCss.includes(token), `Phase 8 final launcher presentation missing ${token}.`);
}

for (const forbidden of [
  "from './data/weapons.js'", "from './actors/Player.js'", "from './ai/BotController.js'",
  "from './match/MatchManager.js'", "from './world/map01.js'"
]) assert.equal(runtime.includes(forbidden), false, `Phase 8 HUD runtime must remain presentation-only: ${forbidden}.`);

// 2.4.1 is an intentional balance release, so historical Phase 8 protects the
// weapon data schema/roster rather than freezing obsolete numeric values.
for (const token of ["id: 'assault-rifle'", "id: 'smg'", "id: 'sniper'", "id: 'shotgun'", "id: 'lmg'", "id: 'pistol'", "id: 'launcher'", "id: 'melee'"]) {
  assert.ok(weapons.includes(token), `Eight-weapon roster changed unexpectedly: ${token}`);
}
for (const token of ['PLAYER_SPEED_TILES = 5', 'SPRINT_SPEED_MULTIPLIER = 1.35', 'DASH_CHARGES_MAX = 4', 'DASH_DISTANCE_TILES = 3']) {
  assert.ok(constants.includes(token), `Canonical movement contract changed: ${token}`);
}
for (const token of ['const ROUND_DURATION = 90;', 'const ROUND_KILL_TARGET = 12;', 'const ROUND_WINS_TO_MATCH = 5;']) {
  assert.ok(match.includes(token), `Canonical match contract changed: ${token}`);
}

console.log('Phase 8 checks passed: professional in-match HUD, no prototype map text, final launcher presentation, reliable update detection, and preserved core movement/match contracts.');
