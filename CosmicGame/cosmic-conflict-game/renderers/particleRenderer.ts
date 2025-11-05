import { Particle } from '../types';

export function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle): void {
  ctx.save();
  ctx.globalAlpha = particle.alpha;

  switch (particle.type) {
    case 'spark':
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = particle.size * 2;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.fill();
      break;

    case 'smoke':
      const smokeGrad = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size);
      smokeGrad.addColorStop(0, particle.color);
      smokeGrad.addColorStop(1, particle.color + '00');
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = smokeGrad;
      ctx.fill();
      break;

    case 'glow':
      const glowGrad = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 2);
      glowGrad.addColorStop(0, particle.color);
      glowGrad.addColorStop(1, particle.color + '00');
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();
      break;

    case 'debris':
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
      break;
  }

  ctx.shadowBlur = 0;
  ctx.restore();
}
