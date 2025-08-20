export type KeysMatching<T, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];

export function isDefined<T>(value: T | undefined): value is T {
  return typeof value !== "undefined";
}

export function asNumber(value: any, defaultValue: number) {
  const number = Number(value);
  return isNaN(number) ? defaultValue : number;
}
