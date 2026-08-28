import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const minimap = read('game/src/render/MinimapRenderer.js');
const camera = read('game/src/world/Camera.js');
const css = read('game/src/ui-2.4.2.1.css');
const phase241 = read('game/src/phase241-runtime.js');
const tactical = read('game/src/ui/TacticalHUD.js');
const constants = read('game/src/engine/constants.js');
const weapons = read('game/src/data/weapons.js');

for (const token of [
  'updatePlayerOverlap(localPlayer, camera = Camera.active)',
  "closest?.('.minimap-shell')",
  'camera.worldToScreen(localPlayer.x, localPlayer.y)',
  "shell.classList.toggle('player-overlap', overlaps)",
  'MINIMAP_OCCLUSION_PADDING'
]) {
  assert.ok(minimap.includes(token), `Adaptive minimap occlusion missing: ${token}`);
}

assert.ok(camera.includes('static active = null'), 'Camera must expose the active match camera for HUD occlusion checks.');
assert.ok(camera.includes('worldToScreen(worldX, worldY)'), 'Camera world-to-screen conversion must remain available.');
assert.ok(css.includes('.minimap-shell.player-overlap'), 'Minimap overlap presentation state missing.');
assert.ok(css.includes('opacity:.40!important'), 'Overlapped minimap must become substantially transparent.');
assert.ok(css.includes('brightness(1.34)'), 'Overlapped minimap must visibly lighten.');
assert.ok(css.includes('transition:opacity .16s ease,filter .16s ease'), 'Minimap fade must be smooth rather than popping.');

assert.ok(css.includes('width:min(430px,34vw)!important'), 'Kill feed width enlargement missing.');
assert.ok(css.includes('font-size:11px!important'), 'Kill feed text enlargement missing.');
assert.ok(css.includes('font-size:11.5px!important'), 'Kill feed player-name enlargement missing.');
assert.ok(css.includes('min-height:31px!important'), 'Kill feed row readability spacing missing.');

assert.ok(phase241.includes("ensureStyle('ui-2.4.2.1.css')"), '2.4.2.1 stylesheet must load through the deterministic runtime.');
assert.ok(phase241.includes("'ui-2421'"), '2.4.2.1 body scope must activate.');
assert.ok(tactical.includes('phase3BlueScoreRows') && tactical.includes('phase3RedScoreRows'), 'Separated team scoreboard from 2.4.1.2 must remain intact.');
assert.ok(constants.includes('DASH_STAMINA_COST = 0'), 'Dash stamina independence must remain intact.');
assert.ok(weapons.includes('fireInterval: 0.22') && weapons.includes('damage: 148'), '2.4.1 balance values must remain intact.');

console.log('Skirmish Arena 2.4.2.1 checks passed: adaptive minimap fade, larger kill feed, and 2.4.1.2 gameplay/HUD compatibility.');
