import { ARENA_EMBLEM_IDS } from './arena/ArenaBadges.js';
import { GameSettings } from './engine/GameSettings.js';
import { TOP_DOWN_WEAPON_PRESENTATION } from './render/WeaponRenderer.js';
import { CHARACTER_PRESENTATION } from './render/PlayerRenderer.js';
import { MENU_WEAPON_PRESENTATION, hydrateWeaponModelCanvases } from './ui/WeaponPresentation.js';
import { MAP_01 } from './world/map01.js';
import { MAP_02 } from './world/map02.js';

const VERSION = '2.5.0';
const settings = new GameSettings();

function ensureStyle(href) {
  let link = [...document.querySelectorAll('link[rel="stylesheet"]')].find((entry) => entry.getAttribute('href') === href);
  if (!link) {
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
  document.head.appendChild(link);
}

function applyPresentationSettings() {
  const gameplay = settings.gameplay();
  const root = document.documentElement;
  root.style.setProperty('--sa-hud-scale', String(gameplay.hudScale));
  root.style.setProperty('--sa-minimap-scale', String(gameplay.minimapScale));
  root.style.setProperty('--sa-minimap-opacity', String(gameplay.minimapOpacity));
  root.style.setProperty('--sa-kill-feed-scale', String(gameplay.killFeedScale));
  document.body.classList.toggle('show-fps', gameplay.showFps);
  document.body.dataset.hudScale = gameplay.hudScale.toFixed(2);
  document.body.dataset.presentationQuality = document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'full';
}

function polishDynamicSurfaces(root = document) {
  hydrateWeaponModelCanvases(root);
  for (const canvas of root.querySelectorAll?.('canvas[data-game-weapon-model]') || []) {
    canvas.dataset.weaponPresentation = 'side-view';
    canvas.dataset.weaponHalo = 'none';
  }
  for (const badge of root.querySelectorAll?.('.career-rank-badge,.arena-rank-badge') || []) badge.dataset.emblemDiscipline = '2.5-authored';
  const arenaStrip = root.querySelector?.('[data-arena-strip]');
  if (arenaStrip) arenaStrip.dataset.layoutVersion = '2.5';
  const logo = root.querySelector?.('.ui231-home-logo');
  if (logo) logo.dataset.logoVersion = '2.5-vector';
  const selector = root.querySelector?.('[data-arena-mode-select]');
  if (selector) selector.dataset.modeLayoutVersion = '2.5';
}

const POLISH_SELECTOR = [
  'canvas[data-game-weapon-model]',
  '.career-rank-badge',
  '.arena-rank-badge',
  '[data-arena-strip]',
  '.ui231-home-logo',
  '[data-arena-mode-select]'
].join(',');

let polishFrame = 0;
const polishRoots = new Set();

function schedulePolish(event) {
  const candidate = event?.target instanceof Element ? event.target : document;
  if (candidate === document) {
    polishRoots.clear();
    polishRoots.add(document);
  } else if (!polishRoots.has(document)) {
    for (const root of polishRoots) {
      if (root.contains?.(candidate)) return;
      if (candidate.contains?.(root)) polishRoots.delete(root);
    }
    polishRoots.add(candidate);
  }
  if (polishFrame) return;
  polishFrame = requestAnimationFrame(() => {
    const roots = [...polishRoots];
    polishFrame = 0;
    polishRoots.clear();
    for (const root of roots) polishDynamicSurfaces(root);
  });
}

function onMenuViewChange(event) {
  const content = document.querySelector('#mainMenu .main-content');
  if (content) {
    content.scrollTop = 0;
    content.scrollLeft = 0;
  }
  schedulePolish(event);
}

function syncQuality() {
  document.body.dataset.presentationQuality = document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'full';
}

ensureStyle('ui-2.5.0.css');
document.body.classList.add('ui-250');
document.body.dataset.phase250Ready = 'true';
applyPresentationSettings();
polishDynamicSurfaces();

const observer = new MutationObserver((records) => {
  for (const record of records) {
    for (const node of record.addedNodes) {
      if (!(node instanceof Element)) continue;
      if (node.matches(POLISH_SELECTOR)) schedulePolish({ target: node.parentElement || node });
      else if (node.querySelector(POLISH_SELECTOR)) schedulePolish({ target: node });
    }
  }
});
observer.observe(document.body, { childList:true, subtree:true });

window.addEventListener('unblockedtdm:settings-change', applyPresentationSettings);
window.addEventListener('skirmish:menu-view-change', onMenuViewChange);
window.addEventListener('skirmish:show-menu-home', onMenuViewChange);
window.addEventListener('skirmish:map-selected', schedulePolish);
document.addEventListener('visibilitychange', syncQuality);
window.addEventListener('beforeunload', () => {
  observer.disconnect();
  if (polishFrame) cancelAnimationFrame(polishFrame);
  polishRoots.clear();
}, { once:true });

window.skirmishArena250 = Object.freeze({
  version:VERSION,
  phase:'Presentation and Map Overhaul',
  logo:'assets/skirmish-arena-main-logo.svg',
  weaponPresentation:TOP_DOWN_WEAPON_PRESENTATION,
  menuWeaponPresentation:MENU_WEAPON_PRESENTATION,
  characterPresentation:CHARACTER_PRESENTATION,
  maps:Object.freeze({
    training:Object.freeze({ id:MAP_01.id, presentation:MAP_01.presentation?.id || null }),
    foundry:Object.freeze({ id:MAP_02.id, presentation:MAP_02.presentation?.id || null })
  }),
  integrity:Object.freeze({
    sideViewMenuModels:true,
    topDownGameplayModels:TOP_DOWN_WEAPON_PRESENTATION.weaponIds.length === 8,
    arenaEmblems:ARENA_EMBLEM_IDS.length === 14,
    settingsTabs:5,
    pauseTabs:5,
    performanceSafeguards:true
  })
});
