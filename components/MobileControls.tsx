import React, { useEffect, useRef, useState } from 'react';

interface MobileControlsProps {
  onJoystickMove: (angle: number | null, distance: number) => void;
  onShoot: () => void;
  onShield: () => void;
  shieldEnergy: number;
  maxShieldEnergy: number;
}

const MobileControls: React.FC<MobileControlsProps> = ({
  onJoystickMove,
  onShoot,
  onShield,
  shieldEnergy,
  maxShieldEnergy,
}) => {
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const joystickTouchId = useRef<number | null>(null);
  const shootTouchId = useRef<number | null>(null);

  const JOYSTICK_RADIUS = 50;
  const JOYSTICK_MAX_DISTANCE = 40;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      Array.from(e.changedTouches).forEach((touch) => {
        const target = touch.target as HTMLElement;

        // Handle joystick touch
        if (joystickBaseRef.current?.contains(target) && joystickTouchId.current === null) {
          e.preventDefault();
          joystickTouchId.current = touch.identifier;
          setJoystickActive(true);
          updateJoystickPosition(touch);
        }
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      Array.from(e.changedTouches).forEach((touch) => {
        // Update joystick position
        if (touch.identifier === joystickTouchId.current) {
          e.preventDefault();
          updateJoystickPosition(touch);
        }
      });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      Array.from(e.changedTouches).forEach((touch) => {
        // Release joystick
        if (touch.identifier === joystickTouchId.current) {
          e.preventDefault();
          joystickTouchId.current = null;
          setJoystickActive(false);
          setJoystickPosition({ x: 0, y: 0 });
          onJoystickMove(null, 0);
        }

        // Release shoot button
        if (touch.identifier === shootTouchId.current) {
          shootTouchId.current = null;
        }
      });
    };

    const updateJoystickPosition = (touch: Touch) => {
      if (!joystickBaseRef.current) return;

      const rect = joystickBaseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = touch.clientX - centerX;
      const dy = touch.clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      const clampedDistance = Math.min(distance, JOYSTICK_MAX_DISTANCE);
      const x = Math.cos(angle) * clampedDistance;
      const y = Math.sin(angle) * clampedDistance;

      setJoystickPosition({ x, y });
      onJoystickMove(angle, clampedDistance / JOYSTICK_MAX_DISTANCE);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [onJoystickMove]);

  const handleShootTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (shootTouchId.current === null && e.touches.length > 0) {
      shootTouchId.current = e.touches[0].identifier;
    }
  };

  const handleShootTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (shootTouchId.current !== null) {
      onShoot();
      shootTouchId.current = null;
    }
  };

  const handleShieldTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    onShield();
  };

  return (
    <div className="mobile-controls pointer-events-none">
      {/* Virtual Joystick */}
      <div
        ref={joystickBaseRef}
        className="fixed bottom-4 left-4 z-50 pointer-events-auto"
        style={{
          width: `${JOYSTICK_RADIUS * 2}px`,
          height: `${JOYSTICK_RADIUS * 2}px`,
        }}
      >
        {/* Joystick Base */}
        <div
          className="absolute inset-0 rounded-full border-3 border-white/40 bg-black/20"
          style={{
            backdropFilter: 'blur(5px)',
          }}
        />

        {/* Joystick Stick */}
        <div
          className="absolute rounded-full bg-white/80 border-2 border-white shadow-lg"
          style={{
            width: '40px',
            height: '40px',
            left: `${JOYSTICK_RADIUS - 20 + joystickPosition.x}px`,
            top: `${JOYSTICK_RADIUS - 20 + joystickPosition.y}px`,
            boxShadow: joystickActive ? '0 0 15px rgba(255, 255, 255, 0.8)' : '0 2px 4px rgba(0,0,0,0.3)',
          }}
        />

        {/* Joystick Label */}
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-white text-xs font-bold whitespace-nowrap"
             style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
          MOVE
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-auto">
        {/* Shoot Button */}
        <button
          onTouchStart={handleShootTouchStart}
          onTouchEnd={handleShootTouchEnd}
          className="w-16 h-16 rounded-full bg-red-600/80 border-3 border-red-300 active:bg-red-700 active:scale-90 transition-all flex items-center justify-center text-white font-bold shadow-lg"
          style={{
            touchAction: 'none',
          }}
        >
          <div className="flex flex-col items-center leading-tight">
            <div className="text-xl">🔫</div>
            <div className="text-[10px]">FIRE</div>
          </div>
        </button>

        {/* Shield Button */}
        <button
          onTouchStart={handleShieldTouch}
          disabled={shieldEnergy < 1}
          className={`w-16 h-16 rounded-full border-3 active:scale-90 transition-all flex items-center justify-center text-white font-bold shadow-lg ${
            shieldEnergy >= 1
              ? 'bg-blue-600/80 border-blue-300 active:bg-blue-700'
              : 'bg-gray-600/50 border-gray-400 opacity-40'
          }`}
          style={{
            touchAction: 'none',
          }}
        >
          <div className="flex flex-col items-center leading-tight">
            <div className="text-xl">🛡️</div>
            <div className="text-[10px]">SHIELD</div>
            <div className="text-[10px] font-bold">{Math.floor(shieldEnergy)}</div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default MobileControls;
