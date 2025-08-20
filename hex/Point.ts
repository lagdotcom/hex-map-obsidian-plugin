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
}
