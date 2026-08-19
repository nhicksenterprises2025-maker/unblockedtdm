const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('gameAPI', {
  getBuildInfo: () => ipcRenderer.invoke('game:get-build-info'),
  quit: () => ipcRenderer.invoke('game:quit')
});
