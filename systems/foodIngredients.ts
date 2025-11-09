import { FoodIngredient, FoodIngredientType } from '../types';

export const FOOD_INGREDIENTS: Record<FoodIngredientType, FoodIngredient> = {
  // === MEATS ===
  GOBLIN_MEAT: {
    type: 'GOBLIN_MEAT',
    name: 'Goblin Meat',
    description: 'Stringy but nutritious meat from a goblin',
    healValue: 15,
    color: '#90EE90'
  },
  ORC_MEAT: {
    type: 'ORC_MEAT',
    name: 'Orc Meat',
    description: 'Tough, gamey meat. Better cooked.',
    healValue: 25,
    color: '#3CB371'
  },
  DEMON_MEAT: {
    type: 'DEMON_MEAT',
    name: 'Demon Meat',
    description: 'Fiery meat that burns going down. Very powerful.',
    healValue: 40,
    color: '#DC143C'
  },
  MUTANT_MEAT: {
    type: 'MUTANT_MEAT',
    name: 'Mutant Meat',
    description: 'Questionable meat with strange properties',
    healValue: 20,
    color: '#9370DB'
  },

  // === PARTS ===
  SKELETON_BONE: {
    type: 'SKELETON_BONE',
    name: 'Skeleton Bone',
    description: 'Can be ground into bone meal for soup',
    healValue: 10,
    color: '#F5F5DC'
  },
  ROBOT_PARTS: {
    type: 'ROBOT_PARTS',
    name: 'Robot Parts',
    description: 'Mechanical components. Maybe edible...?',
    healValue: 5,
    color: '#708090'
  },
  ZOMBIE_BRAIN: {
    type: 'ZOMBIE_BRAIN',
    name: 'Zombie Brain',
    description: 'Disgusting but surprisingly effective',
    healValue: 18,
    color: '#8FBC8F'
  },

  // === MISC ===
  CULTIST_ROBE: {
    type: 'CULTIST_ROBE',
    name: 'Cultist Robe',
    description: 'Can be torn into bandages',
    healValue: 12,
    color: '#800080'
  },
  SOLDIER_RATIONS: {
    type: 'SOLDIER_RATIONS',
    name: 'Soldier Rations',
    description: 'Military MRE. Tastes terrible but very effective.',
    healValue: 30,
    color: '#4B5320'
  }
};

export function getFoodIngredient(type: FoodIngredientType): FoodIngredient {
  return FOOD_INGREDIENTS[type];
}
