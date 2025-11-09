import { Recipe, DishType } from '../types';

export const RECIPES: Record<DishType, Recipe> = {
  // Single ingredient dishes (starter recipes)
  GOBLIN_STEW: {
    dish: 'GOBLIN_STEW',
    name: 'Goblin Stew',
    description: 'A hearty stew made from goblin meat',
    ingredients: ['GOBLIN_MEAT', 'GOBLIN_MEAT'],
    price: 20,
    prepTime: 5,
    reputation: 5,
    unlocked: true
  },
  ORC_ROAST: {
    dish: 'ORC_ROAST',
    name: 'Orc Roast',
    description: 'Tough but filling roasted orc meat',
    ingredients: ['ORC_MEAT', 'ORC_MEAT'],
    price: 35,
    prepTime: 8,
    reputation: 8,
    unlocked: true
  },
  BONE_BROTH: {
    dish: 'BONE_BROTH',
    name: 'Bone Broth',
    description: 'Nutritious broth made from skeleton bones',
    ingredients: ['SKELETON_BONE', 'SKELETON_BONE'],
    price: 15,
    prepTime: 4,
    reputation: 4,
    unlocked: true
  },
  SOLDIER_SANDWICH: {
    dish: 'SOLDIER_SANDWICH',
    name: 'Soldier Sandwich',
    description: 'Military rations repurposed into a sandwich',
    ingredients: ['SOLDIER_RATIONS'],
    price: 30,
    prepTime: 3,
    reputation: 6,
    unlocked: true
  },

  // Advanced recipes (2-3 ingredients)
  DEMON_CURRY: {
    dish: 'DEMON_CURRY',
    name: 'Demon Curry',
    description: 'Spicy curry with demon meat - sets your mouth on fire!',
    ingredients: ['DEMON_MEAT', 'GOBLIN_MEAT'],
    price: 60,
    prepTime: 10,
    reputation: 15,
    unlocked: false
  },
  MUTANT_BURGER: {
    dish: 'MUTANT_BURGER',
    name: 'Mutant Burger',
    description: 'Questionable burger with strange properties',
    ingredients: ['MUTANT_MEAT', 'SOLDIER_RATIONS'],
    price: 40,
    prepTime: 6,
    reputation: 10,
    unlocked: false
  },
  ROBOT_OIL_SOUP: {
    dish: 'ROBOT_OIL_SOUP',
    name: 'Robot Oil Soup',
    description: 'Surprisingly tasty mechanical broth',
    ingredients: ['ROBOT_PARTS', 'SKELETON_BONE'],
    price: 25,
    prepTime: 7,
    reputation: 7,
    unlocked: false
  },
  ZOMBIE_PIZZA: {
    dish: 'ZOMBIE_PIZZA',
    name: 'Zombie Pizza',
    description: 'You don\'t want to know what\'s on this pizza',
    ingredients: ['ZOMBIE_BRAIN', 'GOBLIN_MEAT'],
    price: 45,
    prepTime: 9,
    reputation: 12,
    unlocked: false
  },
  CULTIST_SALAD: {
    dish: 'CULTIST_SALAD',
    name: 'Cultist Salad',
    description: 'Mystical salad wrapped in cultist robes',
    ingredients: ['CULTIST_ROBE', 'SKELETON_BONE'],
    price: 35,
    prepTime: 5,
    reputation: 9,
    unlocked: false
  },

  // Premium recipes (3+ ingredients)
  MYSTERY_MEAT_PIE: {
    dish: 'MYSTERY_MEAT_PIE',
    name: 'Mystery Meat Pie',
    description: 'Best not to ask what\'s inside',
    ingredients: ['GOBLIN_MEAT', 'ORC_MEAT', 'MUTANT_MEAT'],
    price: 80,
    prepTime: 12,
    reputation: 20,
    unlocked: false
  },
  FANTASY_FEAST: {
    dish: 'FANTASY_FEAST',
    name: 'Fantasy Feast',
    description: 'A grand meal fit for heroes',
    ingredients: ['DEMON_MEAT', 'ORC_MEAT', 'SKELETON_BONE', 'GOBLIN_MEAT'],
    price: 120,
    prepTime: 15,
    reputation: 30,
    unlocked: false
  },
  WASTELAND_SPECIAL: {
    dish: 'WASTELAND_SPECIAL',
    name: 'Wasteland Special',
    description: 'Post-apocalyptic fusion cuisine',
    ingredients: ['ROBOT_PARTS', 'MUTANT_MEAT', 'SOLDIER_RATIONS'],
    price: 100,
    prepTime: 13,
    reputation: 25,
    unlocked: false
  }
};

export function getRecipe(dish: DishType): Recipe {
  return RECIPES[dish];
}

export function canCookRecipe(recipe: Recipe, inventory: any[]): boolean {
  const ingredientCounts = new Map<string, number>();

  // Count available ingredients
  for (const item of inventory) {
    const count = ingredientCounts.get(item.type) || 0;
    ingredientCounts.set(item.type, count + 1);
  }

  // Check if we have enough of each ingredient
  for (const ingredient of recipe.ingredients) {
    const available = ingredientCounts.get(ingredient) || 0;
    const needed = recipe.ingredients.filter(i => i === ingredient).length;
    if (available < needed) {
      return false;
    }
  }

  return true;
}

export function consumeIngredients(recipe: Recipe, inventory: any[]): any[] {
  const newInventory = [...inventory];
  const ingredientsNeeded = [...recipe.ingredients];

  for (const ingredient of ingredientsNeeded) {
    const index = newInventory.findIndex(item => item.type === ingredient);
    if (index !== -1) {
      newInventory.splice(index, 1);
    }
  }

  return newInventory;
}
