import { PostgameScreen } from './ui/PostgameScreen.js';

const LAST_MATCH_KEY = 'unblockedtdm.lastMatchSummary';

function ensureStyle(href) {
  if ([...document.querySelectorAll('link[rel="stylesheet"]')].some((link) => link.getAttribute('href') === href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

ensureStyle('ui-v17.css');
ensureStyle('ui-v18.css');
ensureStyle('ui-v18-postgame.css');
ensureStyle('ui-v19.css');
ensureStyle('ui-v192.css');
ensureStyle('ui-v1941.css');
ensureStyle('ui-phase3.css');
document.body.classList.add('ui-v18', 'ui-v19');
document.body.classList.add('ui-v1941', 'ui-phase3');

function blurUiFocus() {
  const active = document.activeElement;
  if (active && active !== document.body && active.blur) active.blur();
}

function installBranding() {
  document.title = 'Skirmish Arena';
  const mark = document.querySelector('.menu-brand .menu-mark');
  if (mark) mark.innerHTML = '<img src="assets/skirmish-arena-mark.svg" alt="SA">';
  const brand = document.querySelector('.menu-brand strong');
  if (brand) brand.textContent = 'SKIRMISH ARENA';
  const brandSub = document.querySelector('.menu-brand small');
  if (brandSub) brandSub.textContent = '3V3 TACTICAL ARENA';
  const heroTitle = document.querySelector('[data-menu-view="home"] .menu-hero h1');
  if (heroTitle) heroTitle.textContent = 'SKIRMISH ARENA';
  const hudMark = document.querySelector('.build-hud .mark');
  if (hudMark) hudMark.textContent = 'SA';
  const hudBrand = document.querySelector('.build-hud .brand strong');
  if (hudBrand) hudBrand.textContent = 'SKIRMISH ARENA';
  const pauseBrand = document.querySelector('.pause-head p');
  if (pauseBrand) pauseBrand.textContent = 'SKIRMISH ARENA';
}

const PHASE2_BUTTONS = {
  play: {
    eyebrow: 'MATCH',
    label: 'PLAY',
    meta: 'ENTER TRAINING COMPLEX',
    icon: '<svg class="phase2-nav-icon" viewBox="0 0 64 64" aria-hidden="true"><path d="M18 11 52 32 18 53Z" fill="none" stroke="currentColor" stroke-width="3"/></svg>'
  },
  loadouts: {
    eyebrow: 'ARSENAL',
    label: 'LOADOUTS',
    meta: '3 DEFAULT · EXPAND TO 25',
    icon: '<svg class="phase2-nav-icon" viewBox="0 0 64 64" aria-hidden="true"><path d="M10 23h34l10 8-10 8H10zM19 23v-7h15v7M18 39v9h11v-9" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>'
  },
  'weapon-info': {
    eyebrow: 'REFERENCE',
    label: 'WEAPON INFO',
    meta: 'EXACT STATS · SPREAD · HANDLING',
    icon: '<svg class="phase2-nav-icon" viewBox="0 0 64 64" aria-hidden="true"><path d="M10 18h44v28H10zM18 26h17M18 34h28M18 42h12" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>'
  },
  settings: {
    eyebrow: 'SYSTEM',
    label: 'SETTINGS',
    meta: 'GAMEPLAY · CONTROLS · DISPLAY',
    icon: '<svg class="phase2-nav-icon" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="10" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M32 9v8M32 47v8M9 32h8M47 32h8M16 16l6 6M42 42l6 6M48 16l-6 6M22 42l-6 6" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>'
  },
  quit: {
    eyebrow: 'CLIENT',
    label: 'QUIT',
    meta: 'EXIT SKIRMISH ARENA',
    icon: '<svg class="phase2-nav-icon" viewBox="0 0 64 64" aria-hidden="true"><path d="M28 12H13v40h15M35 20l12 12-12 12M19 32h28" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>'
  }
};

function installPhase2Menu() {
  const nav = document.querySelector('#mainMenu .main-nav');
  if (!nav) return;

  nav.querySelector('[data-menu-action="home"]')?.remove();
  const order = ['play', 'loadouts', 'weapon-info', 'settings', 'quit'];
  for (const action of order) {
    const button = nav.querySelector(`[data-menu-action="${action}"]`);
    if (!button) continue;
    const copy = PHASE2_BUTTONS[action];
    button.classList.add('phase2-nav-button', `phase2-${action}`);
    button.innerHTML = `${copy.icon}<span class="phase2-button-copy"><small>${copy.eyebrow}</small><strong>${copy.label}</strong><em>${copy.meta}</em></span>`;
    nav.appendChild(button);
  }

  const settingsPanel = document.querySelector('#mainSettingsPanel');
  const cards = [...(settingsPanel?.querySelectorAll('.setting-card') || [])];
  if (settingsPanel?.dataset.settingsVersion) {
    // Versioned Settings panels own their category navigation. Remove any stale
    // positional group stamps left by a legacy render rather than painting
    // GAMEPLAY / DISPLAY labels over the authored tab content.
    for (const card of cards) {
      card.classList.remove('phase2-group-start');
      delete card.dataset.phase2Group;
    }
  } else {
    if (cards[0]) { cards[0].classList.add('phase2-group-start'); cards[0].dataset.phase2Group = 'GAMEPLAY'; }
    if (cards[3]) { cards[3].classList.add('phase2-group-start'); cards[3].dataset.phase2Group = 'DISPLAY'; }
  }
}

function readLastMatch() {
  try {
    const raw = localStorage.getItem(LAST_MATCH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLastMatch(snapshot) {
  try {
    localStorage.setItem(LAST_MATCH_KEY, JSON.stringify({
      winner: snapshot.matchWinner || null,
      blue: snapshot.wins?.blue ?? 0,
      red: snapshot.wins?.red ?? 0,
      duration: snapshot.durationLabel || '0:00',
      completedAt: Date.now()
    }));
  } catch {}
}

function syncHomeStatus() {
  const hero = document.querySelector('[data-menu-view="home"] .menu-hero');
  if (!hero) return;
  let row = hero.querySelector('.ut-menu-status');
  if (!row) {
    row = document.createElement('div');
    row.className = 'ut-menu-status';
    hero.appendChild(row);
  }
  const last = readLastMatch();
  const lastText = last?.winner ? `${last.winner.toUpperCase()} ${last.blue}-${last.red}` : 'NONE';
  row.innerHTML = `<span><i></i>CLIENT <b>READY</b></span><span>MODE <b>3V3 TDM</b></span><span>MAP <b>TRAINING COMPLEX</b></span><span>LAST <b>${lastText}</b></span>`;
}

let currentBuild = null;
function syncLoadoutCopy() {
  const eyebrow = document.querySelector('#loadoutScreen .loadout-head .eyebrow');
  if (eyebrow) eyebrow.textContent = currentBuild ? `SKIRMISH ARENA · LOADOUT CLIENT ${currentBuild.gameVersion}.${currentBuild.build}` : 'SKIRMISH ARENA · LOADOUT CLIENT';
}

async function syncBuildCopy() {
  try {
    currentBuild = await window.gameAPI.getBuildInfo();
    const menuBuild = document.getElementById('mainBuildLabel');
    const menuPhase = document.getElementById('mainPhaseLabel');
    if (menuBuild) menuBuild.textContent = `BUILD ${currentBuild.gameVersion} // VERSION ${currentBuild.build}`;
    if (menuPhase) menuPhase.textContent = currentBuild.phase;
    const heroEyebrow = document.querySelector('[data-menu-view="home"] .menu-eyebrow');
    if (heroEyebrow) heroEyebrow.textContent = `MATCH CLIENT // BUILD ${currentBuild.gameVersion}.${currentBuild.build}`;
    const pauseCopy = document.querySelector('.pause-head small');
    if (pauseCopy) pauseCopy.textContent = `MATCH CLIENT // BUILD ${currentBuild.gameVersion}.${currentBuild.build} // SETTINGS + MATCH CONTROL`;
    syncLoadoutCopy();
  } catch {}
}

const toast = document.createElement('div');
toast.className = 'ut-flow-toast';
document.body.appendChild(toast);
let toastTimer = 0;
function showToast(text, duration = 1300) {
  toast.textContent = text;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), duration);
}

const postgameRoot = document.createElement('section');
postgameRoot.id = 'postgameScreen';
postgameRoot.className = 'postgame-screen';
postgameRoot.dataset.uiSurface = '';
document.body.appendChild(postgameRoot);

const damageStats = new Map();
function resetDamageStats() { damageStats.clear(); }
window.addEventListener('unblockedtdm:damage-applied', (event) => {
  const detail = event.detail || {};
  if (!detail.sourceId || !detail.target || !detail.result?.applied || detail.selfDamage) return;
  if (detail.sourceId === detail.target.id || detail.sourceTeam === detail.target.team) return;
  const current = damageStats.get(detail.sourceId) || { damage: 0, criticals: 0 };
  current.damage += detail.result.amount;
  if (detail.critical) current.criticals += 1;
  damageStats.set(detail.sourceId, current);
});

let rematchBridge = false;
const postgame = new PostgameScreen(postgameRoot, {
  onRematch: () => {
    postgame.hide();
    document.body.classList.remove('postgame-open');
    resetDamageStats();
    blurUiFocus();
    rematchBridge = true;
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Enter', key: 'Enter', bubbles: true }));
    rematchBridge = false;
    showToast('REMATCH // INITIALIZING');
  },
  onMainMenu: () => {
    postgame.hide();
    document.body.classList.remove('postgame-open');
    resetDamageStats();
    blurUiFocus();
    syncHomeStatus();
    document.getElementById('pauseMainMenuButton')?.click();
  }
});

window.addEventListener('unblockedtdm:match-complete', (event) => {
  const snapshot = event.detail || {};
  snapshot.stats = (snapshot.stats || []).map((row) => {
    const tracked = damageStats.get(row.id);
    return tracked ? { ...row, damage: Math.round(tracked.damage), criticals: tracked.criticals } : row;
  });
  saveLastMatch(snapshot);
  syncHomeStatus();
  blurUiFocus();
  document.body.classList.add('postgame-open');
  document.getElementById('roundOverlay')?.classList.remove('visible');
  postgame.show(snapshot);
});

window.addEventListener('keydown', (event) => {
  if (postgameRoot.classList.contains('visible') && !rematchBridge) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  if (event.code !== 'Escape' || event.repeat) return;
  const mainMenu = document.getElementById('mainMenu');
  if (!mainMenu?.classList.contains('visible')) return;
  const activeView = mainMenu.querySelector('[data-menu-view].active');
  if (activeView?.dataset.menuView && activeView.dataset.menuView !== 'home') {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent('skirmish:show-menu-home'));
    blurUiFocus();
  }
}, true);

const loadoutRoot = document.getElementById('loadoutScreen');
if (loadoutRoot) new MutationObserver(syncLoadoutCopy).observe(loadoutRoot, { childList: true });

installBranding();
installPhase2Menu();
syncHomeStatus();
syncBuildCopy();
import('./phase3-runtime.js').catch((error) => console.error('Phase 3 tactical HUD failed to initialize', error));
