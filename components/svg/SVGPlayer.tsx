import React from 'react';
import { Player, WeaponType } from '../../types';

interface SVGPlayerProps {
  player: Player;
  tileSize: number;
}

export const SVGPlayer = React.memo(({ player, tileSize }: SVGPlayerProps) => {
  const x = player.pixelX;
  const y = player.pixelY;
  const size = tileSize * 0.8;
  const halfSize = size / 2;

  // Player is a mix of fantasy armor and modern tactical gear
  return (
    <g transform={`translate(${x}, ${y}) rotate(${(player.angle * 180) / Math.PI + 90}, 0, 0)`}>
      {/* Health indicator glow */}
      <circle
        cx={0}
        cy={0}
        r={halfSize + 2}
        fill={player.health < player.maxHealth * 0.3 ? '#FF0000' : '#00FF00'}
        opacity={0.2}
      />

      {/* Body - armored torso */}
      <ellipse
        cx={0}
        cy={0}
        rx={halfSize * 0.6}
        ry={halfSize * 0.8}
        fill="#4A4A4A"
        stroke="#2A2A2A"
        strokeWidth="1"
      />

      {/* Armor plates */}
      <rect
        x={-halfSize * 0.4}
        y={-halfSize * 0.5}
        width={halfSize * 0.8}
        height={halfSize * 0.3}
        fill="#5A5A5A"
        stroke="#1A1A1A"
        strokeWidth="0.5"
        rx="2"
      />

      {/* Head - helmet */}
      <circle
        cx={0}
        cy={-halfSize * 0.7}
        r={halfSize * 0.35}
        fill="#3A3A3A"
        stroke="#1A1A1A"
        strokeWidth="1"
      />

      {/* Visor glow */}
      <ellipse
        cx={0}
        cy={-halfSize * 0.7}
        rx={halfSize * 0.25}
        ry={halfSize * 0.1}
        fill="#00FFFF"
        opacity="0.8"
      />

      {/* Arms */}
      <rect
        x={-halfSize * 0.75}
        y={-halfSize * 0.3}
        width={halfSize * 0.3}
        height={halfSize * 0.8}
        fill="#4A4A4A"
        stroke="#2A2A2A"
        strokeWidth="0.5"
        rx="2"
      />
      <rect
        x={halfSize * 0.45}
        y={-halfSize * 0.3}
        width={halfSize * 0.3}
        height={halfSize * 0.8}
        fill="#4A4A4A"
        stroke="#2A2A2A"
        strokeWidth="0.5"
        rx="2"
      />

      {/* Weapon indicator - shows current weapon */}
      {renderWeaponIndicator(player.weapon, halfSize)}

      {/* Direction indicator */}
      <circle cx={0} cy={-halfSize * 1.2} r={2} fill="#FFD700" />
    </g>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.player.pixelX === nextProps.player.pixelX &&
    prevProps.player.pixelY === nextProps.player.pixelY &&
    prevProps.player.angle === nextProps.player.angle &&
    prevProps.player.health === nextProps.player.health &&
    prevProps.player.weapon === nextProps.player.weapon
  );
});

function renderWeaponIndicator(weapon: WeaponType, halfSize: number): JSX.Element {
  // Show weapon type with color coding
  let weaponColor = '#FFFFFF';
  let weaponShape: JSX.Element;

  if (weapon === 'SWORD' || weapon === 'DAGGER') {
    weaponColor = '#C0C0C0';
    weaponShape = (
      <line
        x1={halfSize * 0.5}
        y1={0}
        x2={halfSize * 1.2}
        y2={0}
        stroke={weaponColor}
        strokeWidth="3"
      />
    );
  } else if (weapon === 'BOW' || weapon === 'CROSSBOW') {
    weaponColor = '#8B4513';
    weaponShape = (
      <g>
        <line x1={halfSize * 0.5} y1={-halfSize * 0.3} x2={halfSize * 0.5} y2={halfSize * 0.3} stroke={weaponColor} strokeWidth="2" />
        <path d={`M ${halfSize * 0.5} ${-halfSize * 0.3} Q ${halfSize * 0.8} 0 ${halfSize * 0.5} ${halfSize * 0.3}`} stroke={weaponColor} strokeWidth="1" fill="none" />
      </g>
    );
  } else if (weapon === 'STAFF' || weapon === 'MAGIC_WAND') {
    weaponColor = '#9370DB';
    weaponShape = (
      <g>
        <line x1={halfSize * 0.5} y1={-halfSize * 0.4} x2={halfSize * 0.5} y2={halfSize * 0.4} stroke={weaponColor} strokeWidth="2" />
        <circle cx={halfSize * 0.5} cy={-halfSize * 0.4} r={3} fill={weaponColor} opacity="0.8" />
      </g>
    );
  } else {
    // Modern guns
    weaponColor = '#FFD700';
    weaponShape = (
      <rect
        x={halfSize * 0.5}
        y={-halfSize * 0.15}
        width={halfSize * 0.6}
        height={halfSize * 0.3}
        fill={weaponColor}
        stroke="#1A1A1A"
        strokeWidth="1"
        rx="1"
      />
    );
  }

  return <g>{weaponShape}</g>;
}

SVGPlayer.displayName = 'SVGPlayer';
