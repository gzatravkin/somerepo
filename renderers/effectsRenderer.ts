export function drawScreenFlash(ctx: CanvasRenderingContext2D, color: string, intensity: number): void {
  ctx.save();
  ctx.globalAlpha = intensity;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawScanlines(ctx: CanvasRenderingContext2D, intensity: number = 0.1): void {
  ctx.save();
  ctx.globalAlpha = intensity;

  // Horizontal scanlines
  for (let y = 0; y < ctx.canvas.height; y += 3) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, y, ctx.canvas.width, 1);
  }

  // CRT curvature vignette
  const vignetteGradient = ctx.createRadialGradient(
    ctx.canvas.width / 2, ctx.canvas.height / 2, ctx.canvas.width * 0.3,
    ctx.canvas.width / 2, ctx.canvas.height / 2, ctx.canvas.width * 0.7
  );
  vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  ctx.fillStyle = vignetteGradient;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.globalAlpha = 1;
  ctx.restore();
}
