import { Customer, DishType, RestaurantState } from '../types';

const CUSTOMER_NAMES = [
  'Grok the Brave', 'Lady Elara', 'Merchant Tobias', 'Sir Roland', 'Wizard Aldric',
  'Captain Morgan', 'Scout Vera', 'Alchemist Zara', 'Bard Finnegan', 'Thief Raven',
  'Paladin Gareth', 'Ranger Sylvia', 'Blacksmith Doran', 'Priestess Luna', 'Assassin Kael'
];

export function generateCustomer(unlockedRecipes: DishType[]): Customer {
  const types: Customer['type'][] = ['ADVENTURER', 'MERCHANT', 'NOBLE', 'SOLDIER', 'WIZARD'];
  const type = types[Math.floor(Math.random() * types.length)];

  // Customer preferences based on type
  let patienceMultiplier = 1;
  let tipMultiplier = 1;

  switch (type) {
    case 'NOBLE':
      patienceMultiplier = 0.7; // Less patient
      tipMultiplier = 2.0; // Generous tips
      break;
    case 'SOLDIER':
      patienceMultiplier = 1.3; // More patient
      tipMultiplier = 0.8; // Smaller tips
      break;
    case 'WIZARD':
      patienceMultiplier = 1.5; // Very patient
      tipMultiplier = 1.5; // Good tips
      break;
    case 'MERCHANT':
      patienceMultiplier = 1.0;
      tipMultiplier = 1.2;
      break;
    case 'ADVENTURER':
      patienceMultiplier = 1.2;
      tipMultiplier = 1.0;
      break;
  }

  const maxPatience = Math.floor((30 + Math.random() * 30) * patienceMultiplier);
  const desiredDish = unlockedRecipes.length > 0
    ? unlockedRecipes[Math.floor(Math.random() * unlockedRecipes.length)]
    : null;

  return {
    id: `customer-${Date.now()}-${Math.random()}`,
    name: CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)],
    type,
    desiredDish,
    patience: maxPatience,
    maxPatience,
    tip: Math.floor((10 + Math.random() * 20) * tipMultiplier),
    sprite: type.toLowerCase()
  };
}

export function updateCustomers(
  customers: Customer[],
  deltaTime: number,
  restaurantState: RestaurantState
): { updatedCustomers: Customer[]; lostCustomers: number } {
  let lostCustomers = 0;
  const updatedCustomers = customers.map(customer => {
    const updated = { ...customer };
    updated.patience -= deltaTime / 1000; // Convert ms to seconds

    return updated;
  }).filter(customer => {
    if (customer.patience <= 0) {
      lostCustomers++;
      return false;
    }
    return true;
  });

  return { updatedCustomers, lostCustomers };
}

export function serveCustomer(
  customer: Customer,
  dish: DishType,
  restaurantState: RestaurantState
): {
  success: boolean;
  payment: number;
  reputationGain: number;
  message: string;
} {
  if (customer.desiredDish !== dish) {
    return {
      success: false,
      payment: 0,
      reputationGain: -5,
      message: `${customer.name} didn't want that dish!`
    };
  }

  // Calculate payment based on patience remaining
  const patiencePercent = customer.patience / customer.maxPatience;
  const tip = patiencePercent > 0.7 ? customer.tip : 0;

  return {
    success: true,
    payment: tip,
    reputationGain: patiencePercent > 0.7 ? 10 : 5,
    message: patiencePercent > 0.7
      ? `${customer.name} is very satisfied! +${tip} gold tip!`
      : `${customer.name} is satisfied.`
  };
}
