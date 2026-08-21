import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const exists = (path) => fs.existsSync(new URL(`../${path}`, import.meta.url));

const index = read('game/src/index.html');
const flow = read('game/src/flow-v18.js');
const gameMain = read('game/src/main.js');
const launcher = read('launcher/src/index.html');
const weapons = read('game/src/data/weapons.js');
const constants = read('game/src/engine/constants.js');
const match = read('game/src/match/MatchManager.js');

const menuActions = [...index.matchAll(/data-menu-action="([^"]+)"/g)].map((match) => match[1]);
assert.deepEqual(
  menuActions,
  ['play', 'loadouts', 'settings', 'weapon-info', 'home', 'quit'],
  'Phase 1 must preserve the exact 1.9.2 menu action order and DOM contract.'
);

for (const token of [
  "assets/skirmish-arena-mark.svg",
  "brand.textContent = 'SKIRMISH ARENA'",
  "heroTitle.textContent = 'SKIRMISH ARENA'",
  "pauseBrand.textContent = 'SKIRMISH ARENA'",
  'SKIRMISH ARENA · LOADOUT CLIENT'
]) assert.ok(flow.includes(token), `Missing Phase 1 branding contract: ${token}`);

assert.ok(gameMain.includes("title: 'Skirmish Arena'"), 'Game window must use the Skirmish Arena title.');
assert.ok(launcher.includes('<strong>SKIRMISH</strong><span>ARENA //</span>'), 'Launcher must show Skirmish Arena branding.');
assert.ok(launcher.includes('assets/skirmish-arena-mark.svg'), 'Launcher must use the SA mark.');

assert.equal(flow.includes('pointerEvents'), false, 'Phase 1 must not manipulate pointer events.');
assert.equal(flow.includes('pointer-events'), false, 'Phase 1 must not inject pointer-event CSS.');
assert.equal(exists('game/src/phase2-ui.js'), false, 'Phase 2 runtime must not exist in 1.9.3.');
assert.equal(exists('game/src/phase3-hud.js'), false, 'Phase 3 runtime must not exist in 1.9.3.');
assert.equal(exists('game/src/phase4-runtime.js'), false, 'Phase 4 runtime must not exist in 1.9.3.');
assert.equal(exists('game/src/audio/AudioSystem.js'), false, 'Phase 4 audio framework must not exist in 1.9.3.');

for (const token of ['assaultRifle', 'launcher', 'melee']) assert.ok(weapons.includes(token), `Canonical weapon data missing ${token}`);
for (const token of ['DASH_CHARGES_MAX = 4', 'DASH_DISTANCE_TILES = 3', 'PLAYER_SPEED_TILES = 5']) assert.ok(constants.includes(token), `Canonical movement rule changed: ${token}`);
for (const token of ['const ROUND_DURATION = 90;', 'const ROUND_KILL_TARGET = 12;', 'const ROUND_WINS_TO_MATCH = 5;']) assert.ok(match.includes(token), `Canonical match rule changed: ${token}`);

console.log('1.9.3 Phase 1 checks passed: Skirmish Arena branding applied while the proven 1.9.2 front end and gameplay contracts remain intact.');
