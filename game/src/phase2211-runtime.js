import { hydrateWeaponModelCanvases, hydrateGameplayCrosshairCanvases } from './ui/WeaponPresentation.js';

function ensureStyle(href) {
  if ([...document.querySelectorAll('link[rel="stylesheet"]')].some((link) => link.getAttribute('href') === href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function installHomeLogo() {
  const hero = document.querySelector('#mainMenu [data-menu-view="home"] .menu-hero');
  if (!hero) return;

  let logo = hero.querySelector('.ui2211-home-logo');
  if (!logo) {
    logo = document.createElement('img');
    logo.className = 'ui2211-home-logo';
    logo.src = 'assets/skirmish-arena-main-logo.webp';
    logo.alt = 'Skirmish Arena';
    logo.decoding = 'async';
    logo.draggable = false;
    const heading = hero.querySelector('h1');
    if (heading) heading.insertAdjacentElement('beforebegin', logo);
    else hero.prepend(logo);
  }
}

function configureWeaponInfoHeader() {
  const view = document.querySelector('#mainMenu [data-menu-view="weapon-info"]');
  const title = view?.querySelector('.weapon-info-title');
  if (!view || !title) return;

  const eyebrow = title.querySelector('.menu-eyebrow');
  const heading = title.querySelector('h2');
  const copy = title.querySelector('p');
  if (eyebrow) eyebrow.textContent = 'COMPLETE ARSENAL · CANONICAL COMBAT DATA';
  if (heading) heading.textContent = 'WEAPON INFO';
  if (copy) copy.textContent = 'All eight weapons, their actual in-game models, handling behavior and exact live combat values in one reference page.';

  if (!title.querySelector('[data-ui2211-weapon-back]')) {
    title.querySelector('[data-ui221-weapon-back]')?.remove();
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ui2211-page-back';
    button.dataset.ui2211WeaponBack = '';
    button.textContent = 'BACK TO MAIN MENU';
    button.addEventListener('click', () => window.dispatchEvent(new CustomEvent('skirmish:show-menu-home')));
    title.appendChild(button);
  }
}

function syncPageIsolation() {
  const menu = document.getElementById('mainMenu');
  if (!menu) return;
  const weaponView = menu.querySelector('[data-menu-view="weapon-info"]');
  const active = Boolean(menu.classList.contains('visible') && weaponView?.classList.contains('active'));
  document.body.classList.toggle('ui2211-weapon-page', active);
  document.body.classList.toggle('ui2211-home-page', Boolean(menu.classList.contains('visible') && menu.querySelector('[data-menu-view="home"].active')));

  if (active && weaponView) {
    const scroller = weaponView;
    if (scroller.dataset.ui2211Opened !== 'true') {
      scroller.scrollTop = 0;
      scroller.dataset.ui2211Opened = 'true';
    }
  } else if (weaponView) {
    delete weaponView.dataset.ui2211Opened;
  }
}

function refresh2211() {
  installHomeLogo();
  configureWeaponInfoHeader();
  syncPageIsolation();
  hydrateWeaponModelCanvases(document);
  hydrateGameplayCrosshairCanvases(document);
}

let scheduled = false;
function scheduleRefresh() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    refresh2211();
  });
}

ensureStyle('ui-2.21.1.css');
document.body.classList.add('ui-2211');

const observer = new MutationObserver(scheduleRefresh);
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class']
});
window.addEventListener('skirmish:menu-view-change', scheduleRefresh);
window.addEventListener('skirmish:show-menu-home', scheduleRefresh);
window.addEventListener('resize', scheduleRefresh);
scheduleRefresh();
