const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const buildInfo = require('./build-info.json');

// electron-builder's portable wrapper does not reliably forward arbitrary CLI
// arguments to the inner Electron process. Environment variables are inherited
// by both the wrapper and the extracted app, so this is the authoritative CI
// boot-test signal. The CLI flag remains as a local-development fallback.
const SMOKE_TEST = process.env.SKIRMISH_SMOKE_TEST === '1' || process.argv.includes('--smoke-test');
const SMOKE_RESULT_PATH = process.env.SKIRMISH_SMOKE_RESULT_PATH || '';
const SMOKE_TIMEOUT_MS = 30000;
const SMOKE_HARD_TIMEOUT_MS = 45000;
let window;
let smokeWatchdog = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function writeSmokeStatus(stage, detail = {}) {
  if (!SMOKE_TEST || !SMOKE_RESULT_PATH) return;
  try {
    fs.mkdirSync(path.dirname(SMOKE_RESULT_PATH), { recursive: true });
    fs.writeFileSync(SMOKE_RESULT_PATH, `${JSON.stringify({
      stage,
      timestamp: new Date().toISOString(),
      gameVersion: buildInfo.gameVersion,
      build: buildInfo.build,
      sequence: buildInfo.sequence,
      tag: buildInfo.tag,
      pid: process.pid,
      ...detail
    }, null, 2)}\n`, 'utf8');
  } catch (error) {
    console.error('PACKAGED_SMOKE_STATUS_WRITE_FAILED', error?.message || error);
  }
}

function exitSmoke(code, stage, detail = {}) {
  if (smokeWatchdog) clearTimeout(smokeWatchdog);
  writeSmokeStatus(stage, { ...detail, exitCode: code });
  app.exit(code);
}

async function runPackagedSmokeTest(target) {
  const started = Date.now();
  writeSmokeStatus('renderer-probe-start');
  try {
    while (Date.now() - started < SMOKE_TIMEOUT_MS) {
      const state = await Promise.race([
        target.webContents.executeJavaScript(`(() => ({
          boot: document.body?.dataset?.skirmishBoot || 'missing',
          stage: document.body?.dataset?.skirmishBootStage || '',
          version: document.body?.dataset?.skirmishBootVersion || '',
          brand: document.querySelector('#mainMenu .menu-brand strong')?.textContent?.trim() || '',
          career: Boolean(document.querySelector('[data-career-strip]')),
          arena: document.body?.dataset?.arenaReady === 'true' && Boolean(document.querySelector('[data-arena-strip]')),
          arenaPhase2: document.body?.dataset?.arenaPhase2Ready === 'true',
          arenaPhase3: document.body?.dataset?.arenaPhase3Ready === 'true',
          foundry: window.skirmishArenaPhase2?.arenaMapId === 'foundry-zero' && window.skirmishArenaPhase2?.emblemIds?.length === 14,
          phase3Integrity: Boolean(
            window.skirmishArenaPhase3?.integrity?.arenaEmblems &&
            window.skirmishArenaPhase3?.integrity?.careerEmblems &&
            window.skirmishArenaPhase3?.integrity?.weapons &&
            window.skirmishArenaPhase3?.integrity?.foundry
          ),
          phase250: Boolean(
            document.body?.dataset?.phase250Ready === 'true' &&
            document.body?.classList?.contains('ui-250') &&
            window.skirmishArena250?.version === '2.5.0'
          ),
          phase250Integrity: Boolean(
            window.skirmishArena250?.integrity?.sideViewMenuModels &&
            window.skirmishArena250?.integrity?.topDownGameplayModels &&
            window.skirmishArena250?.integrity?.arenaEmblems &&
            window.skirmishArena250?.integrity?.settingsTabs === 5 &&
            window.skirmishArena250?.integrity?.pauseTabs === 5 &&
            window.skirmishArena250?.integrity?.performanceSafeguards
          ),
          phase260: Boolean(
            document.body?.dataset?.phase260Ready === 'true' &&
            document.body?.classList?.contains('ui-260') &&
            window.skirmishArena260?.version === '2.6.0'
          ),
          phase260Integrity: Boolean(
            window.skirmishArena260?.integrity?.pauseTabs &&
            window.skirmishArena260?.integrity?.pauseIcons &&
            window.skirmishArena260?.integrity?.hudScaleRange &&
            window.skirmishArena260?.integrity?.foundryScale &&
            window.skirmishArena260?.integrity?.trainingBlueBarsRemoved
          ),
          phase250Surfaces: Boolean(
            document.querySelector('.ui231-home-logo[data-logo-version="2.5-vector"]') &&
            document.querySelector('[data-arena-strip][data-layout-version="2.5"]') &&
            document.querySelector('[data-loadout-version="2.5"]') &&
            document.querySelector('#mainSettingsPanel[data-settings-version="2.6"]') &&
            document.querySelectorAll('.settings-250-tabs [data-settings-tab]').length === 10 &&
            document.querySelectorAll('.pause-tabs [data-pause-tab]').length === 5 &&
            !document.querySelector('canvas[data-game-weapon-model][data-weapon-halo]:not([data-weapon-halo="none"])')
          ),
          viewIsolation: (() => {
            const views = [...document.querySelectorAll('#mainMenu .main-content>[data-menu-view]')];
            return views.filter((view) => getComputedStyle(view).display !== 'none').length === 1;
          })(),
          foundryPresentation: Boolean(
            window.skirmishArenaPhase3?.foundryPresentation?.enabled &&
            window.skirmishArenaPhase3?.foundryPresentation?.nonBlocking &&
            window.skirmishArenaPhase3?.foundryPresentation?.deterministic &&
            window.skirmishArenaPhase3?.foundryPresentation?.budgets?.maxParticleSlots <= 112 &&
            window.skirmishArenaPhase3?.foundryPresentation?.budgets?.maxAmbientSources <= 48
          ),
          catalog: Boolean(document.querySelector('[data-weapon-info-catalog]')),
          logo: (() => {
            const asset = document.querySelector('.ui231-home-logo[data-logo-version="2.5-vector"]');
            return Boolean(asset?.complete && asset?.naturalWidth > 0);
          })()
        }))()`),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Renderer probe did not answer within 3000ms.')), 3000))
      ]);

      writeSmokeStatus('renderer-probe', { state });

      if (state.boot === 'failed') {
        console.error('PACKAGED_SMOKE_FAIL boot-state=failed', JSON.stringify(state));
        exitSmoke(2, 'boot-failed', { state });
        return;
      }

      if (
        state.boot === 'ready' &&
        state.version === String(buildInfo.gameVersion) &&
        state.brand === 'SKIRMISH ARENA' &&
        state.career &&
        state.arena &&
        state.arenaPhase2 &&
        state.arenaPhase3 &&
        state.foundry &&
        state.phase3Integrity &&
        state.phase250 &&
        state.phase250Integrity &&
        state.phase260 &&
        state.phase260Integrity &&
        state.phase250Surfaces &&
        state.viewIsolation &&
        state.foundryPresentation &&
        state.catalog &&
        state.logo
      ) {
        console.log('PACKAGED_SMOKE_PASS', JSON.stringify(state));
        exitSmoke(0, 'pass', { state });
        return;
      }

      await sleep(150);
    }

    const diagnostic = await Promise.race([
      target.webContents.executeJavaScript(`(() => ({
        boot: document.body?.dataset?.skirmishBoot || 'missing',
        stage: document.body?.dataset?.skirmishBootStage || '',
        diagnostic: typeof window.__SKIRMISH_BOOT_DIAGNOSTIC__ === 'function' ? window.__SKIRMISH_BOOT_DIAGNOSTIC__() : null
      }))()`),
      new Promise((resolve) => setTimeout(() => resolve({ probe: 'unresponsive' }), 3000))
    ]).catch(() => null);
    console.error('PACKAGED_SMOKE_TIMEOUT', JSON.stringify(diagnostic));
    exitSmoke(3, 'renderer-timeout', { diagnostic });
  } catch (error) {
    console.error('PACKAGED_SMOKE_EXCEPTION', error?.stack || error?.message || error);
    exitSmoke(4, 'renderer-probe-error', { error: error?.message || String(error) });
  }
}

function createWindow() {
  const windowOptions = {
    width: 1280,
    height: 760,
    minWidth: 960,
    minHeight: 600,
    fullscreen: true,
    show: true,
    backgroundColor: '#071017',
    title: 'Skirmish Arena',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  };

  if (SMOKE_TEST) {
    windowOptions.fullscreen = false;
    windowOptions.show = false;
  }

  writeSmokeStatus('create-window');
  window = new BrowserWindow(windowOptions);

  window.webContents.on('did-finish-load', () => writeSmokeStatus('did-finish-load'));
  window.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    writeSmokeStatus('did-fail-load', { errorCode, errorDescription });
    if (SMOKE_TEST) exitSmoke(6, 'did-fail-load', { errorCode, errorDescription });
  });
  window.webContents.on('render-process-gone', (_event, details) => {
    if (!SMOKE_TEST) return;
    console.error('PACKAGED_SMOKE_RENDERER_GONE', JSON.stringify(details));
    exitSmoke(5, 'renderer-gone', { details });
  });

  window.loadFile(path.join(__dirname, 'index.html'))
    .then(() => {
      writeSmokeStatus('load-file-resolved');
      if (SMOKE_TEST) runPackagedSmokeTest(window);
    })
    .catch((error) => {
      console.error('GAME_LOAD_FILE_FAILED', error?.stack || error?.message || error);
      if (SMOKE_TEST) exitSmoke(6, 'load-file-rejected', { error: error?.message || String(error) });
    });
}

if (SMOKE_TEST) writeSmokeStatus('main-start', { argv: process.argv.slice(1) });

app.whenReady().then(() => {
  if (SMOKE_TEST) {
    writeSmokeStatus('app-ready');
    smokeWatchdog = setTimeout(() => {
      console.error('PACKAGED_SMOKE_HARD_TIMEOUT');
      exitSmoke(7, 'main-watchdog-timeout');
    }, SMOKE_HARD_TIMEOUT_MS);
  }
  createWindow();
});
app.on('window-all-closed', () => app.quit());
ipcMain.handle('game:get-build-info', () => buildInfo);
ipcMain.handle('game:toggle-fullscreen', () => {
  if (!window || window.isDestroyed()) return false;
  window.setFullScreen(!window.isFullScreen());
  return window.isFullScreen();
});
ipcMain.handle('game:quit', () => app.quit());
