import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (relative) => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const debug = read('game/src/debug-tuning.js');
const index = read('game/src/index.html');
const main = read('game/src/main.js');
const phase231 = read('game/src/phase231-runtime.js');
const smoke = read('scripts/smoke-packaged-game.mjs');
const runner = read('scripts/check-all.mjs');
const pkg = JSON.parse(read('package.json'));

const orderedRuntimes = [
  './flow-v18.js','./phase3-runtime.js','./phase4-runtime.js','./phase5-runtime.js','./phase6-runtime.js','./phase7-runtime.js','./phase8-runtime.js','./phase9-runtime.js','./phase10-runtime.js','./phase2011-runtime.js','./phase2012-runtime.js','./phase2013-runtime.js','./phase2014-runtime.js','./phase221-runtime.js','./phase231-runtime.js','./phase250-runtime.js'
];

assert.ok(debug.includes("document.body.classList.add('skirmish-booting')"));
assert.ok(debug.includes("document.body.dataset.skirmishBoot='ready'"));
assert.ok(debug.includes("document.body.dataset.skirmishBoot='failed'"));
assert.ok(debug.includes("await import('./renderer.js')"));
assert.ok(debug.includes('const loadRuntime=async'));
assert.ok(debug.includes('careerBridge.loadCareerRuntime()'));
assert.equal(debug.includes("import('./flow-v18.js').catch"), false);
assert.ok(debug.includes('modernUiReady'));
assert.ok(debug.includes("brand==='SKIRMISH ARENA'"));
assert.ok(debug.includes("document.querySelector('[data-career-strip]')"));
assert.ok(debug.includes("document.querySelector('[data-weapon-info-catalog]')"));
assert.ok(debug.includes("document.body.dataset.phase250Ready==='true'"));

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
assert.ok(debugScript >= 0 && rendererScript > debugScript);
const immediateGuard = debug.lastIndexOf('installBootGuard();');
const startBootFunction = debug.indexOf('async function startDeterministicBoot()');
const domReadyRegistration = debug.indexOf("if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startDeterministicBoot");
assert.ok(immediateGuard > startBootFunction && immediateGuard < domReadyRegistration);

assert.equal(phase231.includes('new MutationObserver'), false);
assert.ok(phase231.includes('requestAnimationFrame(refresh231)'));
assert.ok(phase231.includes('function setText(node, value)'));
assert.ok(phase231.includes("window.addEventListener('skirmish:menu-view-change', scheduleRefresh)"));

assert.ok(main.includes("process.env.SKIRMISH_SMOKE_TEST === '1'"));
assert.ok(main.includes("process.argv.includes('--smoke-test')"));
assert.ok(main.includes('fullscreen: true'));
assert.ok(main.includes('windowOptions.fullscreen = false'));
assert.ok(main.includes("state.boot === 'ready'"));
assert.ok(main.includes("state.brand === 'SKIRMISH ARENA'"));
assert.ok(main.includes('state.career &&'));
assert.ok(main.includes('state.catalog &&'));
assert.ok(main.includes('state.logo'));

assert.ok(smoke.includes("SKIRMISH_SMOKE_TEST: '1'"));
assert.ok(smoke.includes('win-unpacked/UnblockedTDM.exe'));
assert.ok(smoke.includes("../dist-game/UnblockedTDM.exe"));
assert.ok(smoke.includes('taskkill'));

assert.ok(pkg.scripts['smoke:packaged']?.includes('smoke-packaged-game.mjs'));
assert.ok(pkg.scripts['build:windows']?.includes('npm run smoke:packaged'));
assert.ok(pkg.scripts.check?.includes('check-all.mjs'), 'npm check must execute the centralized regression runner.');
assert.ok(runner.includes("'scripts/test-2.3.1-boot-integrity.mjs'"), 'Boot integrity regression gate must be registered in the centralized npm check runner.');
assert.ok(runner.includes("'scripts/test-2.4.1-combat-polish.mjs'"), '2.4.1 regression gate must be registered in the centralized npm check runner.');

console.log('Skirmish Arena boot-integrity checks passed: deterministic startup, fail-closed legacy shielding, no self-triggering menu observer, portable-safe smoke signaling, and centralized release validation.');
