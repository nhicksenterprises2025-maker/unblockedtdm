// 2.2.1 rollback hotfix: keep the known-good 2.2.1 menu/career stack and
// repair only the Weapon Info navigation tile requested for the rollback.

function blueprintGunIcon() {
  return `<svg viewBox="0 0 140 100" aria-hidden="true" style="display:block;width:118px;height:86px;max-width:100%;max-height:100%">
    <defs>
      <linearGradient id="weaponInfoBlueprint" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#32b9ff"/>
        <stop offset="1" stop-color="#0878c9"/>
      </linearGradient>
      <filter id="weaponInfoGlow"><feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#25b8ff" flood-opacity=".42"/></filter>
    </defs>
    <path d="M18 12h91c7 0 13 6 13 13v58H33c-8 0-15-7-15-15Z" fill="#071b29" stroke="url(#weaponInfoBlueprint)" stroke-width="3"/>
    <path d="M33 12v71" fill="none" stroke="#159ee8" stroke-width="2" opacity=".7"/>
    <g fill="none" stroke="#49c7ff" stroke-linecap="round" stroke-linejoin="round" filter="url(#weaponInfoGlow)">
      <path d="M47 42h38l8 6h14v8H84l-8 7H55l-4-7H43v-9h7Z" stroke-width="3"/>
      <path d="M66 63v10h12l5-10M54 47l5-8h17l5 8M93 48v-6h12" stroke-width="2.4"/>
      <path d="M45 28h57M45 77h46" stroke-width="1.5" stroke-dasharray="5 5" opacity=".6"/>
    </g>
    <circle cx="112" cy="20" r="3" fill="#53ccff"/>
  </svg>`;
}

function installWeaponInfoTile() {
  const button = document.querySelector('#mainMenu [data-menu-action="weapon-info"]');
  if (!button) return;

  let art = button.querySelector('.ui221-nav-art');
  if (!art) {
    art = document.createElement('span');
    art.className = 'ui221-nav-art ui221-info-art';
    art.setAttribute('aria-hidden', 'true');
    button.insertAdjacentElement('afterbegin', art);
  }

  if (art.dataset.weaponInfoHotfix !== 'true') {
    art.classList.add('ui221-info-art');
    art.innerHTML = blueprintGunIcon();
    art.dataset.weaponInfoHotfix = 'true';
  }

  button.style.pointerEvents = 'auto';
  button.style.cursor = 'pointer';

  if (button.dataset.weaponInfoHotfixBound === 'true') return;
  button.dataset.weaponInfoHotfixBound = 'true';
  button.addEventListener('click', () => queueMicrotask(() => {
    const menu = document.getElementById('mainMenu');
    const target = menu?.querySelector('[data-menu-view="weapon-info"]');
    if (!menu || !target) return;
    menu.classList.add('visible');
    for (const view of menu.querySelectorAll('[data-menu-view]')) {
      view.classList.toggle('active', view === target);
    }
    for (const nav of menu.querySelectorAll('[data-menu-nav]')) {
      nav.classList.toggle('active', nav.dataset.menuNav === 'weapon-info');
    }
    document.body.classList.add('ui221-weapon-page');
    const content = menu.querySelector('.main-content');
    if (content) content.scrollTop = 0;
    window.dispatchEvent(new CustomEvent('skirmish:menu-view-change', { detail: { view: 'weapon-info' } }));
  }));
}

let queued = false;
function refreshWeaponInfoHotfix() {
  queued = false;
  installWeaponInfoTile();
}
function scheduleWeaponInfoHotfix() {
  if (queued) return;
  queued = true;
  queueMicrotask(refreshWeaponInfoHotfix);
}

const observer = new MutationObserver(scheduleWeaponInfoHotfix);
observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
window.addEventListener('skirmish:menu-view-change', scheduleWeaponInfoHotfix);
window.addEventListener('skirmish:show-menu-home', scheduleWeaponInfoHotfix);
scheduleWeaponInfoHotfix();
