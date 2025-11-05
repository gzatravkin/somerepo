
import { Vector } from '../types';

export const distance = (p1: Vector, p2: Vector): number => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const getRandomColor = (): string => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export const getRandomPosition = (width: number, height: number): Vector => {
    return {
        x: Math.random() * width,
        y: Math.random() * height,
    };
};
