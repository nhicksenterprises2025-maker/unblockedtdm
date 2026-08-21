const playButton = document.getElementById('play');
const updateButton = document.getElementById('update');
const status = document.getElementById('status');
const version = document.getElementById('version');
const phase = document.getElementById('phase');
const sequence = document.getElementById('sequence');
const progressTrack = document.getElementById('progressTrack');
const progressFill = document.getElementById('progressFill');
const progressLabel = document.getElementById('progressLabel');

let installed = null;
let latest = null;
let busy = false;

function setStatus(text, tone = '') {
  status.textContent = text;
  status.dataset.tone = tone;
}

function setInstalled(entry) {
  installed = entry;
  version.textContent = entry?.testVersion || '2.0-dev';
  phase.textContent = Number(entry?.phase || 0) === 0 ? 'FOUNDATION' : `PHASE ${entry.phase}`;
  sequence.textContent = String(entry?.sequence ?? 0).padStart(2, '0');
}

function setBusy(value) {
  busy = Boolean(value);
  playButton.disabled = busy;
  updateButton.disabled = busy;
}

function resetProgress() {
  progressTrack.classList.remove('visible');
  progressFill.style.width = '0%';
  progressLabel.textContent = '';
}

window.devLauncher.onProgress((payload) => {
  if (payload.type === 'download') {
    progressTrack.classList.add('visible');
    const percent = payload.percent ?? 0;
    progressFill.style.width = `${percent}%`;
    progressLabel.textContent = payload.percent == null ? 'DOWNLOADING' : `DOWNLOADING ${percent}%`;
  }
  if (payload.type === 'status') {
    progressTrack.classList.add('visible');
    progressLabel.textContent = payload.message || '';
    setStatus(payload.message || 'UPDATING', 'update');
  }
});

async function checkUpdates(silent = false) {
  if (busy) return;
  updateButton.textContent = 'CHECKING...';
  updateButton.disabled = true;
  if (!silent) setStatus('CHECKING DEVELOPMENT CHANNEL');

  try {
    const result = await window.devLauncher.checkUpdates();
    latest = result.latest;
    setInstalled(result.installed);
    if (result.updateAvailable) {
      updateButton.textContent = `UPDATE · SEQ ${result.latest.sequence}`;
      updateButton.dataset.mode = 'install';
      updateButton.classList.add('available');
      setStatus(`UPDATE AVAILABLE · SEQUENCE ${result.installed.sequence} → ${result.latest.sequence}`, 'update');
    } else {
      updateButton.textContent = 'CHECK FOR UPDATE';
      updateButton.dataset.mode = 'check';
      updateButton.classList.remove('available');
      if (!silent) setStatus('DEVELOPMENT BUILD IS CURRENT', 'ready');
    }
  } catch (error) {
    updateButton.textContent = 'CHECK FOR UPDATE';
    updateButton.dataset.mode = 'check';
    updateButton.classList.remove('available');
    setStatus(error.message || 'UPDATE CHECK FAILED', 'error');
  } finally {
    updateButton.disabled = false;
  }
}

updateButton.addEventListener('click', async () => {
  if (updateButton.dataset.mode !== 'install') {
    await checkUpdates(false);
    return;
  }

  setBusy(true);
  resetProgress();
  updateButton.textContent = 'UPDATING...';
  setStatus('DOWNLOADING DEVELOPMENT BUILD', 'update');

  try {
    const result = await window.devLauncher.installLatest();
    setInstalled(result.entry);
    latest = result.entry;
    progressFill.style.width = '100%';
    progressTrack.classList.add('visible');
    progressLabel.textContent = result.updated ? 'UPDATE COMPLETE' : 'ALREADY CURRENT';
    updateButton.textContent = 'CHECK FOR UPDATE';
    updateButton.dataset.mode = 'check';
    updateButton.classList.remove('available');
    setStatus(result.updated ? `SEQUENCE ${result.entry.sequence} READY TO PLAY` : 'DEVELOPMENT BUILD IS CURRENT', 'ready');
  } catch (error) {
    setStatus(error.message || 'UPDATE FAILED', 'error');
    updateButton.textContent = latest ? `UPDATE · SEQ ${latest.sequence}` : 'CHECK FOR UPDATE';
  } finally {
    setBusy(false);
  }
});

playButton.addEventListener('click', async () => {
  if (busy) return;
  playButton.disabled = true;
  playButton.textContent = 'LAUNCHING...';
  setStatus('STARTING DEVELOPMENT BUILD');
  try {
    await window.devLauncher.playCurrent();
    setStatus('DEVELOPMENT BUILD RUNNING', 'ready');
  } catch (error) {
    setStatus(error.message || 'LAUNCH FAILED', 'error');
  } finally {
    setTimeout(() => {
      playButton.textContent = 'PLAY DEV BUILD';
      playButton.disabled = false;
    }, 900);
  }
});

document.getElementById('openData').addEventListener('click', async () => {
  const result = await window.devLauncher.openData();
  setStatus(result.ok ? 'DEV DATA FOLDER OPENED' : (result.message || 'COULD NOT OPEN DEV DATA'), result.ok ? 'ready' : 'error');
});

document.getElementById('resetData').addEventListener('click', async () => {
  const result = await window.devLauncher.resetData();
  if (result.cancelled) return;
  setStatus(result.ok ? 'DEV DATA RESET' : 'DEV DATA RESET FAILED', result.ok ? 'ready' : 'error');
});

document.getElementById('quit').addEventListener('click', () => window.devLauncher.quit());

(async () => {
  const state = await window.devLauncher.getState();
  setInstalled(state.installed);
  setStatus('DEVELOPMENT CHANNEL READY', 'ready');
  await checkUpdates(true);
})();
