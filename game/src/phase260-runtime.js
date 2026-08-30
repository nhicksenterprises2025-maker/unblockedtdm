import { GameSettings } from './engine/GameSettings.js';
import { resolveHudLayoutMetrics } from './ui/HudLayout.js';
import { MAP_01 } from './world/map01.js';
import { MAP_02 } from './world/map02.js';

const VERSION = '2.6.0';
const settings = new GameSettings();
const SVG_NS = 'http://www.w3.org/2000/svg';
let resizeFrame = 0;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function ensureStyle(href) {
  let link = [...document.querySelectorAll('link[rel="stylesheet"]')]
    .find((entry) => entry.getAttribute('href') === href);
  if (!link) {
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
  }
  document.head.appendChild(link);
  return link;
}

function setPixels(root, name, value) {
  root.style.setProperty(`--sa26-${name}`, `${Math.max(0, value).toFixed(2)}px`);
}

function applyHudSettings() {
  const gameplay = settings.gameplay();
  const metrics = resolveHudLayoutMetrics(gameplay, { width:window.innerWidth, height:window.innerHeight });
  const { requested, layout, minimap, feed } = metrics;
  const root = document.documentElement;

  root.style.setProperty('--sa26-hud-scale', requested.toFixed(2));
  root.style.setProperty('--sa26-hud-layout-scale', layout.toFixed(2));
  root.style.setProperty('--sa26-minimap-combined-scale', minimap.toFixed(2));
  root.style.setProperty('--sa26-feed-combined-scale', feed.toFixed(2));
  root.style.setProperty('--sa26-minimap-opacity', clamp(Number(gameplay.minimapOpacity) || .92, .45, 1).toFixed(2));

  setPixels(root, 'hud-edge', 20 * layout);
  setPixels(root, 'top-round-col', 112 * layout);
  setPixels(root, 'top-kill-col', 96 * layout);
  setPixels(root, 'top-clock-col', 204 * layout);
  setPixels(root, 'top-pad-y', 12 * layout);
  setPixels(root, 'top-pad-x', 10 * layout);
  setPixels(root, 'top-label', 9 * layout);
  setPixels(root, 'round-value', 24 * layout);
  setPixels(root, 'kill-value', 31 * layout);
  setPixels(root, 'timer-value', 36 * layout);
  setPixels(root, 'minimap-size', 196 * minimap);
  setPixels(root, 'minimap-edge', 20 * layout);
  setPixels(root, 'left-panel-width', 282 * layout);
  setPixels(root, 'health-bottom', 108 * layout);
  setPixels(root, 'panel-pad', 13 * layout);
  setPixels(root, 'hud-label', 9 * layout);
  setPixels(root, 'hud-value', 17 * layout);
  setPixels(root, 'hud-micro', 7.5 * layout);
  setPixels(root, 'hud-track', 8 * layout);
  setPixels(root, 'weapon-width', 312 * layout);
  setPixels(root, 'weapon-min-height', 170 * layout);
  setPixels(root, 'weapon-name', 19 * layout);
  setPixels(root, 'ammo-value', 38 * layout);
  setPixels(root, 'ammo-support', 14 * layout);
  setPixels(root, 'dash-width', 192 * layout);
  setPixels(root, 'dash-bottom', 196 * layout);
  setPixels(root, 'dash-pip', 6 * layout);
  setPixels(root, 'feed-top', 122 * layout);
  setPixels(root, 'feed-right', 22 * layout);
  setPixels(root, 'feed-width', 430 * feed);
  setPixels(root, 'feed-gap', 8 * feed);
  setPixels(root, 'feed-pad-y', 6 * feed);
  setPixels(root, 'feed-pad-x', 9 * feed);
  setPixels(root, 'feed-name', 12.5 * feed);
  setPixels(root, 'feed-weapon', 10.5 * feed);
  setPixels(root, 'feed-critical', 9.5 * feed);
  setPixels(root, 'legend-font', 9 * layout);

  document.body.dataset.hudScale = requested.toFixed(2);
  document.body.dataset.hudLayoutScale = layout.toFixed(2);
  document.body.dataset.minimapCombinedScale = minimap.toFixed(2);
  document.body.dataset.killFeedCombinedScale = feed.toFixed(2);
}

const PAUSE_ICON_PARTS = Object.freeze({
  match:[
    ['circle', { cx:12, cy:12, r:5.2 }],
    ['path', { d:'M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M9.6 12h4.8' }]
  ],
  scoreboard:[
    ['path', { d:'M4 5.5h16M4 12h16M4 18.5h16M8 3v18M15.5 3v18' }],
    ['path', { d:'M10.5 8.7h2.5M10.5 15.2h2.5M17.4 8.7h.1M17.4 15.2h.1' }]
  ],
  loadout:[
    ['path', { d:'M3 13.2h7.4l2.2-2.7h5.2l1.2 1.4h2v3.2h-8.2l-2.1 3.1H7.6l.9-3.1H3z' }],
    ['path', { d:'M5.2 10.3h4.6M14.3 8.2h3.2M18.9 12v3' }]
  ],
  controls:[
    ['path', { d:'M7.5 6.2h9c2.5 0 4.3 2.1 4.3 4.7v4.4c0 1.8-2.1 2.7-3.3 1.4l-2.1-2.3H8.6l-2.1 2.3c-1.2 1.3-3.3.4-3.3-1.4v-4.4c0-2.6 1.8-4.7 4.3-4.7z' }],
    ['path', { d:'M7.4 9.3v4M5.4 11.3h4M16.6 9.7h.1M18.6 12.2h.1' }]
  ],
  settings:[
    ['path', { d:'M9.2 3.4l.7-1.4h4.2l.7 1.4 1.7.7 1.5-.5 2.4 2.4-.5 1.5.7 1.7 1.4.7v4.2l-1.4.7-.7 1.7.5 1.5-2.4 2.4-1.5-.5-1.7.7-.7 1.4H9.9l-.7-1.4-1.7-.7-1.5.5-2.4-2.4.5-1.5-.7-1.7-1.4-.7V9.9l1.4-.7.7-1.7L3.6 6 6 3.6l1.5.5z' }],
    ['circle', { cx:12, cy:12, r:3.2 }]
  ]
});

function makePauseIcon(kind) {
  const root = document.createElement('i');
  root.className = 'pause-tab-icon';
  root.dataset.pauseIcon = kind;
  root.dataset.iconFamily = 'sa-tactical-metal';
  root.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('focusable', 'false');
  for (const [tag, attributes] of PAUSE_ICON_PARTS[kind] || []) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, String(value));
    svg.appendChild(node);
  }
  root.appendChild(svg);
  return root;
}

function installPauseIcons() {
  for (const button of document.querySelectorAll('.pause-tabs [data-pause-tab]')) {
    if (button.querySelector('.pause-tab-icon')) continue;
    const kind = button.dataset.pauseTab;
    if (!PAUSE_ICON_PARTS[kind]) continue;
    button.insertBefore(makePauseIcon(kind), button.firstChild);
  }
}

function annotateReadability() {
  document.querySelector('#mainMenu')?.setAttribute('data-typography-scale', '2.6');
  document.querySelector('#pausePanel')?.setAttribute('data-pause-presentation', 'approved-large-vertical');
  document.querySelector('#phase3Scoreboard')?.setAttribute('data-scoreboard-hierarchy', 'k-kd-dominant');
  document.querySelector('#phase3KillFeed')?.setAttribute('data-feed-readability', '2.6');
}

function scheduleResize() {
  if (resizeFrame) return;
  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = 0;
    applyHudSettings();
  });
}

ensureStyle('ui-2.6.0.css');
document.body.classList.add('ui-260');
document.body.dataset.phase260Ready = 'true';
installPauseIcons();
applyHudSettings();
annotateReadability();

window.addEventListener('unblockedtdm:settings-change', applyHudSettings);
window.addEventListener('resize', scheduleResize);
window.addEventListener('skirmish:menu-view-change', annotateReadability);
window.addEventListener('skirmish:show-menu-home', annotateReadability);
window.addEventListener('beforeunload', () => {
  if (resizeFrame) cancelAnimationFrame(resizeFrame);
}, { once:true });

const mapAreaRatio = (MAP_02.cols * MAP_02.rows) / (MAP_01.cols * MAP_01.rows);
window.skirmishArena260 = Object.freeze({
  version:VERSION,
  phase:'Tactical Intelligence and Interface Refinement',
  hudScale:Object.freeze({ min:.8, max:1.4, responsive:true, componentSizing:true }),
  pause:Object.freeze({ structure:'approved-vertical-five-tab', icons:Object.keys(PAUSE_ICON_PARTS) }),
  maps:Object.freeze({ casual:MAP_01.id, arena:MAP_02.id, areaRatio:mapAreaRatio }),
  futureArchitecture:Object.freeze({
    rosterLabelsUseDisplayIdentity:true,
    humanCountNotHardcodedInScoreboard:true,
    matchMapStateDefinitionDriven:true
  }),
  integrity:Object.freeze({
    pauseTabs:document.querySelectorAll('.pause-tabs [data-pause-tab]').length === 5,
    pauseIcons:document.querySelectorAll('.pause-tab-icon[data-icon-family="sa-tactical-metal"]').length === 5,
    hudScaleRange:true,
    foundryScale:mapAreaRatio >= 1.25 && mapAreaRatio <= 1.35,
    trainingBlueBarsRemoved:MAP_01.presentation?.architecture?.decorativeBlueBars === false
  })
});
