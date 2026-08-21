const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const buildInfo = require('./build-info.json');

const internalDev = process.env.SKIRMISH_ARENA_DEV_CHANNEL === '1' || buildInfo.channel === 'internal-dev';
if (internalDev) {
  app.setPath('userData', path.join(app.getPath('appData'), 'Skirmish Arena 2.0 Development'));
}

let window;

function createWindow() {
  window = new BrowserWindow({
    width: 1280,
    height: 760,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#142b36',
    title: internalDev ? 'Skirmish Arena 2.0 [DEV TEST]' : 'UnblockedTDM',
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
