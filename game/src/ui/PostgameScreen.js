function safe(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
}

function defaultPlayerLabel(row) {
  // Identity is an optional presentation seam for the future social/party
  // layer. Local simulation remains unchanged and no online state is faked.
  const identityName = row?.identity?.displayName || row?.profile?.displayName || row.displayName;
  if (identityName) return String(identityName);
  if (row?.isLocal) return 'YOU';
  return String(row?.id || 'PLAYER').replace(/-/g, ' ').toUpperCase();
}

function kdValue(row) {
  const explicit = Number(row?.kd);
  if (Number.isFinite(explicit)) return explicit;
  const kills = Math.max(0, Number(row?.kills) || 0);
  const deaths = Math.max(0, Number(row?.deaths) || 0);
  return deaths > 0 ? kills / deaths : kills;
}

function rankedRows(rows) {
  return [...rows].sort((a, b) =>
    (Number(b.kills || 0) - Number(a.kills || 0)) ||
    (Number(b.damage || 0) - Number(a.damage || 0)) ||
    (Number(a.deaths || 0) - Number(b.deaths || 0)) ||
    String(a.id || '').localeCompare(String(b.id || ''))
  );
}

function rowHtml(row, labelFor) {
  return `<div class="postgame-row ${row.isLocal ? 'local' : ''}" data-roster-player="${safe(row.id)}">
    <strong>${safe(labelFor(row))}</strong>
    <span class="postgame-key-stat">${Math.max(0, Number(row.kills) || 0)}</span>
    <span>${Math.max(0, Number(row.deaths) || 0)}</span>
    <span>${Math.max(0, Number(row.assists) || 0)}</span>
    <span>${Math.max(0, Math.round(Number(row.damage) || 0))}</span>
    <span class="postgame-key-stat">${kdValue(row).toFixed(2)}</span>
    <span>${Math.max(0, Number(row.criticals) || 0)}</span>
    <span>${Math.max(0, Number(row.bestStreak) || 0)}</span>
  </div>`;
}

function teamTable(team, rows, labelFor) {
  const ordered = rankedRows(rows);
  return `<section class="postgame-team ${team}">
    <div class="postgame-team-title"><span>${team.toUpperCase()} TEAM</span><b>${ordered.reduce((sum, row) => sum + (Number(row.kills) || 0), 0)} KILLS</b></div>
    <div class="postgame-row postgame-head"><strong>PLAYER</strong><span class="postgame-key-stat">K</span><span>D</span><span>A</span><span>DMG</span><span class="postgame-key-stat">K/D</span><span>CRIT</span><span>BEST</span></div>
    ${ordered.map((row) => rowHtml(row, labelFor)).join('')}
  </section>`;
}

export class PostgameScreen {
  constructor(root, { onRematch = null, onMainMenu = null, playerLabel = defaultPlayerLabel } = {}) {
    this.root = root;
    this.onRematch = onRematch;
    this.onMainMenu = onMainMenu;
    this.playerLabel = typeof playerLabel === 'function' ? playerLabel : defaultPlayerLabel;
    this.progressionStateHandler = (event) => {
      const skip = this.root.querySelector('[data-postgame-action="skip"]');
      if (!skip) return;
      const active = Math.max(0, Number(event.detail?.active) || 0);
      skip.hidden = active === 0;
      skip.disabled = active === 0;
    };
    window.addEventListener('skirmish:postgame-progression-state', this.progressionStateHandler);
    this.root.addEventListener('click', (event) => {
      const action = event.target.closest('[data-postgame-action]')?.dataset.postgameAction;
      if (!action) return;
      if (action === 'skip') {
        window.dispatchEvent(new CustomEvent('skirmish:skip-postgame-progression'));
        return;
      }
      if (action === 'rematch' || action === 'menu') window.dispatchEvent(new CustomEvent('skirmish:skip-postgame-progression'));
      if (action === 'rematch') this.onRematch?.();
      if (action === 'menu') this.onMainMenu?.();
    });
  }

  show(snapshot) {
    const stats = Array.isArray(snapshot.stats) ? snapshot.stats : [];
    const blue = stats.filter((row) => row.team === 'blue');
    const red = stats.filter((row) => row.team === 'red');
    const local = stats.find((row) => row.isLocal) || stats[0] || null;
    const rounds = Array.isArray(snapshot.roundHistory) ? snapshot.roundHistory : [];
    const winner = snapshot.matchWinner === 'red' ? 'red' : 'blue';
    const localWon = Boolean(local && winner === local.team);
    const resultLabel = localWon ? 'VICTORY' : 'DEFEAT';
    const mvp = rankedRows(stats)[0] || null;
    const wins = snapshot.wins || { blue:0, red:0 };

    this.root.innerHTML = `<div class="postgame-shell ${localWon ? 'result-victory' : 'result-defeat'}" data-ui-surface>
      <header class="postgame-titlebar">
        <div><span>SKIRMISH ARENA // MATCH COMPLETE</span><h1>${resultLabel}</h1><p>${winner.toUpperCase()} TEAM WINS</p></div>
        <div class="postgame-final"><small>FINAL ROUNDS</small><strong><i>BLUE ${Math.max(0, Number(wins.blue) || 0)}</i><em>:</em><b>${Math.max(0, Number(wins.red) || 0)} RED</b></strong></div>
      </header>
      <div class="postgame-summary">
        <div><span>DURATION</span><strong>${safe(snapshot.durationLabel || '0:00')}</strong></div>
        <div><span>YOUR K/D/A</span><strong>${local ? `${local.kills} / ${local.deaths} / ${local.assists}` : '—'}</strong></div>
        <div><span>YOUR DAMAGE</span><strong>${Math.max(0, Math.round(Number(local?.damage) || 0))}</strong></div>
        <div><span>BEST STREAK</span><strong>${Math.max(0, Number(local?.bestStreak) || 0)}</strong></div>
        <div><span>CRITICAL HITS</span><strong>${Math.max(0, Number(local?.criticals) || 0)}</strong></div>
        <div class="postgame-mvp"><span>MATCH MVP</span><strong>${mvp ? safe(this.playerLabel(mvp)) : '—'}</strong><small>${mvp ? `${Math.max(0, Number(mvp.kills) || 0)} K · ${Math.max(0, Math.round(Number(mvp.damage) || 0))} DMG` : ''}</small></div>
      </div>
      <div class="postgame-scoreboards">
        ${teamTable('blue', blue, this.playerLabel)}
        ${teamTable('red', red, this.playerLabel)}
      </div>
      <section class="postgame-rounds">
        <span>ROUND HISTORY</span>
        <div>${rounds.map((round) => {
          const roundWinner = round?.winner === 'red' ? 'red' : 'blue';
          const kills = round?.kills || { blue:0, red:0 };
          return `<b class="${roundWinner}">R${Math.max(1, Number(round?.round) || 1)} · ${roundWinner.toUpperCase()} · ${Math.max(0, Number(kills.blue) || 0)}-${Math.max(0, Number(kills.red) || 0)}${round?.suddenDeath ? ' · SD' : ''}</b>`;
        }).join('')}</div>
      </section>
      <footer class="postgame-actions">
        <button type="button" class="postgame-skip" data-postgame-action="skip" hidden disabled>SKIP PROGRESSION</button>
        <span aria-hidden="true"></span>
        <button type="button" data-postgame-action="menu">MAIN MENU</button>
        <button type="button" class="primary" data-postgame-action="rematch">REMATCH</button>
      </footer>
    </div>`;
    this.root.classList.add('visible');
  }

  hide() {
    window.dispatchEvent(new CustomEvent('skirmish:skip-postgame-progression'));
    this.root.classList.remove('visible');
  }
}

export { defaultPlayerLabel as postgamePlayerLabel };
