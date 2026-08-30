import { MatchManager } from './match/MatchManager.js';
import { TacticalHUD } from './ui/TacticalHUD.js';
import { ARENA_EMBLEM_IDS } from './arena/ArenaBadges.js';
import { Camera } from './world/Camera.js';
import { MAP_01 } from './world/map01.js';
import { MAP_02 } from './world/map02.js';

function ensureStyle(href) {
  if ([...document.querySelectorAll('link[rel="stylesheet"]')].some((link) => link.getAttribute('href') === href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

ensureStyle('ui-2.4.3.2.css');
document.body.classList.add('ui-2432');

function selectedMode() {
  return window.__SKIRMISH_MATCH_MODE__ === 'arena' ? 'arena' : 'casual';
}

function definitionForMode(mode = selectedMode()) {
  const definition = mode === 'arena' ? MAP_02 : MAP_01;
  if (mode === 'arena' && definition.arenaOnly !== true) throw new Error('Arena requires an Arena-only map definition.');
  if (mode !== 'arena' && definition.arenaOnly) throw new Error('Casual cannot load an Arena-only map definition.');
  return definition;
}

function announceMap(map, mode) {
  document.body.dataset.activeMap = map.id;
  document.body.dataset.activeMapName = map.name;
  const debugLabel = document.getElementById('mapLabel');
  if (debugLabel) debugLabel.textContent = map.name;
  window.dispatchEvent(new CustomEvent('skirmish:map-selected', {
    detail:{ id:map.id, name:map.name, mode, arenaOnly:Boolean(map.arenaOnly) }
  }));
}

// The proven match manager owns rules and respawns. Phase 2 only switches the
// shared TileMap definition before that manager begins the match.
if (!MatchManager.prototype.__arena2432MapBridge) {
  MatchManager.prototype.__arena2432MapBridge = true;
  const previousStartMatch = MatchManager.prototype.startMatch;
  MatchManager.prototype.startMatch = function startMatch2432(...args) {
    const mode = selectedMode();
    const nextMap = definitionForMode(mode);
    const liveMap = this.spawnSystem?.map;
    if (!liveMap?.setDefinition) throw new Error('Arena map switching requires TileMap.setDefinition().');
    if (liveMap.definition?.id !== nextMap.id) liveMap.setDefinition(nextMap);
    Camera.active?.setWorldBounds?.(liveMap.width, liveMap.height);
    announceMap(nextMap, mode);
    return previousStartMatch.apply(this, args);
  };
}

function tacticalMapName(hud) {
  const name = hud?.minimapRenderer?.map?.definition?.name || 'Training Complex';
  const small = hud?.root?.querySelector('.phase3-map-shell header small');
  const label = `${name.toUpperCase()} // LIVE TACTICAL DATA`;
  if (small && small.textContent !== label) small.textContent = label;
}

if (!TacticalHUD.prototype.__arena2432MapCopy) {
  TacticalHUD.prototype.__arena2432MapCopy = true;
  const previousUpdate = TacticalHUD.prototype.update;
  TacticalHUD.prototype.update = function update2432(...args) {
    const result = previousUpdate.apply(this, args);
    tacticalMapName(this);
    return result;
  };
}

function modeMapChip(card, label) {
  if (!card) return;
  let chip = card.querySelector('[data-arena-map-chip]');
  if (!chip) {
    chip = document.createElement('span');
    chip.dataset.arenaMapChip = '';
    chip.className = 'arena-map-chip';
    card.querySelector('p')?.insertAdjacentElement('afterend', chip);
  }
  chip.textContent = `MAP · ${label.toUpperCase()}`;
}

function enhanceModeSelector() {
  const root = document.querySelector('[data-arena-mode-select]');
  if (!root) return;
  const casual = root.querySelector('[data-arena-select-mode="casual"]');
  const arena = root.querySelector('[data-arena-select-mode="arena"]');
  const casualCopy = casual?.querySelector('p');
  const arenaCopy = arena?.querySelector('p');
  if (casualCopy) casualCopy.textContent = 'Standard Skirmish Arena on Training Complex. Career progression stays active; Arena Points and seasonal rank are not affected.';
  if (arenaCopy) arenaCopy.textContent = 'Ranked 3v3 on the Arena-exclusive Foundry Zero battleground with Arena Points, performance bonuses, loss penalties, promotions and demotions.';
  modeMapChip(casual, MAP_01.name);
  modeMapChip(arena, MAP_02.name);
}

function syncHomeMapStatus(detail = null) {
  const status = document.querySelector('#mainMenu [data-menu-view="home"] .ut-menu-status');
  if (!status) return;
  const mode = detail?.mode || selectedMode();
  const map = detail?.name ? { name:detail.name } : definitionForMode(mode);
  for (const span of status.querySelectorAll(':scope > span')) {
    const text = span.childNodes[0]?.textContent?.trim()?.toUpperCase() || span.textContent.trim().toUpperCase();
    if (text.startsWith('MAP')) {
      const value = span.querySelector('b');
      if (value) value.textContent = map.name.toUpperCase();
    }
  }
}

// Run before the Phase-1 menu capture handler, then modify the overlay after it
// has been rendered. No MutationObserver is used because boot integrity forbids
// self-triggering menu mutation loops.
document.addEventListener('click', (event) => {
  if (!event.target.closest?.('#mainMenu [data-menu-action="play"]')) return;
  setTimeout(enhanceModeSelector, 0);
}, true);

window.addEventListener('skirmish:map-selected', (event) => syncHomeMapStatus(event.detail || {}));
window.addEventListener('skirmish:show-menu-home', () => requestAnimationFrame(() => syncHomeMapStatus()));
window.addEventListener('skirmish:menu-view-change', () => requestAnimationFrame(() => {
  enhanceModeSelector();
  syncHomeMapStatus();
}));

requestAnimationFrame(() => {
  enhanceModeSelector();
  syncHomeMapStatus();
  document.body.dataset.arenaPhase2Ready = 'true';
});

window.skirmishArenaPhase2 = Object.freeze({
  maps:Object.freeze({ casual:MAP_01, arena:MAP_02 }),
  emblemIds:ARENA_EMBLEM_IDS,
  arenaMapId:MAP_02.id,
  arenaMapName:MAP_02.name
});
