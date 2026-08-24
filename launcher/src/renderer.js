const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let state;

function buildCode(entry = {}) {
  const version = entry.gameVersion ?? '—';
  const build = entry.build ?? '—';
  return `${version}.${build}`;
}

function setView(name) {
  $$('.nav-button').forEach((button) => button.classList.toggle('active', button.dataset.view === name));
  $$('.view').forEach((view) => view.classList.toggle('active', view.id === name));
  const titles = {
    home: 'PLAY',
    archive: 'BUILD ARCHIVE',
    settings: 'SETTINGS',
    diagnostics: 'DIAGNOSTICS'
  };
  $('#viewTitle').textContent = titles[name] || 'PLAY';
  if (name === 'archive') loadArchive();
}

function setProgress(payload) {
  const panel = $('#progressPanel');
  panel.classList.remove('hidden');
  if (payload.type === 'download') {
    const percent = payload.percent ?? 0;
    $('#progressText').textContent = 'DOWNLOADING UPDATE';
    $('#progressPercent').textContent = payload.percent == null ? '' : `${percent}%`;
    $('#progressBar').style.width = `${percent}%`;
    $('#statusReady').textContent = 'DOWNLOADING';
  } else if (payload.type === 'status') {
    $('#progressText').textContent = String(payload.message || 'WORKING').toUpperCase();
  }
}

function renderState(next) {
  state = next;
  const { buildInfo, installed, settings, gamePath } = next;
  const installedCode = buildCode(installed?.gameVersion ? installed : buildInfo);
  $('#phaseLabel').textContent = (installed.phase || buildInfo.phase || 'CLIENT').toUpperCase();
  $('#launcherBuild').textContent = `v${installedCode}`;
  $('#currentTitle').textContent = `BUILD ${installedCode}`;
  $('#currentMeta').textContent = installed.phase || buildInfo.phase || 'Skirmish Arena';
  $('#installedBuild').textContent = installedCode;
  $('#latestBuild').textContent = installedCode;
  $('#patchTitle').textContent = `BUILD ${installedCode}`;
  $('#patchDetail').textContent = installed.phase || buildInfo.phase || 'Installed release';
  $('#gamePath').textContent = gamePath;
  $('#autoCheckUpdates').checked = settings.autoCheckUpdates;
  $('#minimizeOnPlay').checked = settings.minimizeOnPlay;
  $('#closeAfterPlay').checked = settings.closeAfterPlay;
  $('#statusReady').textContent = 'READY';
  $('#filesStatus').textContent = 'VERIFIED ✓';
  $('#launchState').textContent = 'READY';
}

async function checkUpdates() {
  $('#updateStatus').textContent = 'CHECKING';
  $('#updateDetail').textContent = 'Verifying live release.';
  try {
    const result = await window.launcherAPI.checkUpdates();
    const latestCode = buildCode(result.latest || result.installed);
    $('#latestBuild').textContent = latestCode;
    $('#patchTitle').textContent = `BUILD ${latestCode}`;
    $('#patchDetail').textContent = result.latest?.title || result.installed?.title || 'Current Skirmish Arena release.';
    if (result.updateAvailable) {
      $('#updateStatus').textContent = 'UPDATE AVAILABLE';
      $('#updateDetail').textContent = `${result.latest.title} is ready.`;
      $('#updateButton').textContent = 'INSTALL UPDATE';
      $('#updateButton').dataset.mode = 'install';
      $('#statusReady').textContent = 'UPDATE';
    } else {
      $('#updateStatus').textContent = 'UP TO DATE';
      $('#updateDetail').textContent = 'Installed files match the live release.';
      $('#updateButton').textContent = 'CHECK FOR UPDATES';
      $('#updateButton').dataset.mode = 'check';
      $('#statusReady').textContent = 'READY';
    }
  } catch (error) {
    $('#updateStatus').textContent = 'CHANNEL ERROR';
    $('#updateDetail').textContent = error.message;
    $('#statusReady').textContent = 'OFFLINE';
  }
}

async function installLatest() {
  try {
    $('#updateButton').disabled = true;
    $('#statusReady').textContent = 'INSTALLING';
    const result = await window.launcherAPI.installLatest();
    state.installed = result.entry;
    renderState(state);
    await checkUpdates();
    $('#progressPanel').classList.add('hidden');
  } catch (error) {
    $('#updateStatus').textContent = 'UPDATE FAILED';
    $('#updateDetail').textContent = error.message;
    $('#statusReady').textContent = 'ERROR';
  } finally {
    $('#updateButton').disabled = false;
  }
}

async function loadArchive() {
  const list = $('#archiveList');
  list.innerHTML = '<div class="empty-row">LOADING RELEASES…</div>';
  try {
    const versions = await window.launcherAPI.listVersions();
    if (!versions.length) {
      list.innerHTML = '<div class="empty-row">NO PUBLISHED BUILDS.</div>';
      return;
    }
    list.innerHTML = '';
    for (const entry of versions) {
      const item = document.createElement('article');
      item.className = 'archive-item';
      item.innerHTML = `
        <strong>BUILD ${buildCode(entry)}</strong>
        <span class="phase">${entry.phase}</span>
        <span class="tag">${entry.tag}</span>
        <div class="archive-actions"></div>`;
      const actions = item.querySelector('.archive-actions');
      const action = document.createElement('button');
      action.className = entry.downloaded ? 'primary' : 'secondary';
      action.textContent = entry.downloaded ? 'PLAY' : 'DOWNLOAD';
      action.addEventListener('click', async () => {
        action.disabled = true;
        try {
          if (entry.downloaded) await window.launcherAPI.playVersion(entry.tag);
          else {
            await window.launcherAPI.downloadVersion(entry);
            await loadArchive();
          }
        } catch (error) {
          alert(error.message);
        } finally {
          action.disabled = false;
        }
      });
      actions.appendChild(action);
      list.appendChild(item);
    }
  } catch (error) {
    list.innerHTML = `<div class="empty-row error">${error.message}</div>`;
  }
}

async function init() {
  renderState(await window.launcherAPI.getState());
  window.launcherAPI.onProgress(setProgress);
  $$('.nav-button').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));

  $('#playButton').addEventListener('click', async () => {
    const button = $('#playButton');
    const stateText = $('#launchState');
    button.disabled = true;
    button.textContent = 'STARTING…';
    stateText.textContent = 'LAUNCHING';
    try {
      await window.launcherAPI.playCurrent();
      stateText.textContent = 'GAME STARTED';
    } catch (error) {
      alert(error.message);
      stateText.textContent = 'LAUNCH FAILED';
    } finally {
      setTimeout(() => {
        button.disabled = false;
        button.textContent = 'PLAY';
        if (stateText.textContent !== 'LAUNCH FAILED') stateText.textContent = 'READY';
      }, 900);
    }
  });

  $('#updateButton').addEventListener('click', () => $('#updateButton').dataset.mode === 'install' ? installLatest() : checkUpdates());
  $('#refreshArchive').addEventListener('click', loadArchive);
  $('#saveSettings').addEventListener('click', async () => {
    const saved = await window.launcherAPI.saveSettings({
      autoCheckUpdates: $('#autoCheckUpdates').checked,
      minimizeOnPlay: $('#minimizeOnPlay').checked,
      closeAfterPlay: $('#closeAfterPlay').checked
    });
    state.settings = saved;
    $('#settingsStatus').textContent = 'SAVED ✓';
    setTimeout(() => $('#settingsStatus').textContent = '', 1600);
  });
  $('#openGameFolder').addEventListener('click', () => window.launcherAPI.openGameFolder());
  $('#repairButton').addEventListener('click', async () => {
    const status = $('#diagnosticStatus');
    status.textContent = 'VERIFYING GAME FILES…';
    status.className = 'diagnostic-status';
    try {
      const result = await window.launcherAPI.repair();
      status.textContent = String(result.message || 'FILES VERIFIED').toUpperCase();
      status.className = 'diagnostic-status success';
      $('#filesStatus').textContent = 'VERIFIED ✓';
    } catch (error) {
      status.textContent = error.message;
      status.className = 'diagnostic-status error';
      $('#filesStatus').textContent = 'CHECK FILES';
    }
  });

  if (state.settings.autoCheckUpdates) checkUpdates();
  else {
    $('#updateStatus').textContent = 'MANUAL CHECK';
    $('#updateDetail').textContent = 'Automatic update checks are disabled.';
  }
}

init().catch((error) => {
  document.body.innerHTML = `<pre style="padding:30px;color:#ff6878;background:#080c11">Launcher initialization failed:\n${error.stack || error.message}</pre>`;
});
