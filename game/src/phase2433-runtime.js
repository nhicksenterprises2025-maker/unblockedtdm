import { ARENA_EMBLEM_IDS } from './arena/ArenaBadges.js';
import { ARENA_RANKS } from './arena/ArenaStore.js';
import { CAREER_RANKS } from './progression/ProgressionStore.js';
import { RANK_BADGE_ASSET_PATH } from './progression/RankBadges.js';
import { WEAPON_LIST } from './data/weapons.js';
import { MAP_02 } from './world/map02.js';

const timers = new Map();

function ensureStyle(href) {
  let link = [...document.querySelectorAll('link[rel="stylesheet"]')].find((entry) => entry.getAttribute('href') === href);
  if (!link) {
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
  return link;
}

function pulse(name, duration) {
  const className = `phase2433-${name}`;
  const previous = timers.get(name);
  if (previous) clearTimeout(previous);
  document.body.classList.remove(className);
  // Force only a class-state restart; no presentation nodes are created per event.
  void document.body.offsetWidth;
  document.body.classList.add(className);
  timers.set(name, window.setTimeout(() => {
    document.body.classList.remove(className);
    timers.delete(name);
  }, duration));
}

function clearPresentationState() {
  for (const timer of timers.values()) clearTimeout(timer);
  timers.clear();
  for (const className of [...document.body.classList]) {
    if (className.startsWith('phase2433-')) document.body.classList.remove(className);
  }
}

function polishStaticUi() {
  const menu = document.getElementById('mainMenu');
  if (menu) menu.dataset.phase3Polish = 'true';

  for (const badge of document.querySelectorAll('.career-rank-badge')) {
    badge.dataset.careerEmblem = 'authored';
  }
  for (const card of document.querySelectorAll('[data-catalog-weapon]')) {
    card.dataset.gameplayModel = card.querySelector('canvas[data-game-weapon-model]') ? 'shared' : 'missing';
  }
  for (const button of document.querySelectorAll('[data-arena-select-mode]')) {
    button.setAttribute('aria-label', `${button.dataset.arenaSelectMode === 'arena' ? 'Arena ranked on Foundry Zero' : 'Casual on Training Complex'}`);
  }

  const postgameEyebrow = document.querySelector('#postgameScreen .postgame-titlebar span');
  if (postgameEyebrow && postgameEyebrow.textContent !== 'SKIRMISH ARENA // MATCH COMPLETE') {
    postgameEyebrow.textContent = 'SKIRMISH ARENA // MATCH COMPLETE';
  }
}

function schedulePolish() {
  requestAnimationFrame(polishStaticUi);
}

ensureStyle('ui-2.4.3.3.css');
document.body.classList.add('ui-2433');

window.addEventListener('skirmish:match-started', () => {
  document.body.dataset.phase3Presentation = 'match';
  pulse('match-intro', 900);
});

window.addEventListener('skirmish:arena-round-end', () => pulse('round-transition', 720));

window.addEventListener('skirmish:arena-elimination-pre', (event) => {
  if (event.detail?.attackerId === 'local-blue' && event.detail?.critical) pulse('critical-elimination', 220);
});

window.addEventListener('unblockedtdm:match-complete', (event) => {
  document.body.dataset.phase3Presentation = 'postgame';
  const local = (event.detail?.stats || []).find((row) => row.isLocal || row.id === 'local-blue');
  const ranked = [...(event.detail?.stats || [])].sort((a, b) =>
    (Number(b.kills || 0) - Number(a.kills || 0)) ||
    (Number(b.damage || 0) - Number(a.damage || 0)) ||
    (Number(a.deaths || 0) - Number(b.deaths || 0))
  );
  if (local && ranked[0]?.id === local.id) pulse('mvp', 1100);
  schedulePolish();
});

window.addEventListener('skirmish:menu-view-change', schedulePolish);
window.addEventListener('skirmish:show-menu-home', () => {
  clearPresentationState();
  document.body.dataset.phase3Presentation = 'menu';
  schedulePolish();
});
window.addEventListener('skirmish:map-selected', schedulePolish);
window.addEventListener('beforeunload', clearPresentationState, { once:true });

requestAnimationFrame(() => {
  // Move the Phase 3 sheet behind all legacy compatibility layers in evaluation
  // order but last in the cascade once those layers have installed.
  const phase3Style = ensureStyle('ui-2.4.3.3.css');
  document.head.appendChild(phase3Style);
  polishStaticUi();
  document.body.dataset.arenaPhase3Ready = 'true';
  document.body.dataset.phase3Presentation = 'menu';
});

const foundryPresentation = MAP_02.presentation || {};
window.skirmishArenaPhase3 = Object.freeze({
  version:'2.4.3.3',
  arenaRankIds:Object.freeze([...ARENA_EMBLEM_IDS]),
  arenaThresholds:Object.freeze(ARENA_RANKS.map((rank) => rank.threshold)),
  careerRankIds:Object.freeze(CAREER_RANKS.map((rank) => rank.id)),
  careerBadgeAsset:RANK_BADGE_ASSET_PATH,
  weaponIds:Object.freeze(WEAPON_LIST.map((weapon) => weapon.id)),
  foundryPresentation,
  integrity:Object.freeze({
    arenaEmblems:ARENA_EMBLEM_IDS.length === 14,
    careerEmblems:CAREER_RANKS.length === 26,
    weapons:WEAPON_LIST.length === 8,
    foundry:MAP_02.id === 'foundry-zero' && MAP_02.arenaOnly === true
  })
});
