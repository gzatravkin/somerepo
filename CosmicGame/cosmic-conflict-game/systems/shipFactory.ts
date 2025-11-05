import { Ship, Base, AIPersonality } from '../types';
import { getRandomColor, getRandomPosition } from '../utils/helpers';
import { getRandomWeapon } from './weapons';

const GAME_WIDTH = 4000;
const GAME_HEIGHT = 4000;
const PLAYER_ID = 'player';

export const createShip = (
  isPlayer: boolean = false,
  assignedBase: Base | null = null
): Ship => {
  const isElite = !isPlayer && Math.random() < 0.1; // 10% chance
  const size = isPlayer ? 20 : isElite ? Math.random() * 15 + 25 : Math.random() * 15 + 10;
  const nonDefenderPersonalities: AIPersonality[] = ['AGGRESSOR', 'SCAVENGER', 'WANDERER'];
  const personality: AIPersonality = isElite
    ? 'AGGRESSOR'
    : assignedBase
    ? 'DEFENDER'
    : nonDefenderPersonalities[Math.floor(Math.random() * nonDefenderPersonalities.length)];

  // Shield energy calculation: smaller ships get more uses (7 for size 20, 2 for size 60+)
  const maxShieldEnergy = Math.max(2, Math.floor(7 * (40 / Math.max(size, 20))));

  const position = getRandomPosition(GAME_WIDTH, GAME_HEIGHT);

  return {
    id: isPlayer ? PLAYER_ID : `bot-${Math.random()}-${Date.now()}`,
    x: position.x,
    y: position.y,
    vx: 0,
    vy: 0,
    angle: Math.random() * Math.PI * 2,
    size,
    color: isPlayer ? '#00BFFF' : getRandomColor(),
    isPlayer,
    lastShotTime: 0,
    lastAutoFireTime: 0,
    lastSpecialTime: 0,
    shootCooldown: isElite ? 400 : isPlayer ? 200 : 800,
    projectileDamage: size * (isElite ? 1.2 : 1),
    maxSpeed: (5 - size * 0.05) * (isElite ? 1.1 : 1),
    health: size * 5 * (isElite ? 1.5 : 1),
    maxHealth: size * 5 * (isElite ? 1.5 : 1),
    cargo: 0,
    isElite,
    weapon: isPlayer ? 'PULSE_LASER' : getRandomWeapon(), // Player starts with pulse laser
    upgrades: { FIRE_RATE: 0, SHIP_SPEED: 0, WEAPON_DAMAGE: 0 },
    // Shield properties
    shieldEnergy: maxShieldEnergy,
    maxShieldEnergy,
    shieldActive: false,
    shieldActivatedTime: 0,
    shieldCooldown: 0,
    lastShieldUse: 0,
    // Visual effects
    damageFlashTime: 0,
    engineTrail: [],
    aiState: 'WANDERING',
    aiTarget: null,
    aiSecondaryTarget: null,
    wanderTarget: getRandomPosition(GAME_WIDTH, GAME_HEIGHT),
    aiPersonality: personality,
    aiParams: {
      bravery: isElite ? 0.9 : Math.random(),
      aggression: isElite ? 0.9 : Math.random(),
      reaction: isElite ? 0.8 : Math.random() * 0.6 + 0.2,
      precision: isElite ? 0.9 : Math.random() * 0.5 + 0.3,
    },
    lastAIDecision: 0,
    aiFleeShootTimer: 0,
    assignedBase,
  };
};
