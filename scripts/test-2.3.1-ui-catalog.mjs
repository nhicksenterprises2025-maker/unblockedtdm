import fs from 'node:fs';
import assert from 'node:assert/strict';
import { WEAPON_LIST } from '../game/src/data/weapons.js';
import { DASH_STAMINA_COST } from '../game/src/engine/constants.js';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const menu = read('game/src/ui/MainMenu.js');
const loadoutScreen = read('game/src/ui/LoadoutScreen.js');
const runtime = read('game/src/phase231-runtime.js');
const css = read('game/src/ui-2.3.1.css');
const css232 = read('game/src/ui-2.3.2.css');
const css233 = read('game/src/ui-2.3.3.css');
const css234 = read('game/src/ui-2.3.4.css');
const settings = read('game/src/engine/GameSettings.js');
const loadouts = read('game/src/data/LoadoutStore.js');
const tactical = read('game/src/ui/TacticalHUD.js');
const career = read('game/src/phase211-runtime.js');
const logoUrl = new URL('../game/src/assets/skirmish-arena-main-logo.svg', import.meta.url);

assert.equal(WEAPON_LIST.length, 8);
assert.ok(menu.includes('WEAPON_LIST.map(weaponCatalogCard)'));
assert.ok(menu.includes('weaponModelSvg(weapon)'));
assert.ok(menu.includes('formatWeaponStats(weapon)'));
assert.ok(menu.includes('statBarsHtml(weapon)'));
assert.ok(menu.includes('spreadVisualHtml(weapon)'));
assert.ok(menu.includes('data-weapon-info-catalog'));
assert.equal(menu.includes('detail.innerHTML ='), false);

assert.ok(runtime.includes("assets/skirmish-arena-main-logo.svg"));
assert.ok(runtime.includes('skirmish-arena-main-logo-2.5'));
assert.ok(runtime.includes("document.body.classList.toggle('ui231-weapon-page'"));
assert.ok(runtime.includes('hydrateWeaponModelCanvases(document)'));
assert.ok(runtime.includes('hydrateGameplayCrosshairCanvases(document)'));
assert.ok(runtime.includes("setText(eyebrow, 'BUILD 2.4.1')"));
assert.ok(runtime.includes("ensureStyle('ui-2.3.4.css')"));
assert.ok(runtime.includes("import './phase241-runtime.js'"));
assert.ok(runtime.includes('ui232-blueprint-icon'));
assert.equal(runtime.includes("button.addEventListener('click', () => queueMicrotask"), false);
assert.ok(runtime.includes("title.querySelectorAll('[data-ui221-weapon-back], .ui221-page-back')"));
assert.ok(runtime.includes('modernButtons.slice(1)'));

assert.ok(css.includes('body.ui-231:not(.ui231-weapon-page) #mainMenu [data-menu-view="weapon-info"]'));
assert.ok(css.includes('overflow-y:auto!important'));
assert.ok(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'));
assert.ok(css.includes('.ui231-weapon-card'));
assert.ok(css.includes('.ui231-exact-stats'));
assert.ok(css.includes('.menu-hero h1{display:none!important}'));
assert.ok(css.includes('background:linear-gradient(135deg,#e1e6e9'));
assert.ok(css.includes('phase2-loadouts .ui221-loadout-art'));
assert.ok(css.includes('phase2-settings .ui221-settings-art'));

assert.ok(css232.includes('[data-menu-view="home"] .menu-feature-grid'));
assert.ok(css232.includes('display:none!important'));
assert.ok(css232.includes('.career-strip-211'));
assert.ok(css232.includes('.ui232-info-art'));

assert.ok(loadoutScreen.includes("import { PRIMARY_WEAPONS, SECONDARY_WEAPONS }"));
assert.equal(loadoutScreen.includes('formatWeaponStats'), false);
assert.equal(loadoutScreen.includes('statBarsHtml'), false);
assert.equal(loadoutScreen.includes('spreadVisualHtml'), false);
assert.ok(loadoutScreen.includes('weaponModelSvg(item)'));
assert.ok(loadoutScreen.includes('weaponModelSvg(weapon)'));
assert.ok(loadoutScreen.includes('data-loadout-index'));
assert.ok(loadoutScreen.includes('id="selectWeapon"'));
assert.ok(loadoutScreen.includes('id="deployButton"'));
assert.ok(css233.includes('height:clamp(72px,10.5vh,112px)'));
assert.ok(css233.includes('width:min(92%,620px)'));

assert.ok(css234.includes('body.ui-234 .ui221-page-back{display:none!important}'));
assert.ok(css234.includes('background:transparent!important'));
assert.ok(css234.includes('left:calc(var(--ui234-edge) + 312px)'));
assert.ok(css234.includes('right:var(--ui234-edge)!important'));

assert.ok(settings.includes("map: 'KeyM'"));
assert.ok(settings.includes("scoreboard: 'Tab'"));
assert.ok(loadouts.includes('LOADOUT_SLOT_COUNT = 25'));
assert.ok(loadouts.includes('DEFAULT_LOADOUT_SLOT_COUNT = 3'));
assert.ok(tactical.includes('<span>K</span><span>D</span><span>A</span><span>K/D</span><span>DMG</span>'));
assert.ok(career.includes('MAX_CAREER_LEVEL'));
assert.ok(career.includes('LEVEL ${profile.level}'));
assert.equal(DASH_STAMINA_COST, 0);

assert.ok(fs.existsSync(logoUrl));
const logo = fs.readFileSync(logoUrl, 'utf8');
assert.ok(logo.length > 2500);
assert.ok(logo.includes('<svg'));
assert.ok(logo.includes('>SKIRMISH</text>'));
assert.ok(logo.includes('>ARENA</text>'));

for (const weapon of WEAPON_LIST) {
  assert.ok(weapon.id && weapon.name && weapon.kind && weapon.slot);
  assert.ok(Number.isFinite(weapon.damage) && weapon.damage >= 0);
  assert.ok(Number.isFinite(weapon.fireInterval) && weapon.fireInterval >= 0);
}

console.log('Skirmish Arena 2.3.x compatibility checks passed with 2.4.1 balance-ready weapon schema.');
