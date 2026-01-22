import Point from "./Point";

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

function orientation(p: Point, q: Point, r: Point) {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (val === 0) return "collinear";
  else if (val > 0) return "clockwise";
  else return "anticlockwise";
}

export function jarvisMarch(points: Point[]) {
  if (points.length < 3) throw Error("not enough points for a hull");

  const n = points.length;
  const hull: Point[] = [];

  let leftmost = 0;
  for (let i = 1; i < n; i++) {
    if (points[i].x < points[leftmost].x) leftmost = i;
    else if (
      points[i].x === points[leftmost].x &&
      points[i].y < points[leftmost].y
    )
      leftmost = i;
  }

  let p = leftmost;
  let q = 0;

  do {
    hull.push(points[p]);

    q = (p + 1) % n;
    for (let i = 0; i < n; i++)
      if (orientation(points[p], points[i], points[q]) == "anticlockwise")
        q = i;

    p = q;
  } while (p !== leftmost);

  return hull;
}
