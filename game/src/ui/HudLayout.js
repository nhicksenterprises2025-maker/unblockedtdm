export const HUD_SCALE_RANGE = Object.freeze({ min:.8, max:1.4 });
export const MINIMAP_SCALE_RANGE = Object.freeze({ min:.75, max:1.25 });
export const KILL_FEED_SCALE_RANGE = Object.freeze({ min:.8, max:1.2 });

function clamp(value, min, max, fallback) {
  const numeric = Number(value);
  return Math.max(min, Math.min(max, Number.isFinite(numeric) ? numeric : fallback));
}

export function resolveHudLayoutScale(requestedScale, viewport = {}) {
  const requested = clamp(requestedScale, HUD_SCALE_RANGE.min, HUD_SCALE_RANGE.max, 1);
  const width = Math.max(960, Number(viewport.width) || 1920);
  const height = Math.max(600, Number(viewport.height) || 1080);

  // At maximum minimap scale the left HUD occupies roughly 265 CSS pixels per
  // layout-scale unit, while half of the centered match strip occupies 310.
  // This cap mathematically preserves a gap without transforming the UI.
  const horizontalCap = width / 1150;
  const verticalCap = height < 760 ? 1 : HUD_SCALE_RANGE.max;
  return clamp(Math.min(requested, horizontalCap, verticalCap), HUD_SCALE_RANGE.min, HUD_SCALE_RANGE.max, 1);
}

export function resolveHudLayoutMetrics(gameplay = {}, viewport = {}) {
  const width = Math.max(960, Number(viewport.width) || 1920);
  const height = Math.max(600, Number(viewport.height) || 1080);
  const requested = clamp(gameplay.hudScale, HUD_SCALE_RANGE.min, HUD_SCALE_RANGE.max, 1);
  const layout = resolveHudLayoutScale(requested, { width, height });
  const minimapSetting = clamp(gameplay.minimapScale, MINIMAP_SCALE_RANGE.min, MINIMAP_SCALE_RANGE.max, 1);
  const feedSetting = clamp(gameplay.killFeedScale, KILL_FEED_SCALE_RANGE.min, KILL_FEED_SCALE_RANGE.max, 1);
  const minimap = clamp(layout * minimapSetting, .65, 1.65, 1);
  const feed = clamp(layout * feedSetting, .64, 1.65, 1);
  const topWidth = 620 * layout;
  const topLeft = (width - topWidth) / 2;
  const minimapRight = 20 * layout + 196 * minimap;
  const topHeight = 76 * layout;
  const topBottom = 20 * layout + topHeight;
  const feedTop = 122 * layout;
  const weaponTop = height - (20 + 170) * layout;
  const dashBottom = 196 * layout;

  return Object.freeze({
    requested,
    layout,
    minimap,
    feed,
    viewport:Object.freeze({ width, height }),
    anchors:Object.freeze({
      topWidth,
      topLeft,
      minimapRight,
      topMinimapGap:topLeft - minimapRight,
      topBottom,
      feedTop,
      feedVerticalGap:feedTop - topBottom,
      weaponTop,
      dashBottom
    })
  });
}
