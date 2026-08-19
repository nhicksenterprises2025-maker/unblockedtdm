export function circleIntersectsRect(cx, cy, radius, rect) {
  const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < radius * radius;
}

function collides(x, y, radius, blockers) {
  return blockers.some((rect) => circleIntersectsRect(x, y, radius, rect));
}

export function moveCircle(entity, dx, dy, blockers, bounds) {
  const radius = entity.radius || 0;
  const nextX = Math.max(radius, Math.min(bounds.w - radius, entity.x + dx));
  if (!collides(nextX, entity.y, radius, blockers)) entity.x = nextX;

  const nextY = Math.max(radius, Math.min(bounds.h - radius, entity.y + dy));
  if (!collides(entity.x, nextY, radius, blockers)) entity.y = nextY;
}
