import { LoadoutStore } from './data/LoadoutStore.js';
import { hydrateWeaponModelCanvases, weaponModelSvg } from './ui/WeaponPresentation.js';

function ensureStyle(href) {
  if ([...document.querySelectorAll('link[rel="stylesheet"]')].some((link) => link.getAttribute('href') === href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

ensureStyle('ui-2.01.1.css');
document.body.classList.add('ui-2011');

let scheduled = false;
function scheduleRefresh() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    hydrateWeaponModelCanvases(document);
    enhanceRoundLoadoutSwitcher();
  });
}

function enhanceRoundLoadoutSwitcher() {
  const grid = document.getElementById('roundLoadoutGrid');
  if (!grid) return;

  const savedSlots = new LoadoutStore().all();
  for (const button of grid.querySelectorAll('[data-round-loadout]')) {
    const index = Number(button.dataset.roundLoadout);
    const slot = savedSlots.find((entry) => entry.index === index);
    if (!slot) continue;

    const fingerprint = `${slot.primary.id}:${slot.secondary.id}`;
    let models = button.querySelector('.phase2011-round-models');
    if (!models) {
      models = document.createElement('span');
      models.className = 'phase2011-round-models';
      button.prepend(models);
    }
    if (models.dataset.fingerprint === fingerprint) continue;

    models.dataset.fingerprint = fingerprint;
    models.innerHTML = `
      <span class="phase2011-round-model primary" title="${slot.primary.name}">${weaponModelSvg(slot.primary, 'phase2011-round-canvas')}</span>
      <span class="phase2011-round-model secondary" title="${slot.secondary.name}">${weaponModelSvg(slot.secondary, 'phase2011-round-canvas')}</span>`;
    hydrateWeaponModelCanvases(models);
  }
}

const observer = new MutationObserver(scheduleRefresh);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener('unblockedtdm:settings-change', scheduleRefresh);
window.addEventListener('storage', scheduleRefresh);

scheduleRefresh();
