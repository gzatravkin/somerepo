import React from 'react';

interface WinScreenProps {
  score: number;
  onRestart: () => void;
}

const WinScreen: React.FC<WinScreenProps> = ({ score, onRestart }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <h1 className="text-7xl font-bold text-yellow-400 drop-shadow-[0_0_15px_rgba(255,255,0,0.7)] tracking-widest mb-4">
        YOU WIN!
      </h1>
      <p className="text-3xl text-gray-300 mb-2">Your final score is</p>
      <p className="text-6xl font-bold text-cyan-400 mb-8">{score}</p>
      <button
        onClick={onRestart}
        className="px-10 py-4 text-2xl font-bold text-black bg-cyan-400 rounded-lg
                   hover:bg-white hover:scale-105 transition-transform duration-200
                   shadow-[0_0_20px_rgba(0,255,255,0.5)]"
      >
        PLAY AGAIN
      </button>
    </div>
  );
};

export default WinScreen;
