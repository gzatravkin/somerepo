import React from 'react';
import { Enemy } from '../../types';

interface SVGEnemyProps {
  enemy: Enemy;
  tileSize: number;
}

export const SVGEnemy = React.memo(({ enemy, tileSize }: SVGEnemyProps) => {
  const x = enemy.pixelX;
  const y = enemy.pixelY;
  const size = tileSize * 0.7;
  const halfSize = size / 2;

  const healthPercent = enemy.health / enemy.maxHealth;

  return (
    <g transform={`translate(${x}, ${y}) rotate(${(enemy.angle * 180) / Math.PI + 90}, 0, 0)`}>
      {/* Health bar */}
      {healthPercent < 1 && (
        <g>
          <rect
            x={-halfSize}
            y={-halfSize - 8}
            width={size}
            height={3}
            fill="#FF0000"
            opacity="0.5"
          />
          <rect
            x={-halfSize}
            y={-halfSize - 8}
            width={size * healthPercent}
            height={3}
            fill="#00FF00"
          />
        </g>
      )}

      {/* Enemy body - different for each type */}
      {renderEnemyBody(enemy.type, halfSize, enemy.state)}
    </g>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.enemy.pixelX === nextProps.enemy.pixelX &&
    prevProps.enemy.pixelY === nextProps.enemy.pixelY &&
    prevProps.enemy.angle === nextProps.enemy.angle &&
    prevProps.enemy.health === nextProps.enemy.health &&
    prevProps.enemy.state === nextProps.enemy.state
  );
});

function renderEnemyBody(type: string, halfSize: number, state: string): JSX.Element {
  const isDead = state === 'DEAD';

  switch (type) {
    case 'GOBLIN':
      return (
        <g opacity={isDead ? 0.5 : 1}>
          {/* Small green creature */}
          <ellipse cx={0} cy={0} rx={halfSize * 0.6} ry={halfSize * 0.8} fill="#228B22" stroke="#1A5A1A" strokeWidth="1" />
          <circle cx={0} cy={-halfSize * 0.5} r={halfSize * 0.4} fill="#2F8B2F" stroke="#1A5A1A" strokeWidth="1" />
          {/* Evil eyes */}
          <circle cx={-halfSize * 0.15} cy={-halfSize * 0.5} r={3} fill="#FF0000" />
          <circle cx={halfSize * 0.15} cy={-halfSize * 0.5} r={3} fill="#FF0000" />
          {/* Pointed ears */}
          <circle cx={-halfSize * 0.45} cy={-halfSize * 0.6} r={halfSize * 0.2} fill="#2F8B2F" />
          <circle cx={halfSize * 0.45} cy={-halfSize * 0.6} r={halfSize * 0.2} fill="#2F8B2F" />
        </g>
      );

    case 'ORC':
      return (
        <g opacity={isDead ? 0.5 : 1}>
          {/* Large muscular green creature */}
          <ellipse cx={0} cy={0} rx={halfSize * 0.8} ry={halfSize} fill="#2F4F2F" stroke="#1A3A1A" strokeWidth="1" />
          <rect x={-halfSize * 0.4} y={-halfSize * 0.3} width={halfSize * 0.8} height={halfSize * 0.4} fill="#3A5A3A" stroke="#1A3A1A" strokeWidth="1" />
          {/* Square head */}
          <rect x={-halfSize * 0.5} y={-halfSize * 0.9} width={halfSize} height={halfSize * 0.6} fill="#2F4F2F" stroke="#1A3A1A" strokeWidth="1" rx="2" />
          {/* Tusks */}
          <rect x={-halfSize * 0.3} y={-halfSize * 0.4} width={halfSize * 0.15} height={halfSize * 0.25} fill="#FFFFFF" rx="1" />
          <rect x={halfSize * 0.15} y={-halfSize * 0.4} width={halfSize * 0.15} height={halfSize * 0.25} fill="#FFFFFF" rx="1" />
        </g>
      );

    case 'SKELETON':
      return (
        <g opacity={isDead ? 0.5 : 1}>
          {/* Bone creature */}
          <circle cx={0} cy={-halfSize * 0.6} r={halfSize * 0.4} fill="#F5F5DC" stroke="#D3D3D3" strokeWidth="1" />
          {/* Eye sockets */}
          <circle cx={-halfSize * 0.15} cy={-halfSize * 0.6} r={4} fill="#000000" />
          <circle cx={halfSize * 0.15} cy={-halfSize * 0.6} r={4} fill="#000000" />
          {/* Rib cage */}
          <ellipse cx={0} cy={0} rx={halfSize * 0.5} ry={halfSize * 0.7} fill="none" stroke="#F5F5DC" strokeWidth="2" />
          <line x1={-halfSize * 0.3} y1={-halfSize * 0.3} x2={halfSize * 0.3} y2={-halfSize * 0.3} stroke="#F5F5DC" strokeWidth="1" />
          <line x1={-halfSize * 0.3} y1={0} x2={halfSize * 0.3} y2={0} stroke="#F5F5DC" strokeWidth="1" />
          <line x1={-halfSize * 0.3} y1={halfSize * 0.3} x2={halfSize * 0.3} y2={halfSize * 0.3} stroke="#F5F5DC" strokeWidth="1" />
          {/* Spine */}
          <line x1={0} y1={-halfSize * 0.2} x2={0} y2={halfSize * 0.7} stroke="#F5F5DC" strokeWidth="2" />
        </g>
      );

    case 'ZOMBIE':
      return (
        <g opacity={isDead ? 0.5 : 1}>
          {/* Decaying humanoid */}
          <ellipse cx={0} cy={0} rx={halfSize * 0.7} ry={halfSize * 0.9} fill="#556B2F" stroke="#3A4A2A" strokeWidth="1" />
          <circle cx={0} cy={-halfSize * 0.6} r={halfSize * 0.45} fill="#5A6B3A" stroke="#3A4A2A" strokeWidth="1" />
          {/* Dead eyes */}
          <circle cx={-halfSize * 0.15} cy={-halfSize * 0.6} r={3} fill="#FFFFFF" />
          <circle cx={halfSize * 0.15} cy={-halfSize * 0.6} r={3} fill="#FFFFFF" />
          {/* Wounds */}
          <circle cx={-halfSize * 0.3} cy={0} r={halfSize * 0.15} fill="#8B0000" opacity="0.7" />
          <circle cx={halfSize * 0.2} cy={halfSize * 0.2} r={halfSize * 0.12} fill="#8B0000" opacity="0.7" />
        </g>
      );

    case 'DEMON':
      return (
        <g opacity={isDead ? 0.5 : 1}>
          {/* Large demonic creature */}
          <ellipse cx={0} cy={0} rx={halfSize * 0.9} ry={halfSize * 1.1} fill="#8B0000" stroke="#5A0000" strokeWidth="2" />
          <circle cx={0} cy={-halfSize * 0.7} r={halfSize * 0.5} fill="#A00000" stroke="#5A0000" strokeWidth="2" />
          {/* Glowing eyes */}
          <circle cx={-halfSize * 0.2} cy={-halfSize * 0.7} r={5} fill="#FF0000" opacity="0.9" />
          <circle cx={halfSize * 0.2} cy={-halfSize * 0.7} r={5} fill="#FF0000" opacity="0.9" />
          {/* Horns */}
          <path d={`M ${-halfSize * 0.4} ${-halfSize * 1.0} L ${-halfSize * 0.5} ${-halfSize * 1.4} L ${-halfSize * 0.3} ${-halfSize * 1.1}`} fill="#5A0000" />
          <path d={`M ${halfSize * 0.4} ${-halfSize * 1.0} L ${halfSize * 0.5} ${-halfSize * 1.4} L ${halfSize * 0.3} ${-halfSize * 1.1}`} fill="#5A0000" />
          {/* Flame aura */}
          <circle cx={0} cy={0} r={halfSize * 1.3} fill="#FF4500" opacity="0.2" />
        </g>
      );

    case 'SOLDIER':
      return (
        <g opacity={isDead ? 0.5 : 1}>
          {/* Military uniform */}
          <ellipse cx={0} cy={0} rx={halfSize * 0.6} ry={halfSize * 0.85} fill="#4B5320" stroke="#2A3010" strokeWidth="1" />
          <rect x={-halfSize * 0.5} y={-halfSize * 0.4} width={halfSize} height={halfSize * 0.35} fill="#5A6330" stroke="#2A3010" strokeWidth="1" />
          {/* Helmet */}
          <ellipse cx={0} cy={-halfSize * 0.7} rx={halfSize * 0.4} ry={halfSize * 0.35} fill="#3A4020" stroke="#1A2010" strokeWidth="1" />
          {/* Visor */}
          <rect x={-halfSize * 0.25} y={-halfSize * 0.75} width={halfSize * 0.5} height={halfSize * 0.15} fill="#1A1A1A" rx="1" />
          {/* Gun indicator */}
          <rect x={halfSize * 0.4} y={-halfSize * 0.2} width={halfSize * 0.5} height={halfSize * 0.25} fill="#2A2A2A" stroke="#1A1A1A" strokeWidth="1" rx="1" />
        </g>
      );

    case 'ROBOT':
      return (
        <g opacity={isDead ? 0.5 : 1}>
          {/* Mechanical body */}
          <rect x={-halfSize * 0.6} y={-halfSize * 0.8} width={halfSize * 1.2} height={halfSize * 1.6} fill="#708090" stroke="#404040" strokeWidth="2" rx="3" />
          {/* Panel lines */}
          <line x1={-halfSize * 0.5} y1={-halfSize * 0.3} x2={halfSize * 0.5} y2={-halfSize * 0.3} stroke="#404040" strokeWidth="1" />
          <line x1={-halfSize * 0.5} y1={halfSize * 0.1} x2={halfSize * 0.5} y2={halfSize * 0.1} stroke="#404040" strokeWidth="1" />
          {/* Head */}
          <rect x={-halfSize * 0.4} y={-halfSize * 1.1} width={halfSize * 0.8} height={halfSize * 0.6} fill="#8A9AA0" stroke="#404040" strokeWidth="1" rx="2" />
          {/* Optical sensors */}
          <circle cx={-halfSize * 0.15} cy={-halfSize * 0.85} r={4} fill="#00FFFF" opacity="0.9" />
          <circle cx={halfSize * 0.15} cy={-halfSize * 0.85} r={4} fill="#00FFFF" opacity="0.9" />
          {/* Antenna */}
          <line x1={0} y1={-halfSize * 1.1} x2={0} y2={-halfSize * 1.4} stroke="#8A9AA0" strokeWidth="2" />
          <circle cx={0} cy={-halfSize * 1.4} r={2} fill="#FF0000" />
        </g>
      );

    case 'MUTANT':
      return (
        <g opacity={isDead ? 0.5 : 1}>
          {/* Twisted creature */}
          <ellipse cx={0} cy={0} rx={halfSize * 0.75} ry={halfSize * 0.95} fill="#9370DB" stroke="#6A4AAB" strokeWidth="1" />
          {/* Mutated head */}
          <ellipse cx={0} cy={-halfSize * 0.7} rx={halfSize * 0.5} ry={halfSize * 0.4} fill="#A080DB" stroke="#6A4AAB" strokeWidth="1" />
          {/* Multiple eyes */}
          <circle cx={-halfSize * 0.2} cy={-halfSize * 0.75} r={3} fill="#00FF00" />
          <circle cx={halfSize * 0.1} cy={-halfSize * 0.7} r={4} fill="#00FF00" />
          <circle cx={0} cy={-halfSize * 0.6} r={2} fill="#00FF00" />
          {/* Tentacles */}
          <path d={`M ${-halfSize * 0.6} 0 Q ${-halfSize * 0.9} ${halfSize * 0.3} ${-halfSize * 0.7} ${halfSize * 0.6}`} stroke="#9370DB" strokeWidth="3" fill="none" />
          <path d={`M ${halfSize * 0.6} 0 Q ${halfSize * 0.9} ${halfSize * 0.3} ${halfSize * 0.7} ${halfSize * 0.6}`} stroke="#9370DB" strokeWidth="3" fill="none" />
        </g>
      );

    case 'CULTIST':
      return (
        <g opacity={isDead ? 0.5 : 1}>
          {/* Robed figure */}
          <path d={`M 0 ${-halfSize * 1.0} L ${-halfSize * 0.7} ${halfSize * 0.8} L ${halfSize * 0.7} ${halfSize * 0.8} Z`} fill="#800080" stroke="#500050" strokeWidth="1" />
          {/* Hood */}
          <ellipse cx={0} cy={-halfSize * 0.7} rx={halfSize * 0.5} ry={halfSize * 0.45} fill="#600060" stroke="#500050" strokeWidth="1" />
          {/* Face in shadow */}
          <ellipse cx={0} cy={-halfSize * 0.7} rx={halfSize * 0.35} ry={halfSize * 0.3} fill="#1A1A1A" />
          {/* Glowing eyes */}
          <circle cx={-halfSize * 0.12} cy={-halfSize * 0.7} r={2} fill="#FFFF00" opacity="0.9" />
          <circle cx={halfSize * 0.12} cy={-halfSize * 0.7} r={2} fill="#FFFF00" opacity="0.9" />
          {/* Mystical symbol on robe */}
          <circle cx={0} cy={halfSize * 0.1} r={halfSize * 0.2} fill="none" stroke="#FFFF00" strokeWidth="1" opacity="0.6" />
          <circle cx={0} cy={halfSize * 0.1} r={halfSize * 0.1} fill="none" stroke="#FFFF00" strokeWidth="1" opacity="0.6" />
        </g>
      );

    default:
      return <circle cx={0} cy={0} r={halfSize} fill="#FF0000" />;
  }
}

SVGEnemy.displayName = 'SVGEnemy';
