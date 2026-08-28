import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const runtime = readFileSync(new URL('../game/src/phase2014-runtime.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../game/src/ui-2.01.4.css', import.meta.url), 'utf8');
const loader = readFileSync(new URL('../game/src/debug-tuning.js', import.meta.url), 'utf8');
const weapons = readFileSync(new URL('../game/src/data/weapons.js', import.meta.url), 'utf8');
const constants = readFileSync(new URL('../game/src/engine/constants.js', import.meta.url), 'utf8');
const match = readFileSync(new URL('../game/src/match/MatchManager.js', import.meta.url), 'utf8');

assert.match(loader, /phase2014-runtime\.js/);
assert.match(runtime, /ui-2\.01\.4\.css/);
assert.match(runtime, /ui-2014/);
assert.match(css, /weapon-info-open \.main-content/);
assert.match(css, /height:100%!important/);
assert.match(css, /overflow-y:auto!important/);
assert.match(css, /overflow-x:hidden!important/);
assert.match(css, /loadout-screen:not\(\.hidden\)/);
assert.match(css, /loadout-shell-v16/);
for (const forbidden of ["../data/weapons.js","../actors/Player.js","../ai/BotController.js","../match/MatchManager.js","../world/SpawnSystem.js","../world/map01.js"]) assert.ok(!runtime.includes(forbidden), `2.01.4 runtime must not import ${forbidden}`);
for (const id of ['assault-rifle','smg','sniper','shotgun','lmg','pistol','launcher','melee']) assert.match(weapons, new RegExp(`id:\\s*'${id}'`), `Weapon roster missing ${id}.`);
assert.match(weapons, /damage:\s*\d+(?:\.\d+)?/);
assert.match(constants, /PLAYER_SPEED_TILES\s*=\s*5/);
assert.match(match, /const ROUND_DURATION\s*=\s*90/);
assert.match(match, /const ROUND_KILL_TARGET\s*=\s*12/);

console.log('2.01.4 Weapon Info scroll regression passed with balance-ready weapon data.');
