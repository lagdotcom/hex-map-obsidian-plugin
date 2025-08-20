import Hex from "hex/Hex";
import Layout from "hex/Layout";
import OffsetCoordinates from "hex/OffsetCoordinates";
import { flat, pointy } from "hex/Orientation";
import Point from "hex/Point";
import { addTerrainIcon } from "icons";
import { App } from "obsidian";
import { getOptions, HexMapOptions } from "options";
import createPanZoom from "panzoom";
import { HexMapPluginSettings } from "settings";
import Soon from "Soon";
import { asNumber, isDefined } from "tools";

function toInt(v: any) {
  const n = Number(v);
  const f = Math.floor(n);
  if (f < n) return NaN;
  return n;
}

const dotPattern = /(\d+)\.(\d+)/;
const commaPattern = /(\d+),(\d+)/;
function getCoords(v: any): OffsetCoordinates[] | undefined {
  if (Array.isArray(v)) {
    if (v.length === 2) {
      const [col, row] = v.map(toInt);
      if (!isNaN(col) && !isNaN(row)) return [{ col, row }];
    }

    const parsed: OffsetCoordinates[] = [];
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
    this.left = Math.min(this.left, p.x);
    this.right = Math.max(this.right, p.x);
    this.top = Math.min(this.top, p.y);
    this.bot = Math.max(this.bot, p.y);
    return p.toString();
  };
}

const riverPattern = /river:(?:(\d+):)?(.*)*/gi;
const coordPattern = /(\d+)\.(\d+)/gi;
function* getRivers(source: string, options: HexMapOptions) {
  for (const [, rawWidth, path] of source.matchAll(riverPattern)) {
    yield {
      width: asNumber(rawWidth, options.riverWidth),
      coords: Array.from(path.matchAll(coordPattern)).map(([, col, row]) => ({
        col: Number(col),
        row: Number(row),
      })),
    };
  }
}

export default async function renderHexMap(
  app: App,
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

  const layout = new Layout(
    options.orientation === "flat" ? flat : pointy,
    new Point(options.size, options.size)
  );
  const offset = options.offset === "even" ? 1 : -1;
  const cm = new CoordManager(options.margin);

  const hexData = app.vault
    .getMarkdownFiles()
    .flatMap((file) => {
      const cached = app.metadataCache.getFileCache(file);
      const fm = cached?.frontmatter;
      if (!fm) return;

      const coords = getCoords(fm[options.key]);
      if (!coords) return;

      return coords.map((co) => {
        const hex = Hex.fromQOffsetCoordinates(offset, co);
        const { x, y } = layout.toPixel(hex);
        const { col, row } = co;
        const points = layout
          .getPolygonCorners(hex)
          .map(cm.hexConverter)
          .join(" ");

        return {
          x,
          y,
          col,
          row,
          points,
          name: file.basename,
          path: file.path,
          terrain: fm[options.terrainKey],
          icon: fm[options.iconKey],
        };
      });
    })
    .filter(isDefined);

  let ignoreClick = false;
  const ignoreReset = new Soon(() => (ignoreClick = false));

  const svg = el.createSvg("svg", {
    cls: "hexMap",
    attr: { viewBox: cm.viewBox },
  });

  const gTerrain = svg.createSvg("g", { cls: "terrain" });
  const gTerrainIcons = svg.createSvg("g", { cls: "terrainIcons" });
  const gRivers = svg.createSvg("g", { cls: "rivers" });
  const gCoords = svg.createSvg("g", { cls: "coords" });
  const gIcons = svg.createSvg("g", { cls: "icons" });

  for (const { x, y, col, row, points, name, path, terrain, icon } of hexData) {
    const ts = settings.terrain[terrain ?? "Unknown"];
    if (!ts) console.warn("missing data for " + terrain);

    const polygon = gTerrain.createSvg("polygon", {
      attr: { points, fill: ts?.bg ?? "#222222" },
    });
    polygon.addEventListener("pointerup", () => {
      if (!ignoreClick) this.app.workspace.openLinkText(name, path);
    });

    const title = polygon.createSvg("title");
    title.textContent = name;

    if (ts?.icon)
      addTerrainIcon(
        gTerrainIcons,
        x,
        y,
        options.terrainIconSize,
        ts.icon,
        ts?.fg ?? "black"
      );

    const coord = gCoords.createSvg("text", {
      attr: { x, y: y + options.coordOffset, "font-size": options.coordSize },
    });
    coord.textContent = `${col}.${row}`;

    if (icon) {
      const ie = gIcons.createSvg("text", {
        attr: { x, y, "font-size": options.iconSize },
      });
      ie.textContent = icon;
    }
  }

  for (const { width, coords } of getRivers(source, options))
    gRivers.createSvg("polyline", {
      attr: {
        stroke: options.riverColour,
        "stroke-width": width,
        points: coords
          .map((co) => layout.toPixel(Hex.fromQOffsetCoordinates(offset, co)))
          .map((p) => p.toString())
          .join(" "),
      },
    });

  const pz = createPanZoom(svg, {
    minZoom: 0.5,
    maxZoom: 3,
    beforeWheel: () => ignoreReset.schedule(),
  });
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
