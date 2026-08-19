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
  const startX = entity.x;
  const startY = entity.y;

  const nextX = Math.max(radius, Math.min(bounds.w - radius, entity.x + dx));
  if (!collides(nextX, entity.y, radius, blockers)) entity.x = nextX;

  const nextY = Math.max(radius, Math.min(bounds.h - radius, entity.y + dy));
  if (!collides(entity.x, nextY, radius, blockers)) entity.y = nextY;

  return {
    dx: entity.x - startX,
    dy: entity.y - startY,
    distance: Math.hypot(entity.x - startX, entity.y - startY)
  };
}

export function moveCircleSwept(entity, dx, dy, blockers, bounds, maxStep = 6) {
  const distance = Math.hypot(dx, dy);
  if (distance <= 0.0001) return { dx: 0, dy: 0, distance: 0, blocked: false };

  const startX = entity.x;
  const startY = entity.y;
  const steps = Math.max(1, Math.ceil(distance / Math.max(1, maxStep)));
  const stepX = dx / steps;
  const stepY = dy / steps;
  let blocked = false;

  for (let i = 0; i < steps; i += 1) {
    const beforeX = entity.x;
    const beforeY = entity.y;
    moveCircle(entity, stepX, stepY, blockers, bounds);
    const moved = Math.hypot(entity.x - beforeX, entity.y - beforeY);
    if (moved + 0.01 < Math.hypot(stepX, stepY)) {
      blocked = true;
      break;
    }
  }

  return {
    dx: entity.x - startX,
    dy: entity.y - startY,
    distance: Math.hypot(entity.x - startX, entity.y - startY),
    blocked
  };
}
