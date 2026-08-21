const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const buildInfo = require('./build-info.json');

// Keep the legacy data directory through the 2.0.0 rename so existing
// loadouts, settings and local state survive the product rebrand.
app.setPath('userData', path.join(app.getPath('appData'), 'UnblockedTDM'));

let window;

async function applyPhase1Branding() {
  if (!window || window.isDestroyed()) return;
  try {
    const css = fs.readFileSync(path.join(__dirname, 'phase1-branding.css'), 'utf8');
    await window.webContents.insertCSS(css);
    const script = fs.readFileSync(path.join(__dirname, 'phase1-branding.js'), 'utf8');
    await window.webContents.executeJavaScript(script, true);
  } catch (error) {
    console.error('Phase 1 branding bootstrap failed:', error);
  }
}

function createWindow() {
  window = new BrowserWindow({
    width: 1280,
    height: 760,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#142b36',
    title: 'Skirmish Arena',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  window.webContents.once('did-finish-load', applyPhase1Branding);
  window.loadFile(path.join(__dirname, 'index.html'));
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
