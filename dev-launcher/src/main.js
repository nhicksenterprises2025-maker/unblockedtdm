const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const fsp = fs.promises;
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const buildInfo = require('./build-info.json');

const REPO = 'nhicksenterprises2025-maker/unblockedtdm';
const BRANCH = 'dev/skirmish-arena-2.0';
const RAW_LATEST = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/skirmish-dev/latest.json`;
const LAUNCHER_DATA_NAME = 'Skirmish Arena 2.0 Dev Launcher';
const GAME_DATA_NAME = 'Skirmish Arena 2.0 Development';
const GAME_EXE = 'SkirmishArena-Dev.exe';

app.setPath('userData', path.join(app.getPath('appData'), LAUNCHER_DATA_NAME));

let mainWindow = null;

function launcherRoot() { return app.getPath('userData'); }
function gameRoot() { return path.join(launcherRoot(), 'game'); }
function currentDir() { return path.join(gameRoot(), 'current'); }
function stagingDir() { return path.join(gameRoot(), 'staging'); }
function backupDir() { return path.join(gameRoot(), 'backup'); }
function currentGamePath() { return path.join(currentDir(), GAME_EXE); }
function installedPath() { return path.join(gameRoot(), 'installed.json'); }
function devGameDataPath() { return path.join(app.getPath('appData'), GAME_DATA_NAME); }
function bundledGamePath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'game', GAME_EXE)
    : path.join(__dirname, '..', '..', 'dist-dev-game', GAME_EXE);
}

async function ensureDirs() {
  await Promise.all([
    fsp.mkdir(currentDir(), { recursive: true }),
    fsp.mkdir(stagingDir(), { recursive: true }),
    fsp.mkdir(backupDir(), { recursive: true })
  ]);
}

async function readJson(file, fallback) {
  try { return JSON.parse(await fsp.readFile(file, 'utf8')); }
  catch { return fallback; }
}

async function writeJson(file, value) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await fsp.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function bundledEntry() {
  return {
    product: buildInfo.product,
    testVersion: buildInfo.testVersion,
    phase: Number(buildInfo.phase || 0),
    sequence: Number(buildInfo.sequence || 0),
    channel: 'internal-dev',
    branch: BRANCH,
    title: buildInfo.title || 'Skirmish Arena 2.0 Development Bootstrap',
    gameUrl: '',
    sha256: ''
  };
}

async function ensureBootstrapGame() {
  await ensureDirs();
  if (!fs.existsSync(currentGamePath())) {
    const bundled = bundledGamePath();
    if (!fs.existsSync(bundled)) throw new Error('Bundled development game is missing. Reinstall the dev launcher.');
    await fsp.copyFile(bundled, currentGamePath());
  }
  const installed = await readJson(installedPath(), null);
  if (!installed) await writeJson(installedPath(), bundledEntry());
}

async function getInstalled() {
  await ensureBootstrapGame();
  return readJson(installedPath(), bundledEntry());
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Skirmish-Arena-2.0-Dev-Launcher' },
    cache: 'no-store',
    redirect: 'follow'
  });
  if (!response.ok) throw new Error(`Update metadata returned HTTP ${response.status}.`);
  return response.json();
}

function compare(remote, local) {
  return Number(remote.sequence || 0) - Number(local.sequence || 0);
}

function sendProgress(payload) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('dev:progress', payload);
}

async function downloadFile(url, destination) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Skirmish-Arena-2.0-Dev-Launcher' },
    redirect: 'follow'
  });
  if (!response.ok || !response.body) throw new Error(`Game download failed with HTTP ${response.status}.`);

  const total = Number(response.headers.get('content-length') || 0);
  const reader = response.body.getReader();
  const stream = fs.createWriteStream(destination);
  let received = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (!stream.write(Buffer.from(value))) await new Promise((resolve) => stream.once('drain', resolve));
      sendProgress({ type: 'download', received, total, percent: total ? Math.round((received / total) * 100) : null });
    }
  } finally {
    await new Promise((resolve, reject) => {
      stream.end(resolve);
      stream.on('error', reject);
    });
  }
}

async function sha256(file) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const input = fs.createReadStream(file);
    input.on('error', reject);
    input.on('data', (chunk) => hash.update(chunk));
    input.on('end', () => resolve(hash.digest('hex')));
  });
}

async function installEntry(entry) {
  if (!entry?.gameUrl || !entry?.sha256) throw new Error('Development update manifest is incomplete.');
  await ensureDirs();

  const staged = path.join(stagingDir(), `sequence-${entry.sequence}.exe.part`);
  const backup = path.join(backupDir(), `sequence-${Date.now()}.exe`);
  await fsp.rm(staged, { force: true });

  sendProgress({ type: 'status', message: `DOWNLOADING SEQUENCE ${entry.sequence}` });
  await downloadFile(entry.gameUrl, staged);

  sendProgress({ type: 'status', message: 'VERIFYING GAME FILE' });
  const actual = await sha256(staged);
  if (actual.toLowerCase() !== String(entry.sha256).toLowerCase()) {
    await fsp.rm(staged, { force: true });
    throw new Error('Downloaded development build failed SHA-256 verification. Current build was not changed.');
  }

  let backedUp = false;
  try {
    if (fs.existsSync(currentGamePath())) {
      await fsp.copyFile(currentGamePath(), backup);
      backedUp = true;
    }

    sendProgress({ type: 'status', message: 'INSTALLING DEVELOPMENT BUILD' });
    await fsp.copyFile(staged, currentGamePath());
    await writeJson(installedPath(), { ...entry, installedAt: new Date().toISOString() });
    sendProgress({ type: 'status', message: `SEQUENCE ${entry.sequence} INSTALLED` });
  } catch (error) {
    if (backedUp && fs.existsSync(backup)) {
      try { await fsp.copyFile(backup, currentGamePath()); } catch {}
      sendProgress({ type: 'status', message: 'UPDATE FAILED · PREVIOUS BUILD RESTORED' });
    }
    if (['EPERM', 'EBUSY', 'EACCES'].includes(error?.code)) {
      throw new Error('Close the running development game and press UPDATE again.');
    }
    throw error;
  } finally {
    await fsp.rm(staged, { force: true }).catch(() => {});
    await fsp.rm(backup, { force: true }).catch(() => {});
  }

  return entry;
}

function spawnGame() {
  const executable = currentGamePath();
  if (!fs.existsSync(executable)) throw new Error('Development game executable is missing.');
  const child = spawn(executable, [], {
    detached: true,
    stdio: 'ignore',
    windowsHide: false,
    env: { ...process.env, SKIRMISH_ARENA_DEV_CHANNEL: '1' }
  });
  child.unref();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1060,
    height: 700,
    minWidth: 920,
    minHeight: 620,
    backgroundColor: '#0a1118',
    title: 'Skirmish Arena 2.0 Dev Launcher',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('dev:get-state', async () => ({
  buildInfo,
  installed: await getInstalled(),
  gamePath: currentGamePath(),
  dataPath: devGameDataPath()
}));

ipcMain.handle('dev:check-updates', async () => {
  const installed = await getInstalled();
  const latest = await fetchJson(`${RAW_LATEST}?ts=${Date.now()}`);
  return { installed, latest, updateAvailable: compare(latest, installed) > 0 };
});

ipcMain.handle('dev:install-latest', async () => {
  const installed = await getInstalled();
  const latest = await fetchJson(`${RAW_LATEST}?ts=${Date.now()}`);
  if (compare(latest, installed) <= 0) return { updated: false, entry: installed };
  return { updated: true, entry: await installEntry(latest) };
});

ipcMain.handle('dev:play-current', async () => {
  await ensureBootstrapGame();
  spawnGame();
  mainWindow?.minimize();
  return true;
});

ipcMain.handle('dev:open-data', async () => {
  const target = devGameDataPath();
  await fsp.mkdir(target, { recursive: true });
  const result = await shell.openPath(target);
  return { ok: !result, message: result || '' };
});

ipcMain.handle('dev:reset-data', async () => {
  const answer = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: ['Cancel', 'Reset Dev Data'],
    defaultId: 0,
    cancelId: 0,
    title: 'Reset Skirmish Arena development data?',
    message: 'This removes only Skirmish Arena 2.0 development saves and settings. Public v1.9.2 data is not touched.'
  });
  if (answer.response !== 1) return { ok: false, cancelled: true };
  await fsp.rm(devGameDataPath(), { recursive: true, force: true });
  return { ok: true };
});

ipcMain.handle('dev:quit', () => app.quit());

app.whenReady().then(async () => {
  await ensureBootstrapGame().catch((error) => console.error(error));
  createWindow();
});
app.on('window-all-closed', () => app.quit());
