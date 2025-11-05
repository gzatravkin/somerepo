import React from 'react';
import { Loot } from '../../types';

interface SVGLootProps {
  loot: Loot;
  cameraX: number;
  cameraY: number;
}

const SVGLoot: React.FC<SVGLootProps> = React.memo(({ loot, cameraX, cameraY }) => {
  const screenX = loot.x + cameraX;
  const screenY = loot.y + cameraY;
  const rotation = (Date.now() / 1000) % 360;

  return (
    <g transform={`translate(${screenX}, ${screenY})`}>
      <defs>
        <radialGradient id={`lootGlow-${loot.id}`}>
          <stop offset="0%" stopColor="#FFFF00" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FFFF00" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`lootCrystal-${loot.id}`}>
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#FFFF00" />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0.5" />
        </radialGradient>
      </defs>

      {/* Outer glow - filter removed for performance */}
      <circle
        cx="0"
        cy="0"
        r={loot.radius * 2}
        fill={`url(#lootGlow-${loot.id})`}
      />

      {/* Rotating crystal */}
      <g transform={`rotate(${rotation})`}>
        <path
          d={`M 0,${-loot.radius} L ${loot.radius * 0.6},0 L 0,${loot.radius} L ${-loot.radius * 0.6},0 Z`}
          fill={`url(#lootCrystal-${loot.id})`}
          stroke="#FFD700"
          strokeWidth="1"
        />
        {/* Facet highlights */}
        <path
          d={`M 0,${-loot.radius} L ${loot.radius * 0.6},0 L 0,${loot.radius * 0.3} Z`}
          fill="#FFFF00"
          opacity="0.6"
        />
        <path
          d={`M 0,${-loot.radius} L ${-loot.radius * 0.6},0 L 0,${loot.radius * 0.3} Z`}
          fill="#FFD700"
          opacity="0.4"
        />
      </g>

      {/* Sparkles */}
      {[0, 90, 180, 270].map((angle, i) => {
        const sparkleX = Math.cos((angle * Math.PI) / 180) * loot.radius * 1.5;
        const sparkleY = Math.sin((angle * Math.PI) / 180) * loot.radius * 1.5;
        const sparkleOpacity = (Math.sin(Date.now() / 300 + i) + 1) / 2;

        return (
          <circle
            key={i}
            cx={sparkleX}
            cy={sparkleY}
            r="1"
            fill="#FFFFFF"
            opacity={sparkleOpacity * 0.8}
          />
        );
      })}
    </g>
  );
});

export default SVGLoot;
