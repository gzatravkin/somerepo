import React from 'react';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (window.innerWidth <= 768 && 'ontouchstart' in window);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm px-4">
      <h1 className={`${isMobile ? 'text-4xl sm:text-5xl' : 'text-7xl'} font-bold text-cyan-400 drop-shadow-[0_0_15px_rgba(0,255,255,0.7)] tracking-widest mb-4 text-center`}>
        COSMIC CONFLICT
      </h1>
      <div className={`text-center ${isMobile ? 'text-sm' : 'text-lg'} text-gray-300 max-w-lg mb-8 space-y-2 px-4`}>
        <p className={`font-bold ${isMobile ? 'text-base' : 'text-xl'} text-cyan-300 mb-2`}>
          GOAL: Survive for 3 minutes or grow to size 150!
        </p>
        <p>{isMobile ? 'Use joystick to move, buttons to fire and shield.' : 'Your ship follows the mouse cursor. Left-click to fire.'}</p>
        <p>Destroy other ships, collect their loot, and upgrade at bases.</p>
        <p>Avoid larger ships and beware of powerful <span className="text-fuchsia-400 font-bold">Elite</span> enemies!</p>
      </div>
      <button
        onClick={onStart}
        onTouchEnd={onStart}
        className={`${isMobile ? 'px-8 py-4 text-xl' : 'px-10 py-4 text-2xl'} font-bold text-black bg-cyan-400 rounded-lg
                   active:bg-white active:scale-95 transition-transform duration-200
                   shadow-[0_0_20px_rgba(0,255,255,0.5)] min-w-[200px]`}
        style={{ touchAction: 'manipulation' }}
      >
        START GAME
      </button>
    </div>
  );
};

export default StartScreen;