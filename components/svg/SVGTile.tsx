import React from 'react';
import { Tile } from '../../types';

interface SVGTileProps {
  tile: Tile;
  tileSize: number;
}

export const SVGTile = React.memo(({ tile, tileSize }: SVGTileProps) => {
  const x = tile.x * tileSize;
  const y = tile.y * tileSize;

  if (tile.type === 'WALL') {
    const variant = tile.variant || 0;
    const stoneColors = ['#5A5A5A', '#4A4A4A', '#6A6A6A'];
    const baseColor = stoneColors[variant % 3];

    return (
      <g>
        {/* Wall block with stone texture */}
        <defs>
          <linearGradient id={`wall-grad-${tile.x}-${tile.y}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={baseColor} />
            <stop offset="50%" stopColor="#3A3A3A" />
            <stop offset="100%" stopColor={baseColor} />
          </linearGradient>
        </defs>
        <rect
          x={x}
          y={y}
          width={tileSize}
          height={tileSize}
          fill={`url(#wall-grad-${tile.x}-${tile.y})`}
          stroke="#2A2A2A"
          strokeWidth="1"
        />
        {/* Stone cracks for detail */}
        <line
          x1={x + tileSize * 0.2}
          y1={y}
          x2={x + tileSize * 0.3}
          y2={y + tileSize}
          stroke="#1A1A1A"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1={x + tileSize * 0.7}
          y1={y}
          x2={x + tileSize * 0.6}
          y2={y + tileSize}
          stroke="#1A1A1A"
          strokeWidth="1"
          opacity="0.5"
        />
      </g>
    );
  }

  if (tile.type === 'FLOOR' || tile.type === 'ENTRANCE' || tile.type === 'EXIT') {
    const variant = tile.variant || 0;
    const floorColors = ['#2F2F2F', '#3F3F3F', '#353535', '#2A2A2A'];
    const baseColor = floorColors[variant % 4];

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={tileSize}
          height={tileSize}
          fill={baseColor}
          stroke="#252525"
          strokeWidth="0.5"
        />
        {/* Floor details */}
        {variant % 2 === 0 && (
          <circle
            cx={x + tileSize / 2}
            cy={y + tileSize / 2}
            r={tileSize * 0.1}
            fill="#454545"
            opacity="0.3"
          />
        )}
        {/* Special markers */}
        {tile.type === 'ENTRANCE' && (
          <>
            <circle cx={x + tileSize / 2} cy={y + tileSize / 2} r={tileSize * 0.3} fill="#00FF00" opacity="0.3" />
            <text
              x={x + tileSize / 2}
              y={y + tileSize / 2 + 4}
              textAnchor="middle"
              fontSize={tileSize * 0.4}
              fill="#00FF00"
              fontWeight="bold"
            >
              ↓
            </text>
          </>
        )}
        {tile.type === 'EXIT' && (
          <>
            <circle cx={x + tileSize / 2} cy={y + tileSize / 2} r={tileSize * 0.3} fill="#FFD700" opacity="0.3" />
            <text
              x={x + tileSize / 2}
              y={y + tileSize / 2 + 4}
              textAnchor="middle"
              fontSize={tileSize * 0.4}
              fill="#FFD700"
              fontWeight="bold"
            >
              ↑
            </text>
          </>
        )}
      </g>
    );
  }

  return null;
}, (prevProps, nextProps) => {
  return prevProps.tile === nextProps.tile && prevProps.tileSize === nextProps.tileSize;
});

SVGTile.displayName = 'SVGTile';
