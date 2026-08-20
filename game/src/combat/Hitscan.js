function rayRectDistance(ox, oy, dx, dy, rect, maxDistance) {
  let tMin = 0;
  let tMax = maxDistance;
  for (const axis of ['x', 'y']) {
    const origin = axis === 'x' ? ox : oy;
    const direction = axis === 'x' ? dx : dy;
    const min = rect[axis];
    const max = rect[axis] + (axis === 'x' ? rect.w : rect.h);
    if (Math.abs(direction) < 1e-8) {
      if (origin < min || origin > max) return null;
      continue;
    }
    let t1 = (min - origin) / direction;
    let t2 = (max - origin) / direction;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return null;
  }
  return tMin >= 0 && tMin <= maxDistance ? tMin : null;
}

function rayCircleDistance(ox, oy, dx, dy, circle, maxDistance) {
  const cx = circle.x - ox;
  const cy = circle.y - oy;
  const projection = cx * dx + cy * dy;
  if (projection < 0 || projection > maxDistance) return null;
  const closestSq = cx * cx + cy * cy - projection * projection;
  const radiusSq = circle.radius * circle.radius;
  if (closestSq > radiusSq) return null;
  const offset = Math.sqrt(Math.max(0, radiusSq - closestSq));
  const t = projection - offset;
  return t >= 0 ? t : projection + offset <= maxDistance ? projection + offset : null;
}

export function castHitscan({ origin, angle, map, targets = [], shooter, maxDistance }) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let nearestDistance = maxDistance;
  let hitTarget = null;
  let hitStructure = null;

  for (const rect of map.blockers) {
    const distance = rayRectDistance(origin.x, origin.y, dx, dy, rect, nearestDistance);
    if (distance != null && distance < nearestDistance) {
      nearestDistance = distance;
      hitStructure = rect;
      hitTarget = null;
    }
  }

  for (const target of targets) {
    if (!target?.health?.alive || target === shooter || target.team === shooter.team) continue;
    const distance = rayCircleDistance(origin.x, origin.y, dx, dy, target, nearestDistance);
    if (distance != null && distance < nearestDistance) {
      nearestDistance = distance;
      hitTarget = target;
      hitStructure = null;
    }
  }

  return {
    distance: nearestDistance,
    target: hitTarget,
    structure: hitStructure,
    point: { x: origin.x + dx * nearestDistance, y: origin.y + dy * nearestDistance },
    direction: { x: dx, y: dy }
  };
}
