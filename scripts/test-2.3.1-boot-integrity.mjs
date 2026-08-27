import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (relative) => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const debug = read('game/src/debug-tuning.js');
const index = read('game/src/index.html');
const main = read('game/src/main.js');
const smoke = read('scripts/smoke-packaged-game.mjs');
const pkg = JSON.parse(read('package.json'));

const orderedRuntimes = [
  './flow-v18.js',
  './phase3-runtime.js',
  './phase4-runtime.js',
  './phase5-runtime.js',
  './phase6-runtime.js',
  './phase7-runtime.js',
  './phase8-runtime.js',
  './phase9-runtime.js',
  './phase10-runtime.js',
  './phase2011-runtime.js',
  './phase2012-runtime.js',
  './phase2013-runtime.js',
  './phase2014-runtime.js',
  './phase221-runtime.js',
  './phase231-runtime.js'
];

assert.ok(debug.includes("document.body.classList.add('skirmish-booting')"), 'Legacy shell must be hidden behind the boot guard before modern runtime ownership.');
assert.ok(debug.includes("document.body.dataset.skirmishBoot='ready'"), 'Successful startup must expose an explicit ready state.');
assert.ok(debug.includes("document.body.dataset.skirmishBoot='failed'"), 'Failed startup must expose an explicit failed state instead of revealing Build 1.6.');
assert.ok(debug.includes("await import('./renderer.js')"), 'Core renderer must be awaited by the deterministic bootstrap.');
assert.ok(debug.includes('const loadRuntime=async'), 'Bootstrap must route every modern phase through one awaited loader.');
assert.ok(debug.includes('careerBridge.loadCareerRuntime()'), 'Career compatibility bridge must be awaited explicitly instead of fire-and-forget.');
assert.equal(debug.includes("import('./flow-v18.js').catch"), false, 'The old fire-and-forget runtime chain must be removed.');
assert.ok(debug.includes('modernUiReady'), 'Bootstrap must verify modern UI ownership before exposing the client.');
assert.ok(debug.includes("brand==='SKIRMISH ARENA'"), 'Bootstrap readiness must verify Skirmish Arena branding.');
assert.ok(debug.includes("document.querySelector('[data-career-strip]')"), 'Bootstrap readiness must verify Career exists.');
assert.ok(debug.includes("document.querySelector('[data-weapon-info-catalog]')"), 'Bootstrap readiness must verify the Weapon Info catalog exists.');

let previous = -1;
for (const runtime of orderedRuntimes) {
  const needle = `import('${runtime}')`;
  const position = debug.indexOf(needle);
  assert.ok(position > previous, `${runtime} must appear in deterministic historical order.`);
  assert.ok(debug.slice(Math.max(0, position - 80), position).includes('loadRuntime'), `${runtime} must be awaited through the deterministic loader.`);
  assert.ok(fs.existsSync(new URL(`../game/src/${runtime.replace('./', '')}`, import.meta.url)), `${runtime} must be packaged in game/src.`);
  previous = position;
}

const debugScript = index.indexOf('<script src="debug-tuning.js"></script>');
const rendererScript = index.indexOf('<script type="module" src="renderer.js"></script>');
assert.ok(debugScript >= 0 && rendererScript > debugScript, 'Boot bootstrap script must be parsed before the direct renderer module fallback.');
const immediateGuard = debug.lastIndexOf('installBootGuard();');
const startBootFunction = debug.indexOf('async function startDeterministicBoot()');
const domReadyRegistration = debug.indexOf("if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startDeterministicBoot");
assert.ok(immediateGuard > startBootFunction && immediateGuard < domReadyRegistration, 'Boot shield must engage immediately during classic-script evaluation, before DOMContentLoaded and renderer-module execution.');

assert.ok(main.includes("process.env.SKIRMISH_SMOKE_TEST === '1'"), 'Portable packaged smoke mode must use an inherited environment signal.');
assert.ok(main.includes("process.argv.includes('--smoke-test')"), 'Packaged game must retain the CLI smoke fallback for direct testing.');
assert.ok(main.includes('fullscreen: true'), 'Normal game startup must remain fullscreen-first.');
assert.ok(main.includes('windowOptions.fullscreen = false'), 'Only packaged smoke mode may suppress fullscreen.');
assert.ok(main.includes("state.boot === 'ready'"), 'Packaged smoke mode must require the bootstrap ready state.');
assert.ok(main.includes("state.brand === 'SKIRMISH ARENA'"), 'Packaged smoke mode must verify modern branding.');
assert.ok(main.includes('state.career &&'), 'Packaged smoke mode must verify Career presentation.');
assert.ok(main.includes('state.catalog &&'), 'Packaged smoke mode must verify Weapon Info presentation.');
assert.ok(main.includes('state.logo'), 'Packaged smoke mode must verify the 2.3.1 home logo.');

assert.ok(smoke.includes("SKIRMISH_SMOKE_TEST: '1'"), 'Smoke runner must propagate the authoritative environment signal through the portable wrapper.');
assert.ok(smoke.includes('win-unpacked/UnblockedTDM.exe'), 'CI must directly boot-test the packaged Electron app.');
assert.ok(smoke.includes("../dist-game/UnblockedTDM.exe"), 'CI must also boot-test the final portable release executable.');
assert.ok(smoke.includes("taskkill"), 'Timed-out Windows smoke tests must clean up the full portable process tree.');

assert.ok(pkg.scripts['smoke:packaged']?.includes('smoke-packaged-game.mjs'), 'Build system must expose the packaged smoke test.');
assert.ok(pkg.scripts['build:windows']?.includes('npm run smoke:packaged'), 'Windows release build must smoke-test the packaged EXE before launcher packaging/publish.');
assert.ok(pkg.scripts.check.includes('test-2.3.1-boot-integrity.mjs'), 'Boot integrity regression gate must run in npm check.');

console.log('Skirmish Arena boot-integrity checks passed: deterministic runtime order, immediate fail-closed legacy-shell shielding, portable-safe smoke signaling, and both packaged EXE paths are enforced.');
