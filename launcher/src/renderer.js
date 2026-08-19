const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let state;

function setView(name) {
  $$('.nav-button').forEach((button) => button.classList.toggle('active', button.dataset.view === name));
  $$('.view').forEach((view) => view.classList.toggle('active', view.id === name));
  const titles = { home: 'Launcher', archive: 'Version Archive', settings: 'Settings', diagnostics: 'Diagnostics' };
  $('#viewTitle').textContent = titles[name] || 'Launcher';
  if (name === 'archive') loadArchive();
}

function setProgress(payload) {
  const panel = $('#progressPanel');
  panel.classList.remove('hidden');
  if (payload.type === 'download') {
    const percent = payload.percent ?? 0;
    $('#progressText').textContent = 'Downloading update…';
    $('#progressPercent').textContent = payload.percent == null ? '' : `${percent}%`;
    $('#progressBar').style.width = `${percent}%`;
  } else if (payload.type === 'status') {
    $('#progressText').textContent = payload.message;
  }
}

function renderState(next) {
  state = next;
  const { buildInfo, installed, settings, gamePath } = next;
  $('#phaseLabel').textContent = buildInfo.phase.toUpperCase();
  $('#launcherBuild').textContent = `Build ${buildInfo.gameVersion} · Version ${buildInfo.build}`;
  $('#currentTitle').textContent = installed.title || `${buildInfo.product} ${buildInfo.gameVersion}`;
  $('#currentMeta').textContent = `${installed.phase || buildInfo.phase} · Build ${installed.gameVersion} · Version ${installed.build}`;
  $('#gamePath').textContent = gamePath;
  $('#autoCheckUpdates').checked = settings.autoCheckUpdates;
  $('#minimizeOnPlay').checked = settings.minimizeOnPlay;
  $('#closeAfterPlay').checked = settings.closeAfterPlay;
}

async function checkUpdates() {
  $('#updateStatus').textContent = 'Checking GitHub…';
  $('#updateDetail').textContent = 'Reading the live UnblockedTDM release manifest.';
  try {
    const result = await window.launcherAPI.checkUpdates();
    if (result.updateAvailable) {
      $('#updateStatus').textContent = 'Update available';
      $('#updateDetail').textContent = `${result.latest.title} is ready to install.`;
      $('#updateButton').textContent = 'INSTALL UPDATE';
      $('#updateButton').dataset.mode = 'install';
    } else {
      $('#updateStatus').textContent = 'Up to date';
      $('#updateDetail').textContent = `${result.installed.title} is the latest published build.`;
      $('#updateButton').textContent = 'CHECK FOR UPDATES';
      $('#updateButton').dataset.mode = 'check';
    }
  } catch (error) {
    $('#updateStatus').textContent = 'Unable to check';
    $('#updateDetail').textContent = error.message;
  }
}

async function installLatest() {
  try {
    $('#updateButton').disabled = true;
    const result = await window.launcherAPI.installLatest();
    state.installed = result.entry;
    renderState(state);
    await checkUpdates();
  } catch (error) {
    $('#updateStatus').textContent = 'Update failed';
    $('#updateDetail').textContent = error.message;
  } finally {
    $('#updateButton').disabled = false;
  }
}

async function loadArchive() {
  const list = $('#archiveList');
  list.innerHTML = '<div class="panel muted">Loading immutable builds from GitHub…</div>';
  try {
    const versions = await window.launcherAPI.listVersions();
    if (!versions.length) {
      list.innerHTML = '<div class="panel muted">No published archived builds are available yet.</div>';
      return;
    }
    list.innerHTML = '';
    for (const entry of versions) {
      const item = document.createElement('article');
      item.className = 'panel archive-item';
      item.innerHTML = `
        <div>
          <strong>${entry.title}</strong>
          <div class="archive-meta">
            <span>${entry.phase}</span><span>Build ${entry.gameVersion}</span><span>Version ${entry.build}</span><span>${entry.tag}</span>
          </div>
        </div>
        <div class="archive-actions"></div>`;
      const actions = item.querySelector('.archive-actions');
      const action = document.createElement('button');
      action.className = entry.downloaded ? 'primary' : 'secondary';
      action.textContent = entry.downloaded ? 'PLAY VERSION' : 'DOWNLOAD';
      action.addEventListener('click', async () => {
        action.disabled = true;
        try {
          if (entry.downloaded) {
            await window.launcherAPI.playVersion(entry.tag);
          } else {
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
    list.innerHTML = `<div class="panel error">${error.message}</div>`;
  }
}

async function init() {
  renderState(await window.launcherAPI.getState());
  window.launcherAPI.onProgress(setProgress);
  $$('.nav-button').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
  $('#playButton').addEventListener('click', async () => {
    try { await window.launcherAPI.playCurrent(); } catch (error) { alert(error.message); }
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
    $('#settingsStatus').textContent = 'Saved.';
    setTimeout(() => $('#settingsStatus').textContent = '', 1600);
  });
  $('#openGameFolder').addEventListener('click', () => window.launcherAPI.openGameFolder());
  $('#repairButton').addEventListener('click', async () => {
    const status = $('#diagnosticStatus');
    status.textContent = 'Verifying game files…';
    try {
      const result = await window.launcherAPI.repair();
      status.textContent = result.message;
      status.className = 'panel success';
    } catch (error) {
      status.textContent = error.message;
      status.className = 'panel error';
    }
  });
  if (state.settings.autoCheckUpdates) checkUpdates();
  else {
    $('#updateStatus').textContent = 'Automatic checks disabled';
    $('#updateDetail').textContent = 'Use Check for Updates whenever you want to query GitHub.';
  }
}

init().catch((error) => {
  document.body.innerHTML = `<pre style="padding:30px;color:#ff9d9d">Launcher initialization failed:\n${error.stack || error.message}</pre>`;
});
