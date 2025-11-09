import React from 'react';
import { Projectile } from '../../types';

interface SVGRogueProjectileProps {
  projectile: Projectile;
}

export const SVGRogueProjectile = React.memo(({ projectile }: SVGRogueProjectileProps) => {
  const x = projectile.x;
  const y = projectile.y;
  const size = projectile.size;

  // Different appearance based on weapon type
  if (projectile.weaponType === 'SWORD' || projectile.weaponType === 'DAGGER') {
    // Melee slash effect
    return (
      <g transform={`translate(${x}, ${y}) rotate(${(projectile.angle * 180) / Math.PI})`}>
        <path
          d={`M ${-size * 2} 0 L ${size * 2} 0`}
          stroke={projectile.color}
          strokeWidth={size}
          strokeLinecap="round"
          opacity="0.6"
        />
      </g>
    );
  }

  if (projectile.weaponType === 'BOW' || projectile.weaponType === 'CROSSBOW') {
    // Arrow
    return (
      <g transform={`translate(${x}, ${y}) rotate(${(projectile.angle * 180) / Math.PI})`}>
        <line x1={-size * 1.5} y1={0} x2={size * 1.5} y2={0} stroke={projectile.color} strokeWidth={2} />
        <polygon points={`${size * 1.5},0 ${size},${-size * 0.3} ${size},${size * 0.3}`} fill={projectile.color} />
      </g>
    );
  }

  if (projectile.weaponType === 'STAFF' || projectile.weaponType === 'MAGIC_WAND') {
    // Magic orb
    return (
      <g transform={`translate(${x}, ${y})`}>
        <circle cx={0} cy={0} r={size * 1.5} fill={projectile.color} opacity="0.3" />
        <circle cx={0} cy={0} r={size} fill={projectile.color} opacity="0.8" />
        <circle cx={0} cy={0} r={size * 0.5} fill="#FFFFFF" opacity="0.9" />
      </g>
    );
  }

  if (projectile.weaponType === 'FLAMETHROWER') {
    // Fire particle
    const flameColors = ['#FF4500', '#FF6347', '#FFA500', '#FFD700'];
    const color = flameColors[Math.floor(Math.random() * flameColors.length)];
    return (
      <g transform={`translate(${x}, ${y})`}>
        <circle cx={0} cy={0} r={size * 1.2} fill={color} opacity={0.4 + Math.random() * 0.3} />
        <circle cx={0} cy={0} r={size * 0.6} fill="#FFFF00" opacity="0.6" />
      </g>
    );
  }

  // Default bullet (for modern weapons)
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx={0} cy={0} r={size * 1.5} fill={projectile.color} opacity="0.3" />
      <ellipse
        cx={0}
        cy={0}
        rx={size * 0.8}
        ry={size * 0.5}
        fill={projectile.color}
        transform={`rotate(${(projectile.angle * 180) / Math.PI})`}
      />
      <circle cx={0} cy={0} r={size * 0.3} fill="#FFFFFF" opacity="0.8" />
    </g>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.projectile.x === nextProps.projectile.x &&
    prevProps.projectile.y === nextProps.projectile.y &&
    prevProps.projectile.angle === nextProps.projectile.angle
  );
});

SVGRogueProjectile.displayName = 'SVGRogueProjectile';
