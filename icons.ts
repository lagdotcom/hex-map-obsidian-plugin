const iconStyle = `
.line { stroke: currentColor; stroke-width: 5; fill: none; }
`;

const cir = (x: number, y: number, r: number, className = "line") =>
  `<circle class="${className}" cx=${x} cy=${y} r=${r} />`;
const path = (d: string, className = "line") =>
  `<path class="${className}" d="${d}" />`;
const line = (points: string, className = "line") =>
  `<polyline class="${className}" points="${points}" />`;

function renderIcon(commands: string[]) {
  return `<style>${iconStyle}</style>` + commands.join("");
}

const iconLibrary = {
  hill: renderIcon([
    line("10,30 50,10 90,30"),
    line("0,55 50,35 100,55"),
    line("10,80 50,60 90,80"),
  ]),
  mountain: renderIcon([
    line("0,50 15,15 25,30"),
    line("15,80 45,10 60,40"),
    line("60,60 85,15 100,40"),
  ]),
  farm: renderIcon([
    line("20,10 50,20"),
    line("16,18 46,28"),
    line("12,26 42,36"),
    line("8,34 38,44"),
    line("50,56 80,66"),
    line("46,64 76,74"),
    line("42,72 72,82"),
    line("38,80 68,90"),
  ]),
  fen: renderIcon([
    line("35,60 20,45"),
    line("42,52 30,35"),
    line("50,50 50,27"),
    line("58,52 70,35"),
    line("65,60 80,45"),
  ]),
  forest: renderIcon([line("50,90 50,60"), cir(50, 35, 25)]),
  forestEvergreen: renderIcon([line("50,100 50,70 30,70 50,20 70,70 50,70")]),
  forestFen: renderIcon([
    line("70,83 70,53"),
    cir(70, 28, 25),
    line("20,77 5,62"),
    line("27,69 15,52"),
    line("35,67 35,44"),
    line("43,69 55,52"),
    line("50,77 65,62"),
  ]),
  forestMixed: renderIcon([
    line("30,100 30,70 10,70 30,20 50,70 30,70"),
    line("70,85 70,55"),
    cir(70, 30, 25),
  ]),
  forestDense: renderIcon([
    line("30,100 30,70"),
    cir(30, 45, 25),
    line("70,85 70,55"),
    cir(70, 30, 25),
  ]),
  forestDenseMixed: renderIcon([
    line("25,100 25,70 5,70 25,20 45,70 25,70"),
    line("40,85 40,55"),
    cir(40, 30, 25),
    line("55,100 55,70 35,70 55,20 75,70 55,70"),
    line("70,85 70,55"),
    cir(70, 30, 25),
  ]),
  volcanoExtinct: renderIcon([
    line("10,100 35,35"),
    line("65,35 90,100"),
    path("M 35 35 A 15 15 0 0 0 65 35"),
  ]),
};
export type TerrainIconName = keyof typeof iconLibrary;

export const iconOptions = Object.fromEntries(
  Object.keys(iconLibrary)
    .sort()
    .map((k) => [k, k]),
);

export function addTerrainIcon(
  parent: SVGElement,
  x: number,
  y: number,
  size: number,
  icon: TerrainIconName,
  fg: string,
) {
  const html = iconLibrary[icon];
  if (!html) return;

  const g = parent.createSvg("svg", {
    attr: {
      viewBox: `0 0 100 100`,
      x: x - size / 2,
      y: y - size / 2,
      width: size,
      height: size,
      color: fg,
    },
  });
  g.innerHTML = html;

  return g;
}
