const { app, BrowserWindow, ipcMain, protocol, net } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const buildInfo = require('./build-info.json');

const smokeTest = process.argv.includes('--smoke-test');
if (smokeTest) app.commandLine.appendSwitch('disable-gpu');

let window;
let uiReady = false;
let bootTimeout = null;

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'skirmish',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  }
]);

function resolveAppAsset(requestUrl) {
  const url = new URL(requestUrl);
  let relativePath = decodeURIComponent(url.pathname || '/index.html');
  if (!relativePath || relativePath === '/') relativePath = '/index.html';
  relativePath = relativePath.replace(/^\/+/, '');

  const root = path.resolve(__dirname);
  const resolved = path.resolve(root, relativePath);
  const rootPrefix = `${root}${path.sep}`;
  if (resolved !== root && !resolved.startsWith(rootPrefix)) return null;
  return resolved;
}

function writeSmokeResult(result) {
  const sentinel = process.env.SKIRMISH_SMOKE_SENTINEL;
  if (!sentinel) return;
  fs.mkdirSync(path.dirname(sentinel), { recursive: true });
  fs.writeFileSync(sentinel, JSON.stringify({
    product: buildInfo.product,
    gameVersion: buildInfo.gameVersion,
    build: buildInfo.build,
    sequence: buildInfo.sequence,
    phase: buildInfo.phase,
    tag: buildInfo.tag,
    ...result
  }, null, 2));
}

function showStartupFailure(reason = 'The modern Skirmish Arena UI did not finish loading.') {
  if (!window || window.isDestroyed()) return;
  if (bootTimeout) clearTimeout(bootTimeout);
  bootTimeout = null;

  if (smokeTest) {
    writeSmokeResult({ uiReady: false, error: String(reason) });
    console.error(`[Skirmish smoke test] ${reason}`);
    app.exit(2);
    return;
  }

  const safeReason = JSON.stringify(String(reason));
  window.webContents.executeJavaScript(`
    (() => {
      const reason = ${safeReason};
      document.title = 'Skirmish Arena — Startup Error';
      document.body.innerHTML = '<main style="min-height:100vh;display:grid;place-items:center;background:#07141b;color:#eef7ff;font-family:Arial,sans-serif;padding:32px;box-sizing:border-box"><section style="width:min(720px,92vw);border:1px solid #2d5364;background:#0b202a;padding:32px"><div style="font-size:12px;letter-spacing:.18em;color:#55c8ff;font-weight:700">SKIRMISH ARENA</div><h1 style="margin:10px 0 12px;font-size:34px">STARTUP FAILED</h1><p style="color:#a9c2ce;line-height:1.55;margin:0 0 18px">' + reason.replace(/[&<>\"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char])) + '</p><p style="color:#6f93a4;font-size:13px;margin:0">Build ${buildInfo.gameVersion} · ${buildInfo.build} · ${buildInfo.phase}</p></section></main>';
    })();
  `).catch(() => {});

  if (!window.isVisible()) window.show();
}

function createWindow() {
  uiReady = false;
  window = new BrowserWindow({
    width: 1280,
    height: 760,
    minWidth: 960,
    minHeight: 600,
    fullscreen: true,
    show: false,
    backgroundColor: '#07141b',
    title: 'Skirmish Arena',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  window.webContents.once('did-finish-load', () => {
    if (uiReady) return;
    bootTimeout = setTimeout(() => {
      if (!uiReady) showStartupFailure('Modern UI boot timed out before game:ui-ready.');
    }, smokeTest ? 15000 : 8000);
  });

  window.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    if (!uiReady) showStartupFailure(`UI document failed to load (${errorCode}): ${errorDescription}`);
  });

  window.webContents.on('preload-error', (_event, preloadPath, error) => {
    if (!uiReady) showStartupFailure(`Preload failed (${preloadPath}): ${error?.message || error}`);
  });

  window.webContents.on('render-process-gone', (_event, details) => {
    if (!uiReady) showStartupFailure(`Renderer exited during UI boot: ${details?.reason || 'unknown reason'}`);
  });

  window.loadURL('skirmish://app/index.html');
}

app.whenReady().then(async () => {
  await protocol.handle('skirmish', (request) => {
    const filePath = resolveAppAsset(request.url);
    if (!filePath) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(filePath).toString());
  });
  createWindow();
});

app.on('window-all-closed', () => app.quit());

ipcMain.on('game:ui-boot-error', (_event, detail) => {
  if (uiReady) return;
  const source = detail?.source ? ` @ ${detail.source}:${detail.line || 0}:${detail.column || 0}` : '';
  showStartupFailure(`Renderer boot error: ${detail?.message || 'unknown error'}${source}`);
});

ipcMain.on('game:ui-ready', () => {
  uiReady = true;
  if (bootTimeout) clearTimeout(bootTimeout);
  bootTimeout = null;

  if (smokeTest) {
    writeSmokeResult({ uiReady: true });
    app.exit(0);
    return;
  }

  if (window && !window.isDestroyed() && !window.isVisible()) window.show();
});

ipcMain.handle('game:get-build-info', () => buildInfo);
ipcMain.handle('game:toggle-fullscreen', () => {
  if (!window || window.isDestroyed()) return false;
  window.setFullScreen(!window.isFullScreen());
  return window.isFullScreen();
});
ipcMain.handle('game:quit', () => app.quit());
