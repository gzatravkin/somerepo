import { Ship, Projectile, Explosion, Loot } from '../types';
import { distance } from '../utils/helpers';

export interface CollisionResult {
  projectilesThatHit: Set<string>;
  shipsThatDied: Map<string, { killerId: string; size: number }>;
  lootCollected: Set<string>;
}

export const detectProjectileCollisions = (
  projectiles: Projectile[],
  ships: Map<string, Ship>
): { projectilesThatHit: Set<string>; shipsThatDied: Map<string, { killerId: string; size: number }> } => {
  const projectilesThatHit = new Set<string>();
  const shipsThatDied = new Map<string, { killerId: string; size: number }>();

  projectiles.forEach((proj) => {
    if (projectilesThatHit.has(proj.id)) return;

    // Skip collision for gravity wells - they handle damage separately
    if (proj.specialType === 'GRAVITY_WELL') return;

    ships.forEach((ship) => {
      if (ship.id === proj.ownerId || shipsThatDied.has(ship.id)) return;

      // Special handling for beams
      if (proj.isBeam && proj.beamLength) {
        const beamEndX = proj.x + Math.cos(Math.atan2(proj.vy, proj.vx)) * proj.beamLength;
        const beamEndY = proj.y + Math.sin(Math.atan2(proj.vy, proj.vx)) * proj.beamLength;

        // Check if ship intersects with beam line
        const dist = distanceToLineSegment(ship.x, ship.y, proj.x, proj.y, beamEndX, beamEndY);
        if (dist < ship.size) {
          if (!ship.shieldActive) {
            ship.health -= proj.damage / 60; // Beam does damage over time
            if (ship.health <= 0) {
              shipsThatDied.set(ship.id, { killerId: proj.ownerId, size: ship.size });
            }
          }
        }
      } else {
        // Standard collision detection
        if (distance(proj, ship) < ship.size + proj.size) {
          // Piercing shots can hit multiple enemies
          if (proj.piercing && proj.piercedShips) {
            if (!proj.piercedShips.has(ship.id)) {
              proj.piercedShips.add(ship.id);
              if (!ship.shieldActive) {
                ship.health -= proj.damage;
                if (ship.health <= 0) {
                  shipsThatDied.set(ship.id, { killerId: proj.ownerId, size: ship.size });
                }
              }
            }
          } else {
            // Normal projectile hits once
            if (!ship.shieldActive) {
              ship.health -= proj.damage;
              if (ship.health <= 0) {
                shipsThatDied.set(ship.id, { killerId: proj.ownerId, size: ship.size });
              }
            }
            projectilesThatHit.add(proj.id);
          }
        }
      }
    });
  });

  return { projectilesThatHit, shipsThatDied };
};

export const detectExplosionCollisions = (
  explosions: Explosion[],
  ships: Map<string, Ship>,
  shipsThatDied: Map<string, { killerId: string; size: number }>
): void => {
  explosions.forEach((exp) => {
    if (!exp.damageDealt) {
      ships.forEach((ship) => {
        if (ship.id === exp.ownerId || shipsThatDied.has(ship.id)) return;
        if (distance(exp, ship) < exp.maxRadius + ship.size) {
          if (!ship.shieldActive) {
            ship.health -= exp.damage;
            if (ship.health <= 0 && !shipsThatDied.has(ship.id)) {
              shipsThatDied.set(ship.id, { killerId: exp.ownerId, size: ship.size });
            }
          }
        }
      });
      exp.damageDealt = true;
    }
  });
};

export const detectLootCollection = (loot: Loot[], ships: Map<string, Ship>): Set<string> => {
  const collectedLoot = new Set<string>();

  ships.forEach((ship) => {
    loot.forEach((l) => {
      if (collectedLoot.has(l.id)) return;
      if (distance(ship, l) < ship.size + l.radius) {
        ship.cargo += l.value;
        collectedLoot.add(l.id);
      }
    });
  });

  return collectedLoot;
};

// Helper function to calculate distance from point to line segment
function distanceToLineSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));

  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));

  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  return Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY));
}
