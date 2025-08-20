// thanks https://www.redblobgames.com/grids/hexagons/implementation.html

import { abs, floor, lerp, max, round } from "./maths";
import OffsetCoordinates from "./OffsetCoordinates";

const epsilon = 1e-6;
const epsilon2 = epsilon * 2;

export interface HexLike {
  q: number;
  r: number;
  s: number;
}

export default class Hex {
  constructor(public q: number, public r: number, public s = -q - r) {}

  static fromQOffsetCoordinates(offset: 1 | -1, h: OffsetCoordinates) {
    const q = h.col;
    const r = h.row - round((h.col + offset * (h.col & 1)) / 2);
    return new Hex(q, r);
  }

  toString() {
    return `${this.q},${this.r},${this.s}`;
  }

  equals(other: HexLike) {
    return this.q === other.q && this.r === other.r && this.s === other.s;
  }

  add(other: HexLike) {
    return new Hex(this.q + other.q, this.r + other.r, this.s + other.s);
  }
  subtract(other: HexLike) {
    return new Hex(this.q - other.q, this.r - other.r, this.s - other.s);
  }

  length() {
    return floor((abs(this.q) + abs(this.r) + abs(this.s)) / 2);
  }
  distance(other: HexLike) {
    return this.subtract(other).length();
  }

  static direction(dir: Direction) {
    return directions[dir];
  }
  neighbour(dir: Direction) {
    return this.add(directions[dir]);
  }

  round() {
    let q = round(this.q);
    let r = round(this.r);
    let s = round(this.s);

    const qDiff = abs(q - this.q);
    const rDiff = abs(r - this.r);
    const sDiff = abs(s - this.s);

    if (qDiff > rDiff && qDiff > sDiff) q = -r - s;
    else if (rDiff > sDiff) r = -q - s;
    else s = -q - r;

    return new Hex(q, r, s);
  }

  lerp(o: HexLike, t: number) {
    return new Hex(
      lerp(this.q, o.q, t),
      lerp(this.r, o.r, t),
      lerp(this.s, o.s, t)
    );
  }

  line(o: HexLike) {
    const n = this.distance(o);
    const aNudge = new Hex(
      this.q + epsilon,
      this.r + epsilon,
      this.s - epsilon2
    );
    const bNudge = new Hex(o.q + epsilon, o.r + epsilon, o.s - epsilon2);
    const step = 1 / max(n, 1);

    return new Array(n).map((_, i) => aNudge.lerp(bNudge, step * i).round());
  }

  toOffsetCoordinates(offset: 1 | -1 = 1): OffsetCoordinates {
    const col: number = this.q;
    const row = this.r + floor((this.q + offset * (this.q & 1)) / 2);
    return { col, row };
  }
}

const directions = [
  new Hex(1, 0, -1),
  new Hex(1, -1, 0),
  new Hex(0, -1, 1),
  new Hex(-1, 0, 1),
  new Hex(-1, 1, 0),
  new Hex(0, 1, -1),
];
export type Direction = 0 | 1 | 2 | 3 | 4 | 5;
