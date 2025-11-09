import React, { useState, useCallback, useRef, useEffect } from 'react';
import Game from './components/GameOptimized';
import StartScreen from './components/StartScreen';
import GameOverScreen from './components/GameOverScreen';
import WinScreen from './components/WinScreen';
import { GameState } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);

  const startGame = () => {
    setScore(0);
    setGameState('PLAYING');
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
    setGameState('PLAYING');
  };

  return (
    <div className="w-screen h-screen bg-black font-sans text-white select-none">
      {gameState === 'START' && <StartScreen onStart={startGame} />}
      {gameState === 'PLAYING' && <Game onGameOver={endGame} onWin={winGame} score={score} setScore={setScore} />}
      {gameState === 'GAME_OVER' && <GameOverScreen score={finalScore} onRestart={restartGame} />}
      {gameState === 'WIN' && <WinScreen score={finalScore} onRestart={restartGame} />}
    </div>
  );
};

export default App;