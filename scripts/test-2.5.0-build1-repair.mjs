import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DEFAULT_BINDINGS, GAMEPLAY_DEFAULTS, GameSettings } from '../game/src/engine/GameSettings.js';

const read = (relative) => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const renderer = read('game/src/renderer.js');
const settingsSource = read('game/src/engine/GameSettings.js');
const settingsPanel = read('game/src/ui/SettingsPanel.js');
const tacticalRuntime = read('game/src/phase3-runtime.js');
const ammoRuntime = read('game/src/phase241-runtime.js');
const loadoutRuntime = read('game/src/phase2431-runtime.js');
const presentationRuntime = read('game/src/phase250-runtime.js');
const weaponCanvasRuntime = read('game/src/phase2011-runtime.js');
const canvasSizingRuntime = read('game/src/phase2012-runtime.js');
const menuRuntime = read('game/src/phase221-runtime.js');
const loadoutScreen = read('game/src/ui/LoadoutScreen.js');
const css = read('game/src/ui-2.5.0.css');
const releaseWorkflow = read('.github/workflows/publish-windows.yml');

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

// A static menu or pause surface must draw the arena exactly once per
// map/viewport key, while live play clears the key and resumes every-frame work.
for (const token of [
  'let staticRenderKey = null',
  'const staticSurface = !matchStarted || isPaused',
  "`${isPaused ? 'pause' : 'menu'}:${map.definition?.id || 'map'}:${innerWidth}x${innerHeight}:${dpr}`",
  'if (staticRenderKey === nextStaticKey) return',
  'staticRenderKey = nextStaticKey',
  'staticRenderKey = null'
]) assert.ok(renderer.includes(token), `Static arena rendering guard missing: ${token}`);
const resizeCanvasBody = renderer.match(/function resizeCanvas\(\) \{([\s\S]*?)\r?\n\}/)?.[1];
assert.ok(resizeCanvasBody, 'The canvas resize lifecycle must remain available for static-frame invalidation checks.');
const resizeInvalidationIndex = resizeCanvasBody.lastIndexOf('staticRenderKey = null');
for (const mutation of ['canvas.width =', 'canvas.height =', 'camera.resize(']) {
  const mutationIndex = resizeCanvasBody.indexOf(mutation);
  assert.ok(mutationIndex >= 0, `Canvas resize lifecycle missing: ${mutation}`);
  assert.ok(
    resizeInvalidationIndex > mutationIndex,
    `resizeCanvas must invalidate the cached Home/Pause frame after ${mutation} clears or changes the render target.`
  );
}

// User-authored loadout names must never be interpolated into the round picker
// as raw markup. The pause picker already follows the same escaping contract.
assert.ok(renderer.includes('<span>${escapeMarkup(slot.name)}</span>'));
assert.equal(renderer.includes('<span>${slot.name}</span>'), false);

// Reset operations write complete defaults in a batch and dispatch once. This
// behavior check prevents the old reset-all settings event storm from returning.
const priorWindow = globalThis.window;
const priorCustomEvent = globalThis.CustomEvent;
const settingsEvents = [];
try {
  globalThis.window = { dispatchEvent(event) { settingsEvents.push(event); return true; } };
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
  };

  const storage = new MemoryStorage();
  const settings = new GameSettings(storage);
  settings.setGameplay('sensitivity', 2.1);
  settings.setGameplay('showFps', true);
  settings.setBinding('fire', 'KeyF');

  settingsEvents.length = 0;
  assert.deepEqual(settings.resetGameplay(), GAMEPLAY_DEFAULTS);
  assert.equal(settingsEvents.length, 1, 'resetGameplay must emit one consolidated settings event.');

  settings.setBinding('fire', 'KeyG');
  settingsEvents.length = 0;
  assert.deepEqual(settings.resetBindings(), DEFAULT_BINDINGS);
  assert.equal(settingsEvents.length, 1, 'resetBindings must emit one consolidated settings event.');

  settings.setGameplay('masterVolume', 0.2);
  settings.setBinding('reload', 'KeyQ');
  settingsEvents.length = 0;
  const reset = settings.resetAll();
  assert.deepEqual(reset.gameplay, GAMEPLAY_DEFAULTS);
  assert.deepEqual(reset.bindings, DEFAULT_BINDINGS);
  assert.equal(settingsEvents.length, 1, 'resetAll must emit once after both settings groups are restored.');
  assert.equal(settingsEvents[0].type, 'unblockedtdm:settings-change');
  assert.deepEqual(settingsEvents[0].detail, reset);
} finally {
  if (priorWindow === undefined) delete globalThis.window;
  else globalThis.window = priorWindow;
  if (priorCustomEvent === undefined) delete globalThis.CustomEvent;
  else globalThis.CustomEvent = priorCustomEvent;
}
for (const token of [
  'resetGameplay({ emit = true } = {})',
  'resetBindings({ emit = true } = {})',
  'this.resetGameplay({ emit:false })',
  'this.resetBindings({ emit:false })'
]) assert.ok(settingsSource.includes(token), `Batched settings reset wiring missing: ${token}`);
assert.ok(settingsPanel.includes("if (action === 'reset-all') this.settings.resetAll()"));

// Pausing or hiding the game only deactivates tactical presentation. It cannot
// masquerade as a new match session and reset the tactical HUD on resume.
for (const token of [
  'let wasMatchSessionActive = false',
  "const matchSessionActive = matchStarted && matchRef.state !== 'match-over'",
  'const visible = matchSessionActive && !paused && !document.hidden',
  'if (matchSessionActive && !wasMatchSessionActive) tacticalHud.reset()',
  'tacticalHud.setActive(visible)',
  'wasMatchSessionActive = matchSessionActive',
  'if (!visible) return',
  'window.clearInterval(tacticalHudTimer)'
]) assert.ok(tacticalRuntime.includes(token), `Tactical HUD session guard missing: ${token}`);
assert.equal(tacticalRuntime.includes('let wasActive = false'), false);

// Background tabs no longer burn a 20 Hz low-ammo poll, and the timer is
// explicitly cleaned up with a visibility resync when the tab returns.
for (const token of [
  'if (document.hidden) return',
  'window.setInterval(syncLowAmmoHud, 100)',
  "document.addEventListener('visibilitychange', syncLowAmmoHud)",
  'window.clearInterval(lowAmmoTimer)'
]) assert.ok(ammoRuntime.includes(token), `Low-ammo polling safeguard missing: ${token}`);

// Dynamic presentation work must filter added nodes before scheduling a scan,
// coalesce nested roots, and release retained observers/roots on teardown.
for (const token of [
  'const POLISH_SELECTOR = [',
  'const polishRoots = new Set()',
  'node.matches(POLISH_SELECTOR)',
  'node.querySelector(POLISH_SELECTOR)',
  'if (polishFrame) return',
  'observer.disconnect()',
  'polishRoots.clear()'
]) assert.ok(presentationRuntime.includes(token), `Filtered 2.5 presentation observer missing: ${token}`);

for (const [name, source, required] of [
  ['weapon canvases', weaponCanvasRuntime, ["document.querySelector('[data-weapon-info-list]')", "document.getElementById('roundLoadoutGrid')"]],
  ['canvas sizing', canvasSizingRuntime, ["document.getElementById('mainMenu')", "document.getElementById('loadoutScreen')"]],
  ['menu polish', menuRuntime, ["document.getElementById('mainMenu')"]]
]) {
  assert.equal(source.includes('observer.observe(document.documentElement'), false, `${name} must not observe the entire document tree.`);
  for (const token of required) assert.ok(source.includes(token), `${name} observer scope missing: ${token}`);
  assert.ok(source.includes('observer.disconnect()'), `${name} observer must disconnect during teardown.`);
}

// LoadoutScreen replaces its entire subtree after every action. The render event
// is therefore the stable hook that restores the Casual/Arena route indicator.
for (const token of [
  "new CustomEvent('skirmish:loadout-rendered'",
  'bubbles:true',
  'detail:{ mode:this.mode, slotIndex:this.selectedIndex, weaponSlot:this.activeSlot }'
]) assert.ok(loadoutScreen.includes(token), `Loadout render lifecycle signal missing: ${token}`);
for (const token of [
  "window.addEventListener('skirmish:loadout-rendered'",
  "syncLoadoutMode(window.__SKIRMISH_MATCH_MODE__ === 'arena' ? 'arena' : 'casual')",
  "const eyebrow = head.querySelector('.eyebrow')",
  "eyebrow.insertAdjacentElement('afterend', pill)"
]) assert.ok(loadoutRuntime.includes(token), `Persistent loadout mode indicator wiring missing: ${token}`);
for (const forbidden of ['head.appendChild(pill)', 'head.append(pill)']) {
  assert.equal(loadoutRuntime.includes(forbidden), false, 'The mode pill must stay in the title copy beside the eyebrow instead of becoming a third Loadouts header flex child.');
}
const baseModePillRule = css.match(/body\.ui-250 \.loadout-mode-pill\{([^}]*)\}/)?.[1];
assert.ok(baseModePillRule, 'Loadouts must deliberately style its mode pill instead of inheriting a generic badge treatment.');
for (const token of ['display:inline-flex', 'border-left:3px solid', 'background:', 'font:']) {
  assert.ok(baseModePillRule.includes(token), `Base Loadouts mode-pill styling missing: ${token}`);
}
const arenaModePillRule = css.match(/body\.ui-250 \.loadout-mode-pill\.arena\{([^}]*)\}/)?.[1];
assert.ok(arenaModePillRule, 'Arena mode must have a deliberate visual state on the Loadouts mode pill.');
for (const token of ['border-color:', 'border-left-color:', 'background:', 'color:']) {
  assert.ok(arenaModePillRule.includes(token), `Arena Loadouts mode-pill styling missing: ${token}`);
}

// At the supported 960px minimum, the Pause content pane is narrower than the
// overall viewport because its section rail remains visible. Collapse the
// 690px-minimum match brief before that pane can overflow horizontally.
const pauseMinimumWidthRule = css.match(/@media\(max-width:1040px\)\{([\s\S]*?)(?=\r?\n@media|\s*$)/)?.[1];
assert.ok(pauseMinimumWidthRule, 'Pause must retain a 1040px breakpoint for its narrower content pane.');
assert.ok(
  pauseMinimumWidthRule.includes('body.ui-250 .pause-match-brief{grid-template-columns:1fr}'),
  'The Pause match brief must collapse to one column by 1040px.'
);
assert.ok(
  pauseMinimumWidthRule.includes('body.ui-250 .pause-round-state{border-right:0;border-bottom:1px solid var(--sa25-line)}'),
  'The stacked Pause round state must exchange its right divider for a bottom divider by 1040px.'
);

// The 960x600 supported minimum needs an internal scroll path and compact weapon
// presentation so controls do not fall below the fixed shell/footer.
assert.match(
  css,
  /weapon-detail\.ui233-weapon-detail\{[^}]*overflow:auto!important/,
  'The refined weapon detail must retain an internal scroll path at constrained heights.'
);
const compactHeightRules = [...css.matchAll(/@media\(max-height:(\d+)px\)\{([\s\S]*?)(?=\n@media|\s*$)/g)]
  .filter(([, height]) => Number(height) >= 600 && Number(height) <= 760);
assert.ok(compactHeightRules.some(([, , body]) => body.includes('loadout-screen') && body.includes('phase2-weapon-stage')), 'A compact-height rule must reduce the Loadouts weapon presentation at 960x600.');

// A same-tag Build 1 repair must replace and verify all binary assets before
// publishing revised release notes. Otherwise the public notes could advertise
// a repair whose executable upload failed.
const releaseUpload = releaseWorkflow.indexOf('gh release upload $tag $gameAsset $installerAsset $manifestAsset --clobber');
const releaseUploadCheck = releaseWorkflow.indexOf('if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }', releaseUpload);
const releaseNotesEdit = releaseWorkflow.indexOf('gh release edit $tag --title $plan.title --notes-file $plan.notesFile', releaseUploadCheck);
const newReleaseBranch = releaseWorkflow.indexOf('} else {', releaseUpload);
assert.ok(releaseUpload >= 0, 'Existing releases must replace all three Build 1 assets with --clobber.');
assert.ok(releaseUploadCheck > releaseUpload, 'Existing-release asset upload must check $LASTEXITCODE before continuing.');
assert.ok(releaseNotesEdit > releaseUploadCheck, 'Release notes must be edited only after the asset upload succeeds.');
assert.ok(newReleaseBranch > releaseNotesEdit, 'The existing-release notes edit must stay inside the existing-release branch.');

console.log('Skirmish Arena 2.5.0 Build 1 repair checks passed: static rendering, safe loadout names, batched settings, lifecycle-safe HUDs, scoped observers, persistent mode routing and compact Loadouts are covered.');
