import { Ship } from '../types';

export function drawMinimap(
  ctx: CanvasRenderingContext2D,
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
  ctx.save();
  ctx.translate(x, y);

  // Background
  ctx.fillStyle = 'rgba(0, 0, 20, 0.7)';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#00BFFF';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, width, height);

  const scaleX = width / gameWidth;
  const scaleY = height / gameHeight;

  // Draw bases
  bases.forEach(base => {
    const mapX = base.x * scaleX;
    const mapY = base.y * scaleY;
    ctx.beginPath();
    ctx.arc(mapX, mapY, 4, 0, Math.PI * 2);
    ctx.fillStyle = base.color;
    ctx.fill();
  });

  // Draw loot
  loot.forEach(l => {
    const mapX = l.x * scaleX;
    const mapY = l.y * scaleY;
    ctx.beginPath();
    ctx.arc(mapX, mapY, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fill();
  });

  // Draw ships
  ships.forEach(ship => {
    const mapX = ship.x * scaleX;
    const mapY = ship.y * scaleY;

    ctx.beginPath();
    ctx.arc(mapX, mapY, ship.isPlayer ? 3 : 2, 0, Math.PI * 2);
    ctx.fillStyle = ship.isPlayer ? '#00FF00' : ship.isElite ? '#FF0000' : '#FF8800';
    ctx.fill();

    if (ship.isPlayer) {
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });

  ctx.restore();
}
