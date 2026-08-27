const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('gameAPI', {
  getBuildInfo: () => ipcRenderer.invoke('game:get-build-info'),
  toggleFullscreen: () => ipcRenderer.invoke('game:toggle-fullscreen'),
  quit: () => ipcRenderer.invoke('game:quit'),
  uiReady: () => ipcRenderer.send('game:ui-ready')
});
