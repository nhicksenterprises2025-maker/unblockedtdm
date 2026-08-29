import fs from 'node:fs';
import assert from 'node:assert/strict';
import { ARENA_EMBLEM_IDS } from '../game/src/arena/ArenaBadges.js';
import { LOADOUT_SLOT_COUNT, LoadoutStore } from '../game/src/data/LoadoutStore.js';
import { WEAPONS } from '../game/src/data/weapons.js';
import { GameSettings } from '../game/src/engine/GameSettings.js';
import { CAREER_RANKS } from '../game/src/progression/ProgressionStore.js';
import { CHARACTER_PRESENTATION } from '../game/src/render/PlayerRenderer.js';
import { TOP_DOWN_WEAPON_PRESENTATION } from '../game/src/render/WeaponRenderer.js';
import { MENU_WEAPON_PRESENTATION } from '../game/src/ui/WeaponPresentation.js';
import { MAP_01 } from '../game/src/world/map01.js';
import { MAP_02 } from '../game/src/world/map02.js';

const read = (relative) => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const index = read('game/src/index.html');
const loader = read('game/src/debug-tuning.js');
const runtime = read('game/src/phase250-runtime.js');
const css = read('game/src/ui-2.5.0.css');
const loadouts = read('game/src/ui/LoadoutScreen.js');
const settingsPanel = read('game/src/ui/SettingsPanel.js');
const homeArt = read('game/src/ui/HomeCommandArt.js');
const menuRuntime = read('game/src/phase221-runtime.js');
const logoRuntime = read('game/src/phase231-runtime.js');
const logo = read('game/src/assets/skirmish-arena-main-logo.svg');
const careerBadges = read('game/src/assets/ranks/rank-badges.svg');
const arenaBadges = read('game/src/arena/ArenaBadges.js');
const worldRenderer = read('game/src/render/WorldRenderer.js');
const renderer = read('game/src/renderer.js');
const main = read('game/src/main.js');

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

// Boot ownership and release-specific runtime registration.
assert.ok(loader.indexOf("import('./phase250-runtime.js')") > loader.indexOf("import('./phase231-runtime.js')"));
for (const token of ["document.body.classList.contains('ui-250')", "document.body.dataset.phase250Ready==='true'", '2.5 PRESENTATION']) assert.ok(loader.includes(token));
for (const token of ['ui-2.5.0.css', 'window.skirmishArena250', 'performanceSafeguards:true', "const VERSION = '2.5.0'"]) assert.ok(runtime.includes(token));
for (const token of ['phase250:', 'phase250Integrity:', 'phase250Surfaces:', 'viewIsolation:', 'state.phase250 &&', 'state.phase250Integrity &&', 'state.phase250Surfaces &&', 'state.viewIsolation &&', 'asset?.complete && asset?.naturalWidth > 0']) assert.ok(main.includes(token), `Packaged 2.5 smoke gate missing ${token}`);

// Requirement 1: Home Arena information strip is a bounded shared grid.
for (const token of ['.career-strip-211', 'grid-template-columns:minmax(250px', '>.career-recent', 'grid-column:1/-1', '.arena-strip .arena-strip-badge']) assert.ok(css.includes(token));

// Requirement 2: exactly 26 Career and 14 Arena emblems in disciplined families.
assert.equal(CAREER_RANKS.length, 26);
assert.equal((careerBadges.match(/<symbol id="rank-/g) || []).length, 26);
for (const family of ['career-service-shield','career-angular-shield','career-command-star','career-round-medal','career-diamond-shield']) assert.ok(careerBadges.includes(family));
for (const forbidden of ['singularity','obsidian','galaxy','deepGlow']) assert.equal(careerBadges.includes(forbidden), false);
assert.equal(ARENA_EMBLEM_IDS.length, 14);
assert.equal(new Set(ARENA_EMBLEM_IDS).size, 14);
for (const family of ['entry','tiered','command','crystal','apex']) assert.ok(arenaBadges.includes(`${family}: \``) || arenaBadges.includes(`return '${family}'`));

// Requirements 3 and 10: side-view menu models, no halo, and all eight top-down live models.
assert.equal(MENU_WEAPON_PRESENTATION.role, 'menu-side-view-reference');
assert.equal(MENU_WEAPON_PRESENTATION.halo, false);
assert.equal(MENU_WEAPON_PRESENTATION.weaponIds.length, 8);
assert.equal(TOP_DOWN_WEAPON_PRESENTATION.role, 'gameplay-top-down');
assert.equal(TOP_DOWN_WEAPON_PRESENTATION.weaponIds.length, 8);
assert.equal(new Set(TOP_DOWN_WEAPON_PRESENTATION.weaponIds).size, 8);
for (const id of TOP_DOWN_WEAPON_PRESENTATION.weaponIds) assert.ok(read('game/src/render/WeaponRenderer.js').includes(`case '${id}'`));
assert.equal(CHARACTER_PRESENTATION.authored, true);
assert.ok(CHARACTER_PRESENTATION.features.includes('unit-identifier'));

// Requirement 4: crisp native vector wordmark keeps the existing identity.
for (const token of ['<text x="560" y="139"', '>SKIRMISH</text>', '>ARENA</text>', 'logo-steel', 'logo-cyan']) assert.ok(logo.includes(token));
assert.ok(logoRuntime.includes("assets/skirmish-arena-main-logo.svg"));
assert.ok(logoRuntime.includes('skirmish-arena-main-logo-2.5'));

// Requirement 5: every surfaced 2.5 setting is persisted and bounded by GameSettings.
assert.equal((settingsPanel.match(/data-settings-tab=/g) || []).length, 5);
for (const key of ['sensitivity','aiDifficulty','autoSprint','screenShake','screenShakeStrength','damageVignette','damageVignetteIntensity','audioEnabled','masterVolume','hudScale','showFps','minimapMode','minimapScale','minimapOpacity','killFeedScale']) assert.ok(settingsPanel.includes(`data-setting="${key}"`));
const memory = new MemoryStorage();
const settings = new GameSettings(memory);
const expectedSettings = {
  sensitivity:1.4, aiDifficulty:'Pro', minimapMode:'rotate', minimapScale:1.2, minimapOpacity:.6,
  screenShake:false, screenShakeStrength:.35, damageVignette:false, damageVignetteIntensity:.45,
  autoSprint:false, audioEnabled:false, masterVolume:.55, hudScale:1.15, killFeedScale:.9, showFps:true
};
for (const [key, value] of Object.entries(expectedSettings)) settings.setGameplay(key, value);
const restoredSettings = new GameSettings(memory).gameplay();
for (const [key, value] of Object.entries(expectedSettings)) assert.equal(restoredSettings[key], value, `${key} must persist through a new settings instance.`);
settings.setGameplay('hudScale', 9);
settings.setGameplay('minimapOpacity', -4);
assert.equal(settings.gameplay().hudScale, 1.2);
assert.equal(settings.gameplay().minimapOpacity, .45);
const rebound = settings.setBinding('fire', 'KeyF');
assert.equal(rebound.ok, true);
assert.equal(new GameSettings(memory).binding('fire'), 'KeyF');
const legacyMemory = new MemoryStorage();
legacyMemory.setItem('unblockedtdm.sensitivity', '1.25');
legacyMemory.setItem('unblockedtdm.masterVolume', '.4');
const migrated = new GameSettings(legacyMemory).gameplay();
assert.equal(migrated.sensitivity, 1.25);
assert.equal(migrated.masterVolume, .4);
assert.equal(migrated.hudScale, 1);
assert.equal(migrated.minimapOpacity, .92);
for (const token of ['shakeStrength', 'vignetteIntensity: gameplaySettings.damageVignetteIntensity']) assert.ok(renderer.includes(token));

// Requirement 6: header summaries are gone and saved slots use full weapon names.
assert.equal(loadouts.includes('class="selected-summary"'), false);
assert.ok(loadouts.includes('class="loadout-head-index"'));
assert.ok(loadouts.includes('${slot.primary.name}'));
assert.ok(loadouts.includes('${slot.secondary.name}'));
const loadoutMemory = new MemoryStorage();
const loadoutStore = new LoadoutStore(loadoutMemory);
while (loadoutStore.canAddSlot()) loadoutStore.addSlot();
assert.equal(loadoutStore.count(), LOADOUT_SLOT_COUNT);
assert.equal(loadoutStore.addSlot(), null);
loadoutStore.save(4, { name:'Precision Alpha', primary:WEAPONS.sniper, secondary:WEAPONS.launcher });
const restoredLoadouts = new LoadoutStore(loadoutMemory);
assert.equal(restoredLoadouts.get(4).name, 'Precision Alpha');
assert.equal(restoredLoadouts.get(4).primary.id, 'sniper');
assert.equal(restoredLoadouts.get(4).secondary.id, 'launcher');
assert.equal(restoredLoadouts.resetSlot(4).name, 'Loadout 05');

// Requirement 7: mode selector has stable route diagrams and authored metadata.
for (const token of ['arena-mode-number','arena-mode-route','TRAINING COMPLEX','FOUNDRY ZERO','FIRST TO 5']) assert.ok(read('game/src/phase2431-runtime.js').includes(token));
for (const token of ['max-height:min(760px,94vh)', '.arena-mode-route', '@media(max-height:760px)']) assert.ok(css.includes(token));

// Requirement 8: Foundry fire originates from bounded housings and stays visual-only.
assert.equal(MAP_02.presentation.safety.fireDamage, false);
assert.equal(MAP_02.presentation.safety.fireCollision, false);
assert.equal(MAP_02.presentation.safety.fireSourcesBounded, true);
assert.equal(MAP_02.presentation.fixtures.burnerHousings.length, MAP_02.presentation.safety.sourceCount);
assert.equal(MAP_02.presentation.nonBlocking, true);
for (const token of ['burnerHousings:takeFixtures', "housing.type === 'furnaceThroat'", 'HARD_MAX_PARTICLE_SLOTS', 'presentationVisibleBounds']) assert.ok(worldRenderer.includes(token));

// Requirement 9: Pause contains five useful live tabs and real match data paths.
assert.equal((index.match(/data-pause-tab=/g) || []).length, 5);
for (const view of ['match','scoreboard','loadout','controls','settings']) assert.ok(index.includes(`data-pause-view="${view}"`));
for (const token of ['match.statsSnapshot()', 'pauseScoreboardRows', 'pauseLoadoutSlots', 'BINDING_ACTIONS.map', 'pauseTopPerformer', 'pauseObjective', '<span>Cycle Weapon</span><strong>MOUSE WHEEL</strong>', '<span>Pause</span><strong>ESC</strong>', 'if (!paused) return;']) assert.ok(renderer.includes(token));
for (const token of ["getElementById('resumeButton')", 'setPaused(false)', "getElementById('pauseMainMenuButton')", 'returnToMainMenu()']) assert.ok(renderer.includes(token));
assert.ok(renderer.includes("map.definition?.name || 'Training Complex'"), 'Pause context must use the active map definition instead of the TileMap wrapper.');

// Requirement 10: Training keeps geometry/balance and gains a no-animation presentation layer.
assert.equal(MAP_01.presentation.id, 'training-complex-2.5');
assert.equal(MAP_01.presentation.nonBlocking, true);
assert.equal(MAP_01.presentation.budgets.maxAnimatedSources, 0);
assert.equal(MAP_01.spawns.blue.length, 3);
assert.equal(MAP_01.spawns.red.length, 3);
for (let index = 0; index < 3; index += 1) {
  assert.equal(MAP_01.spawns.blue[index].y, MAP_01.spawns.red[index].y);
  assert.equal(MAP_01.spawns.blue[index].x + MAP_01.spawns.red[index].x, MAP_01.cols * MAP_01.tileSize);
}
for (const role of ['trainingHall','coverModule','supplyCrate','rangeBarrier','spawnRail','controlTerminal']) assert.ok(MAP_01.structures.some((item) => item.visualRole === role));

// Requirement 11: Loadouts stays unchanged while the other command icons join one metal family.
assert.ok(menuRuntime.includes('loadouts: loadoutIcon'));
for (const icon of ['weapon-info','settings','quit']) assert.ok(homeArt.includes(`commandIcon('${icon}'`));
assert.ok(homeArt.includes('data-home-command-icon="${kind}"'));
assert.equal((homeArt.match(/data-home-icon-family="command-metal"/g) || []).length, 1, 'One shared template must own the command-metal family.');

// Performance guardrails are explicit and degrade only presentation work.
for (const token of ["document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches", 'MutationObserver', "document.addEventListener('visibilitychange'", 'observer.disconnect()', 'if (polishFrame) return', 'cancelAnimationFrame(polishFrame)']) assert.ok(runtime.includes(token));
assert.ok(worldRenderer.includes("dataset?.presentationQuality !== 'reduced'"));
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
assert.ok(css.includes('body.ui-250.match-started.show-fps .engine-footer'));

console.log('Skirmish Arena 2.5.0 checks passed: all 11 presentation requirements, real settings, split weapon models, authored emblems, map logic, pause data and performance guardrails are covered.');
