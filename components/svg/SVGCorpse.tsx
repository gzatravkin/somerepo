import React from 'react';
import { Corpse } from '../../types';

interface SVGCorpseProps {
  corpse: Corpse;
  tileSize: number;
}

export const SVGCorpse = React.memo(({ corpse, tileSize }: SVGCorpseProps) => {
  const x = corpse.pixelX;
  const y = corpse.pixelY;
  const size = tileSize * 0.6;

  // Corpse appearance varies by enemy type
  return (
    <g transform={`translate(${x}, ${y})`} opacity={corpse.looted ? 0.3 : 0.7}>
      {/* Blood pool */}
      <ellipse
        cx={0}
        cy={size * 0.3}
        rx={size * 0.8}
        ry={size * 0.4}
        fill="#8B0000"
        opacity="0.6"
      />

      {/* Dead body - simplified silhouette */}
      <ellipse
        cx={0}
        cy={0}
        rx={size * 0.5}
        ry={size * 0.7}
        fill="#2A2A2A"
        stroke="#1A1A1A"
        strokeWidth="1"
      />

      {/* X marks the dead */}
      <g opacity="0.8">
        <line
          x1={-size * 0.2}
          y1={-size * 0.2}
          x2={size * 0.2}
          y2={size * 0.2}
          stroke="#FF0000"
          strokeWidth="2"
        />
        <line
          x1={size * 0.2}
          y1={-size * 0.2}
          x2={-size * 0.2}
          y2={size * 0.2}
          stroke="#FF0000"
          strokeWidth="2"
        />
      </g>

      {/* Loot indicator if not looted */}
      {!corpse.looted && corpse.loot.length > 0 && (
        <g>
          <circle cx={0} cy={-size * 0.8} r={size * 0.15} fill="#FFD700" opacity="0.8" />
          <circle cx={0} cy={-size * 0.8} r={size * 0.25} fill="none" stroke="#FFD700" strokeWidth="1" opacity="0.5" />
          <text
            x={0}
            y={-size * 0.7}
            textAnchor="middle"
            fontSize={size * 0.25}
            fill="#FFD700"
            fontWeight="bold"
          >
            {corpse.loot.length}
          </text>
        </g>
      )}
    </g>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.corpse.looted === nextProps.corpse.looted &&
    prevProps.corpse.pixelX === nextProps.corpse.pixelX &&
    prevProps.corpse.pixelY === nextProps.corpse.pixelY
  );
});

SVGCorpse.displayName = 'SVGCorpse';
