import React from 'react';

const SVGFilters: React.FC = () => {
  return (
    <defs>
      {/* Ship Glow Filter */}
      <filter id="shipGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Shield Glow Filter */}
      <filter id="shieldGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Projectile Glow Filter */}
      <filter id="projectileGlow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Explosion Glow Filter */}
      <filter id="explosionGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="8" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Loot Glow Filter */}
      <filter id="lootGlow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Motion Blur Filter (for fast projectiles) */}
      <filter id="motionBlur">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3 0" />
      </filter>
    </defs>
  );
};

export default SVGFilters;
