const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('devLauncher', {
  getState: () => ipcRenderer.invoke('dev:get-state'),
  checkUpdates: () => ipcRenderer.invoke('dev:check-updates'),
  installLatest: () => ipcRenderer.invoke('dev:install-latest'),
  playCurrent: () => ipcRenderer.invoke('dev:play-current'),
  openData: () => ipcRenderer.invoke('dev:open-data'),
  resetData: () => ipcRenderer.invoke('dev:reset-data'),
  quit: () => ipcRenderer.invoke('dev:quit'),
  onProgress: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('dev:progress', listener);
    return () => ipcRenderer.removeListener('dev:progress', listener);
  }
});
