import { Ship, Loot, Base, Projectile, Vector, AIState } from '../types';
import { distance } from '../utils/helpers';
import { getRandomPosition } from '../utils/helpers';

const GAME_WIDTH = 4000;
const GAME_HEIGHT = 4000;

export const activateShield = (ship: Ship): void => {
  const now = Date.now();
  if (ship.shieldEnergy > 0 && !ship.shieldActive && now - ship.lastShieldUse > ship.shieldCooldown) {
    ship.shieldActive = true;
    ship.shieldActivatedTime = now;
    ship.shieldEnergy--;
    ship.lastShieldUse = now;
  }
};

export const updateBotAI = (
  ship: Ship,
  ships: Map<string, Ship>,
  loot: Loot[],
  bases: Base[],
  projectiles: Projectile[]
): void => {
  const perceptionRadius = 600;
  const now = Date.now();

  // Check for incoming projectiles and activate shield if needed
  const incomingProjectiles = projectiles.filter((p) => p.ownerId !== ship.id);
  let shouldUseShield = false;

  incomingProjectiles.forEach((proj) => {
    const distToProjectile = distance(ship, proj);
    const projSpeed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy);
    const timeToImpact = distToProjectile / Math.max(projSpeed, 1);

    // If projectile will hit within 0.3 seconds and ship has shield energy
    if (timeToImpact < 0.3 && distToProjectile < ship.size * 2.5 && ship.shieldEnergy > 0) {
      // Use shield based on AI personality and reaction time
      const useChance =
        ship.aiParams.bravery * 0.6 + ship.aiParams.reaction * 0.4 + (ship.isElite ? 0.3 : 0.1);
      if (Math.random() < useChance) {
        shouldUseShield = true;
      }
    }
  });

  if (shouldUseShield) {
    activateShield(ship);
  }

  // Only make major AI decisions based on reaction time
  const reactionDelay = (1 - ship.aiParams.reaction) * 500 + 200; // 200-700ms delay
  const shouldMakeDecision = now - ship.lastAIDecision > reactionDelay;

  // --- Perception ---
  let nearestBiggerThreat: Ship | null = null;
  let bestPrey: Ship | null = null;
  let nearestLoot: Loot | null = null;
  let distToThreat = Infinity;
  let preyScore = -Infinity;
  let distToLoot = Infinity;

  ships.forEach((other) => {
    if (other.id === ship.id) return;
    const d = distance(ship, other);
    if (d > perceptionRadius) return;

    // Threat Assessment: A threat is significantly larger or another elite
    const sizeThreatRatio = 1.15 + ship.aiParams.bravery * 0.2; // Braver ships have higher threshold
    if (other.size > ship.size * sizeThreatRatio || (other.isElite && ship.size < other.size * 1.3)) {
      if (d < distToThreat) {
        distToThreat = d;
        nearestBiggerThreat = other;
      }
    }

    // Prey Assessment: Score potential targets
    const sizeDifference = ship.size - other.size;
    const canAttack = sizeDifference > -ship.size * (0.3 - ship.aiParams.bravery * 0.2);
    if (canAttack) {
      let currentPreyScore = 1000 - d;
      currentPreyScore += sizeDifference * 5;
      if (other.isPlayer) {
        currentPreyScore += 200 * ship.aiParams.aggression;
      }
      // Add some randomness to prey selection
      currentPreyScore += (Math.random() - 0.5) * 100;
      if (currentPreyScore > preyScore) {
        preyScore = currentPreyScore;
        bestPrey = other;
      }
    }
  });

  loot.forEach((l) => {
    const d = distance(ship, l);
    if (d < perceptionRadius && d < distToLoot) {
      distToLoot = d;
      nearestLoot = l;
    }
  });

  // Cargo management
  const cargoCapacity = ship.size * 3;
  const cargoFull = ship.cargo >= cargoCapacity * 0.8;

  // Find closest base for return
  let closestBase: Base | null = null;
  let distToBase = Infinity;
  if (cargoFull || ship.health < ship.maxHealth * 0.5) {
    bases.forEach((b) => {
      const d = distance(ship, b);
      if (d < distToBase) {
        distToBase = d;
        closestBase = b;
      }
    });
  }

  // --- State Decision (only if reaction time allows) ---
  if (shouldMakeDecision) {
    ship.lastAIDecision = now;

    // Check if should flee (with chance to fight back)
    const fleeThreshold = (1 - ship.aiParams.bravery) * 0.8 + 0.2;
    if (nearestBiggerThreat && distToThreat < perceptionRadius * fleeThreshold) {
      // Smart flee behavior: sometimes try to shoot while fleeing
      if (ship.aiParams.aggression > 0.5 && bestPrey && Math.random() < 0.4) {
        ship.aiState = 'FLEEING_AND_SHOOTING';
        ship.aiTarget = nearestBiggerThreat;
        ship.aiSecondaryTarget = bestPrey;
        ship.aiFleeShootTimer = now;
      } else {
        ship.aiState = 'FLEEING';
        ship.aiTarget = nearestBiggerThreat;
        ship.aiSecondaryTarget = null;
      }
      return;
    }

    // Defender behavior
    if (ship.aiPersonality === 'DEFENDER' && ship.assignedBase) {
      let potentialTarget: Ship | null = null;
      let targetDist = Infinity;
      ships.forEach((other) => {
        if (other.id === ship.id) return;
        const d = distance(other, ship.assignedBase!);
        if (d < ship.assignedBase!.radius * 1.5 && other.size < ship.size * 1.4) {
          const distToShip = distance(ship, other);
          if (distToShip < targetDist) {
            targetDist = distToShip;
            potentialTarget = other;
          }
        }
      });

      if (potentialTarget) {
        ship.aiState = 'DEFENDING_BASE';
        ship.aiTarget = potentialTarget;
        ship.aiSecondaryTarget = null;
      } else {
        ship.aiState = 'WANDERING';
        ship.aiSecondaryTarget = null;
      }
      return;
    }

    // Standard personalities with more variation
    if (cargoFull && closestBase) {
      ship.aiState = 'RETURNING_TO_BASE';
      ship.aiTarget = closestBase;
      ship.aiSecondaryTarget = null;
      return;
    }

    const personalityRandomness = Math.random();

    switch (ship.aiPersonality) {
      case 'AGGRESSOR':
        if (bestPrey) {
          ship.aiState = 'HUNTING';
          ship.aiTarget = bestPrey;
        } else if (nearestLoot && personalityRandomness < 0.3) {
          ship.aiState = 'COLLECTING_LOOT';
          ship.aiTarget = nearestLoot;
        } else {
          ship.aiState = 'WANDERING';
        }
        break;
      case 'SCAVENGER':
        if (nearestLoot) {
          ship.aiState = 'COLLECTING_LOOT';
          ship.aiTarget = nearestLoot;
        } else if (bestPrey && personalityRandomness < 0.4) {
          ship.aiState = 'HUNTING';
          ship.aiTarget = bestPrey;
        } else {
          ship.aiState = 'WANDERING';
        }
        break;
      case 'WANDERER':
        const aggressionThreshold = ship.aiParams.aggression * 0.7;
        if (bestPrey && personalityRandomness < aggressionThreshold) {
          ship.aiState = 'HUNTING';
          ship.aiTarget = bestPrey;
        } else if (nearestLoot && personalityRandomness < 0.6) {
          ship.aiState = 'COLLECTING_LOOT';
          ship.aiTarget = nearestLoot;
        } else {
          ship.aiState = 'WANDERING';
        }
        break;
      default:
        ship.aiState = 'WANDERING';
    }
  }
};

export const getAIMovementAngle = (ship: Ship, now: number): number | undefined => {
  let targetAngle: number | undefined;

  switch (ship.aiState) {
    case 'FLEEING':
      if (ship.aiTarget) {
        // Flee directly away from threat
        targetAngle = Math.atan2(ship.y - ship.aiTarget.y, ship.x - ship.aiTarget.x);
        // Add some imprecision based on AI skill
        const fleeImprecision = (1 - ship.aiParams.precision) * 0.3;
        targetAngle += (Math.random() - 0.5) * fleeImprecision;
      }
      break;
    case 'FLEEING_AND_SHOOTING':
      const fleeShootCycleTime = 1000 + Math.random() * 1000; // 1-2 second cycles
      const cycleProgress = (now - ship.aiFleeShootTimer) % fleeShootCycleTime;
      const shootPhase = cycleProgress < 300; // 300ms shooting phase

      if (shootPhase && ship.aiSecondaryTarget) {
        // Briefly turn to shoot at secondary target
        targetAngle = Math.atan2(
          ship.aiSecondaryTarget.y - ship.y,
          ship.aiSecondaryTarget.x - ship.x
        );
      } else if (ship.aiTarget) {
        // Continue fleeing from primary threat
        targetAngle = Math.atan2(ship.y - ship.aiTarget.y, ship.x - ship.aiTarget.x);
        const fleeImprecision = (1 - ship.aiParams.precision) * 0.4;
        targetAngle += (Math.random() - 0.5) * fleeImprecision;
      }
      break;
    case 'HUNTING':
    case 'DEFENDING_BASE':
      if (ship.aiTarget) {
        targetAngle = Math.atan2(ship.aiTarget.y - ship.y, ship.aiTarget.x - ship.x);
        // Add hunting imprecision
        const huntImprecision = (1 - ship.aiParams.precision) * 0.2;
        targetAngle += (Math.random() - 0.5) * huntImprecision;
      }
      break;
    case 'COLLECTING_LOOT':
    case 'RETURNING_TO_BASE':
      if (ship.aiTarget) {
        targetAngle = Math.atan2(ship.aiTarget.y - ship.y, ship.aiTarget.x - ship.x);
        // Add navigation imprecision
        const navImprecision = (1 - ship.aiParams.precision) * 0.15;
        targetAngle += (Math.random() - 0.5) * navImprecision;
      }
      break;
    case 'WANDERING':
      if (distance(ship, ship.wanderTarget) < 100) {
        ship.wanderTarget = getRandomPosition(GAME_WIDTH, GAME_HEIGHT);
      }
      targetAngle = Math.atan2(ship.wanderTarget.y - ship.y, ship.wanderTarget.x - ship.x);
      // Wandering has the most imprecision
      const wanderImprecision = (1 - ship.aiParams.precision) * 0.5;
      targetAngle += (Math.random() - 0.5) * wanderImprecision;
      break;
  }

  return targetAngle;
};

export const shouldAIShoot = (ship: Ship): boolean => {
  if (!ship.aiTarget || ship.aiTarget.hasOwnProperty('value')) return false; // Don't shoot at loot

  const target = ship.aiTarget as Ship;
  const huntDistance = distance(ship, target);
  const shootRange = 300 + ship.aiParams.aggression * 250;

  if (huntDistance < shootRange) {
    // Vary shooting frequency based on precision and aggression
    const shootChance = ship.aiParams.precision * 0.3 + ship.aiParams.aggression * 0.4;
    if (Math.random() < shootChance) {
      return true;
    }
  }

  return false;
};
