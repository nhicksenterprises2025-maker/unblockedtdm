import { TILE_SIZE } from './engine/constants.js';
import { WeaponManager } from './combat/WeaponManager.js';
import { castHitscan } from './combat/Hitscan.js';
import { hydrateWeaponModelCanvases } from './ui/WeaponPresentation.js';
import { quitCommandIcon, settingsCommandIcon, weaponInfoCommandIcon } from './ui/HomeCommandArt.js';

const DEG_TO_RAD = Math.PI / 180;

function ensureStyle(href) {
  if ([...document.querySelectorAll('link[rel="stylesheet"]')].some((link) => link.getAttribute('href') === href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function installShotgunRangeCap() {
  if (WeaponManager.prototype.__ui221ShotgunCap) return;
  WeaponManager.prototype.__ui221ShotgunCap = true;

  WeaponManager.prototype.fireShotgun = function fireShotgun221(weapon, map, targets) {
    const muzzle = this.muzzleWorldPosition();
    const spread = this.currentSpreadDegrees();
    const crit = Math.random() < weapon.critChance;
    const aggregate = new Map();
    const maxDistance = Math.max(0, Number(weapon.maxRangeTiles ?? weapon.fullDamageRangeTiles) || 0) * TILE_SIZE;

    for (let i = 0; i < weapon.pelletCount; i += 1) {
      const radial = Math.sqrt(Math.random());
      const ringAngle = Math.random() * Math.PI * 2;
      const angularOffset = Math.cos(ringAngle) * radial * (spread * 0.5) * DEG_TO_RAD;
      const angle = this.owner.aimAngle + angularOffset;
      const hit = castHitscan({ origin: muzzle, angle, map, targets, shooter: this.owner, maxDistance });
      this.feedback.spawnShot({ muzzle, end: hit.point, crit, hit: Boolean(hit.target), type: 'shotgun-pellet' });
      if (!hit.target) continue;

      const centerDistance = Math.hypot(hit.target.x - this.owner.x, hit.target.y - this.owner.y);
      if (centerDistance > maxDistance) continue;
      const pelletDamage = crit
        ? weapon.critDamage
        : (centerDistance <= weapon.fullDamageRangeTiles * TILE_SIZE ? weapon.damage : weapon.falloffDamage);
      const record = aggregate.get(hit.target.id) || { target: hit.target, damage: 0, point: hit.point };
      record.damage += pelletDamage;
      record.point = hit.point;
      aggregate.set(hit.target.id, record);
    }

    let anyApplied = false;
    for (const record of aggregate.values()) {
      const result = this.applyWeaponDamage(record.target, record.damage, crit, record.point, weapon);
      anyApplied ||= Boolean(result.applied);
    }
    return {
      applied: anyApplied,
      pelletsHit: [...aggregate.values()].reduce((sum, record) => sum + Math.round(record.damage / (crit ? weapon.critDamage : weapon.damage)), 0)
    };
  };
}

function silverPlayIcon() {
  return `<span class="ui221-nav-art ui221-play-art" aria-hidden="true">
    <svg viewBox="0 0 120 120" focusable="false">
      <defs>
        <linearGradient id="ui221PlayMetal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".26" stop-color="#b9c4cd"/><stop offset=".5" stop-color="#5f6b75"/><stop offset=".72" stop-color="#e7edf1"/><stop offset="1" stop-color="#7b8790"/></linearGradient>
        <linearGradient id="ui221PlayEdge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7fbff"/><stop offset="1" stop-color="#87939d"/></linearGradient>
        <filter id="ui221PlayShadow"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000" flood-opacity=".45"/></filter>
      </defs>
      <path d="M31 20 98 60 31 100Z" fill="url(#ui221PlayMetal)" stroke="url(#ui221PlayEdge)" stroke-width="5" stroke-linejoin="round" filter="url(#ui221PlayShadow)"/>
      <path d="M42 39 78 60 42 81Z" fill="#0b1218" opacity=".33"/>
      <path d="M35 26 91 60" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2"/>
    </svg>
  </span>`;
}

function loadoutIcon() {
  return `<span class="ui221-nav-art ui221-loadout-art" aria-hidden="true">
    <canvas width="330" height="110" data-game-weapon-model="assault-rifle" class="ui221-nav-weapon ui221-nav-ar"></canvas>
    <canvas width="330" height="110" data-game-weapon-model="shotgun" class="ui221-nav-weapon ui221-nav-shotgun"></canvas>
    <canvas width="330" height="110" data-game-weapon-model="pistol" class="ui221-nav-weapon ui221-nav-pistol"></canvas>
  </span>`;
}

const ICONS = Object.freeze({
  play: silverPlayIcon,
  loadouts: loadoutIcon,
  'weapon-info': weaponInfoCommandIcon,
  settings: settingsCommandIcon,
  quit: quitCommandIcon
});

function installMenuArt() {
  const nav = document.querySelector('#mainMenu .main-nav');
  if (!nav) return;
  for (const [action, factory] of Object.entries(ICONS)) {
    const button = nav.querySelector(`[data-menu-action="${action}"]`);
    if (!button || button.dataset.ui221Art === 'true') continue;
    button.querySelector('.phase2-nav-icon')?.remove();
    button.insertAdjacentHTML('afterbegin', factory());
    button.dataset.ui221Art = 'true';
  }
  hydrateWeaponModelCanvases(nav);
}

function ensureWeaponInfoBackButton() {
  const view = document.querySelector('#mainMenu [data-menu-view="weapon-info"]');
  const title = view?.querySelector('.weapon-info-title');
  if (!view || !title || title.querySelector('[data-ui221-weapon-back]')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ui221-page-back';
  button.dataset.ui221WeaponBack = '';
  button.textContent = 'BACK TO MAIN MENU';
  button.addEventListener('click', () => window.dispatchEvent(new CustomEvent('skirmish:show-menu-home')));
  title.appendChild(button);
}

function syncWeaponPageState() {
  const menu = document.getElementById('mainMenu');
  const active = Boolean(menu?.classList.contains('visible') && menu.querySelector('[data-menu-view="weapon-info"].active'));
  document.body.classList.toggle('ui221-weapon-page', active);
  if (active) {
    const content = menu.querySelector('.main-content');
    if (content) content.scrollTop = 0;
  }
}

function installWeaponInfoAccessGuard() {
  const button = document.querySelector('#mainMenu [data-menu-action="weapon-info"]');
  if (!button || button.dataset.ui221Access === 'true') return;
  button.dataset.ui221Access = 'true';
  button.addEventListener('click', () => queueMicrotask(() => {
    const menu = document.getElementById('mainMenu');
    const target = menu?.querySelector('[data-menu-view="weapon-info"]');
    if (!menu || !target) return;
    for (const view of menu.querySelectorAll('[data-menu-view]')) view.classList.toggle('active', view === target);
    syncWeaponPageState();
  }));
}

let scheduled = false;
function refreshUi221() {
  scheduled = false;
  installMenuArt();
  ensureWeaponInfoBackButton();
  installWeaponInfoAccessGuard();
  syncWeaponPageState();
  hydrateWeaponModelCanvases(document);
}

function scheduleRefresh() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(refreshUi221);
}

ensureStyle('ui-2.2.1.css');
document.body.classList.add('ui-221');
installShotgunRangeCap();

const observer = new MutationObserver(scheduleRefresh);
const mainMenu = document.getElementById('mainMenu');
if (mainMenu) observer.observe(mainMenu, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
window.addEventListener('skirmish:menu-view-change', scheduleRefresh);
window.addEventListener('skirmish:show-menu-home', scheduleRefresh);
window.addEventListener('resize', scheduleRefresh);
window.addEventListener('beforeunload', () => observer.disconnect(), { once:true });
scheduleRefresh();
