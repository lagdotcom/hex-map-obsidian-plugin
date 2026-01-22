import Hex from "hex/Hex";
import Layout from "hex/Layout";
import { jarvisMarch } from "hex/maths";
import { flat, pointy } from "hex/Orientation";
import Point from "hex/Point";
import { addTerrainIcon } from "icons";
import { App } from "obsidian";
import createPanZoom from "panzoom";
import {
  getBorders,
  getCoords,
  getOptions,
  getOverlays,
  getRivers,
  getZones,
} from "parsing";
import { HexMapPluginSettings } from "settings";
import Soon from "Soon";
import { isDefined } from "tools";

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

function makeDisplayToggle({
  parent,
  g,
  items,
  text,
  prepend,
}: {
  parent: HTMLElement;
  g: SVGElement;
  items?: HTMLElement;
  text: string;
  prepend?: boolean;
}) {
  const label = parent.createEl("label", { prepend });
  const input = label.createEl("input", {
    attr: { type: "checkbox", checked: true },
  });
  input.addEventListener("change", () => {
    g.style.display = input.checked ? "" : "none";
    if (items) items.style.display = input.checked ? "" : "none";
  });
  label.createEl("span", { text });
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
  points: Point[];

  constructor(
    public parent: SVGElement,
    public label: string,
    public tag: string,
    public fill: string,
    public opacity: number,
  ) {
    this.g = parent.createSvg("g", { attr: { fill } });
    this.g.dataset["tag"] = tag;
    this.gHexes = this.g.createSvg("g", { attr: { opacity } });
    this.cm = new CoordManager(0);
    this.points = [];
  }

  add(point: Point) {
    this.cm.hexConverter(point);
    this.points.push(point);
  }

  addToPanel(panel: HTMLElement) {
    makeDisplayToggle({ parent: panel, g: this.g, text: this.label });
  }

  getCentrePoint() {
    const cx = (this.cm.left + this.cm.right) / 2;
    const cy = (this.cm.bot + this.cm.top) / 2;
    return [cx.toString(), cy.toString()];
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

export default async function renderHexMap(
  app: App,
  settings: HexMapPluginSettings,
  source: string,
  el: HTMLElement,
  sourcePath: string,
) {
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

  let centreHex: Hex | undefined;
  if (options.centre) {
    if (options.centre.toLowerCase() === "this") {
      const sourceFile = app.vault.getFileByPath(sourcePath);
      if (!sourceFile) return die("cannot use 'this': not in a file???");

      const fm = app.metadataCache.getFileCache(sourceFile)?.frontmatter;
      if (!fm) return die("cannot use 'this': no frontmatter");

      const coords = getCoords(fm[options.key]);
      if (!coords) return die("cannot use 'this': invalid coords");

      centreHex = Hex.fromQOffsetCoordinates(offset, coords[0]);
    } else {
      const coords = getCoords(options.centre);
      if (!coords) return die(`cannot parse coords: ${options.centre}`);

      centreHex = Hex.fromQOffsetCoordinates(offset, coords[0]);
    }
  }

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

        if (
          isDefined(options.maxDistance) &&
          centreHex &&
          centreHex.distance(hex) > options.maxDistance
        )
          return undefined;

        const { x, y } = layout.toPixel(hex);
        const { col, row } = co;
        const corners = layout.getPolygonCorners(hex);
        const points = corners.map(cm.hexConverter).join(" ");

        return {
          x,
          y,
          col,
          row,
          corners,
          points,
          name: file.basename,
          path: file.path,
          terrain: fm[options.terrainKey],
          icon: fm[options.iconKey],
          tags: cached.tags?.map((t) => t.tag) ?? [],
        };
      });
    })
    .filter(isDefined);

  let ignoreClick = false;
  const ignoreReset = new Soon(() => (ignoreClick = false));

  const svg = hmc.createSvg("svg", {
    cls: "hexMap",
    attr: { viewBox: cm.viewBox },
  });
  if (isDefined(options.maxWidth)) svg.style.maxWidth = options.maxWidth;
  if (isDefined(options.maxHeight)) svg.style.maxHeight = options.maxHeight;

  // set up for zone labels
  const defs = svg.createSvg("defs");
  const filter = defs.createSvg("filter", {
    attr: { x: -0.05, y: -0.1, width: 1.1, height: 1.2, id: "solid" },
  });
  filter.createSvg("feFlood", { attr: { "flood-color": "#00000040" } });
  filter.createSvg("feComposite", {
    attr: { in: "SourceGraphic", operator: "xor" },
  });

  const panel = el.createDiv({ cls: "panel" });

  const gTerrain = svg.createSvg("g", { cls: "terrain" });
  const gTerrainIcons = svg.createSvg("g", { cls: "terrainIcons" });
  const gRivers = svg.createSvg("g", { cls: "rivers" });
  const gCoords = svg.createSvg("g", { cls: "coords" });
  const gIcons = svg.createSvg("g", { cls: "icons" });
  const gBorders = svg.createSvg("g", { cls: "borders" });
  const gOverlays = svg.createSvg("g", { cls: "overlays" });
  const gZones = svg.createSvg("g", { cls: "zones" });

  const borders = getBorders(source).map(
    (b) => new Border(gBorders, b.tag, b.colour, b.thickness),
  );
  const overlays = getOverlays(source).map(
    (o) => new Overlay(gOverlays, o.tag, o.fill, o.opacity),
  );
  const rivers = getRivers(source, options);
  const zones = getZones(source).map(
    (z) => new Zone(gZones, z.label, z.tag, z.fill, z.opacity),
  );

  for (const {
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
  } of hexData) {
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
        ts?.fg ?? "black",
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
      if (b.tag && tags.includes(b.tag))
        b.g.createSvg("polygon", { attr: { points } });

    for (const o of overlays)
      if (o.tag && tags.includes(o.tag))
        o.g.createSvg("polygon", { attr: { points } });

    for (const z of zones)
      if (z.tag && tags.includes(z.tag)) {
        // z.gHexes.createSvg("polygon", { attr: { points } });
        for (const corner of corners) z.add(corner);
      }
  }

  for (const { width, coords } of rivers)
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

  addPanelSection(panel, gBorders, borders, "Borders");
  addPanelSection(panel, gOverlays, overlays, "Overlays");

  if (rivers.length) {
    const panelRivers = panel.createEl("section");
    makeDisplayToggle({
      parent: panelRivers,
      g: gRivers,
      text: "Rivers",
    }).classList.add("heading");
  }

  {
    const section = panel.createEl("section");
    const items = section.createDiv({ cls: "list" });
    for (const z of zones) {
      const [x, y] = z.getCentrePoint();
      if (x === "NaN") continue;

      // TODO use a more hex-specific algorithm?
      const points = jarvisMarch(z.points)
        .map((p) => p.toString())
        .join(" ");
      z.g.createSvg("polygon", {
        attr: { points, stroke: z.fill, "fill-opacity": z.opacity },
      });
      const text = z.g.createSvg("text", {
        attr: { x, y, fill: z.fill, filter: "url(#solid)" },
      });
      text.textContent = z.label;
      z.addToPanel(items);
    }
    if (!items.childElementCount) section.remove();
    else
      makeDisplayToggle({
        parent: section,
        g: gZones,
        text: "Zones",
        prepend: true,
      }).classList.add("heading");

    if (!panel.childElementCount) panel.remove();
  }

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
