import { EnemyType, EnemyConfig, FoodIngredientType } from '../types';

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  // === FANTASY ENEMIES ===
  GOBLIN: {
    type: 'GOBLIN',
    name: 'Goblin',
    health: 30,
    damage: 10,
    moveSpeed: 400,
    shootSpeed: 1500,
    projectileSpeed: 4,
    projectileSize: 4,
    aggroRange: 8,
    color: '#228B22',
    lootTable: ['GOBLIN_MEAT']
  },
  ORC: {
    type: 'ORC',
    name: 'Orc',
    health: 60,
    damage: 18,
    moveSpeed: 600,
    shootSpeed: 2000,
    projectileSpeed: 5,
    projectileSize: 6,
    aggroRange: 10,
    color: '#2F4F2F',
    lootTable: ['ORC_MEAT', 'ORC_MEAT']
  },
  SKELETON: {
    type: 'SKELETON',
    name: 'Skeleton',
    health: 25,
    damage: 12,
    moveSpeed: 350,
    shootSpeed: 1200,
    projectileSpeed: 6,
    projectileSize: 3,
    aggroRange: 12,
    color: '#F5F5DC',
    lootTable: ['SKELETON_BONE', 'SKELETON_BONE']
  },
  ZOMBIE: {
    type: 'ZOMBIE',
    name: 'Zombie',
    health: 40,
    damage: 15,
    moveSpeed: 800,
    shootSpeed: 3000,
    projectileSpeed: 3,
    projectileSize: 5,
    aggroRange: 6,
    color: '#556B2F',
    lootTable: ['ZOMBIE_BRAIN']
  },
  DEMON: {
    type: 'DEMON',
    name: 'Demon',
    health: 100,
    damage: 25,
    moveSpeed: 300,
    shootSpeed: 1000,
    projectileSpeed: 8,
    projectileSize: 8,
    aggroRange: 15,
    color: '#8B0000',
    lootTable: ['DEMON_MEAT', 'DEMON_MEAT', 'DEMON_MEAT']
  },

  // === MODERN/MIXED ENEMIES ===
  SOLDIER: {
    type: 'SOLDIER',
    name: 'Soldier',
    health: 50,
    damage: 20,
    moveSpeed: 400,
    shootSpeed: 800,
    projectileSpeed: 12,
    projectileSize: 3,
    aggroRange: 15,
    color: '#4B5320',
    lootTable: ['SOLDIER_RATIONS', 'SOLDIER_RATIONS']
  },
  ROBOT: {
    type: 'ROBOT',
    name: 'Combat Robot',
    health: 70,
    damage: 22,
    moveSpeed: 300,
    shootSpeed: 600,
    projectileSpeed: 15,
    projectileSize: 4,
    aggroRange: 20,
    color: '#708090',
    lootTable: ['ROBOT_PARTS', 'ROBOT_PARTS']
  },
  MUTANT: {
    type: 'MUTANT',
    name: 'Mutant',
    health: 55,
    damage: 16,
    moveSpeed: 350,
    shootSpeed: 1400,
    projectileSpeed: 7,
    projectileSize: 5,
    aggroRange: 12,
    color: '#9370DB',
    lootTable: ['MUTANT_MEAT', 'MUTANT_MEAT']
  },
  CULTIST: {
    type: 'CULTIST',
    name: 'Cultist',
    health: 35,
    damage: 14,
    moveSpeed: 450,
    shootSpeed: 1100,
    projectileSpeed: 6,
    projectileSize: 6,
    aggroRange: 14,
    color: '#800080',
    lootTable: ['CULTIST_ROBE']
  }
};

export function getEnemyConfig(type: EnemyType): EnemyConfig {
  return ENEMY_CONFIGS[type];
}

export function getRandomEnemyType(): EnemyType {
  const types: EnemyType[] = [
    'GOBLIN', 'ORC', 'SKELETON', 'ZOMBIE', 'DEMON',
    'SOLDIER', 'ROBOT', 'MUTANT', 'CULTIST'
  ];
  return types[Math.floor(Math.random() * types.length)];
}
