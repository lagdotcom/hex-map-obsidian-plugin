import OffsetCoordinates from "hex/OffsetCoordinates";
import { parseYaml } from "obsidian";
import { HexMapPluginSettings } from "settings";
import { toInt } from "tools";

export interface MapRiver {
  size: number;
  path: string[];
}
export interface MapOverlay {
  tag: string;
  bg: string;
  opacity?: number;
}
export interface MapZone {
  label: string;
  tag: string;
  bg: string;
  opacity?: number;
}
export interface MapBorder {
  tag: string;
  colour: string;
  thickness?: number;
}

export interface HexMapOptions {
  orientation: string;
  offset: string;
  key: string;
  terrainKey: string;
  iconKey: string;
  regionKey: string;
  size: number;
  margin: number;
  coordOffset: number;
  coordSize: number;
  iconSize: number;
  terrainIconSize: number;
  riverWidth: number;
  riverColour: string;
  centre?: string;
  maxDistance?: number;
  maxWidth?: string;
  maxHeight?: string;
  useDataView: boolean;

  borders?: MapBorder[];
  rivers?: MapRiver[];
  overlays?: MapOverlay[];
  zones?: MapZone[];
}
export function getOptions(
  source: string,
  settings: HexMapPluginSettings,
): HexMapOptions {
  const mapSettings = parseYaml(source.replace(/\u00a0/g, " ")); // fixes paste issues
  const combined = { ...settings, ...mapSettings };
  return combined;
}

const dotPattern = /(\d+)\.(\d+)/;
const commaPattern = /(\d+),(\d+)/;
export function getCoords(v: unknown): OffsetCoordinates[] | undefined {
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
