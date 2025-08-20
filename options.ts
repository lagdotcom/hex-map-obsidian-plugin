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

const keyValuePattern = /(\w+)=(\w+)/g;

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
