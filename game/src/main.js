const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const buildInfo = require('./build-info.json');

const SMOKE_TEST = process.argv.includes('--smoke-test');
const SMOKE_TIMEOUT_MS = 30000;
let window;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runPackagedSmokeTest(target) {
  const started = Date.now();
  try {
    while (Date.now() - started < SMOKE_TIMEOUT_MS) {
      const state = await target.webContents.executeJavaScript(`(() => ({
        boot: document.body?.dataset?.skirmishBoot || 'missing',
        version: document.body?.dataset?.skirmishBootVersion || '',
        brand: document.querySelector('#mainMenu .menu-brand strong')?.textContent?.trim() || '',
        career: Boolean(document.querySelector('[data-career-strip]')),
        catalog: Boolean(document.querySelector('[data-weapon-info-catalog]')),
        logo: Boolean(document.querySelector('.ui231-home-logo'))
      }))()`);

      if (state.boot === 'failed') {
        console.error('PACKAGED_SMOKE_FAIL boot-state=failed', JSON.stringify(state));
        app.exit(2);
        return;
      }

      if (
        state.boot === 'ready' &&
        state.version === String(buildInfo.gameVersion) &&
        state.brand === 'SKIRMISH ARENA' &&
        state.career &&
        state.catalog &&
        state.logo
      ) {
        console.log('PACKAGED_SMOKE_PASS', JSON.stringify(state));
        app.exit(0);
        return;
      }

      await sleep(150);
    }

    const diagnostic = await target.webContents.executeJavaScript(`(() => ({
      boot: document.body?.dataset?.skirmishBoot || 'missing',
      stage: document.body?.dataset?.skirmishBootStage || '',
      diagnostic: typeof window.__SKIRMISH_BOOT_DIAGNOSTIC__ === 'function' ? window.__SKIRMISH_BOOT_DIAGNOSTIC__() : null
    }))()`).catch(() => null);
    console.error('PACKAGED_SMOKE_TIMEOUT', JSON.stringify(diagnostic));
    app.exit(3);
  } catch (error) {
    console.error('PACKAGED_SMOKE_EXCEPTION', error?.stack || error?.message || error);
    app.exit(4);
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

  window = new BrowserWindow(windowOptions);

  window.webContents.on('render-process-gone', (_event, details) => {
    if (!SMOKE_TEST) return;
    console.error('PACKAGED_SMOKE_RENDERER_GONE', JSON.stringify(details));
    app.exit(5);
  });

  window.loadFile(path.join(__dirname, 'index.html'))
    .then(() => {
      if (SMOKE_TEST) runPackagedSmokeTest(window);
    })
    .catch((error) => {
      console.error('GAME_LOAD_FILE_FAILED', error?.stack || error?.message || error);
      if (SMOKE_TEST) app.exit(6);
    });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
ipcMain.handle('game:get-build-info', () => buildInfo);
ipcMain.handle('game:toggle-fullscreen', () => {
  if (!window || window.isDestroyed()) return false;
  window.setFullScreen(!window.isFullScreen());
  return window.isFullScreen();
});
ipcMain.handle('game:quit', () => app.quit());
