import assert from 'node:assert/strict';
import fs from 'node:fs';
import { WEAPON_LIST, WEAPONS } from '../game/src/data/weapons.js';
import { PlayerRenderer, TEAM_PALETTES } from '../game/src/render/PlayerRenderer.js';
import { WeaponRenderer } from '../game/src/render/WeaponRenderer.js';

const read = (relative) => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const weaponSource = read('game/src/render/WeaponRenderer.js');
const playerSource = read('game/src/render/PlayerRenderer.js');
const phase241 = read('game/src/phase241-runtime.js');
const rendererSource = read('game/src/renderer.js');

function fakeContext() {
  const gradient = () => ({ addColorStop() {} });
  const target = {
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    createLinearGradient: gradient,
    createRadialGradient: gradient,
    measureText: () => ({ width: 0 })
  };
  return new Proxy(target, {
    get(object, key) {
      if (key in object) return object[key];
      const method = () => {};
      object[key] = method;
      return method;
    },
    set(object, key, value) {
      object[key] = value;
      return true;
    }
  });
}

assert.equal(WEAPON_LIST.length, 8, 'Render polish must preserve the eight-weapon roster.');
assert.deepEqual(Object.keys(TEAM_PALETTES).sort(), ['blue', 'red'], 'Character rendering must retain two explicit team palettes.');

const methodById = {
  'assault-rifle': 'drawAR',
  smg: 'drawSMG',
  sniper: 'drawSniper',
  shotgun: 'drawShotgun',
  lmg: 'drawLMG',
  pistol: 'drawPistol',
  launcher: 'drawLauncher',
  melee: 'drawMelee'
};
const renderer = new WeaponRenderer(fakeContext());
for (const weapon of WEAPON_LIST) {
  const method = methodById[weapon.id];
  assert.equal(typeof renderer[method], 'function', `${weapon.name} must retain a shared gameplay renderer.`);
  renderer[method](renderer.ctx, { firing:false, reloading:false, fireKick:0, meleeSwing:0 }, 0);
  renderer[method](renderer.ctx, { firing:true, reloading:false, fireKick:0.8, meleeSwing:0.65 }, 0);
  renderer[method](renderer.ctx, { firing:false, reloading:true, fireKick:0, meleeSwing:0 }, 0.25);
  renderer[method](renderer.ctx, { firing:false, reloading:true, fireKick:0, meleeSwing:0 }, 0.75);
}

for (const token of [
  'metalGradient', 'triggerGuard', 'ventSlots', 'drawMagazine', 'drawShotgunShell', 'drawCasing',
  "'assault-rifle': [18, 5.2]", "shotgun: [25, 9]", "launcher: [13, 7]",
  "globalCompositeOperation = 'lighter'"
]) assert.ok(weaponSource.includes(token), `Shared weapon polish is missing ${token}.`);

const playerRenderer = new PlayerRenderer(fakeContext());
const health = {
  alive: true,
  respawnTimer: 0,
  isSpawnProtected: () => true
};
const player = {
  x: 100,
  y: 100,
  radius: 18,
  team: 'blue',
  isLocal: true,
  health,
  trail: [{ type:'dash', x:90, y:100, aimAngle:0, life:0.08, maxLife:0.12 }],
  dashBlend: 0.8,
  dashDirection: 0,
  animationPhase: 0.25,
  animationTime: 1,
  sprintBlend: 0.7,
  motionBlend: 1,
  bodyLean: 0.5,
  visualMoveAngle: 0,
  visualAimAngle: 0,
  aimAngle: 0,
  dashDeniedTimer: 0,
  isInvulnerable: () => true
};
const manager = {
  currentWeapon: () => WEAPONS.assaultRifle,
  currentAmmo: () => ({ magazine: 3, reserve: 72 }),
  animationState: () => ({ fireKick:0.7 })
};
playerRenderer.draw(player, manager);
health.alive = false;
health.respawnTimer = 2;
playerRenderer.draw(player, manager);

for (const token of [
  'drawSpawnProtection', 'drawDeathMarker', 'drawHeadAndHelmet', 'drawDashGroundStreak',
  'palette.armorLight', 'weaponManager?.animationState?.()', "fillStyle='#ff4658'"
]) assert.ok(playerSource.includes(token), `Player presentation polish is missing ${token}.`);
assert.ok(
  rendererSource.includes('const drawOrder = players.slice().sort') &&
  rendererSource.includes('playerRenderer.draw(actor, actor.weaponManager);') &&
  rendererSource.includes('if (!actor.health.alive) continue;'),
  'Eliminated actors must reach the death presentation while live-only weapon effects remain gated.'
);

for (const token of [
  "import './phase2433-runtime.js';",
  "ensureStyle('ui-2.4.3.3.css')",
  'WeaponRenderer.prototype.drawShotgun',
  'ctx.moveTo(-22,-6)',
  'const pumpX = 27 - pumpSlide',
  'ctx.roundRect(pumpX,-6.2,20,12.4,3)',
  'ctx.fillRect(44,-3.4,25,3.4)',
  'ctx.fillRect(44,1.1,21,3.1)',
  'hydrateWeaponModelCanvases(document)'
]) assert.ok(phase241.includes(token), `Phase 2.4.1/Phase 3 render bridge is missing ${token}.`);

console.log('Skirmish Arena 2.4.3.3 render checks passed: eight distinct shared weapon models, live mechanical animation states, tactical character layers, team readability, spawn/death states, and pump-action compatibility.');
