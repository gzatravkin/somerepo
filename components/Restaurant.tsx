import React, { useState, useEffect, useRef } from 'react';
import { RestaurantState, Customer, CookingSlot, FoodIngredient, DishType } from '../types';
import { RECIPES, canCookRecipe, consumeIngredients, getRecipe } from '../systems/recipes';
import { generateCustomer, updateCustomers, serveCustomer } from '../systems/customerSystem';

interface RestaurantProps {
  inventory: FoodIngredient[];
  onInventoryChange: (newInventory: FoodIngredient[]) => void;
  onStartExpedition: () => void;
  restaurantState: RestaurantState;
  onRestaurantStateChange: (newState: RestaurantState) => void;
}

const Restaurant: React.FC<RestaurantProps> = ({
  inventory,
  onInventoryChange,
  onStartExpedition,
  restaurantState,
  onRestaurantStateChange
}) => {
  const [cookingSlots, setCookingSlots] = useState<CookingSlot[]>([
    { recipe: null, progress: 0, startTime: 0 },
    { recipe: null, progress: 0, startTime: 0 }
  ]);
  const [selectedRecipe, setSelectedRecipe] = useState<DishType | null>(null);
  const [message, setMessage] = useState<string>('');
  const lastCustomerSpawn = useRef(Date.now());
  const lastFrameTime = useRef(Date.now());

  // Game loop for restaurant
  useEffect(() => {
    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = now - lastFrameTime.current;
      lastFrameTime.current = now;

      // Update cooking progress
      const updatedSlots = cookingSlots.map(slot => {
        if (slot.recipe && slot.progress < 100) {
          const elapsed = (now - slot.startTime) / 1000;
          const progress = Math.min(100, (elapsed / slot.recipe.prepTime) * 100);
          return { ...slot, progress };
        }
        return slot;
      });

      // Auto-complete finished dishes
      updatedSlots.forEach((slot, index) => {
        if (slot.recipe && slot.progress >= 100 && !restaurantState.preparedDishes.includes(slot.recipe.dish)) {
          const newState = { ...restaurantState };
          newState.preparedDishes.push(slot.recipe.dish);
          onRestaurantStateChange(newState);
          showMessage(`${slot.recipe.name} is ready!`);
          updatedSlots[index] = { recipe: null, progress: 0, startTime: 0 };
        }
      });

      setCookingSlots(updatedSlots);

      // Update customers
      const { updatedCustomers, lostCustomers } = updateCustomers(
        restaurantState.customerQueue,
        deltaTime,
        restaurantState
      );

      if (lostCustomers > 0) {
        showMessage(`${lostCustomers} customer(s) left unhappy!`);
        const newState = { ...restaurantState };
        newState.reputation = Math.max(0, newState.reputation - lostCustomers * 10);
        newState.customerQueue = updatedCustomers;
        onRestaurantStateChange(newState);
      } else if (updatedCustomers.length !== restaurantState.customerQueue.length) {
        const newState = { ...restaurantState };
        newState.customerQueue = updatedCustomers;
        onRestaurantStateChange(newState);
      }

      // Spawn new customers
      if (now - lastCustomerSpawn.current > 10000 && restaurantState.customerQueue.length < 5) {
        lastCustomerSpawn.current = now;
        const newCustomer = generateCustomer(restaurantState.unlockedRecipes);
        const newState = { ...restaurantState };
        newState.customerQueue.push(newCustomer);
        onRestaurantStateChange(newState);
      }
    };

    const intervalId = setInterval(gameLoop, 100);
    return () => clearInterval(intervalId);
  }, [cookingSlots, restaurantState, onRestaurantStateChange]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const startCooking = (dishType: DishType) => {
    const recipe = { ...getRecipe(dishType) };

    if (!canCookRecipe(recipe, inventory)) {
      showMessage('Not enough ingredients!');
      return;
    }

    const emptySlot = cookingSlots.findIndex(slot => slot.recipe === null);
    if (emptySlot === -1) {
      showMessage('All cooking slots are busy!');
      return;
    }

    // Consume ingredients
    const newInventory = consumeIngredients(recipe, inventory);
    onInventoryChange(newInventory);

    // Start cooking
    const newSlots = [...cookingSlots];
    newSlots[emptySlot] = {
      recipe,
      progress: 0,
      startTime: Date.now()
    };
    setCookingSlots(newSlots);
    showMessage(`Started cooking ${recipe.name}!`);
  };

  const serveDish = (dishType: DishType, customerIndex: number) => {
    const customer = restaurantState.customerQueue[customerIndex];
    const dishIndex = restaurantState.preparedDishes.indexOf(dishType);

    if (dishIndex === -1) {
      showMessage('Dish not prepared!');
      return;
    }

    const result = serveCustomer(customer, dishType, restaurantState);
    showMessage(result.message);

    const newState = { ...restaurantState };
    newState.preparedDishes.splice(dishIndex, 1);
    newState.customerQueue.splice(customerIndex, 1);

    if (result.success) {
      // Add payment from recipe price + tip
      const recipePrice = getRecipe(dishType).price;
      newState.money += recipePrice + result.payment;
      newState.reputation = Math.max(0, newState.reputation + result.reputationGain);

      // Check for recipe unlocks
      if (newState.reputation >= 50 && !newState.unlockedRecipes.includes('DEMON_CURRY')) {
        newState.unlockedRecipes.push('DEMON_CURRY', 'MUTANT_BURGER', 'ROBOT_OIL_SOUP');
        showMessage('New recipes unlocked!');
      }
      if (newState.reputation >= 100 && !newState.unlockedRecipes.includes('MYSTERY_MEAT_PIE')) {
        newState.unlockedRecipes.push('MYSTERY_MEAT_PIE', 'ZOMBIE_PIZZA', 'CULTIST_SALAD');
        showMessage('Advanced recipes unlocked!');
      }
      if (newState.reputation >= 200 && !newState.unlockedRecipes.includes('FANTASY_FEAST')) {
        newState.unlockedRecipes.push('FANTASY_FEAST', 'WASTELAND_SPECIAL');
        showMessage('Premium recipes unlocked!');
      }
    } else {
      newState.reputation = Math.max(0, newState.reputation + result.reputationGain);
    }

    onRestaurantStateChange(newState);
  };

  const availableRecipes = Object.values(RECIPES).filter(recipe =>
    restaurantState.unlockedRecipes.includes(recipe.dish)
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🍽️ Dungeon Delights Restaurant</h1>
        <div style={styles.stats}>
          <div style={styles.statItem}>💰 Gold: {restaurantState.money}</div>
          <div style={styles.statItem}>⭐ Reputation: {restaurantState.reputation}</div>
          <div style={styles.statItem}>📦 Ingredients: {inventory.length}</div>
        </div>
      </div>

      {/* Message banner */}
      {message && (
        <div style={styles.message}>{message}</div>
      )}

      <div style={styles.mainContent}>
        {/* Left side - Cooking & Recipes */}
        <div style={styles.leftPanel}>
          {/* Cooking Stations */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🔥 Cooking Stations</h2>
            {cookingSlots.map((slot, index) => (
              <div key={index} style={styles.cookingSlot}>
                {slot.recipe ? (
                  <>
                    <div style={styles.cookingName}>{slot.recipe.name}</div>
                    <div style={styles.progressBar}>
                      <div style={{ ...styles.progressFill, width: `${slot.progress}%` }} />
                    </div>
                    <div style={styles.progressText}>{Math.floor(slot.progress)}%</div>
                  </>
                ) : (
                  <div style={styles.emptySlot}>Empty</div>
                )}
              </div>
            ))}
          </div>

          {/* Recipe Book */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📖 Recipe Book</h2>
            <div style={styles.recipeList}>
              {availableRecipes.map(recipe => {
                const canCook = canCookRecipe(recipe, inventory);
                return (
                  <div
                    key={recipe.dish}
                    style={{
                      ...styles.recipeCard,
                      opacity: canCook ? 1 : 0.5,
                      cursor: canCook ? 'pointer' : 'not-allowed'
                    }}
                    onClick={() => canCook && startCooking(recipe.dish)}
                  >
                    <div style={styles.recipeName}>{recipe.name}</div>
                    <div style={styles.recipeDesc}>{recipe.description}</div>
                    <div style={styles.recipeIngredients}>
                      Needs: {recipe.ingredients.map(ing => ing.replace(/_/g, ' ')).join(', ')}
                    </div>
                    <div style={styles.recipeInfo}>
                      💰 {recipe.price}g | ⏱️ {recipe.prepTime}s | ⭐ +{recipe.reputation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right side - Customers & Service */}
        <div style={styles.rightPanel}>
          {/* Customer Queue */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>👥 Customers ({restaurantState.customerQueue.length}/5)</h2>
            {restaurantState.customerQueue.map((customer, index) => {
              const patiencePercent = (customer.patience / customer.maxPatience) * 100;
              return (
                <div key={customer.id} style={styles.customerCard}>
                  <div style={styles.customerInfo}>
                    <div style={styles.customerName}>{customer.name}</div>
                    <div style={styles.customerType}>{customer.type}</div>
                    {customer.desiredDish && (
                      <div style={styles.customerOrder}>
                        Wants: {getRecipe(customer.desiredDish).name}
                      </div>
                    )}
                  </div>
                  <div style={styles.patienceBar}>
                    <div style={{
                      ...styles.patienceFill,
                      width: `${patiencePercent}%`,
                      backgroundColor: patiencePercent > 50 ? '#4CAF50' : patiencePercent > 25 ? '#FFA500' : '#FF0000'
                    }} />
                  </div>
                  <div style={styles.customerButtons}>
                    {restaurantState.preparedDishes.map((dish, dishIndex) => (
                      <button
                        key={dishIndex}
                        style={styles.serveButton}
                        onClick={() => serveDish(dish, index)}
                      >
                        Serve {getRecipe(dish).name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Prepared Dishes */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🍲 Ready to Serve</h2>
            {restaurantState.preparedDishes.length === 0 ? (
              <div style={styles.emptyMessage}>No dishes ready</div>
            ) : (
              restaurantState.preparedDishes.map((dish, index) => (
                <div key={index} style={styles.dishReady}>
                  {getRecipe(dish).name}
                </div>
              ))
            )}
          </div>

          {/* Expedition Button */}
          <button style={styles.expeditionButton} onClick={onStartExpedition}>
            🗡️ Start Expedition (Collect Ingredients)
          </button>
        </div>
      </div>

      {/* Inventory Display */}
      <div style={styles.inventorySection}>
        <h3 style={styles.sectionTitle}>📦 Current Inventory</h3>
        <div style={styles.inventoryGrid}>
          {inventory.map((item, index) => (
            <div key={index} style={{ ...styles.inventoryItem, backgroundColor: item.color + '40' }}>
              {item.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100vh',
    backgroundColor: '#2A1810',
    color: '#FFF',
    fontFamily: 'Arial, sans-serif',
    overflow: 'auto',
    padding: '20px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px'
  },
  title: {
    fontSize: '32px',
    margin: '0 0 10px 0',
    color: '#FFD700'
  },
  stats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '30px',
    fontSize: '18px'
  },
  statItem: {
    padding: '10px 20px',
    backgroundColor: '#3A2820',
    borderRadius: '8px'
  },
  message: {
    textAlign: 'center',
    padding: '15px',
    backgroundColor: '#4CAF50',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  mainContent: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px'
  },
  leftPanel: {
    flex: 1
  },
  rightPanel: {
    flex: 1
  },
  section: {
    backgroundColor: '#3A2820',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '20px',
    marginTop: '0',
    marginBottom: '15px',
    color: '#FFD700'
  },
  cookingSlot: {
    backgroundColor: '#4A3830',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '10px'
  },
  cookingName: {
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  progressBar: {
    width: '100%',
    height: '20px',
    backgroundColor: '#2A1810',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '5px'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    transition: 'width 0.3s'
  },
  progressText: {
    textAlign: 'right',
    fontSize: '12px'
  },
  emptySlot: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic'
  },
  recipeList: {
    maxHeight: '400px',
    overflowY: 'auto'
  },
  recipeCard: {
    backgroundColor: '#4A3830',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '10px',
    border: '2px solid transparent',
    transition: 'all 0.2s'
  },
  recipeName: {
    fontWeight: 'bold',
    fontSize: '16px',
    marginBottom: '5px'
  },
  recipeDesc: {
    fontSize: '12px',
    color: '#CCC',
    marginBottom: '5px'
  },
  recipeIngredients: {
    fontSize: '11px',
    color: '#AAA',
    marginBottom: '5px'
  },
  recipeInfo: {
    fontSize: '12px',
    color: '#FFD700'
  },
  customerCard: {
    backgroundColor: '#4A3830',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '10px'
  },
  customerInfo: {
    marginBottom: '10px'
  },
  customerName: {
    fontWeight: 'bold',
    fontSize: '16px'
  },
  customerType: {
    fontSize: '12px',
    color: '#AAA'
  },
  customerOrder: {
    fontSize: '14px',
    color: '#FFD700',
    marginTop: '5px'
  },
  patienceBar: {
    width: '100%',
    height: '10px',
    backgroundColor: '#2A1810',
    borderRadius: '5px',
    overflow: 'hidden',
    marginBottom: '10px'
  },
  patienceFill: {
    height: '100%',
    transition: 'width 1s, background-color 0.3s'
  },
  customerButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  serveButton: {
    padding: '5px 10px',
    backgroundColor: '#4CAF50',
    color: '#FFF',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  dishReady: {
    backgroundColor: '#4A3830',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '5px',
    textAlign: 'center'
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic'
  },
  expeditionButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#FF6347',
    color: '#FFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '20px'
  },
  inventorySection: {
    backgroundColor: '#3A2820',
    borderRadius: '8px',
    padding: '15px'
  },
  inventoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '10px'
  },
  inventoryItem: {
    padding: '10px',
    borderRadius: '5px',
    textAlign: 'center',
    fontSize: '12px'
  }
};

export default Restaurant;
