const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const fsp = fs.promises;
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const buildInfo = require('./build-info.json');

const RAW_BASE = 'https://raw.githubusercontent.com/nhicksenterprises2025-maker/unblockedtdm/main/distribution';
const DEFAULT_SETTINGS = {
  autoCheckUpdates: true,
  minimizeOnPlay: true,
  closeAfterPlay: false
};

let mainWindow;

function launcherDataDir() {
  return app.getPath('userData');
}
function gameRoot() {
  return path.join(launcherDataDir(), 'game');
}
function currentDir() {
  return path.join(gameRoot(), 'current');
}
function currentGamePath() {
  return path.join(currentDir(), 'UnblockedTDM.exe');
}
function archiveRoot() {
  return path.join(gameRoot(), 'archive');
}
function stagingRoot() {
  return path.join(gameRoot(), 'staging');
}
function backupRoot() {
  return path.join(gameRoot(), 'backup');
}
function installedManifestPath() {
  return path.join(gameRoot(), 'installed.json');
}
function settingsPath() {
  return path.join(launcherDataDir(), 'launcher-settings.json');
}
function bundledGamePath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'game', 'UnblockedTDM.exe')
    : path.resolve(__dirname, '../../dist-game/UnblockedTDM.exe');
}
function devGameDir() {
  return path.resolve(__dirname, '../../game');
}

async function ensureDirectories() {
  await Promise.all([
    fsp.mkdir(currentDir(), { recursive: true }),
    fsp.mkdir(archiveRoot(), { recursive: true }),
    fsp.mkdir(stagingRoot(), { recursive: true }),
    fsp.mkdir(backupRoot(), { recursive: true })
  ]);
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fsp.readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function writeJson(file, value) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await fsp.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function getSettings() {
  return { ...DEFAULT_SETTINGS, ...(await readJson(settingsPath(), {})) };
}

async function ensureBootstrapGame() {
  await ensureDirectories();
  const target = currentGamePath();

  if (!fs.existsSync(target)) {
    const source = bundledGamePath();
    if (fs.existsSync(source)) {
      await fsp.copyFile(source, target);
    } else if (app.isPackaged) {
      throw new Error(`Bundled game executable was not found at ${source}`);
    }
  }

  const existing = await readJson(installedManifestPath(), null);
  if (!existing) {
    await writeJson(installedManifestPath(), {
      product: buildInfo.product,
      gameVersion: buildInfo.gameVersion,
      build: buildInfo.build,
      sequence: buildInfo.sequence,
      phase: buildInfo.phase,
      tag: buildInfo.tag,
      title: buildInfo.title,
      gameUrl: `https://github.com/${buildInfo.repository}/releases/download/${buildInfo.tag}/UnblockedTDM-${buildInfo.gameVersion}-v${buildInfo.build}.exe`,
      sha256: ''
    });
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'UnblockedTDM-Launcher' },
    cache: 'no-store'
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} while requesting ${url}`);
  return response.json();
}

async function getInstalled() {
  return readJson(installedManifestPath(), {
    product: buildInfo.product,
    gameVersion: buildInfo.gameVersion,
    build: buildInfo.build,
    sequence: buildInfo.sequence,
    phase: buildInfo.phase,
    tag: buildInfo.tag,
    title: buildInfo.title
  });
}

function compareBuild(remote, local) {
  return Number(remote.sequence || remote.build || 0) - Number(local.sequence || local.build || 0);
}

function sendProgress(payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('launcher:progress', payload);
  }
}

async function downloadFile(url, destination) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'UnblockedTDM-Launcher' },
    redirect: 'follow'
  });
  if (!response.ok || !response.body) throw new Error(`Download failed with HTTP ${response.status}`);

  const total = Number(response.headers.get('content-length') || 0);
  const reader = response.body.getReader();
  const stream = fs.createWriteStream(destination);
  let received = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (!stream.write(Buffer.from(value))) {
        await new Promise((resolve) => stream.once('drain', resolve));
      }
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

async function verifyFile(file, expected) {
  if (!expected) return { valid: true, hash: await sha256(file), expected: null };
  const hash = await sha256(file);
  return { valid: hash.toLowerCase() === String(expected).toLowerCase(), hash, expected };
}

async function installRemoteEntry(entry) {
  await ensureDirectories();
  const staged = path.join(stagingRoot(), `UnblockedTDM-${entry.tag}.exe.part`);
  const backup = path.join(backupRoot(), `UnblockedTDM-${Date.now()}.exe`);
  sendProgress({ type: 'status', message: `Downloading ${entry.title}` });
  await downloadFile(entry.gameUrl, staged);
  const verification = await verifyFile(staged, entry.sha256);
  if (!verification.valid) {
    await fsp.rm(staged, { force: true });
    throw new Error('Downloaded game failed SHA-256 verification. No files were replaced.');
  }

  let backedUp = false;
  try {
    if (fs.existsSync(currentGamePath())) {
      await fsp.copyFile(currentGamePath(), backup);
      backedUp = true;
    }
    await fsp.copyFile(staged, currentGamePath());
    await writeJson(installedManifestPath(), entry);
    sendProgress({ type: 'status', message: `${entry.title} installed` });
  } catch (error) {
    if (backedUp && fs.existsSync(backup)) {
      await fsp.copyFile(backup, currentGamePath());
      sendProgress({ type: 'status', message: 'Update failed. Previous build restored.' });
    }
    throw error;
  } finally {
    await fsp.rm(staged, { force: true });
  }

  return entry;
}

async function remoteEntryForInstalled(installed) {
  const archive = await fetchJson(`${RAW_BASE}/versions.json?ts=${Date.now()}`);
  return (archive.versions || []).find((item) => item.tag === installed.tag) || null;
}

async function repairCurrentGame() {
  if (!app.isPackaged && !fs.existsSync(currentGamePath())) {
    return { repaired: false, message: 'Development mode uses the game source directly; no packaged executable needs repair.' };
  }

  const installed = await getInstalled();
  const remote = await remoteEntryForInstalled(installed);
  if (!remote) throw new Error(`No immutable archive entry exists for ${installed.tag}.`);

  if (fs.existsSync(currentGamePath())) {
    const verification = await verifyFile(currentGamePath(), remote.sha256);
    if (verification.valid) {
      return { repaired: false, message: 'Game files verified successfully.' };
    }
  }

  await installRemoteEntry(remote);
  return { repaired: true, message: 'Game files were restored from the version archive.' };
}

function spawnGame(executable) {
  if (!fs.existsSync(executable)) throw new Error(`Game executable not found: ${executable}`);
  const child = spawn(executable, [], { detached: true, stdio: 'ignore' });
  child.unref();
}

function spawnDevelopmentGame() {
  const sourceDir = devGameDir();
  if (!fs.existsSync(path.join(sourceDir, 'package.json'))) {
    throw new Error(`Development game source was not found at ${sourceDir}`);
  }

  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawn(process.execPath, [sourceDir], {
    detached: true,
    stdio: 'ignore',
    env
  });
  child.unref();
}

async function playCurrent() {
  await ensureBootstrapGame();

  if (!app.isPackaged && !fs.existsSync(currentGamePath())) {
    spawnDevelopmentGame();
  } else {
    spawnGame(currentGamePath());
  }

  const settings = await getSettings();
  if (settings.closeAfterPlay) app.quit();
  else if (settings.minimizeOnPlay && mainWindow) mainWindow.minimize();
  return true;
}

async function listVersions() {
  const data = await fetchJson(`${RAW_BASE}/versions.json?ts=${Date.now()}`);
  const output = [];
  for (const entry of data.versions || []) {
    const localExe = path.join(archiveRoot(), entry.tag, 'UnblockedTDM.exe');
    output.push({ ...entry, downloaded: fs.existsSync(localExe) });
  }
  return output;
}

async function downloadArchiveVersion(entry) {
  const dir = path.join(archiveRoot(), entry.tag);
  await fsp.mkdir(dir, { recursive: true });
  const partial = path.join(dir, 'UnblockedTDM.exe.part');
  const final = path.join(dir, 'UnblockedTDM.exe');
  await downloadFile(entry.gameUrl, partial);
  const verification = await verifyFile(partial, entry.sha256);
  if (!verification.valid) {
    await fsp.rm(partial, { force: true });
    throw new Error('Archived build failed SHA-256 verification.');
  }
  await fsp.rename(partial, final);
  await writeJson(path.join(dir, 'version.json'), entry);
  return { ...entry, downloaded: true };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 980,
    minHeight: 650,
    backgroundColor: '#0c1320',
    title: 'UnblockedTDM Launcher',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(async () => {
  await ensureBootstrapGame().catch((error) => console.error(error));
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('launcher:get-state', async () => ({
  buildInfo,
  installed: await getInstalled(),
  settings: await getSettings(),
  gamePath: !app.isPackaged && !fs.existsSync(currentGamePath()) ? devGameDir() : currentGamePath(),
  dataPath: launcherDataDir()
}));

ipcMain.handle('launcher:check-updates', async () => {
  const [latest, installed] = await Promise.all([
    fetchJson(`${RAW_BASE}/latest.json?ts=${Date.now()}`),
    getInstalled()
  ]);
  return { latest, installed, updateAvailable: compareBuild(latest, installed) > 0 };
});

ipcMain.handle('launcher:install-latest', async () => {
  const latest = await fetchJson(`${RAW_BASE}/latest.json?ts=${Date.now()}`);
  const installed = await getInstalled();
  if (compareBuild(latest, installed) <= 0) return { updated: false, entry: installed };
  return { updated: true, entry: await installRemoteEntry(latest) };
});

ipcMain.handle('launcher:play-current', playCurrent);
ipcMain.handle('launcher:list-versions', listVersions);
ipcMain.handle('launcher:download-version', (_event, entry) => downloadArchiveVersion(entry));
ipcMain.handle('launcher:play-version', async (_event, tag) => {
  const executable = path.join(archiveRoot(), tag, 'UnblockedTDM.exe');
  spawnGame(executable);
  return true;
});
ipcMain.handle('launcher:repair', repairCurrentGame);
ipcMain.handle('launcher:open-game-folder', async () => shell.openPath(gameRoot()));
ipcMain.handle('launcher:get-settings', getSettings);
ipcMain.handle('launcher:save-settings', async (_event, patch) => {
  const next = { ...(await getSettings()), ...patch };
  await writeJson(settingsPath(), next);
  return next;
});
