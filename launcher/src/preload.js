const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('launcherAPI', {
  getState: () => ipcRenderer.invoke('launcher:get-state'),
  checkUpdates: () => ipcRenderer.invoke('launcher:check-updates'),
  installLatest: () => ipcRenderer.invoke('launcher:install-latest'),
  playCurrent: () => ipcRenderer.invoke('launcher:play-current'),
  listVersions: () => ipcRenderer.invoke('launcher:list-versions'),
  downloadVersion: (entry) => ipcRenderer.invoke('launcher:download-version', entry),
  playVersion: (tag) => ipcRenderer.invoke('launcher:play-version', tag),
  repair: () => ipcRenderer.invoke('launcher:repair'),
  openGameFolder: () => ipcRenderer.invoke('launcher:open-game-folder'),
  getSettings: () => ipcRenderer.invoke('launcher:get-settings'),
  saveSettings: (patch) => ipcRenderer.invoke('launcher:save-settings', patch),
  onProgress: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('launcher:progress', listener);
    return () => ipcRenderer.removeListener('launcher:progress', listener);
  }
});
