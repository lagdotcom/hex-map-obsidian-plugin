import {
	defineHex,
	Grid,
	Hex,
	HexCoordinates,
	Orientation,
	Point,
} from "honeycomb-grid";
import { HexMapPluginSettings } from "main";
import { FrontMatterCache, TFile } from "obsidian";
import { getOptions } from "options";

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

	get viewBox() {
		return `${this.left - this.margin} ${this.top - this.margin} ${
			this.width + this.margin * 2
		} ${this.height + this.margin * 2}`;
	}

	get width() {
		return this.right - this.left;
	}

	get height() {
		return this.bot - this.top;
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

	const svg = el.createSvg("svg", {
		cls: "hexMap",
		attr: { viewBox: cm.viewBox },
	});
	for (const { hex, points, name, path, terrain, icon } of hexData) {
		const fill = settings.terrainColours[terrain ?? "Unknown"];
		if (!fill) console.warn("missing colour for " + terrain);

		const g = svg.createSvg("g");

		const title = g.createSvg("title");
		title.textContent = name;

		g.createSvg("polygon", {
			cls: "hex",
			attr: { points, fill: fill ?? "#222222" },
		}).addEventListener("click", () => {
			this.app.workspace.openLinkText(name, path);
		});

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
}
