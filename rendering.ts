import {
  defineHex,
  Grid,
  Hex,
  HexCoordinates,
  Orientation,
  Point,
} from "honeycomb-grid";
import { addTerrainIcon } from "icons";
import { HexMapPluginSettings } from "main";
import { FrontMatterCache, TFile } from "obsidian";
import { getOptions } from "options";
import createPanZoom from "panzoom";
import Soon from "Soon";

function toInt(v: any) {
  const n = Number(v);
  const f = Math.floor(n);
  if (f < n) return NaN;
  return n;
}

const dotPattern = /(\d+)\.(\d+)/;
const commaPattern = /(\d+),(\d+)/;
function getCoords(v: any): HexCoordinates[] | undefined {
  if (Array.isArray(v)) {
    if (v.length === 2) {
      const [col, row] = v.map(toInt);
      if (!isNaN(col) && !isNaN(row)) return [{ col, row }];
    }

    const parsed: HexCoordinates[] = [];
    for (const item of v) {
      const result = getCoords(item);
      if (result) parsed.push(...result);
    }
    return parsed;
  }

  if (typeof v === "string") {
    const dotMatch = dotPattern.exec(v);
    if (dotMatch) {
      const [col, row] = dotMatch.slice(1).map(toInt);
      if (!isNaN(col) && !isNaN(row)) return [{ col, row }];
    }

    const commaMatch = commaPattern.exec(v);
    if (commaMatch) {
      const [col, row] = commaMatch.slice(1).map(toInt);
      if (!isNaN(col) && !isNaN(row)) return [{ col, row }];
    }
  }
}

class CoordManager {
  top: number;
  left: number;
  bot: number;
  right: number;

  constructor(public margin: number) {
    this.bot = -Infinity;
    this.left = Infinity;
    this.right = -Infinity;
    this.top = Infinity;
  }

  get viewLeft() {
    return this.left - this.margin;
  }
  get viewTop() {
    return this.top - this.margin;
  }
  get viewWidth() {
    return this.right - this.left + this.margin * 2;
  }
  get viewHeight() {
    return this.bot - this.top + this.margin * 2;
  }
  get viewBox() {
    return `${this.viewLeft} ${this.viewTop} ${this.viewWidth} ${this.viewHeight}`;
  }

  hexConverter = (p: Point) => {
    const x = p.x;
    const y = p.y;
    this.left = Math.min(this.left, x);
    this.right = Math.max(this.right, x);
    this.top = Math.min(this.top, y);
    this.bot = Math.max(this.bot, y);

    return `${x},${y}`;
  };
}

export default async function renderHexMap(
  settings: HexMapPluginSettings,
  source: string,
  el: HTMLElement
) {
  const options = getOptions(source, settings);
  if (!options.key) {
    el.createSpan({ text: "ERROR: no key=xxx given" });
    return;
  }

  el.classList.add("hexMapContainer");

  const MyHex = defineHex({
    dimensions: options.size,
    orientation: Orientation.FLAT,
  });
  const hexes: Hex[] = [];
  const hexFiles: Map<Hex, TFile> = new Map();
  const hexMatter: Map<Hex, FrontMatterCache> = new Map();
  for (const file of this.app.vault.getMarkdownFiles()) {
    const cached = this.app.metadataCache.getFileCache(file);
    const fm = cached?.frontmatter;
    if (!fm) continue;

    const coords = getCoords(fm[options.key]);
    if (!coords) continue;

    for (const co of coords) {
      const hex = new MyHex(co);
      hexes.push(hex);
      hexFiles.set(hex, file);
      hexMatter.set(hex, fm);
    }
  }

  const grid = Grid.fromIterable(hexes);

  const cm = new CoordManager(options.margin);
  const hexData = grid.toArray().map((hex) => {
    const points = hex.corners.map(cm.hexConverter).join(" ");
    const file = hexFiles.get(hex)!;
    const fm = hexMatter.get(hex)!;

    return {
      hex,
      points,
      name: file.basename,
      path: file.path,
      terrain: fm[options.terrainKey],
      icon: fm[options.iconKey],
    };
  });

  let ignoreClick = false;
  const ignoreReset = new Soon(() => (ignoreClick = false));

  const svg = el.createSvg("svg", {
    cls: "hexMap",
    attr: { viewBox: cm.viewBox },
  });
  for (const { hex, points, name, path, terrain, icon } of hexData) {
    const ts = settings.terrain[terrain ?? "Unknown"];
    if (!ts) console.warn("missing data for " + terrain);

    const g = svg.createSvg("g");

    const title = g.createSvg("title");
    title.textContent = name;

    g.createSvg("polygon", {
      cls: "hex",
      attr: { points, fill: ts?.bg ?? "#222222" },
    }).addEventListener("pointerup", () => {
      if (!ignoreClick) this.app.workspace.openLinkText(name, path);
    });

    if (ts?.icon)
      addTerrainIcon(
        g,
        hex.x,
        hex.y,
        options.terrainIconSize,
        ts.icon,
        ts?.fg ?? "black"
      );

    const coord = g.createSvg("text", {
      cls: "coord",
      attr: {
        x: hex.x,
        y: hex.y + options.coordOffset,
        "font-size": options.coordSize,
      },
    });
    coord.textContent = `${hex.col}.${hex.row}`;

    if (icon) {
      const ie = g.createSvg("text", {
        cls: "icon",
        attr: {
          x: hex.x,
          y: hex.y,
          "font-size": options.iconSize,
        },
      });
      ie.textContent = icon;
    }
  }

  const pz = createPanZoom(svg, { minZoom: 0.5, maxZoom: 3 });
  pz.on("panstart", () => {
    el.classList.add("panning");
    ignoreClick = true;
  });
  pz.on("panend", () => {
    el.classList.remove("panning");
    ignoreReset.schedule();
  });
  pz.on("zoom", () => (ignoreClick = true));
  pz.on("zoomend", () => ignoreReset.schedule());
}
