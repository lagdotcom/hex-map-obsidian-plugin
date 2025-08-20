import { sqrt } from "./maths";

export default class Orientation {
  constructor(
    public f0: number,
    public f1: number,
    public f2: number,
    public f3: number,
    public b0: number,
    public b1: number,
    public b2: number,
    public b3: number,
    public startAngle: number,
  ) {}
}

const r3 = sqrt(3);

export const pointy = new Orientation(
  r3,
  r3 / 2,
  0,
  3 / 2,
  r3 / 3,
  -1 / 3,
  0,
  2 / 3,
  0.5,
);

export const flat = new Orientation(
  3 / 2,
  0,
  r3 / 2,
  r3,
  2 / 3,
  0,
  -1 / 3,
  r3 / 3,
  0,
);
