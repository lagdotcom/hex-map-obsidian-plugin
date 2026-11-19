import broken from "./icons/broken.svg";
import deadTree from "./icons/deadTree.svg";
import dots from "./icons/dots.svg";
import farm from "./icons/farm.svg";
import fen from "./icons/fen.svg";
import forest from "./icons/forest.svg";
import forestDense from "./icons/forestDense.svg";
import forestDenseMixed from "./icons/forestDenseMixed.svg";
import forestEvergreen from "./icons/forestEvergreen.svg";
import forestFen from "./icons/forestFen.svg";
import forestMixed from "./icons/forestMixed.svg";
import grass from "./icons/grass.svg";
import hill from "./icons/hill.svg";
import jungle from "./icons/jungle.svg";
import mountain from "./icons/mountain.svg";
import volcanoExtinct from "./icons/volcanoExtinct.svg";

const iconLibrary = {
  broken,
  deadTree,
  dots,
  farm,
  fen,
  forest,
  forestDense,
  forestDenseMixed,
  forestEvergreen,
  forestFen,
  forestMixed,
  grass,
  hill,
  jungle,
  mountain,
  volcanoExtinct,
};
export type TerrainIconName = keyof typeof iconLibrary;

export const iconOptions = Object.fromEntries(
  Object.keys(iconLibrary)
    .sort()
    .map((k) => [k, k]),
);

const getSymbolId = (icon: TerrainIconName, prefix: string = "") =>
  `${prefix}symbol-${CSS.escape(icon)}`;

export function addTerrainSymbols(
  parent: SVGElement,
  mapId: string,
  size: number,
) {
  for (const [icon, html] of Object.entries(iconLibrary)) {
    const id = getSymbolId(icon as TerrainIconName, mapId);

    const g = parent.createSvg("symbol", {
      attr: { id, viewBox: `0 0 100 100`, width: size, height: size },
    });
    g.innerHTML = html;
  }
}

export function useTerrainSymbol(
  parent: SVGElement,
  mapId: string,
  x: number,
  y: number,
  size: number,
  icon: TerrainIconName,
  fg: string,
) {
  return parent.createSvg("use", {
    attr: {
      href: getSymbolId(icon, "#" + mapId),
      x: x - size / 2,
      y: y - size / 2,
      color: fg,
    },
  });
}
