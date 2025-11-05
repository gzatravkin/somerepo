import React from 'react';
import { Explosion } from '../../types';

interface SVGExplosionProps {
  explosion: Explosion;
  cameraX: number;
  cameraY: number;
}

const SVGExplosion: React.FC<SVGExplosionProps> = React.memo(({ explosion, cameraX, cameraY }) => {
  const screenX = explosion.x + cameraX;
  const screenY = explosion.y + cameraY;
  const progress = 1 - explosion.lifetime / explosion.maxLifetime;
  const opacity = 1 - progress;

  return (
    <g transform={`translate(${screenX}, ${screenY})`} opacity={opacity}>
      <defs>
        <radialGradient id={`expGrad-${explosion.id}`}>
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="30%" stopColor="#FFAA00" />
          <stop offset="60%" stopColor="#FF4500" />
          <stop offset="100%" stopColor="rgba(139, 0, 0, 0)" />
        </radialGradient>
        <radialGradient id={`expCore-${explosion.id}`}>
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FFFF00" stopOpacity="0.8" />
        </radialGradient>
      </defs>

      {/* Main explosion sphere - filter removed for performance */}
      <circle
        cx="0"
        cy="0"
        r={explosion.radius}
        fill={`url(#expGrad-${explosion.id})`}
      />

      {/* Bright core */}
      <circle
        cx="0"
        cy="0"
        r={explosion.radius * 0.3}
        fill={`url(#expCore-${explosion.id})`}
      />

      {/* Shockwave rings */}
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          cx="0"
          cy="0"
          r={explosion.radius * (1 + i * 0.5)}
          fill="none"
          stroke="#FF8C00"
          strokeWidth="2"
          opacity={(1 - progress) * (0.5 - i * 0.1)}
        />
      ))}
    </g>
  );
});

export default SVGExplosion;
