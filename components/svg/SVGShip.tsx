import React from 'react';
import { Ship } from '../../types';
import { WEAPON_CONFIGS } from '../../systems/weapons';

interface SVGShipProps {
  ship: Ship;
  cameraX: number;
  cameraY: number;
}

const SVGShip: React.FC<SVGShipProps> = React.memo(({ ship, cameraX, cameraY }) => {
  const weaponConfig = WEAPON_CONFIGS[ship.weapon];
  const screenX = ship.x + cameraX;
  const screenY = ship.y + cameraY;
  const rotationDeg = (ship.angle * 180) / Math.PI;

  // Calculate health bar
  const healthPercent = ship.health / ship.maxHealth;
  const barWidth = ship.size * 2;
  const barHeight = 5;

  return (
    <g transform={`translate(${screenX}, ${screenY}) rotate(${rotationDeg})`}>
      {/* Ship Glow Effect (Elite ships) - Simplified without expensive filter */}
      {ship.isElite && (
        <circle
          cx="0"
          cy="0"
          r={ship.size + 10}
          fill="none"
          stroke={weaponConfig.glowColor}
          strokeWidth="3"
          opacity="0.6"
        />
      )}

      {/* Shield Effect - Simplified without expensive filter */}
      {ship.shieldActive && (
        <circle
          cx="0"
          cy="0"
          r={ship.size + 8}
          fill="none"
          stroke="#00BFFF"
          strokeWidth="3"
          opacity="0.8"
        />
      )}

      {/* Main Ship Body */}
      <defs>
        <linearGradient id={`shipGradient-${ship.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={ship.color} stopOpacity="1" />
          <stop offset="50%" stopColor={ship.color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={ship.color} stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id={`shipGradientDark-${ship.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={ship.color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={ship.color} stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={`metalGradient-${ship.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e0e0e0" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#b0b0b0" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#808080" stopOpacity="0.7" />
        </linearGradient>
        <radialGradient id={`engineGlow-${ship.id}`}>
          <stop offset="0%" stopColor="#FFFF00" stopOpacity="1" />
          <stop offset="30%" stopColor="#FFAA00" stopOpacity="1" />
          <stop offset="60%" stopColor="#FF4500" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FF0000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`engineCore-${ship.id}`}>
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="40%" stopColor="#FFFF00" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFAA00" stopOpacity="0.3" />
        </radialGradient>
        <radialGradient id={`cockpitGlass-${ship.id}`}>
          <stop offset="0%" stopColor="#88DDFF" stopOpacity="0.8" />
          <stop offset="50%" stopColor={weaponConfig.color} stopOpacity="0.6" />
          <stop offset="100%" stopColor="#004466" stopOpacity="0.9" />
        </radialGradient>
      </defs>

      {/* Shadow/Depth Layer */}
      <path
        d={`M ${ship.size * 0.85},0 L ${-ship.size * 0.65},${ship.size * 0.52} L ${-ship.size * 0.45},0 L ${-ship.size * 0.65},${-ship.size * 0.52} Z`}
        fill="#000000"
        opacity="0.3"
        transform="translate(2, 2)"
      />

      {/* Main Hull - Bottom Layer */}
      <path
        d={`M ${ship.size * 0.85},0 L ${-ship.size * 0.65},${ship.size * 0.52} L ${-ship.size * 0.45},0 L ${-ship.size * 0.65},${-ship.size * 0.52} Z`}
        fill={`url(#shipGradientDark-${ship.id})`}
        stroke="#333333"
        strokeWidth="1.5"
      />

      {/* Main Hull - Top Layer */}
      <path
        d={`M ${ship.size * 0.8},0 L ${-ship.size * 0.6},${ship.size * 0.48} L ${-ship.size * 0.4},0 L ${-ship.size * 0.6},${-ship.size * 0.48} Z`}
        fill={`url(#shipGradient-${ship.id})`}
        stroke="#ffffff"
        strokeWidth="2"
        opacity="0.95"
      />

      {/* Center Ridge/Panel */}
      <path
        d={`M ${ship.size * 0.75},0 L ${-ship.size * 0.35},0`}
        stroke="#ffffff"
        strokeWidth="3"
        opacity="0.4"
      />

      {/* Panel Lines */}
      <path
        d={`M ${ship.size * 0.5},0 L ${-ship.size * 0.3},${ship.size * 0.25}`}
        stroke="#ffffff"
        strokeWidth="1"
        opacity="0.3"
      />
      <path
        d={`M ${ship.size * 0.5},0 L ${-ship.size * 0.3},${-ship.size * 0.25}`}
        stroke="#ffffff"
        strokeWidth="1"
        opacity="0.3"
      />

      {/* Wing Structures */}
      {/* Top Wing */}
      <path
        d={`M ${ship.size * 0.2},${ship.size * 0.15} L ${-ship.size * 0.45},${ship.size * 0.48} L ${-ship.size * 0.35},${ship.size * 0.35} Z`}
        fill={`url(#metalGradient-${ship.id})`}
        stroke="#ffffff"
        strokeWidth="1.5"
        opacity="0.9"
      />
      {/* Bottom Wing */}
      <path
        d={`M ${ship.size * 0.2},${-ship.size * 0.15} L ${-ship.size * 0.45},${-ship.size * 0.48} L ${-ship.size * 0.35},${-ship.size * 0.35} Z`}
        fill={`url(#metalGradient-${ship.id})`}
        stroke="#ffffff"
        strokeWidth="1.5"
        opacity="0.9"
      />

      {/* Wing Details and Vents */}
      <rect
        x={-ship.size * 0.48}
        y={ship.size * 0.38}
        width={ship.size * 0.08}
        height={ship.size * 0.06}
        fill="#222222"
        stroke={weaponConfig.glowColor}
        strokeWidth="0.5"
        opacity="0.8"
      />
      <rect
        x={-ship.size * 0.48}
        y={-ship.size * 0.44}
        width={ship.size * 0.08}
        height={ship.size * 0.06}
        fill="#222222"
        stroke={weaponConfig.glowColor}
        strokeWidth="0.5"
        opacity="0.8"
      />

      {/* Cockpit Section */}
      {/* Cockpit Frame */}
      <ellipse
        cx={ship.size * 0.35}
        cy="0"
        rx={ship.size * 0.25}
        ry={ship.size * 0.18}
        fill="#1a1a1a"
        stroke="#666666"
        strokeWidth="1.5"
        opacity="0.9"
      />
      {/* Cockpit Glass */}
      <ellipse
        cx={ship.size * 0.38}
        cy="0"
        rx={ship.size * 0.2}
        ry={ship.size * 0.14}
        fill={`url(#cockpitGlass-${ship.id})`}
        opacity="0.85"
      />
      {/* Glass Reflection */}
      <ellipse
        cx={ship.size * 0.42}
        cy={-ship.size * 0.05}
        rx={ship.size * 0.12}
        ry={ship.size * 0.08}
        fill="#FFFFFF"
        opacity="0.4"
      />
      {/* Inner Cockpit Glow */}
      <ellipse
        cx={ship.size * 0.35}
        cy="0"
        rx={ship.size * 0.08}
        ry={ship.size * 0.06}
        fill={weaponConfig.glowColor}
        opacity="0.6"
      >
        <animate
          attributeName="opacity"
          values="0.4;0.7;0.4"
          dur="2s"
          repeatCount="indefinite"
        />
      </ellipse>

      {/* Engine Nacelles */}
      {/* Top Engine Housing */}
      <ellipse
        cx={-ship.size * 0.52}
        cy={ship.size * 0.28}
        rx={ship.size * 0.12}
        ry={ship.size * 0.1}
        fill="#2a2a2a"
        stroke="#555555"
        strokeWidth="1.5"
      />
      {/* Bottom Engine Housing */}
      <ellipse
        cx={-ship.size * 0.52}
        cy={-ship.size * 0.28}
        rx={ship.size * 0.12}
        ry={ship.size * 0.1}
        fill="#2a2a2a"
        stroke="#555555"
        strokeWidth="1.5"
      />

      {/* Engine Glow - Top */}
      <ellipse
        cx={-ship.size * 0.52}
        cy={ship.size * 0.28}
        rx={ship.size * 0.18}
        ry={ship.size * 0.14}
        fill={`url(#engineGlow-${ship.id})`}
      >
        <animate
          attributeName="rx"
          values={`${ship.size * 0.18};${ship.size * 0.24};${ship.size * 0.18}`}
          dur="0.3s"
          repeatCount="indefinite"
        />
      </ellipse>
      {/* Engine Core - Top */}
      <ellipse
        cx={-ship.size * 0.52}
        cy={ship.size * 0.28}
        rx={ship.size * 0.08}
        ry={ship.size * 0.06}
        fill={`url(#engineCore-${ship.id})`}
      >
        <animate
          attributeName="opacity"
          values="0.8;1;0.8"
          dur="0.2s"
          repeatCount="indefinite"
        />
      </ellipse>

      {/* Engine Glow - Bottom */}
      <ellipse
        cx={-ship.size * 0.52}
        cy={-ship.size * 0.28}
        rx={ship.size * 0.18}
        ry={ship.size * 0.14}
        fill={`url(#engineGlow-${ship.id})`}
      >
        <animate
          attributeName="rx"
          values={`${ship.size * 0.18};${ship.size * 0.24};${ship.size * 0.18}`}
          dur="0.3s"
          repeatCount="indefinite"
        />
      </ellipse>
      {/* Engine Core - Bottom */}
      <ellipse
        cx={-ship.size * 0.52}
        cy={-ship.size * 0.28}
        rx={ship.size * 0.08}
        ry={ship.size * 0.06}
        fill={`url(#engineCore-${ship.id})`}
      >
        <animate
          attributeName="opacity"
          values="0.8;1;0.8"
          dur="0.2s"
          repeatCount="indefinite"
        />
      </ellipse>

      {/* Engine Exhaust Trails */}
      <path
        d={`M ${-ship.size * 0.64},${ship.size * 0.28} L ${-ship.size * 0.85},${ship.size * 0.28}`}
        stroke="#FF8800"
        strokeWidth="2"
        opacity="0.6"
      >
        <animate
          attributeName="opacity"
          values="0.3;0.7;0.3"
          dur="0.2s"
          repeatCount="indefinite"
        />
      </path>
      <path
        d={`M ${-ship.size * 0.64},${-ship.size * 0.28} L ${-ship.size * 0.85},${-ship.size * 0.28}`}
        stroke="#FF8800"
        strokeWidth="2"
        opacity="0.6"
      >
        <animate
          attributeName="opacity"
          values="0.3;0.7;0.3"
          dur="0.2s"
          repeatCount="indefinite"
        />
      </path>

      {/* Weapon Hardpoints - Enhanced */}
      {/* Top Weapon */}
      <g>
        <circle
          cx={ship.size * 0.45}
          cy={ship.size * 0.38}
          r={ship.size * 0.1}
          fill="#1a1a1a"
          stroke="#444444"
          strokeWidth="1.5"
        />
        <circle
          cx={ship.size * 0.45}
          cy={ship.size * 0.38}
          r={ship.size * 0.06}
          fill={weaponConfig.color}
          stroke={weaponConfig.glowColor}
          strokeWidth="1.5"
        >
          <animate
            attributeName="opacity"
            values="0.6;1;0.6"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      </g>
      {/* Bottom Weapon */}
      <g>
        <circle
          cx={ship.size * 0.45}
          cy={-ship.size * 0.38}
          r={ship.size * 0.1}
          fill="#1a1a1a"
          stroke="#444444"
          strokeWidth="1.5"
        />
        <circle
          cx={ship.size * 0.45}
          cy={-ship.size * 0.38}
          r={ship.size * 0.06}
          fill={weaponConfig.color}
          stroke={weaponConfig.glowColor}
          strokeWidth="1.5"
        >
          <animate
            attributeName="opacity"
            values="0.6;1;0.6"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      </g>

      {/* Detail Accents */}
      <circle
        cx={ship.size * 0.1}
        cy={ship.size * 0.12}
        r={ship.size * 0.03}
        fill={weaponConfig.glowColor}
        opacity="0.6"
      />
      <circle
        cx={ship.size * 0.1}
        cy={-ship.size * 0.12}
        r={ship.size * 0.03}
        fill={weaponConfig.glowColor}
        opacity="0.6"
      />

      {/* Health Bar (only show when damaged) */}
      {ship.health < ship.maxHealth && (
        <g transform={`rotate(${-rotationDeg})`}>
          <rect
            x={-barWidth / 2}
            y={ship.size + 10}
            width={barWidth}
            height={barHeight}
            fill="#333"
            stroke="#000"
            strokeWidth="1"
          />
          <rect
            x={-barWidth / 2}
            y={ship.size + 10}
            width={barWidth * healthPercent}
            height={barHeight}
            fill={healthPercent > 0.5 ? '#00FF00' : healthPercent > 0.2 ? '#FFFF00' : '#FF0000'}
          />
        </g>
      )}
    </g>
  );
}, (prevProps, nextProps) => {
  // Only re-render if ship properties or position changed significantly
  return (
    prevProps.ship.id === nextProps.ship.id &&
    prevProps.ship.x === nextProps.ship.x &&
    prevProps.ship.y === nextProps.ship.y &&
    prevProps.ship.angle === nextProps.ship.angle &&
    prevProps.ship.health === nextProps.ship.health &&
    prevProps.ship.shieldActive === nextProps.ship.shieldActive &&
    prevProps.cameraX === nextProps.cameraX &&
    prevProps.cameraY === nextProps.cameraY
  );
});

export default SVGShip;
