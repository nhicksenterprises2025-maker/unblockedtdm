const { contextBridge, ipcRenderer } = require('electron');

function reportBootError(detail) {
  ipcRenderer.send('game:ui-boot-error', detail);
}

window.addEventListener('error', (event) => {
  reportBootError({
    message: event.message || 'Renderer error',
    source: event.filename || '',
    line: event.lineno || 0,
    column: event.colno || 0
  });
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  reportBootError({
    message: String(reason?.stack || reason?.message || reason || 'Unhandled renderer rejection'),
    source: 'unhandledrejection',
    line: 0,
    column: 0
  });
});

contextBridge.exposeInMainWorld('gameAPI', {
  getBuildInfo: () => ipcRenderer.invoke('game:get-build-info'),
  toggleFullscreen: () => ipcRenderer.invoke('game:toggle-fullscreen'),
  quit: () => ipcRenderer.invoke('game:quit'),
  uiReady: () => ipcRenderer.send('game:ui-ready')
});
