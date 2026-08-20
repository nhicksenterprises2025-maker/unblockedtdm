import fs from 'node:fs';
import assert from 'node:assert/strict';

const flow = fs.readFileSync(new URL('../game/src/flow-v18.js', import.meta.url), 'utf8');
const debug = fs.readFileSync(new URL('../game/src/debug-tuning.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../game/src/ui-v18.css', import.meta.url), 'utf8');
const postgameCss = fs.readFileSync(new URL('../game/src/ui-v18-postgame.css', import.meta.url), 'utf8');
const logo = fs.readFileSync(new URL('../game/src/assets/unblockedtdm-mark.svg', import.meta.url), 'utf8');
const art = fs.readFileSync(new URL('../game/src/assets/training-complex-art.svg', import.meta.url), 'utf8');
const launcherCss = fs.readFileSync(new URL('../launcher/src/styles.css', import.meta.url), 'utf8');
const postgame = fs.readFileSync(new URL('../game/src/ui/PostgameScreen.js', import.meta.url), 'utf8');

assert.ok(debug.includes("import('./flow-v18.js')"), 'Build 1.8 flow runtime must be loaded');
assert.ok(!debug.includes("import('./postgame-runtime.js')"), 'Legacy postgame runtime must not load beside Build 1.8 flow');
for (const token of [
  "ensureStyle('ui-v17.css')",
  "ensureStyle('ui-v18.css')",
  "ensureStyle('ui-v18-postgame.css')",
  "document.body.classList.add('ui-v18')",
  "unblockedtdm:match-complete",
  "unblockedtdm:damage-applied",
  "LAST_MATCH_KEY",
  "localStorage.setItem(LAST_MATCH_KEY",
  "new MutationObserver(syncLoadoutCopy).observe(loadoutRoot, { childList: true })",
  "data-menu-action=\"home\""
]) assert.ok(flow.includes(token), `Missing Build 1.8 flow contract: ${token}`);

assert.ok(!flow.includes('observer.observe(document.body'), 'Build 1.8 must not globally observe gameplay class mutations');
assert.ok(flow.includes('PostgameScreen'), 'Postgame must be integrated into the Build 1.8 flow');
assert.ok(postgame.includes('data-postgame-action="rematch"') && postgame.includes('data-postgame-action="menu"'), 'Postgame actions must remain functional');

for (const color of ['#080c11', '#0d131b', '#111925', '#222d3a', '#f1f4f7', '#778595', '#37b8ff']) {
  assert.ok(css.includes(color), `Missing shared launcher/game palette color ${color}`);
}
assert.ok(css.includes('assets/training-complex-art.svg'), 'Game menus must use shared Training Complex artwork');
assert.ok(css.includes('.main-menu-shell') && css.includes('border-radius:0'), 'Main menu must use flat desktop geometry');
assert.ok(css.includes('.main-nav button') && css.includes('border-left:3px solid transparent'), 'Game navigation must use launcher-style edge markers');
assert.ok(css.includes('.loadout-shell') && css.includes('.pause-shell') && css.includes('.weapon-info-layout'), 'Loadout, pause and weapon-info menus must share the new UI layer');
assert.ok(css.includes('.round-loadout-panel') && css.includes('.postgame-shell'), 'Round-break and postgame surfaces must share the new UI layer');
assert.ok(!css.includes('background:radial-gradient'), 'Build 1.8 game menus must not reintroduce the old radial gradient background');
assert.ok(!css.includes('background:linear-gradient'), 'Build 1.8 game menus must not use decorative background gradients');
assert.ok(postgameCss.includes('body.postgame-open .round-overlay'), 'Postgame must suppress the underlying match-over overlay');
assert.ok(logo.includes('#37b8ff') && logo.includes('#080c11'), 'Shared UT mark must use the product palette');
assert.ok(art.includes('TRAINING COMPLEX') && art.includes('MATCH CLIENT'), 'Shared game artwork must carry UnblockedTDM technical motifs');

assert.ok(launcherCss.includes('#080c11') && launcherCss.includes('#37b8ff'), 'Launcher and game must retain the same base palette');
console.log('Build 1.8 unified UI, postgame integration, persistence and flow contracts passed.');
