import { Ship, Particle } from '../types';
import { drawParticle } from '../renderers/particleRenderer';
import { drawMinimap } from '../renderers/minimapRenderer';
import { drawScreenFlash, drawScanlines } from '../renderers/effectsRenderer';

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  drawParticle(particle: Particle): void {
    drawParticle(this.ctx, particle);
  }

  drawMinimap(
    x: number,
    y: number,
    width: number,
    height: number,
    gameWidth: number,
    gameHeight: number,
    playerShip: Ship,
    ships: Map<string, Ship>,
    bases: any[],
    loot: any[]
  ): void {
    drawMinimap(this.ctx, x, y, width, height, gameWidth, gameHeight, playerShip, ships, bases, loot);
  }

  drawScreenFlash(color: string, intensity: number): void {
    drawScreenFlash(this.ctx, color, intensity);
  }

  drawScanlines(intensity: number = 0.1): void {
    drawScanlines(this.ctx, intensity);
  }
}
