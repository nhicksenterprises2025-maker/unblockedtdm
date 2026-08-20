import { PostgameScreen } from './ui/PostgameScreen.js';

function ensureStyle(href) {
  if ([...document.querySelectorAll('link[rel="stylesheet"]')].some((link) => link.getAttribute('href') === href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

ensureStyle('ui-v17.css');
ensureStyle('ui-v18.css');
document.body.classList.add('ui-v18');

function blurUiFocus() {
  const active = document.activeElement;
  if (active && active !== document.body && active.blur) active.blur();
}

function installBranding() {
  const mark = document.querySelector('.menu-brand .menu-mark');
  if (mark && !mark.querySelector('img')) mark.innerHTML = '<img src="assets/unblockedtdm-mark.svg" alt="UT">';
  const brand = document.querySelector('.menu-brand strong');
  if (brand) brand.textContent = 'UNBLOCKED // TDM';
}

function installHomeStatus() {
  const hero = document.querySelector('[data-menu-view="home"] .menu-hero');
  if (!hero || hero.querySelector('.ut-menu-status')) return;
  const row = document.createElement('div');
  row.className = 'ut-menu-status';
  row.innerHTML = '<span><i></i>CLIENT <b>READY</b></span><span>MODE <b>3V3 TDM</b></span><span>MAP <b>TRAINING COMPLEX</b></span><span>PROFILE <b>LOCAL</b></span>';
  hero.appendChild(row);
}

let currentBuild = null;
function syncLoadoutCopy() {
  const eyebrow = document.querySelector('#loadoutScreen .loadout-head .eyebrow');
  if (eyebrow) eyebrow.textContent = currentBuild ? `UNBLOCKED // TDM · LOADOUT CLIENT ${currentBuild.gameVersion}.${currentBuild.build}` : 'UNBLOCKED // TDM · LOADOUT CLIENT';
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
    document.getElementById('pauseMainMenuButton')?.click();
  }
});

window.addEventListener('unblockedtdm:match-complete', (event) => {
  const snapshot = event.detail || {};
  snapshot.stats = (snapshot.stats || []).map((row) => {
    const tracked = damageStats.get(row.id);
    return tracked ? { ...row, damage: Math.round(tracked.damage), criticals: tracked.criticals } : row;
  });
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
    mainMenu.querySelector('[data-menu-action="home"]')?.click();
    blurUiFocus();
  }
}, true);

const loadoutRoot = document.getElementById('loadoutScreen');
if (loadoutRoot) new MutationObserver(syncLoadoutCopy).observe(loadoutRoot, { childList: true });

installBranding();
installHomeStatus();
syncBuildCopy();
