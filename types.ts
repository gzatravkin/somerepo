export type GameState = 'START' | 'PLAYING' | 'GAME_OVER' | 'WIN';

export interface Vector {
  x: number;
  y: number;
}

export interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
  size: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  lifetime: number;
  maxLifetime: number;
  type: 'spark' | 'smoke' | 'glow' | 'debris';
}

export type AIState = 'HUNTING' | 'FLEEING' | 'WANDERING' | 'COLLECTING_LOOT' | 'RETURNING_TO_BASE' | 'DEFENDING_BASE' | 'FLEEING_AND_SHOOTING';
export type AIPersonality = 'AGGRESSOR' | 'SCAVENGER' | 'DEFENDER' | 'WANDERER';
export type UpgradeType = 'FIRE_RATE' | 'SHIP_SPEED' | 'WEAPON_DAMAGE';

// Weapon System (simplified for current game)
export type WeaponType = 'BULLET' | 'CANNON' | 'PULSE_LASER' | 'PLASMA_CANNON' | 'RAILGUN' | 'MISSILE_LAUNCHER' | 'BEAM_WEAPON' | 'QUANTUM_DISRUPTOR' | 'MATTER_ANNIHILATOR';

export interface WeaponConfig {
  type: WeaponType;
  name: string;
  autoFireRate: number; // ms between auto shots
  specialCooldown: number; // ms between special abilities
  autoProjectileSpeed: number;
  autoProjectileSize: number;
  autoProjectileDamage: number;
  autoProjectileLifetime: number;
  specialDescription: string;
  color: string;
  glowColor: string;
}

export type SpecialAbilityType =
  | 'TRIPLE_SHOT'
  | 'EXPLOSIVE_BLAST'
  | 'PIERCING_SHOT'
  | 'HOMING_MISSILES'
  | 'CONTINUOUS_BEAM'
  | 'QUANTUM_BURST'
  | 'GRAVITY_WELL';

export interface Ship {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  size: number;
  color: string;
  isPlayer: boolean;
  lastShotTime: number;
  lastAutoFireTime: number;
  lastSpecialTime: number;
  shootCooldown: number;
  projectileDamage: number;
  maxSpeed: number;
  health: number;
  maxHealth: number;
  cargo: number;
  isElite: boolean;
  weapon: WeaponType;
  upgrades: {
    [key in UpgradeType]: number;
  };
  // Shield properties
  shieldEnergy: number;
  maxShieldEnergy: number;
  shieldActive: boolean;
  shieldActivatedTime: number;
  shieldCooldown: number;
  lastShieldUse: number;
  // Visual effects
  damageFlashTime: number;
  engineTrail: TrailPoint[];
  // AI-specific properties
  aiState: AIState;
  aiTarget: Ship | Loot | Base | null;
  aiSecondaryTarget: Ship | null; // For shooting while fleeing
  wanderTarget: Vector;
  aiPersonality: AIPersonality;
  aiParams: {
    bravery: number; // 0-1, likelihood to attack bigger ships
    aggression: number; // 0-1, how close to get/how often to shoot
    reaction: number; // 0-1, how quickly they react/change behavior
    precision: number; // 0-1, how accurate their movements/shots are
  };
  lastAIDecision: number; // Time of last major AI decision
  aiFleeShootTimer: number; // Timer for coordinating flee and shoot
  assignedBase: Base | null; // For defenders
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ownerId: string;
  size: number;
  color: string;
  damage: number;
  lifetime: number;
  weaponType: WeaponType;
  isSpecial: boolean;
  specialType?: SpecialAbilityType;
  // Visual effects
  trail: TrailPoint[];
  glowIntensity: number;
  // For homing missiles
  targetId?: string;
  // For piercing shots
  piercing?: boolean;
  piercedShips?: Set<string>;
  // For beams
  isBeam?: boolean;
  beamLength?: number;
  // For gravity wells
  pullRadius?: number;
  pullStrength?: number;
  stationary?: boolean;
  stationaryTime?: number;
  // For beams that track owner
  trackOwner?: boolean;
}

export interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  layer: number;
}

export interface Explosion {
  id: string;
  x: number;
  y: number;
  ownerId: string;
  radius: number;
  maxRadius: number;
  damage: number;
  lifetime: number;
  maxLifetime: number;
  damageDealt: boolean;
}

export interface Loot {
  id: string;
  x: number;
  y: number;
  value: number;
  radius: number;
}

export interface Base {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  upgradeType: UpgradeType;
  pulsePhase: number;
  rotationAngle: number;
}