const ASSET_PATH = 'assets/ranks/rank-badges.svg';

function escapeAttr(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function rankBadgeHref(rankOrId) {
  const id = typeof rankOrId === 'string' ? rankOrId : rankOrId?.id;
  const safeId = String(id || 'recruit-i').replace(/[^a-z0-9-]/gi, '');
  return `${ASSET_PATH}#rank-${safeId}`;
}

export function rankBadgeMarkup(rank, className = '') {
  const title = escapeAttr(rank?.title || 'Recruit I');
  return `<svg class="career-rank-badge ${escapeAttr(className)}" viewBox="0 0 160 180" role="img" aria-label="${title} rank emblem" focusable="false"><use href="${rankBadgeHref(rank)}"></use></svg>`;
}

export const RANK_BADGE_ASSET_PATH = ASSET_PATH;
