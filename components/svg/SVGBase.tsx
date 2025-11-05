import React from 'react';
import { Base } from '../../types';

interface SVGBaseProps {
  base: Base;
  cameraX: number;
  cameraY: number;
  upgradeLevel: number;
  upgradeCost: number;
}

const SVGBase: React.FC<SVGBaseProps> = React.memo(({ base, cameraX, cameraY, upgradeLevel, upgradeCost }) => {
  const screenX = base.x + cameraX;
  const screenY = base.y + cameraY;
  const pulsePhase = Math.sin(base.pulsePhase) * 0.5 + 0.5;
  const currentRadius = base.radius * (1 + pulsePhase * 0.05);

  return (
    <g transform={`translate(${screenX}, ${screenY})`}>
      <defs>
        <radialGradient id={`baseGrad-${base.id}`}>
          <stop offset="0%" stopColor={base.color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={base.color} stopOpacity="0.05" />
        </radialGradient>
      </defs>

      {/* Outer glow rings */}
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          cx="0"
          cy="0"
          r={currentRadius + i * 15}
          fill="none"
          stroke={base.color}
          strokeWidth="2"
          opacity={0.3 - i * 0.08}
        />
      ))}

      {/* Main base circle with pulse - filter removed for performance */}
      <circle
        cx="0"
        cy="0"
        r={currentRadius}
        fill={`url(#baseGrad-${base.id})`}
        stroke={base.color}
        strokeWidth={5 + pulsePhase * 2}
      />

      {/* Rotating elements */}
      <g transform={`rotate(${(base.rotationAngle * 180) / Math.PI})`}>
        {/* Energy nodes */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i / 6) * Math.PI * 2;
          const nodeX = Math.cos(angle) * currentRadius * 0.7;
          const nodeY = Math.sin(angle) * currentRadius * 0.7;

          return (
            <circle
              key={i}
              cx={nodeX}
              cy={nodeY}
              r={5 + pulsePhase * 2}
              fill={base.color}
            />
          );
        })}
      </g>

      {/* Text */}
      <text
        x="0"
        y="-20"
        fill="#FFF"
        fontSize="24"
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ filter: 'drop-shadow(0 0 5px #000)' }}
      >
        {base.upgradeType.replace('_', ' ')}
      </text>
      <text
        x="0"
        y="20"
        fill="#FFF"
        fontSize="20"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ filter: 'drop-shadow(0 0 5px #000)' }}
      >
        COST: {upgradeCost} CARGO
      </text>
    </g>
  );
});

export default SVGBase;
