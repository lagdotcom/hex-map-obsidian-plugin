import { feq, round } from "./maths";

export interface PointLike {
  x: number;
  y: number;
}

export default class Point {
  constructor(
    public x: number,
    public y: number,
  ) {}

  toString() {
    return `${this.x},${this.y}`;
  }

  add(o: PointLike) {
    return new Point(this.x + o.x, this.y + o.y);
  }

  subtract(o: PointLike) {
    return new Point(this.x - o.x, this.y - o.y);
  }

  div(divisor: number) {
    return new Point(this.x / divisor, this.y / divisor);
  }

  eq(o: PointLike) {
    return feq(this.x, o.x) && feq(this.y, o.y);
  }

  lt(o: PointLike) {
    return this.x < o.x || (feq(this.x, o.x) && this.y < o.y);
  }

  round(factor = 1000) {
    return new Point(
      round(this.x * factor) / factor,
      round(this.y * factor) / factor,
    );
  }
}
