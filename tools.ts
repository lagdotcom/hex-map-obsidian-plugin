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

export function asArray<T>(item?: T | T[]) {
  if (typeof item === "undefined") return [];
  if (Array.isArray(item)) return item;
  return [item];
}

export function setMapAdd<K, V>(map: Map<K, Set<V>>, key: K, value: V) {
  const existing = map.get(key);
  if (existing) existing.add(value);
  else map.set(key, new Set<V>([value]));
}
