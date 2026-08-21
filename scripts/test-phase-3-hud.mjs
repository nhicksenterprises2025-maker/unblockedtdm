import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const hud = read('game/src/phase3-hud.js');
const css = read('game/src/ui-v30.css');
const match = read('game/src/match/MatchManager.js');
const minimap = read('game/src/render/MinimapRenderer.js');
const tuning = read('game/src/debug-tuning.js');

for (const token of ['skirmishTacticalHud', 'skirmishScoreboard', 'skirmishFullMap', 'topPerformers', 'K/D', 'DMG', 'CRITICAL', "event.code === 'Tab'", "event.code === 'KeyM'"]) {
  assert.ok(hud.includes(token), `Phase 3 HUD missing ${token}`);
}
assert.ok(match.includes("new CustomEvent('skirmish:hud'"), 'MatchManager must expose read-only scoreboard data.');
assert.ok(match.includes("new CustomEvent('skirmish:kill'"), 'MatchManager must expose kill-feed events.');
assert.ok(minimap.includes('const ENEMY_REVEAL_SECONDS = 1.5'), 'Tactical enemy reveal must remain limited to 1.5 seconds after firing.');
assert.ok(minimap.includes("friendly ? '#61cfff' : '#ff6273'"), 'Minimap team/enemy color distinction must remain intact.');
assert.ok(minimap.includes("ctx.fillStyle = '#ffffff'"), 'Local player must remain white on minimap.');
assert.ok(css.includes('.performer.rank-1'), 'MVP presentation styling is missing.');
assert.ok(css.includes('.kill-line.critical'), 'Critical kill-feed styling is missing.');
assert.ok(tuning.includes("import('./phase3-hud.js')"), 'Phase 3 must load through normal startup.');
console.log('Phase 3 HUD checks passed: tactical HUD, map, scoreboard, MVP/top 3, kill feed and tactical reveal behavior are present.');
