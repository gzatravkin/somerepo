import { Ship, Projectile, WeaponType } from '../types';
import { WEAPON_CONFIGS } from './weapons';

const GAME_WIDTH = 4000;
const GAME_HEIGHT = 4000;

export const createAutoFireProjectile = (owner: Ship): Projectile | null => {
  const now = Date.now();
  const weaponConfig = WEAPON_CONFIGS[owner.weapon];

  if (now - owner.lastAutoFireTime < weaponConfig.autoFireRate) {
    return null;
  }

  owner.lastAutoFireTime = now;

  return {
    id: `proj-${Math.random()}-${Date.now()}`,
    x: owner.x + Math.cos(owner.angle) * owner.size,
    y: owner.y + Math.sin(owner.angle) * owner.size,
    vx: Math.cos(owner.angle) * weaponConfig.autoProjectileSpeed + owner.vx * 0.3,
    vy: Math.sin(owner.angle) * weaponConfig.autoProjectileSpeed + owner.vy * 0.3,
    ownerId: owner.id,
    size: weaponConfig.autoProjectileSize,
    color: weaponConfig.color,
    damage: weaponConfig.autoProjectileDamage * (1 + owner.upgrades.WEAPON_DAMAGE * 0.2),
    lifetime: weaponConfig.autoProjectileLifetime,
    weaponType: owner.weapon,
    isSpecial: false,
    trail: [],
    glowIntensity: 0.5,
  };
};

export const createSpecialAbilityProjectiles = (
  owner: Ship,
  allShips: Map<string, Ship>
): Projectile[] => {
  const now = Date.now();
  const weaponConfig = WEAPON_CONFIGS[owner.weapon];

  if (now - owner.lastSpecialTime < weaponConfig.specialCooldown) {
    return [];
  }

  owner.lastSpecialTime = now;

  const projectiles: Projectile[] = [];

  switch (owner.weapon) {
    case 'PULSE_LASER': {
      // Triple shot - 3 lasers in a spread
      const spreadAngles = [-0.3, 0, 0.3];
      spreadAngles.forEach((angleOffset) => {
        const angle = owner.angle + angleOffset;
        projectiles.push({
          id: `proj-${Math.random()}-${Date.now()}`,
          x: owner.x + Math.cos(angle) * owner.size,
          y: owner.y + Math.sin(angle) * owner.size,
          vx: Math.cos(angle) * (weaponConfig.autoProjectileSpeed * 1.5),
          vy: Math.sin(angle) * (weaponConfig.autoProjectileSpeed * 1.5),
          ownerId: owner.id,
          size: weaponConfig.autoProjectileSize * 1.5,
          color: weaponConfig.color,
          damage: weaponConfig.autoProjectileDamage * 2 * (1 + owner.upgrades.WEAPON_DAMAGE * 0.2),
          lifetime: weaponConfig.autoProjectileLifetime,
          weaponType: owner.weapon,
          isSpecial: true,
          specialType: 'TRIPLE_SHOT',
          trail: [],
          glowIntensity: 1.0,
        });
      });
      break;
    }

    case 'PLASMA_CANNON': {
      // Explosive blast
      projectiles.push({
        id: `proj-${Math.random()}-${Date.now()}`,
        x: owner.x + Math.cos(owner.angle) * owner.size,
        y: owner.y + Math.sin(owner.angle) * owner.size,
        vx: Math.cos(owner.angle) * 10 + owner.vx * 0.5,
        vy: Math.sin(owner.angle) * 10 + owner.vy * 0.5,
        ownerId: owner.id,
        size: 15,
        color: weaponConfig.color,
        damage: weaponConfig.autoProjectileDamage * 3 * (1 + owner.upgrades.WEAPON_DAMAGE * 0.2),
        lifetime: 100,
        weaponType: owner.weapon,
        isSpecial: true,
        specialType: 'EXPLOSIVE_BLAST',
        trail: [],
        glowIntensity: 1.2,
      });
      break;
    }

    case 'RAILGUN': {
      // Piercing shot
      projectiles.push({
        id: `proj-${Math.random()}-${Date.now()}`,
        x: owner.x + Math.cos(owner.angle) * owner.size,
        y: owner.y + Math.sin(owner.angle) * owner.size,
        vx: Math.cos(owner.angle) * 25,
        vy: Math.sin(owner.angle) * 25,
        ownerId: owner.id,
        size: 5,
        color: weaponConfig.color,
        damage: weaponConfig.autoProjectileDamage * 2.5 * (1 + owner.upgrades.WEAPON_DAMAGE * 0.2),
        lifetime: 150,
        weaponType: owner.weapon,
        isSpecial: true,
        specialType: 'PIERCING_SHOT',
        piercing: true,
        piercedShips: new Set<string>(),
        trail: [],
        glowIntensity: 1.5,
      });
      break;
    }

    case 'MISSILE_LAUNCHER': {
      // 5 Homing missiles
      const missileAngles = [-0.4, -0.2, 0, 0.2, 0.4];

      // Find nearest enemies for targeting
      const nearestEnemies: string[] = [];
      let minDist = Infinity;
      allShips.forEach((ship) => {
        if (ship.id !== owner.id) {
          const dist = Math.sqrt(
            (ship.x - owner.x) ** 2 + (ship.y - owner.y) ** 2
          );
          if (dist < minDist && nearestEnemies.length < 5) {
            nearestEnemies.push(ship.id);
          }
        }
      });

      missileAngles.forEach((angleOffset, i) => {
        const angle = owner.angle + angleOffset;
        projectiles.push({
          id: `proj-${Math.random()}-${Date.now()}`,
          x: owner.x + Math.cos(angle) * owner.size,
          y: owner.y + Math.sin(angle) * owner.size,
          vx: Math.cos(angle) * 8,
          vy: Math.sin(angle) * 8,
          ownerId: owner.id,
          size: 7,
          color: weaponConfig.color,
          damage: weaponConfig.autoProjectileDamage * 1.5 * (1 + owner.upgrades.WEAPON_DAMAGE * 0.2),
          lifetime: 200,
          weaponType: owner.weapon,
          isSpecial: true,
          specialType: 'HOMING_MISSILES',
          targetId: nearestEnemies[i % nearestEnemies.length],
          trail: [],
          glowIntensity: 0.8,
        });
      });
      break;
    }

    case 'BEAM_WEAPON': {
      // Continuous beam that tracks the ship
      projectiles.push({
        id: `proj-${Math.random()}-${Date.now()}`,
        x: owner.x,
        y: owner.y,
        vx: 0,
        vy: 0,
        ownerId: owner.id,
        size: 4,
        color: weaponConfig.color,
        damage: weaponConfig.autoProjectileDamage * 15 * (1 + owner.upgrades.WEAPON_DAMAGE * 0.2), // Total damage over lifetime
        lifetime: 120, // 2 seconds
        weaponType: owner.weapon,
        isSpecial: true,
        specialType: 'CONTINUOUS_BEAM',
        isBeam: true,
        beamLength: 600,
        trackOwner: true,
        trail: [],
        glowIntensity: 2.0,
      });
      break;
    }

    case 'QUANTUM_DISRUPTOR': {
      // Quantum burst - creates multiple projectiles in a circle
      const burstCount = 8;
      for (let i = 0; i < burstCount; i++) {
        const angle = (i / burstCount) * Math.PI * 2;
        const distance = 100;
        projectiles.push({
          id: `proj-${Math.random()}-${Date.now()}`,
          x: owner.x + Math.cos(angle) * distance,
          y: owner.y + Math.sin(angle) * distance,
          vx: Math.cos(angle) * 12,
          vy: Math.sin(angle) * 12,
          ownerId: owner.id,
          size: 6,
          color: weaponConfig.color,
          damage: weaponConfig.autoProjectileDamage * 1.8 * (1 + owner.upgrades.WEAPON_DAMAGE * 0.2),
          lifetime: 100,
          weaponType: owner.weapon,
          isSpecial: true,
          specialType: 'QUANTUM_BURST',
          trail: [],
          glowIntensity: 1.3,
        });
      }
      break;
    }

    case 'MATTER_ANNIHILATOR': {
      // Gravity well - travels then stops and pulls
      projectiles.push({
        id: `proj-${Math.random()}-${Date.now()}`,
        x: owner.x + Math.cos(owner.angle) * owner.size,
        y: owner.y + Math.sin(owner.angle) * owner.size,
        vx: Math.cos(owner.angle) * 10 + owner.vx * 0.5,
        vy: Math.sin(owner.angle) * 10 + owner.vy * 0.5,
        ownerId: owner.id,
        size: 20,
        color: weaponConfig.color,
        damage: weaponConfig.autoProjectileDamage * 0.8 * (1 + owner.upgrades.WEAPON_DAMAGE * 0.2), // DPS per frame
        lifetime: 300, // 5 seconds
        weaponType: owner.weapon,
        isSpecial: true,
        specialType: 'GRAVITY_WELL',
        pullRadius: 250,
        pullStrength: 1.5,
        stationary: false,
        stationaryTime: 30, // Becomes stationary after 30 frames
        trail: [],
        glowIntensity: 1.8,
      });
      break;
    }
  }

  return projectiles;
};

export const updateHomingMissile = (
  projectile: Projectile,
  allShips: Map<string, Ship>
): void => {
  if (!projectile.targetId || projectile.specialType !== 'HOMING_MISSILES') return;

  const target = allShips.get(projectile.targetId);
  if (!target) return;

  // Calculate angle to target
  const dx = target.x - projectile.x;
  const dy = target.y - projectile.y;
  const targetAngle = Math.atan2(dy, dx);

  // Current velocity angle
  const currentAngle = Math.atan2(projectile.vy, projectile.vx);
  const speed = Math.sqrt(projectile.vx ** 2 + projectile.vy ** 2);

  // Gradually turn towards target (homing factor)
  const turnRate = 0.1;
  let angleDiff = targetAngle - currentAngle;

  // Normalize angle difference
  if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

  const newAngle = currentAngle + angleDiff * turnRate;

  // Update velocity
  projectile.vx = Math.cos(newAngle) * (speed + 0.2); // Slight acceleration
  projectile.vy = Math.sin(newAngle) * (speed + 0.2);
};

export const applyGravityWellEffect = (
  gravityWell: Projectile,
  allShips: Map<string, Ship>,
  allProjectiles: Projectile[]
): { damagedShips: Map<string, number>, destroyedProjectiles: Set<string> } => {
  if (!gravityWell.pullRadius || !gravityWell.pullStrength) {
    return { damagedShips: new Map(), destroyedProjectiles: new Set() };
  }

  const damagedShips = new Map<string, number>();
  const destroyedProjectiles = new Set<string>();

  // Pull and damage ships
  allShips.forEach((ship) => {
    if (ship.id === gravityWell.ownerId) return;

    const dx = gravityWell.x - ship.x;
    const dy = gravityWell.y - ship.y;
    const distance = Math.sqrt(dx ** 2 + dy ** 2);

    if (distance < gravityWell.pullRadius) {
      const pullForce = gravityWell.pullStrength * (1 - distance / gravityWell.pullRadius);
      ship.vx += (dx / distance) * pullForce;
      ship.vy += (dy / distance) * pullForce;

      // Deal damage if stationary
      if (gravityWell.stationary && !ship.shieldActive) {
        damagedShips.set(ship.id, gravityWell.damage);
      }
    }
  });

  // Destroy incoming projectiles
  if (gravityWell.stationary) {
    allProjectiles.forEach((proj) => {
      if (proj.id === gravityWell.id || proj.ownerId === gravityWell.ownerId) return;

      const dx = gravityWell.x - proj.x;
      const dy = gravityWell.y - proj.y;
      const distance = Math.sqrt(dx ** 2 + dy ** 2);

      if (distance < gravityWell.pullRadius * 0.5) {
        destroyedProjectiles.add(proj.id);
      }
    });
  }

  return { damagedShips, destroyedProjectiles };
};
