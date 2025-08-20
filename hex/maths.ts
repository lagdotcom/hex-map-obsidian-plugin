export const {
  abs,
  ceil,
  cos,
  floor,
  max,
  min,
  PI: π,
  random,
  round,
  sin,
  sqrt,
} = Math;

export const π2 = π * 2;

export function lerp(a: number, b: number, t: number) {
  return a * (1 - t) + b * t;
}

export function randomPick<T>(items: T[]) {
  const index = floor(random() * items.length);
  return items[index];
}
