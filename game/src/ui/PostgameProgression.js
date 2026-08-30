import {
  MAX_CAREER_LEVEL,
  TOTAL_CAREER_XP,
  careerLevelFromXp,
  nextRankForLevel,
  rankForLevel
} from '../progression/ProgressionStore.js';
import { ARENA_RANKS, arenaNextRankForPoints, arenaRankForPoints } from '../arena/ArenaStore.js';

const activeAnimations = new Set();
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const roundHalf = (value) => Math.round((Number(value) || 0) * 2) / 2;

function dispatchState() {
  try {
    if (globalThis.window?.dispatchEvent && globalThis.CustomEvent) {
      globalThis.window.dispatchEvent(new CustomEvent('skirmish:postgame-progression-state', {
        detail:{ active:activeAnimations.size }
      }));
    }
  } catch {}
}

export function careerProgressionState(totalXp) {
  const safeTotalXp = clamp(Math.floor(Number(totalXp) || 0), 0, TOTAL_CAREER_XP);
  const career = careerLevelFromXp(safeTotalXp);
  const rank = rankForLevel(career.level);
  return Object.freeze({
    totalXp:safeTotalXp,
    ...career,
    rank,
    nextRank:nextRankForLevel(career.level),
    progress:career.level >= MAX_CAREER_LEVEL || !career.levelXpRequired
      ? 1
      : clamp(career.levelXp / career.levelXpRequired, 0, 1)
  });
}

export function arenaProgressionState(points) {
  const ap = Math.max(0, roundHalf(points));
  const rank = arenaRankForPoints(ap);
  const nextRank = arenaNextRankForPoints(ap);
  const span = nextRank ? Math.max(1, nextRank.threshold - rank.threshold) : 1;
  return Object.freeze({
    ap,
    rank,
    nextRank,
    progress:nextRank ? clamp((ap - rank.threshold) / span, 0, 1) : 1
  });
}

export function careerTransitionLevels(fromXp, toXp) {
  const from = careerProgressionState(fromXp);
  const to = careerProgressionState(toXp);
  if (from.level === to.level) return [];
  const direction = Math.sign(to.level - from.level);
  const levels = [];
  for (let level = from.level + direction; direction > 0 ? level <= to.level : level >= to.level; level += direction) levels.push(level);
  return levels;
}

export function arenaTransitionRanks(fromAp, toAp) {
  const from = arenaProgressionState(fromAp);
  const to = arenaProgressionState(toAp);
  if (from.rank.id === to.rank.id) return [];
  const fromIndex = ARENA_RANKS.findIndex((rank) => rank.id === from.rank.id);
  const toIndex = ARENA_RANKS.findIndex((rank) => rank.id === to.rank.id);
  const direction = Math.sign(toIndex - fromIndex);
  const crossed = [];
  for (let index = fromIndex + direction; direction > 0 ? index <= toIndex : index >= toIndex; index += direction) crossed.push(ARENA_RANKS[index].id);
  return crossed;
}

function preferredReducedMotion() {
  try { return Boolean(globalThis.window?.matchMedia?.('(prefers-reduced-motion: reduce)').matches); } catch { return false; }
}

/**
 * One bounded animator drives both Career XP and Arena AP. Callers derive the
 * visible level/rank from each emitted value, so the last frame can never
 * disagree with the already-persisted store result.
 */
export function animateProgression({ from = 0, to = 0, duration = 1200, quantize = (value) => value, onFrame = () => {} } = {}) {
  const startValue = Number(from) || 0;
  const finalValue = Number(to) || 0;
  const safeDuration = preferredReducedMotion() ? 0 : clamp(Number(duration) || 0, 0, 2400);
  let frameId = null;
  let timerId = null;
  let settled = false;
  let resolvePromise;
  const promise = new Promise((resolve) => { resolvePromise = resolve; });

  const emit = (value, progress, final = false) => {
    try { onFrame(final ? finalValue : quantize(value), progress, final); } catch {}
  };

  const controller = {
    finish() {
      if (settled) return;
      settled = true;
      if (frameId != null && globalThis.cancelAnimationFrame) globalThis.cancelAnimationFrame(frameId);
      if (timerId != null) globalThis.clearTimeout?.(timerId);
      emit(finalValue, 1, true);
      activeAnimations.delete(controller);
      dispatchState();
      resolvePromise(finalValue);
    },
    promise
  };

  activeAnimations.add(controller);
  dispatchState();
  emit(startValue, 0, false);

  if (safeDuration <= 0 || startValue === finalValue) {
    Promise.resolve().then(() => controller.finish());
    return controller;
  }

  const now = () => globalThis.performance?.now?.() ?? Date.now();
  const startedAt = now();
  const step = () => {
    if (settled) return;
    const linear = clamp((now() - startedAt) / safeDuration, 0, 1);
    const eased = 1 - Math.pow(1 - linear, 3);
    emit(startValue + (finalValue - startValue) * eased, linear, false);
    if (linear >= 1) controller.finish();
    else if (globalThis.requestAnimationFrame) frameId = globalThis.requestAnimationFrame(step);
    else timerId = globalThis.setTimeout?.(step, 16);
  };
  if (globalThis.requestAnimationFrame) frameId = globalThis.requestAnimationFrame(step);
  else timerId = globalThis.setTimeout?.(step, 16);
  return controller;
}

export function skipPostgameProgression() {
  for (const animation of [...activeAnimations]) animation.finish();
}

try {
  globalThis.window?.addEventListener?.('skirmish:skip-postgame-progression', skipPostgameProgression);
} catch {}
