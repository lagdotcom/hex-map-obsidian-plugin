import type Hex from "./Hex";
import type Layout from "./Layout";
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

const delta = 0.001;
export function feq(a: number, b: number) {
  return abs(a - b) < delta;
}

class Edge {
  a: Point;
  b: Point;

  constructor(a: Point, b: Point) {
    this.a = a;
    this.b = b;
  }

  get key() {
    const a = this.a.round().toString();
    const b = this.b.round().toString();
    return this.a.lt(this.b) ? `${a}-${b}` : `${b}-${a}`;
  }

  eq(o: Edge) {
    return this.a.eq(o.a) && this.b.eq(o.b);
  }

  eqUnordered(o: Edge) {
    return this.eq(o) || (this.b.eq(o.a) && this.a.eq(o.b));
  }
}

export function edgeWalk(layout: Layout, selected: Set<Hex>) {
  const edgeCount = new Map<string, number>();
  const edges: Edge[] = [];

  for (const hex of selected) {
    const vertices = layout.getPolygonCorners(hex);
    for (let i = 0; i < 6; i++) {
      const a = vertices[i];
      const b = vertices[(i + 1) % 6];
      const edge = new Edge(a, b);

      if (edgeCount.has(edge.key))
        edgeCount.set(edge.key, edgeCount.get(edge.key)! + 1);
      else {
        edgeCount.set(edge.key, 1);
        edges.push(edge);
      }
    }
  }

  const boundary = edges.filter((e) => edgeCount.get(e.key)! === 1);

  const polygons: Point[][] = [];
  while (boundary.length) {
    const edge = boundary.shift()!;
    const polygon = [edge.a, edge.b];
    let current = edge.b;

    while (true) {
      const next = boundary.find((e) => e.a.eq(current));
      if (!next) throw Error("wat");
      boundary.remove(next);

      current = next.b;
      if (current.eq(polygon[0])) break;
      polygon.push(current);
    }

    polygons.push(polygon);
  }
  return polygons;
}
