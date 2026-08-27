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
  return `<svg class="ui231-blueprint-icon" viewBox="0 0 150 110" aria-hidden="true">
    <defs>
      <linearGradient id="ui231BlueprintEdge" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#67d6ff"/><stop offset=".48" stop-color="#25b9ff"/><stop offset="1" stop-color="#087fc9"/>
      </linearGradient>
      <filter id="ui231BlueprintGlow"><feDropShadow dx="0" dy="0" stdDeviation="2.2" flood-color="#2fc1ff" flood-opacity=".34"/></filter>
    </defs>
    <path d="M17 10h94c11 0 20 9 20 20v67H38c-12 0-21-9-21-21Z" fill="#071a27" stroke="url(#ui231BlueprintEdge)" stroke-width="3"/>
    <path d="M38 10v87" fill="none" stroke="#169eda" stroke-width="2" opacity=".78"/>
    <path d="M48 24h67M48 87h53" fill="none" stroke="#1a8fca" stroke-width="1.4" stroke-dasharray="5 5" opacity=".58"/>
    <g fill="none" stroke="#62d4ff" stroke-linejoin="round" stroke-linecap="round" filter="url(#ui231BlueprintGlow)">
      <path d="M48 50h45l8 6h21v10H94l-10 8H61l-5-8H46V56h9Z" stroke-width="3"/>
      <path d="M67 74v11h15l6-12M59 56l6-10h20l7 10M101 56v-8h14" stroke-width="2.3"/>
      <path d="M50 38h54M50 80h43" stroke-width="1.2" stroke-dasharray="4 4" opacity=".64"/>
    </g>
    <circle cx="119" cy="22" r="3" fill="#70dcff"/>
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
  setText(eyebrow, 'BUILD 2.3.1');
  buildInfoPromise.then((info) => {
    if (!eyebrow.isConnected) return;
    setText(eyebrow, `BUILD ${info?.gameVersion || '2.3.1'}`);
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
  if (art.dataset.ui231Blueprint === 'true') return;
  art.className = 'ui221-nav-art ui231-info-art';
  art.innerHTML = weaponInfoBlueprintIcon();
  art.dataset.ui231Blueprint = 'true';
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

  title.querySelector('[data-ui221-weapon-back]')?.remove();
  if (!title.querySelector('[data-ui231-weapon-back]')) {
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
document.body.classList.add('ui-231');

// 2.3.1 is the final runtime in the deterministic boot chain. Earlier builds
// used a subtree-wide MutationObserver here; refresh231 itself mutates that same
// subtree, allowing a self-triggering microtask loop that could starve Electron
// and leave the historical 1.6 shell visible/unresponsive. Refresh only from
// explicit application events and resize, and make all writes idempotent.
window.addEventListener('skirmish:menu-view-change', scheduleRefresh);
window.addEventListener('skirmish:show-menu-home', scheduleRefresh);
window.addEventListener('resize', scheduleRefresh);
scheduleRefresh();
