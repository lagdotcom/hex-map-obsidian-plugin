import OffsetCoordinates from "hex/OffsetCoordinates";
import { asNumber, toInt } from "tools";
import { HexMapPluginSettings } from "settings";
import { KeysMatching } from "tools";

export interface HexMapOptions {
  orientation: string;
  offset: string;
  key: string;
  terrainKey: string;
  iconKey: string;
  size: number;
  margin: number;
  coordOffset: number;
  coordSize: number;
  iconSize: number;
  terrainIconSize: number;
  riverWidth: number;
  riverColour: string;
}
type NumberKey = KeysMatching<HexMapOptions, number>;
type StringKey = KeysMatching<HexMapOptions, string>;
const numberKeys: NumberKey[] = [
  "size",
  "margin",
  "coordOffset",
  "coordSize",
  "iconSize",
  "terrainIconSize",
  "riverWidth",
] as const;

const keyValuePattern = /^(\w+)=(\w+)$/gim;

export function getOptions(source: string, settings: HexMapPluginSettings) {
  const {
    orientation,
    offset,
    terrainKey,
    iconKey,
    size,
    margin,
    coordOffset,
    coordSize,
    iconSize,
    terrainIconSize,
    riverWidth,
    riverColour,
  } = settings;
  const options: HexMapOptions = {
    key: "",
    orientation,
    offset,
    terrainKey,
    iconKey,
    size,
    margin,
    coordOffset,
    coordSize,
    iconSize,
    terrainIconSize,
    riverWidth,
    riverColour,
  };

  for (const [, key, value] of source.matchAll(keyValuePattern)) {
    if (numberKeys.includes(key as NumberKey))
      options[key as NumberKey] = Number(value);
    else options[key as StringKey] = value;
  }

  return options;
}

const riverPattern = /^river:(?:(\d+):)?(.*)$/gim;
const coordPattern = /(\d+)\.(\d+)/gi;
export function getRivers(source: string, options: HexMapOptions) {
  return Array.from(source.matchAll(riverPattern)).map(
    ([, rawWidth, path]) => ({
      width: asNumber(rawWidth, options.riverWidth),
      coords: Array.from(path.matchAll(coordPattern)).map(([, col, row]) => ({
        col: Number(col),
        row: Number(row),
      })),
    })
  );
}

const overlayTagPattern = /^overlay:(#\w+):(\w+)(?::([\d\.]+))?$/gim;
export function getOverlays(source: string) {
  return Array.from(source.matchAll(overlayTagPattern)).map(
    ([, tag, fill, opacity]) => ({
      tag,
      fill,
      opacity: asNumber(opacity, 0.4),
    })
  );
}

const borderTagPattern = /^border:(#\w+):(\w+)(?::([\d\.]+))?$/gim;
export function getBorders(source: string) {
  return Array.from(source.matchAll(borderTagPattern)).map(
    ([, tag, colour, thickness]) => ({
      tag,
      colour,
      thickness: asNumber(thickness, 1),
    })
  );
}

const dotPattern = /(\d+)\.(\d+)/;
const commaPattern = /(\d+),(\d+)/;
export function getCoords(v: any): OffsetCoordinates[] | undefined {
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
