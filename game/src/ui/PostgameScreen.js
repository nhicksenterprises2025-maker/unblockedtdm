function playerLabel(row) {
  if (row.isLocal) return 'YOU';
  if (row.displayName) return String(row.displayName);
  return row.id.replace(/-/g, ' ').toUpperCase();
}

function rowHtml(row) {
  return `<div class="postgame-row ${row.isLocal ? 'local' : ''}">
    <strong>${playerLabel(row)}</strong>
    <span>${row.kills}</span>
    <span>${row.deaths}</span>
    <span>${row.assists}</span>
    <span>${row.damage}</span>
    <span>${row.kd.toFixed(2)}</span>
    <span>${row.criticals}</span>
    <span>${row.bestStreak}</span>
  </div>`;
}

function teamTable(team, rows) {
  return `<section class="postgame-team ${team}">
    <div class="postgame-team-title"><span>${team.toUpperCase()} TEAM</span><b>${rows.reduce((sum, row) => sum + row.kills, 0)} KILLS</b></div>
    <div class="postgame-row postgame-head"><strong>PLAYER</strong><span>K</span><span>D</span><span>A</span><span>DMG</span><span>K/D</span><span>CRIT</span><span>BEST</span></div>
    ${rows.map(rowHtml).join('')}
  </section>`;
}

export class PostgameScreen {
  constructor(root, { onRematch = null, onMainMenu = null } = {}) {
    this.root = root;
    this.onRematch = onRematch;
    this.onMainMenu = onMainMenu;
    this.root.addEventListener('click', (event) => {
      const action = event.target.closest('[data-postgame-action]')?.dataset.postgameAction;
      if (action === 'rematch') this.onRematch?.();
      if (action === 'menu') this.onMainMenu?.();
    });
  }

  show(snapshot) {
    const stats = snapshot.stats || [];
    const blue = stats.filter((row) => row.team === 'blue');
    const red = stats.filter((row) => row.team === 'red');
    const local = stats.find((row) => row.isLocal) || stats[0];
    const rounds = snapshot.roundHistory || [];

    this.root.innerHTML = `<div class="postgame-shell" data-ui-surface>
      <header class="postgame-titlebar">
        <div><span>SKIRMISH ARENA // MATCH COMPLETE</span><h1>${snapshot.matchWinner?.toUpperCase() || '—'} TEAM WINS</h1></div>
        <div class="postgame-final"><small>FINAL ROUNDS</small><strong><i>BLUE ${snapshot.wins.blue}</i><b>${snapshot.wins.red} RED</b></strong></div>
      </header>
      <div class="postgame-summary">
        <div><span>DURATION</span><strong>${snapshot.durationLabel || '0:00'}</strong></div>
        <div><span>YOUR K/D/A</span><strong>${local ? `${local.kills} / ${local.deaths} / ${local.assists}` : '—'}</strong></div>
        <div><span>YOUR DAMAGE</span><strong>${local?.damage ?? 0}</strong></div>
        <div><span>BEST STREAK</span><strong>${local?.bestStreak ?? 0}</strong></div>
        <div><span>CRITICAL HITS</span><strong>${local?.criticals ?? 0}</strong></div>
      </div>
      <div class="postgame-scoreboards">
        ${teamTable('blue', blue)}
        ${teamTable('red', red)}
      </div>
      <section class="postgame-rounds">
        <span>ROUND HISTORY</span>
        <div>${rounds.map((round) => `<b class="${round.winner}">R${round.round} · ${round.winner.toUpperCase()} · ${round.kills.blue}-${round.kills.red}${round.suddenDeath ? ' · SD' : ''}</b>`).join('')}</div>
      </section>
      <footer class="postgame-actions">
        <button type="button" data-postgame-action="menu">MAIN MENU</button>
        <button type="button" class="primary" data-postgame-action="rematch">REMATCH</button>
      </footer>
    </div>`;
    this.root.classList.add('visible');
  }

  hide() {
    this.root.classList.remove('visible');
  }
}
