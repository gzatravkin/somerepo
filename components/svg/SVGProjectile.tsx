import React from 'react';
import { Projectile } from '../../types';
import { WEAPON_CONFIGS } from '../../systems/weapons';

interface SVGProjectileProps {
  projectile: Projectile;
  cameraX: number;
  cameraY: number;
}

const SVGProjectile: React.FC<SVGProjectileProps> = React.memo(({ projectile, cameraX, cameraY }) => {
  const weaponConfig = WEAPON_CONFIGS[projectile.weaponType];
  const screenX = projectile.x + cameraX;
  const screenY = projectile.y + cameraY;
  const angle = (Math.atan2(projectile.vy, projectile.vx) * 180) / Math.PI;

  // Render beams differently
  if (projectile.isBeam && projectile.beamLength) {
    const beamEndX = screenX + Math.cos((angle * Math.PI) / 180) * projectile.beamLength;
    const beamEndY = screenY + Math.sin((angle * Math.PI) / 180) * projectile.beamLength;

    return (
      <g>
        <defs>
          <linearGradient id={`beamGrad-${projectile.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={weaponConfig.glowColor} stopOpacity="1" />
            <stop offset="100%" stopColor={weaponConfig.glowColor} stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Beam glow layers */}
        <line
          x1={screenX}
          y1={screenY}
          x2={beamEndX}
          y2={beamEndY}
          stroke={weaponConfig.glowColor}
          strokeWidth={projectile.size * 4}
          strokeLinecap="round"
          opacity="0.3"
        />
        <line
          x1={screenX}
          y1={screenY}
          x2={beamEndX}
          y2={beamEndY}
          stroke={weaponConfig.glowColor}
          strokeWidth={projectile.size * 2}
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Beam core */}
        <line
          x1={screenX}
          y1={screenY}
          x2={beamEndX}
          y2={beamEndY}
          stroke={`url(#beamGrad-${projectile.id})`}
          strokeWidth={projectile.size}
          strokeLinecap="round"
          opacity="1"
        />

        {/* Beam origin glow */}
        <circle
          cx={screenX}
          cy={screenY}
          r={projectile.size * 3}
          fill={weaponConfig.glowColor}
          opacity="0.5"
        />
        <circle
          cx={screenX}
          cy={screenY}
          r={projectile.size * 1.5}
          fill="#FFFFFF"
          opacity="0.8"
        />
      </g>
    );
  }

  // Regular projectile rendering
  return (
    <g transform={`translate(${screenX}, ${screenY}) rotate(${angle})`}>
      <defs>
        <radialGradient id={`projGrad-${projectile.id}`}>
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="30%" stopColor={projectile.color} />
          <stop offset="100%" stopColor={weaponConfig.glowColor} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Projectile glow - filter removed for performance */}
      <circle
        cx="0"
        cy="0"
        r={projectile.size * 2}
        fill={`url(#projGrad-${projectile.id})`}
      />

      {/* Projectile core */}
      <ellipse
        cx="0"
        cy="0"
        rx={projectile.size * 1.2}
        ry={projectile.size * 0.8}
        fill="#FFFFFF"
        opacity="0.9"
      />
    </g>
  );
});

export default SVGProjectile;
