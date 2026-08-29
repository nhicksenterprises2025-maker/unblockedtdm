export function arenaOpponentTeam(team) {
  return team === 'red' ? 'blue' : 'red';
}

export function refreshTeamWipeLatch(latched, opponentsAliveBefore, teamSize = 3) {
  const requiredAlive = Math.max(1, Math.floor(Number(teamSize) || 3));
  return Number(opponentsAliveBefore) >= requiredAlive ? false : Boolean(latched);
}

export function resolveTeamWipe({ latched = false, attackerTeam = null, localTeam = 'blue', opponentsAliveAfter = 1 } = {}) {
  const awarded = attackerTeam === localTeam && Number(opponentsAliveAfter) === 0 && !latched;
  return {
    awarded,
    latched: awarded ? true : Boolean(latched)
  };
}
