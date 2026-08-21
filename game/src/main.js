const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const buildInfo = require('./build-info.json');

// Keep the legacy data directory through the 2.0.0 rename so existing
// loadouts, settings and local state survive the product rebrand.
app.setPath('userData', path.join(app.getPath('appData'), 'UnblockedTDM'));

let window;

function createWindow() {
  window = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1280,
    minHeight: 720,
    fullscreen: true,
    backgroundColor: '#142b36',
    title: 'Skirmish Arena',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
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
