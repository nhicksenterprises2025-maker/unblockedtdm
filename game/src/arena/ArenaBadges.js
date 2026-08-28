import { ARENA_RANKS, arenaRankIndex } from './ArenaStore.js';

const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));

function chevrons(index) {
  const count = index <= 2 ? index + 1 : index <= 5 ? index - 2 : index <= 7 ? index - 5 : Math.min(4, 2 + Math.floor((index - 8) / 2));
  return Array.from({ length:Math.max(1, count) }, (_, i) => {
    const y = 47 + i * 8;
    return `<path d="M31 ${y} 48 ${y + 7} 65 ${y}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join('');
}

export function arenaBadgeMarkup(rank, className = '') {
  const resolved = ARENA_RANKS.find((entry) => entry.id === rank?.id) || ARENA_RANKS[0];
  const index = arenaRankIndex(resolved);
  const stars = index >= 8 ? `<path d="M48 28l3.2 6.4 7.1 1-5.1 5 1.2 7-6.4-3.4-6.4 3.4 1.2-7-5.1-5 7.1-1z" fill="currentColor" opacity="${index >= 12 ? '.95' : '.62'}"/>` : '';
  return `<span class="arena-rank-badge ${safe(className)}" data-arena-rank-badge="${safe(resolved.id)}" style="--arena-rank-tone:${safe(resolved.tone)}" title="${safe(resolved.title)}">
    <svg viewBox="0 0 96 112" aria-hidden="true">
      <path d="M48 4 84 18v36c0 24-15 42-36 54C27 96 12 78 12 54V18Z" fill="#09131a" stroke="currentColor" stroke-width="3"/>
      <path d="M48 11 76 22v31c0 18-11 33-28 44-17-11-28-26-28-44V22Z" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".42"/>
      ${stars}${chevrons(index)}
    </svg>
  </span>`;
}
