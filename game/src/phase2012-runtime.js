import { hydrateGameplayCrosshairCanvases } from './ui/WeaponPresentation.js';

function ensureStyle(href) {
  if ([...document.querySelectorAll('link[rel="stylesheet"]')].some((link) => link.getAttribute('href') === href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

ensureStyle('ui-2.01.2.css');
document.body.classList.add('ui-2012');

let scheduled = false;
function refresh() {
  scheduled = false;
  const mainMenu = document.getElementById('mainMenu');
  const weaponInfoOpen = Boolean(
    mainMenu?.classList.contains('visible') &&
    mainMenu.querySelector('[data-menu-view="weapon-info"].active')
  );
  document.body.classList.toggle('weapon-info-open', weaponInfoOpen);
  hydrateGameplayCrosshairCanvases(document);
}

function scheduleRefresh() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(refresh);
}

const observer = new MutationObserver(scheduleRefresh);
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class']
});
window.addEventListener('resize', scheduleRefresh);

scheduleRefresh();
