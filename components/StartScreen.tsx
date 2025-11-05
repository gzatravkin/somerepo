import React from 'react';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <h1 className="text-7xl font-bold text-cyan-400 drop-shadow-[0_0_15px_rgba(0,255,255,0.7)] tracking-widest mb-4">
        COSMIC CONFLICT
      </h1>
      <div className="text-center text-lg text-gray-300 max-w-lg mb-8 space-y-2">
        <p className="font-bold text-xl text-cyan-300 mb-2">GOAL: Survive for 3 minutes or grow to size 150!</p>
        <p>Your ship follows the mouse cursor. Left-click to fire.</p>
        <p>Destroy other ships, collect their loot, and upgrade at bases.</p>
        <p>Avoid larger ships and beware of powerful <span className="text-fuchsia-400 font-bold">Elite</span> enemies!</p>
      </div>
      <button
        onClick={onStart}
        className="px-10 py-4 text-2xl font-bold text-black bg-cyan-400 rounded-lg
                   hover:bg-white hover:scale-105 transition-transform duration-200
                   shadow-[0_0_20px_rgba(0,255,255,0.5)]"
      >
        START GAME
      </button>
    </div>
  );
};

export default StartScreen;