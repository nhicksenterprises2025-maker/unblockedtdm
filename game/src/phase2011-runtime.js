import { LoadoutStore } from './data/LoadoutStore.js';
import { WEAPON_LIST } from './data/weapons.js';
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
    enhanceWeaponInfoList();
    enhanceRoundLoadoutSwitcher();
    hydrateWeaponModelCanvases(document);
  });
}

function enhanceWeaponInfoList() {
  const list = document.querySelector('[data-weapon-info-list]');
  if (!list) return;

  for (const button of list.querySelectorAll('[data-weapon-info]')) {
    const weapon = WEAPON_LIST.find((entry) => entry.id === button.dataset.weaponInfo);
    if (!weapon || button.querySelector('.phase2011-list-model')) continue;
    const model = document.createElement('span');
    model.className = 'phase2011-list-model';
    model.innerHTML = weaponModelSvg(weapon, 'phase2011-list-canvas');
    button.prepend(model);
    hydrateWeaponModelCanvases(model);
  }
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
for (const root of [
  document.querySelector('[data-weapon-info-list]'),
  document.getElementById('roundLoadoutGrid')
].filter(Boolean)) {
  observer.observe(root, { childList: true, subtree: true });
}
window.addEventListener('unblockedtdm:settings-change', scheduleRefresh);
window.addEventListener('storage', scheduleRefresh);
window.addEventListener('beforeunload', () => observer.disconnect(), { once:true });

scheduleRefresh();
