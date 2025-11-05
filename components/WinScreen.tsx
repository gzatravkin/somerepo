import React from 'react';

interface WinScreenProps {
  score: number;
  onRestart: () => void;
}

const WinScreen: React.FC<WinScreenProps> = ({ score, onRestart }) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (window.innerWidth <= 768 && 'ontouchstart' in window);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm px-4">
      <h1 className={`${isMobile ? 'text-5xl' : 'text-7xl'} font-bold text-yellow-400 drop-shadow-[0_0_15px_rgba(255,255,0,0.7)] tracking-widest mb-4 text-center`}>
        YOU WIN!
      </h1>
      <p className={`${isMobile ? 'text-xl' : 'text-3xl'} text-gray-300 mb-2`}>Your final score is</p>
      <p className={`${isMobile ? 'text-4xl' : 'text-6xl'} font-bold text-cyan-400 mb-8`}>{score}</p>
      <button
        onClick={onRestart}
        onTouchEnd={onRestart}
        className={`${isMobile ? 'px-8 py-4 text-xl' : 'px-10 py-4 text-2xl'} font-bold text-black bg-cyan-400 rounded-lg
                   active:bg-white active:scale-95 transition-transform duration-200
                   shadow-[0_0_20px_rgba(0,255,255,0.5)] min-w-[200px]`}
        style={{ touchAction: 'manipulation' }}
      >
        PLAY AGAIN
      </button>
    </div>
  );
};

export default WinScreen;
