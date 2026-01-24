import broken from "./icons/broken.svg";
import dots from "./icons/dots.svg";
import farm from "./icons/farm.svg";
import fen from "./icons/fen.svg";
import forest from "./icons/forest.svg";
import forestDense from "./icons/forestDense.svg";
import forestDenseMixed from "./icons/forestDenseMixed.svg";
import forestEvergreen from "./icons/forestEvergreen.svg";
import forestFen from "./icons/forestFen.svg";
import forestMixed from "./icons/forestMixed.svg";
import hill from "./icons/hill.svg";
import mountain from "./icons/mountain.svg";
import volcanoExtinct from "./icons/volcanoExtinct.svg";

const iconLibrary = {
  broken,
  dots,
  farm,
  fen,
  forest,
  forestDense,
  forestDenseMixed,
  forestEvergreen,
  forestFen,
  forestMixed,
  hill,
  mountain,
  volcanoExtinct,
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
