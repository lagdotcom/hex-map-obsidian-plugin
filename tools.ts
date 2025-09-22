export type KeysMatching<T, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];

export function isDefined<T>(value: T | undefined): value is T {
  return typeof value !== "undefined";
}

export function asNumber(value: unknown, defaultValue: number) {
  const number = Number(value);
  return isNaN(number) ? defaultValue : number;
}

export function toInt(v: unknown) {
  const n = Number(v);
  const f = Math.floor(n);
  if (f < n) return NaN;
  return n;
}
