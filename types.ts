export type GameState = 'START' | 'PLAYING' | 'GAME_OVER' | 'WIN';
export type GameMode = 'RESTAURANT' | 'EXPEDITION';

export interface Vector {
  x: number;
  y: number;
}

// Tile System
export type TileType = 'FLOOR' | 'WALL' | 'DOOR_CLOSED' | 'DOOR_OPEN' | 'ENTRANCE' | 'EXIT';

export interface Tile {
  type: TileType;
  x: number;
  y: number;
  variant?: number; // For visual variety
}

// Dungeon Structure
export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface Dungeon {
  width: number;
  height: number;
  tiles: Tile[][];
  rooms: Room[];
}

// Weapon System (Fantasy + Modern Guns)
export type WeaponType =
  // Fantasy weapons
  | 'SWORD' | 'BOW' | 'CROSSBOW' | 'STAFF' | 'DAGGER'
  // Modern weapons
  | 'PISTOL' | 'SHOTGUN' | 'RIFLE' | 'SMG' | 'SNIPER'
  // Special
  | 'MAGIC_WAND' | 'FLAMETHROWER';

export interface WeaponConfig {
  type: WeaponType;
  name: string;
  damage: number;
  fireRate: number; // ms between shots
  projectileSpeed: number;
  projectileSize: number;
  range: number;
  spreadAngle: number; // For shotgun-like weapons
  projectileCount: number; // Number of projectiles per shot
  knockback: number;
  isMelee: boolean;
  ammoType?: string;
  color: string;
}

// Entity Base
export interface Entity {
  id: string;
  x: number; // Grid position
  y: number; // Grid position
  pixelX: number; // Smooth pixel position for rendering
  pixelY: number; // Smooth pixel position for rendering
}

// Player
export interface Player extends Entity {
  health: number;
  maxHealth: number;
  weapon: WeaponType;
  inventory: FoodIngredient[];
  angle: number; // Facing direction in radians
  lastShotTime: number;
  movementCooldown: number; // Time until next grid move
}

// Enemy Types
export type EnemyType =
  // Fantasy
  | 'GOBLIN' | 'ORC' | 'SKELETON' | 'ZOMBIE' | 'DEMON'
  // Modern/mixed
  | 'SOLDIER' | 'ROBOT' | 'MUTANT' | 'CULTIST';

export interface EnemyConfig {
  type: EnemyType;
  name: string;
  health: number;
  damage: number;
  moveSpeed: number; // ms between moves
  shootSpeed: number; // ms between shots
  projectileSpeed: number;
  projectileSize: number;
  aggroRange: number; // Tiles
  color: string;
  lootTable: FoodIngredientType[];
}

export interface Enemy extends Entity {
  type: EnemyType;
  health: number;
  maxHealth: number;
  damage: number;
  moveSpeed: number;
  shootSpeed: number;
  projectileSpeed: number;
  projectileSize: number;
  aggroRange: number;
  lastMoveTime: number;
  lastShotTime: number;
  angle: number;
  state: 'IDLE' | 'CHASING' | 'ATTACKING' | 'DEAD';
  targetX?: number;
  targetY?: number;
}

// Projectiles
export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  size: number;
  color: string;
  damage: number;
  lifetime: number;
  maxLifetime: number;
  ownerId: string;
  isPlayerProjectile: boolean;
  weaponType: WeaponType;
  knockback: number;
}

// Corpse and Loot System
export type FoodIngredientType =
  // Meats
  | 'GOBLIN_MEAT' | 'ORC_MEAT' | 'DEMON_MEAT' | 'MUTANT_MEAT'
  // Parts
  | 'SKELETON_BONE' | 'ROBOT_PARTS' | 'ZOMBIE_BRAIN'
  // Misc
  | 'CULTIST_ROBE' | 'SOLDIER_RATIONS';

export interface FoodIngredient {
  type: FoodIngredientType;
  name: string;
  description: string;
  healValue: number;
  color: string;
}

export interface Corpse extends Entity {
  enemyType: EnemyType;
  loot: FoodIngredient[];
  looted: boolean;
  decayTime: number; // When it disappears
}

// Particles for effects
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
}

// Game Stats
export interface GameStats {
  enemiesKilled: number;
  itemsCollected: number;
  floor: number;
  score: number;
}

// ===== RESTAURANT SYSTEM =====

export type DishType =
  | 'GOBLIN_STEW' | 'ORC_ROAST' | 'DEMON_CURRY' | 'MUTANT_BURGER'
  | 'BONE_BROTH' | 'ROBOT_OIL_SOUP' | 'ZOMBIE_PIZZA'
  | 'CULTIST_SALAD' | 'SOLDIER_SANDWICH'
  | 'MYSTERY_MEAT_PIE' | 'FANTASY_FEAST' | 'WASTELAND_SPECIAL';

export interface Recipe {
  dish: DishType;
  name: string;
  description: string;
  ingredients: FoodIngredientType[];
  price: number; // Selling price
  prepTime: number; // Seconds to cook
  reputation: number; // Reputation gained when served
  unlocked: boolean;
}

export interface Customer {
  id: string;
  name: string;
  type: 'ADVENTURER' | 'MERCHANT' | 'NOBLE' | 'SOLDIER' | 'WIZARD';
  desiredDish: DishType | null;
  patience: number; // Seconds before they leave
  maxPatience: number;
  tip: number; // Extra payment if served quickly
  sprite: string; // Customer appearance
}

export interface RestaurantState {
  money: number;
  reputation: number;
  level: number;
  unlockedRecipes: DishType[];
  customerQueue: Customer[];
  preparedDishes: DishType[];
  upgrades: {
    tableCount: number;
    kitchenSpeed: number;
    storageSizeIncrease: number;
  };
}

export interface CookingSlot {
  recipe: Recipe | null;
  progress: number; // 0-100%
  startTime: number;
}
