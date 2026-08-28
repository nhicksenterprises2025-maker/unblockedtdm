import { hydrateGameplayCrosshairCanvases, hydrateWeaponModelCanvases } from './ui/WeaponPresentation.js';

function ensureStyle(href) {
  if ([...document.querySelectorAll('link[rel="stylesheet"]')].some((link) => link.getAttribute('href') === href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function setText(node, value) {
  if (node && node.textContent !== value) node.textContent = value;
}

function weaponInfoBlueprintIcon() {
  return `<svg class="ui232-blueprint-icon" viewBox="0 0 150 110" aria-hidden="true">
    <rect x="18" y="12" width="112" height="86" rx="10" fill="#071923" stroke="#34c4ff" stroke-width="3"/>
    <path d="M38 12v86" fill="none" stroke="#1b95c7" stroke-width="2"/>
    <path d="M52 50h42l8 6h17v10H94l-9 8H63l-5-8H49V56h9Z" fill="none" stroke="#6ddaff" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M67 74v11h14l6-12" fill="none" stroke="#37bdf3" stroke-width="2.3" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`;
}

function installHomeLogo() {
  const hero = document.querySelector('#mainMenu [data-menu-view="home"] .menu-hero');
  if (!hero) return;
  let logo = hero.querySelector('.ui231-home-logo');
  if (!logo) {
    logo = document.createElement('img');
    logo.className = 'ui231-home-logo';
    logo.src = 'assets/skirmish-arena-main-logo.webp';
    logo.alt = 'Skirmish Arena';
    logo.decoding = 'async';
    logo.draggable = false;
    const heading = hero.querySelector('h1');
    if (heading) heading.insertAdjacentElement('beforebegin', logo);
    else hero.prepend(logo);
  }
}

let buildInfoPromise = null;
function updateHomeBuildLabel() {
  const eyebrow = document.querySelector('#mainMenu [data-menu-view="home"] .menu-hero .menu-eyebrow');
  if (!eyebrow) return;
  if (!buildInfoPromise) {
    buildInfoPromise = window.gameAPI?.getBuildInfo?.()
      ?.catch?.(() => null) || Promise.resolve(null);
  }
  setText(eyebrow, 'BUILD 2.3.4');
  buildInfoPromise.then((info) => {
    if (!eyebrow.isConnected) return;
    setText(eyebrow, `BUILD ${info?.gameVersion || '2.3.4'}`);
  });
}

function installWeaponInfoTileArt() {
  const button = document.querySelector('#mainMenu [data-menu-action="weapon-info"]');
  if (!button) return;
  let art = button.querySelector('.ui221-nav-art');
  if (!art) {
    art = document.createElement('span');
    art.className = 'ui221-nav-art';
    art.setAttribute('aria-hidden', 'true');
    button.insertAdjacentElement('afterbegin', art);
  }
  if (art.dataset.ui232Simplified === 'true') return;
  art.className = 'ui221-nav-art ui231-info-art ui232-info-art';
  art.innerHTML = weaponInfoBlueprintIcon();
  art.dataset.ui232Simplified = 'true';
}

function configureWeaponInfoHeader() {
  const view = document.querySelector('#mainMenu [data-menu-view="weapon-info"]');
  const title = view?.querySelector('.weapon-info-title');
  if (!view || !title) return;

  const eyebrow = title.querySelector('.menu-eyebrow');
  const heading = title.querySelector('h2');
  const copy = title.querySelector('p');
  setText(eyebrow, 'COMPLETE ARSENAL · CANONICAL COMBAT DATA');
  setText(heading, 'WEAPON INFO');
  setText(copy, 'All eight live weapons in one dedicated reference page with real in-game models, exact stats, handling bars and the actual gameplay crosshair spread renderer.');

  for (const stale of title.querySelectorAll('[data-ui221-weapon-back], .ui221-page-back')) stale.remove();
  const modernButtons = [...title.querySelectorAll('[data-ui231-weapon-back]')];
  for (const duplicate of modernButtons.slice(1)) duplicate.remove();
  if (!modernButtons[0]?.isConnected) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ui231-page-back';
    button.dataset.ui231WeaponBack = '';
    button.textContent = 'BACK TO MAIN MENU';
    button.addEventListener('click', () => window.dispatchEvent(new CustomEvent('skirmish:show-menu-home')));
    title.appendChild(button);
  }
}

function syncWeaponPageState() {
  const menu = document.getElementById('mainMenu');
  const weaponView = menu?.querySelector('[data-menu-view="weapon-info"]');
  const active = Boolean(menu?.classList.contains('visible') && weaponView?.classList.contains('active'));
  document.body.classList.toggle('ui231-weapon-page', active);

  if (!active) {
    document.body.classList.remove('ui221-weapon-page');
    if (weaponView?.dataset.ui231Opened) delete weaponView.dataset.ui231Opened;
    return;
  }

  if (weaponView && weaponView.dataset.ui231Opened !== 'true') {
    weaponView.scrollTop = 0;
    weaponView.dataset.ui231Opened = 'true';
  }
}

function hydratePresentation() {
  hydrateWeaponModelCanvases(document);
  hydrateGameplayCrosshairCanvases(document);
}

let queued = false;
function refresh231() {
  queued = false;
  installHomeLogo();
  updateHomeBuildLabel();
  installWeaponInfoTileArt();
  configureWeaponInfoHeader();
  syncWeaponPageState();
  hydratePresentation();
}

function scheduleRefresh() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(refresh231);
}

ensureStyle('ui-2.3.1.css');
ensureStyle('ui-2.3.2.css');
ensureStyle('ui-2.3.3.css');
ensureStyle('ui-2.3.4.css');
document.body.classList.add('ui-231', 'ui-232', 'ui-233', 'ui-234');

// 2.3.x remains the final presentation runtime in the deterministic boot chain.
// Refresh only from explicit application events and resize. Never observe and
// mutate the same menu subtree; that old feedback loop could starve Electron.
window.addEventListener('skirmish:menu-view-change', scheduleRefresh);
window.addEventListener('skirmish:show-menu-home', scheduleRefresh);
window.addEventListener('resize', scheduleRefresh);
scheduleRefresh();
