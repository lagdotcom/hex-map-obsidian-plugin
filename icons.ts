const iconStyle = `
.line { stroke: currentColor; stroke-width: 5; fill: none; }
`;

type CircleCommand = { type: "circle"; x: number; y: number; r: number };
const cir = (x: number, y: number, r: number): CircleCommand => ({
  type: "circle",
  x,
  y,
  r,
});

type PathCommand = { type: "path"; d: string };
const path = (d: string): PathCommand => ({ type: "path", d });

type PolylineCommand = { type: "polyline"; points: string };
const line = (points: string): PolylineCommand => ({
  type: "polyline",
  points,
});

const iconLibrary = {
  hill: [
    line("10,30 50,10 90,30"),
    line("0,55 50,35 100,55"),
    line("10,80 50,60 90,80"),
  ],
  mountain: [
    line("0,50 15,15 25,30"),
    line("15,80 45,10 60,40"),
    line("60,60 85,15 100,40"),
  ],
  farm: [
    line("20,10 50,20"),
    line("16,18 46,28"),
    line("12,26 42,36"),
    line("8,34 38,44"),
    line("50,56 80,66"),
    line("46,64 76,74"),
    line("42,72 72,82"),
    line("38,80 68,90"),
  ],
  forest: [line("50,90 50,60"), cir(50, 35, 25)],
  forestEvergreen: [line("50,100 50,70 30,70 50,20 70,70 50,70")],
  forestMixed: [
    line("30,100 30,70 10,70 30,20 50,70 30,70"),
    line("70,85 70,55"),
    cir(70, 30, 25),
  ],
  forestDense: [
    line("30,100 30,70"),
    cir(30, 45, 25),
    line("70,85 70,55"),
    cir(70, 30, 25),
  ],
  forestDenseMixed: [
    line("25,100 25,70 5,70 25,20 45,70 25,70"),
    line("40,85 40,55"),
    cir(40, 30, 25),
    line("55,100 55,70 35,70 55,20 75,70 55,70"),
    line("70,85 70,55"),
    cir(70, 30, 25),
  ],
  volcanoExtinct: [
    line("10,100 35,35"),
    line("65,35 90,100"),
    path("M 35 35 A 15 15 0 0 0 65 35"),
  ],
};
export type TerrainIconName = keyof typeof iconLibrary;

export const iconOptions = Object.fromEntries(
  Object.keys(iconLibrary)
    .sort()
    .map((k) => [k, k])
);

export function addTerrainIcon(
  parent: SVGElement,
  x: number,
  y: number,
  size: number,
  icon: TerrainIconName,
  fg: string
) {
  const commands = iconLibrary[icon];
  if (!commands) return;

  const g = parent.createSvg("svg", {
    cls: "terrainIcon",
    attr: {
      viewBox: `0 0 100 100`,
      x: x - size / 2,
      y: y - size / 2,
      width: size,
      height: size,
      color: fg,
    },
  });

  const style = g.createSvg("style");
  style.innerHTML = iconStyle;

  for (const command of commands) {
    switch (command.type) {
      case "polyline":
        g.createSvg("polyline", {
          attr: { class: "line", points: command.points },
        });
        break;

      case "circle":
        g.createSvg("circle", {
          attr: { class: "line", cx: command.x, cy: command.y, r: command.r },
        });
        break;

      case "path":
        g.createSvg("path", { attr: { class: "line", d: command.d } });
        break;
    }
  }

  return g;
}
