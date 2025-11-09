import React, { useState, useCallback } from 'react';
import Game from './components/GameOptimized';
import Restaurant from './components/Restaurant';
import StartScreen from './components/StartScreen';
import GameOverScreen from './components/GameOverScreen';
import WinScreen from './components/WinScreen';
import { GameState, GameMode, FoodIngredient, RestaurantState, DishType } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('START');
  const [gameMode, setGameMode] = useState<GameMode>('RESTAURANT');
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);

  // Persistent inventory between modes
  const [persistentInventory, setPersistentInventory] = useState<FoodIngredient[]>([]);

  // Restaurant state
  const [restaurantState, setRestaurantState] = useState<RestaurantState>({
    money: 100,
    reputation: 0,
    level: 1,
    unlockedRecipes: ['GOBLIN_STEW', 'ORC_ROAST', 'BONE_BROTH', 'SOLDIER_SANDWICH'] as DishType[],
    customerQueue: [],
    preparedDishes: [],
    upgrades: {
      tableCount: 2,
      kitchenSpeed: 1,
      storageSizeIncrease: 0
    }
  });

  const startGame = () => {
    setScore(0);
    setGameState('PLAYING');
    setGameMode('RESTAURANT');
  };

  const startExpedition = () => {
    setGameMode('EXPEDITION');
  };

  const returnToRestaurant = (newInventory: FoodIngredient[]) => {
    // Combine existing inventory with expedition loot
    setPersistentInventory([...persistentInventory, ...newInventory]);
    setGameMode('RESTAURANT');
  };

  const endGame = useCallback((currentScore: number) => {
    setFinalScore(currentScore);
    setGameState('GAME_OVER');
  }, []);

  const winGame = useCallback((currentScore: number) => {
    setFinalScore(currentScore);
    setGameState('WIN');
  }, []);

  const restartGame = () => {
    setScore(0);
    setPersistentInventory([]);
    setRestaurantState({
      money: 100,
      reputation: 0,
      level: 1,
      unlockedRecipes: ['GOBLIN_STEW', 'ORC_ROAST', 'BONE_BROTH', 'SOLDIER_SANDWICH'] as DishType[],
      customerQueue: [],
      preparedDishes: [],
      upgrades: {
        tableCount: 2,
        kitchenSpeed: 1,
        storageSizeIncrease: 0
      }
    });
    setGameState('PLAYING');
    setGameMode('RESTAURANT');
  };

  return (
    <div className="w-screen h-screen bg-black font-sans text-white select-none">
      {gameState === 'START' && <StartScreen onStart={startGame} />}

      {gameState === 'PLAYING' && gameMode === 'RESTAURANT' && (
        <Restaurant
          inventory={persistentInventory}
          onInventoryChange={setPersistentInventory}
          onStartExpedition={startExpedition}
          restaurantState={restaurantState}
          onRestaurantStateChange={setRestaurantState}
        />
      )}

      {gameState === 'PLAYING' && gameMode === 'EXPEDITION' && (
        <Game
          onGameOver={endGame}
          onWin={winGame}
          onReturnToRestaurant={returnToRestaurant}
          score={score}
          setScore={setScore}
        />
      )}

      {gameState === 'GAME_OVER' && <GameOverScreen score={finalScore} onRestart={restartGame} />}
      {gameState === 'WIN' && <WinScreen score={finalScore} onRestart={restartGame} />}
    </div>
  );
};

export default App;
