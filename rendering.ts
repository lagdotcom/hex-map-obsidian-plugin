import { App, type FrontmatterLinkCache, type TFile } from "obsidian";
import createPanZoom from "panzoom";

import Hex from "./hex/Hex";
import Layout from "./hex/Layout";
import { edgeWalk, getMidpoint } from "./hex/maths";
import { flat, pointy } from "./hex/Orientation";
import Point from "./hex/Point";
import { addTerrainSymbols, useTerrainSymbol } from "./icons";
import {
  getCoords,
  getOptions,
  type HexMapOptions,
  type MapZone,
} from "./parsing";
import { HexMapPluginSettings } from "./settings";
import { isDefined, setMapAdd } from "./tools";

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

  addToBounds = (p: Point) => {
    this.left = Math.min(this.left, p.x);
    this.right = Math.max(this.right, p.x);
    this.top = Math.min(this.top, p.y);
    this.bot = Math.max(this.bot, p.y);
  };

  centre = () =>
    new Point((this.right + this.left) / 2, (this.bot + this.top) / 2);
}

function makeDisplayToggle({
  parent,
  g,
  items,
  text,
  prepend,
  value,
}: {
  parent: HTMLElement;
  g: SVGElement;
  items?: HTMLElement;
  text: string;
  prepend?: boolean;
  value?: boolean;
}) {
  const label = parent.createEl("label", { prepend });
  const input = label.createEl("input", {
    attr: { type: "checkbox", checked: true },
  });

  const onChange = () => {
    g.style.display = input.checked ? "" : "none";
    if (items) items.style.display = input.checked ? "" : "none";
  };

  input.addEventListener("change", onChange);
  label.createEl("span", { text });

  if (value === false) {
    input.checked = false;
    onChange();
  }

  return label;
}

class Border {
  g: SVGGElement;

  constructor(
    public parent: SVGGElement,
    public tag: string,
    public colour: string,
    public thickness: number,
  ) {
    this.g = parent.createSvg("g", {
      attr: { stroke: colour, "stroke-width": thickness },
    });
    this.g.dataset["tag"] = tag;
  }

  addToPanel(panel: HTMLElement) {
    if (this.g.childElementCount)
      makeDisplayToggle({ parent: panel, g: this.g, text: this.tag });
  }
}

class Overlay {
  g: SVGGElement;

  constructor(
    public parent: SVGGElement,
    public tag: string,
    public fill: string,
    public opacity: number,
  ) {
    this.g = parent.createSvg("g", { attr: { fill, opacity } });
    this.g.dataset["tag"] = tag;
  }

  addToPanel(panel: HTMLElement) {
    if (this.g.childElementCount)
      makeDisplayToggle({ parent: panel, g: this.g, text: this.tag });
  }
}

class Zone {
  cm: CoordManager;
  g: SVGGElement;
  gHexes: SVGGElement;
  hexen: Set<Hex>;
  points: Point[];

  constructor(
    public parent: SVGElement,
    public label: string,
    public tag: string,
    public fill: string,
    public opacity: number,
  ) {
    this.g = parent.createSvg("g");
    this.g.dataset["tag"] = tag;
    this.gHexes = this.g.createSvg("g", {
      attr: { stroke: fill, fill, "fill-opacity": opacity },
    });
    this.cm = new CoordManager(0);
    this.hexen = new Set();
    this.points = [];
  }

  apply(zone: MapZone) {
    this.label = zone.label;
    this.tag = zone.tag;
    this.fill = zone.bg;
    this.gHexes.setAttribute("stroke", this.fill);
    this.gHexes.setAttribute("fill", this.fill);
    if (isDefined(zone.opacity)) {
      this.opacity = zone.opacity;
      this.gHexes.setAttr("fill-opacity", zone.opacity);
    }
  }

  add(hex: Hex, point: Point) {
    this.cm.addToBounds(point);
    this.hexen.add(hex);
    this.points.push(point);
  }

  addToPanel(panel: HTMLElement) {
    makeDisplayToggle({ parent: panel, g: this.g, text: this.label });
  }

  getCentrePoint() {
    const p = this.cm.centre();
    return [p.x.toString(), p.y.toString()];
  }
}

function addPanelSection<T extends { addToPanel(el: HTMLElement): void }>(
  panel: HTMLElement,
  g: SVGGElement,
  things: T[],
  label: string,
) {
  const section = panel.createEl("section");
  const items = section.createDiv({ cls: "list" });
  for (const t of things) t.addToPanel(items);
  if (!items.childElementCount) section.remove();
  else
    makeDisplayToggle({
      parent: section,
      g,
      items,
      text: label,
      prepend: true,
    }).classList.add("heading");
}

function toPointsString(p: Point[]) {
  return p.map((p) => p.toString()).join(" ");
}

type HexFilter = (hex: Hex) => boolean;

interface ZoneInfo {
  id: string;
  name: string;
  colour?: string;
  opacity?: number;
}

type InfoResolver = (link: FrontmatterLinkCache, src: string) => ZoneInfo;

interface HexInfo {
  hex: Hex;
  x: number;
  y: number;
  col: number;
  row: number;
  corners: Point[];
  points: string;
  name: string;
  path: string;
  terrain: string;
  icon: string;
  tags: string[];
  regions: ZoneInfo[];
  controllers: ZoneInfo[];
}

function extractLinks(key: string, links?: FrontmatterLinkCache[]) {
  const pattern = new RegExp(`^${key}(\\.\\d+)?$`);
  return links ? links.filter((l) => l.key.match(pattern)) : [];
}

function getHexDataFromVault({
  app,
  options,
  offset,
  layout,
  cm,
  resolveControllerLink,
  resolveRegionLink,
  shouldExclude,
}: {
  app: App;
  options: HexMapOptions;
  offset: 1 | -1;
  layout: Layout;
  cm: CoordManager;
  resolveControllerLink: InfoResolver;
  resolveRegionLink: InfoResolver;
  shouldExclude?: HexFilter;
}): HexInfo[] {
  const usedCoords = new Map<string, string>();

  return app.vault
    .getMarkdownFiles()
    .flatMap((file) => {
      const cached = app.metadataCache.getFileCache(file);
      const fm = cached?.frontmatter;
      if (!fm) return;

      const coords = getCoords(fm[options.key]);
      if (!coords) return;

      return coords.map((co) => {
        const hex = Hex.fromQOffsetCoordinates(offset, co);
        if (shouldExclude?.(hex)) return undefined;

        const { x, y } = layout.toPixel(hex);
        const { col, row } = co;
        const corners = layout.getPolygonCorners(hex);
        for (const corner of corners) cm.addToBounds(corner);

        const tags = ((fm.tags ?? []) as string[])
          .map((tag) => `#${tag}`)
          .concat((cached.tags ?? []).map((t) => t.tag));

        const coord = `${col}.${row}`;
        const prev = usedCoords.get(coord);
        if (prev) {
          console.warn(`${coord} used by ${prev}, skipping ${file.basename}`);
          return;
        }
        usedCoords.set(coord, file.basename);

        return {
          hex,
          x,
          y,
          col,
          row,
          corners,
          points: toPointsString(corners),
          name: file.basename,
          path: file.path,
          terrain: fm[options.terrainKey],
          icon: fm[options.iconKey],
          tags,
          regions: extractLinks(options.regionKey, cached.frontmatterLinks).map(
            (link) => resolveRegionLink(link, file.path),
          ),
          controllers: extractLinks(
            options.controllerKey,
            cached.frontmatterLinks,
          ).map((link) => resolveControllerLink(link, file.path)),
        };
      });
    })
    .filter(isDefined);
}

interface RiverNode {
  hex: Hex;
  thickness: number;
}

interface RiverInfo {
  name: string;
  path: string;
  nodes: RiverNode[];
}

function getRiverDataFromVault({
  app,
  offset,
  options,
}: {
  app: App;
  offset: 1 | -1;
  options: HexMapOptions;
}): RiverInfo[] {
  const key = options.key + ".river";

  return app.vault
    .getMarkdownFiles()
    .map((file) => {
      const cached = app.metadataCache.getFileCache(file);
      const fm = cached?.frontmatter;
      if (!fm) return;

      const course = fm[key];
      if (!course) return;

      let thickness = 3;
      const nodes: RiverNode[] = [];
      for (const item of course as string[]) {
        if (item.startsWith("T")) {
          thickness = parseInt(item.slice(1));
          continue;
        } else if (item.startsWith("[[")) {
          const other = app.metadataCache.getFirstLinkpathDest(
            item.slice(2, -2),
            file.path,
          );
          if (other) {
            const otherFm = app.metadataCache.getFileCache(other)?.frontmatter;
            if (otherFm) {
              const coords = getCoords(otherFm[options.key]);
              if (coords) {
                const hex = Hex.fromQOffsetCoordinates(offset, coords[0]);
                nodes.push({ hex, thickness });
                continue;
              }
            }
          }
        } else {
          const coords = getCoords(item);
          if (coords && coords.length === 1) {
            const hex = Hex.fromQOffsetCoordinates(offset, coords[0]);
            nodes.push({ hex, thickness });
            continue;
          }
        }

        console.warn(`unknown river course item: ${item}`);
      }

      return { name: file.basename, path: file.path, nodes };
    })
    .filter(isDefined);
}

declare global {
  interface DataViewTable<T> {
    type: "table";
    headers: string[];
    values: T[];
  }

  interface DataViewPluginAPI {
    query<T>(query: string): Promise<{ value: DataViewTable<T> }>;
  }

  interface Window {
    DataviewAPI: DataViewPluginAPI;
  }
}

async function getHexDataFromDataView({
  options,
  offset,
  layout,
  cm,
  shouldExclude,
}: {
  options: HexMapOptions;
  offset: 1 | -1;
  layout: Layout;
  cm: CoordManager;
  shouldExclude?: HexFilter;
}): Promise<HexInfo[]> {
  const usedCoords = new Map<string, string>();

  return (
    await window.DataviewAPI.query<
      [
        file: TFile,
        coords: string[],
        tags: string[] | null,
        etags: string[] | null,
        terrain: string | null,
        icon: string | null,
      ]
    >(
      `TABLE ${options.key}, tags, file.etags, terrain, icon WHERE ${options.key}`,
    )
  ).value.values
    .flatMap(
      ([file, coordsField, tagsField, fileTags, terrainField, iconField]) => {
        const coords = getCoords(coordsField);
        if (!coords) return;

        return coords.map((co) => {
          const hex = Hex.fromQOffsetCoordinates(offset, co);
          if (shouldExclude?.(hex)) return undefined;

          const { x, y } = layout.toPixel(hex);
          const { col, row } = co;
          const corners = layout.getPolygonCorners(hex);
          for (const corner of corners) cm.addToBounds(corner);

          const tags = ((tagsField ?? []) as string[])
            .map((tag) => `#${tag}`)
            .concat(fileTags ?? []);
          const coord = `${col}.${row}`;
          const prev = usedCoords.get(coord);
          if (prev) {
            console.warn(`${coord} used by ${prev}, skipping ${file.basename}`);
            return;
          }
          usedCoords.set(coord, file.basename);

          return {
            hex,
            x,
            y,
            col,
            row,
            corners,
            points: toPointsString(corners),
            name: file.basename,
            path: file.path,
            terrain: terrainField ?? "UNKNOWN",
            icon: iconField ?? "",
            tags,
            regions: [], // TODO
            controllers: [], // TODO
          };
        });
      },
    )
    .filter(isDefined);
}

const getMaxDistanceFilter =
  (matches: Hex[], max: number): HexFilter =>
  (hex) =>
    matches.find((ma) => ma.distance(hex) <= max) ? false : true;

export default async function renderHexMap(
  app: App,
  mapId: string,
  settings: HexMapPluginSettings,
  source: string,
  el: HTMLElement,
  sourcePath: string,
) {
  const start = performance.now();

  const die = (text: string) => el.createSpan({ text, cls: "error" });

  const options = getOptions(source, settings);
  if (!options.key) return die("no key=xxx given");

  const hmc = el.createDiv({ cls: "hexMapContainer" });

  const layout = new Layout(
    options.orientation === "flat" ? flat : pointy,
    new Point(options.size, options.size),
  );
  const offset = options.offset === "even" ? 1 : -1;
  const cm = new CoordManager(options.margin);

  const riverData = getRiverDataFromVault({ app, offset, options });

  let matchedHexes: Hex[] = [];
  if (options.centre) {
    if (
      typeof options.centre === "string" &&
      options.centre.toLowerCase() === "this"
    ) {
      const sourceFile = app.vault.getFileByPath(sourcePath);
      if (!sourceFile) return die("cannot use 'this': not in a file???");

      const fm = app.metadataCache.getFileCache(sourceFile)?.frontmatter;
      if (!fm) return die("cannot use 'this': no frontmatter");

      const coords = getCoords(fm[options.key]);
      const thisRiver = riverData.find((r) => r.path === sourcePath);

      if (coords)
        matchedHexes = coords.map((co) =>
          Hex.fromQOffsetCoordinates(offset, co),
        );
      else if (thisRiver) matchedHexes = thisRiver.nodes.map((co) => co.hex);
      else return die("cannot use 'this': invalid coords");
    } else {
      const coords = getCoords(options.centre);
      if (!coords) return die(`cannot parse coords: ${options.centre}`);

      matchedHexes = coords.map((co) => Hex.fromQOffsetCoordinates(offset, co));
    }
  }

  const shouldExclude = matchedHexes.length
    ? getMaxDistanceFilter(matchedHexes, options.maxDistance ?? 1)
    : undefined;

  const regionMap = new Map<string, ZoneInfo>();
  const zoneMap = new Map<string, ZoneInfo>();

  const resolveLink =
    (map: Map<string, ZoneInfo>) =>
    (link: FrontmatterLinkCache, src: string) => {
      const previous = map.get(link.link);
      if (previous) return previous;

      const path = app.metadataCache.getFirstLinkpathDest(link.link, src);
      const fm = path
        ? app.metadataCache.getFileCache(path)?.frontmatter
        : undefined;

      const info: ZoneInfo = {
        id: path?.path ?? link.link,
        name: link.displayText ?? link.link,
        colour: fm?.colour,
        opacity: fm?.opacity,
      };

      map.set(link.link, info);
      return info;
    };

  const resolveRegionLink = resolveLink(regionMap);
  const resolveControllerLink = resolveLink(zoneMap);

  const hexData =
    "DataviewAPI" in window && options.useDataView
      ? await getHexDataFromDataView({
          shouldExclude,
          cm,
          layout,
          offset,
          options,
        })
      : getHexDataFromVault({
          app,
          resolveControllerLink,
          resolveRegionLink,
          shouldExclude,
          cm,
          layout,
          offset,
          options,
        });

  const svg = hmc.createSvg("svg", {
    cls: "hexMap",
    attr: { viewBox: cm.viewBox },
  });
  if (isDefined(options.maxWidth)) svg.style.maxWidth = options.maxWidth;
  if (isDefined(options.maxHeight)) svg.style.maxHeight = options.maxHeight;

  const defs = svg.createSvg("defs");

  addTerrainSymbols(svg, mapId, options.terrainIconSize);

  const getZoneHatching = (colours: string[], stripe: number) => {
    const id = `${mapId}-hatch-${colours
      .sort()
      .join("-")
      .replace(/[^\w-]/g, "")}`;
    if (!defs.querySelector(`#${CSS.escape(id)}`)) {
      const p = defs.createSvg("pattern", {
        attr: {
          id,
          patternUnits: "userSpaceOnUse",
          width: stripe * colours.length,
          height: 1,
          patternTransform: "rotate(45)",
        },
      });
      colours.forEach((fill, i) =>
        p.createSvg("rect", {
          attr: { x: i * stripe, width: stripe, height: 1, fill },
        }),
      );
    }
    return `url(#${id})`;
  };

  const panel = el.createDiv({ cls: "panel" });

  const gTerrain = svg.createSvg("g", { cls: "terrain" });
  const gTerrainIcons = svg.createSvg("g", { cls: "terrainIcons" });
  const gRivers = svg.createSvg("g", { cls: "rivers" });
  const gIcons = svg.createSvg("g", { cls: "icons" });
  const gBorders = svg.createSvg("g", { cls: "borders" });
  const gOverlays = svg.createSvg("g", { cls: "overlays" });
  const gZones = svg.createSvg("g", { cls: "zones" });
  const gCoords = svg.createSvg("g", { cls: "coords" });
  const gRegions = svg.createSvg("g", { cls: "regions" });
  const gRiverNames = svg.createSvg("g", { cls: "riverNames" });

  const borders = (options.borders ?? []).map(
    (b) =>
      new Border(
        gBorders,
        b.tag,
        b.colour,
        b.thickness ?? options.borderThickness,
      ),
  );
  const overlays = (options.overlays ?? []).map(
    (o) =>
      new Overlay(gOverlays, o.tag, o.bg, o.opacity ?? options.overlayOpacity),
  );
  const rivers = options.rivers ?? [];

  const zones = Array.from(
    zoneMap.values(),
    (z) =>
      new Zone(
        gZones,
        z.name,
        "",
        z.colour ?? options.zoneColour,
        z.opacity ?? options.zoneOpacity,
      ),
  );
  for (const zone of options.zones ?? []) {
    const existing = zones.find((z) => z.label === zone.label);
    if (existing) existing.apply(zone);
    else
      zones.push(
        new Zone(
          gZones,
          zone.label,
          zone.tag,
          zone.bg,
          zone.opacity ?? options.zoneOpacity,
        ),
      );
  }
  zones.sort((a, b) => a.label.localeCompare(b.label));

  const regions = Array.from(
    regionMap.values(),
    (r) =>
      new Zone(
        gRegions,
        r.name,
        "",
        r.colour ?? options.zoneColour,
        r.opacity ?? options.regionOpacity,
      ),
  ).sort((a, b) => a.label.localeCompare(b.label));

  const riversByHex = new Map<string, Set<string>>();

  const addRiverSegment = (
    thickness: number,
    points: Hex[],
    name: string = "unknown river",
  ) => {
    for (const hex of points) setMapAdd(riversByHex, hex.toString(), name);

    gRivers.createSvg("polyline", {
      attr: {
        stroke: options.riverColour,
        "stroke-width": thickness,
        points: toPointsString(points.map((h) => layout.toPixel(h))),
      },
    });
  };

  for (const { size, path } of rivers) {
    const coords = path.map(getCoords).filter(isDefined);

    addRiverSegment(
      size,
      coords.map((co) => Hex.fromQOffsetCoordinates(offset, co[0])),
    );
  }

  for (const river of riverData) {
    const accumulator: Hex[] = [];
    let thickness = river.nodes[0].thickness;
    const cm = new CoordManager(0);

    for (const node of river.nodes) {
      cm.addToBounds(layout.toPixel(node.hex));
      if (node.thickness !== thickness) {
        if (accumulator.length > 1)
          addRiverSegment(thickness, accumulator, river.name);
        accumulator.splice(0, accumulator.length - 1);
        accumulator.push(node.hex);
        thickness = node.thickness;
      } else {
        accumulator.push(node.hex);
      }
    }

    if (accumulator.length > 1)
      addRiverSegment(thickness, accumulator, river.name);

    const size = river.nodes.reduce((hi, n) => Math.max(hi, n.thickness), 0);
    const midpoint = getMidpoint(river.nodes.map((n) => n.hex));
    const { x, y } = layout.toPixel(midpoint);
    const label = gRiverNames.createSvg("text", {
      attr: {
        x,
        y,
        fill: options.riverColour,
        "font-size": `${4 + size}px`,
        // TODO figure out how to rotate name?
      },
    });
    label.textContent = river.name;
  }

  for (const {
    hex,
    x,
    y,
    col,
    row,
    corners,
    points,
    name,
    path,
    terrain,
    icon,
    tags,
    regions: regionInfo,
    controllers: controllerInfo,
  } of hexData) {
    const titleLines = [name, `Terrain: ${terrain}`];

    const ts = options.terrain[terrain ?? "Unknown"];
    if (!ts) console.warn("missing data for " + terrain);

    const polygon = gTerrain.createSvg("polygon", {
      attr: {
        points,
        fill: ts?.bg ?? options.terrainBg,
        "data-name": name,
        "data-path": path,
      },
    });

    if (ts?.icon)
      useTerrainSymbol(
        gTerrainIcons,
        mapId,
        x,
        y,
        options.terrainIconSize,
        ts.icon,
        ts?.fg ?? options.terrainFg,
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

    for (const b of borders)
      if (b.tag && tags.includes(b.tag)) {
        const inner = layout.getPolygonCorners(hex, b.thickness);
        b.g.createSvg("polygon", { attr: { points: toPointsString(inner) } });
      }

    for (const o of overlays)
      if (o.tag && tags.includes(o.tag))
        o.g.createSvg("polygon", { attr: { points } });

    const zoneMatches = zones.filter(
      (z) =>
        tags.includes(z.tag) ||
        controllerInfo.find((ci) => ci.name === z.label),
    );
    if (zoneMatches.length > 1) {
      const opacity = Math.min(
        0.8,
        zoneMatches.reduce((t, z) => t + z.opacity, 0) /
          (zoneMatches.length - 1),
      );
      gZones.createSvg("polygon", {
        attr: {
          points,
          opacity,
          fill: getZoneHatching(
            zoneMatches.map((z) => z.fill),
            options.size / 4,
          ),
        },
      });
      titleLines.push(
        `Contested: ${zoneMatches.map((z) => z.label).join(", ")}`,
      );
    } else if (zoneMatches.length === 1) {
      const zone = zoneMatches[0];
      for (const corner of corners) zone.add(hex, corner);
      titleLines.push(`Controller: ${zone.label}`);
    }

    const regionMatches: string[] = [];
    for (const r of regions) {
      if (regionInfo.find((x) => x.name === r.label)) {
        for (const corner of corners) r.add(hex, corner);
        regionMatches.push(r.label);
      }
    }
    if (regionMatches.length)
      titleLines.push(`Region: ${regionMatches.join(", ")}`);

    const riverNames = riversByHex.get(hex.toString());
    if (riverNames)
      titleLines.push(`River: ${Array.from(riverNames).join(", ")}`);

    const title = polygon.createSvg("title");
    title.textContent = titleLines.join("\n");
  }

  addPanelSection(panel, gBorders, borders, "Borders");
  addPanelSection(panel, gOverlays, overlays, "Overlays");

  if (rivers.length || riverData.length) {
    const panelRivers = panel.createEl("section");

    const items = panelRivers.createDiv({ cls: "list" });
    makeDisplayToggle({
      parent: items,
      g: gRiverNames,
      text: "Names",
      value: false,
    });

    makeDisplayToggle({
      parent: panelRivers,
      g: gRivers,
      text: "Rivers",
      items,
      prepend: true,
    }).classList.add("heading");
  }

  {
    const section = panel.createEl("section");
    const items = section.createDiv({ cls: "list" });
    for (const z of zones) {
      const [x, y] = z.getCentrePoint();
      if (x === "NaN") continue;

      const borders = edgeWalk(layout, z.hexen);
      for (const corners of borders)
        z.gHexes.createSvg("polygon", {
          attr: { points: toPointsString(corners) },
        });

      const text = z.g.createSvg("text", { attr: { x, y, fill: z.fill } });
      text.textContent = z.label;
      z.addToPanel(items);
    }
    if (!items.childElementCount) section.remove();
    else
      makeDisplayToggle({
        parent: section,
        g: gZones,
        items,
        text: "Zones",
        prepend: true,
      }).classList.add("heading");
  }

  {
    const section = panel.createEl("section");
    const items = section.createDiv({ cls: "list" });
    for (const r of regions) {
      const [x, y] = r.getCentrePoint();
      if (x === "NaN") continue;

      const borders = edgeWalk(layout, r.hexen);
      for (const corners of borders)
        r.gHexes.createSvg("polygon", {
          attr: { points: toPointsString(corners) },
        });

      const text = r.g.createSvg("text", { attr: { x, y, fill: r.fill } });
      text.textContent = r.label;
      r.addToPanel(items);
    }
    if (!items.childElementCount) section.remove();
    else
      makeDisplayToggle({
        parent: section,
        g: gRegions,
        items,
        text: "Regions",
        prepend: true,
        value: false,
      }).classList.add("heading");
  }

  if (!panel.childElementCount) panel.remove();

  const pz = createPanZoom(svg, {
    minZoom: options.minZoom,
    maxZoom: options.maxZoom,
    onClick: (e) => {
      if (e.target instanceof HTMLElement || e.target instanceof SVGElement) {
        const name = e.target.dataset["name"];
        const path = e.target.dataset["path"];
        if (name && path) app.workspace.openLinkText(name, path);
      }
    },
  });
  pz.on("panstart", () => hmc.classList.add("panning"));
  pz.on("panend", () => hmc.classList.remove("panning"));

  const end = performance.now();
  console.log(`Hex map render took ${end - start}ms`, { options });
}
