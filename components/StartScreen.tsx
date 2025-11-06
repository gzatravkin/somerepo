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
      <div className={`text-center ${isMobile ? 'text-xs' : 'text-lg'} text-gray-300 max-w-lg mb-6 space-y-1 px-4`}>
        <p className={`font-bold ${isMobile ? 'text-sm' : 'text-xl'} text-cyan-300 mb-1`}>
          GOAL: Survive for 3 minutes or grow to size 150!
        </p>
        <p>{isMobile ? 'Use joystick to move, fire button to shoot, shield button for defense.' : 'Your ship follows the mouse cursor. Left-click to fire.'}</p>
        <p className={isMobile ? 'text-xs' : ''}>Destroy ships, collect loot, and upgrade at colored bases.</p>
        <p className={isMobile ? 'text-xs' : ''}>Weapons upgrade automatically as you grow larger!</p>
        <p className={isMobile ? 'text-xs' : ''}>Avoid larger ships and <span className="text-fuchsia-400 font-bold">Elite</span> enemies!</p>
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