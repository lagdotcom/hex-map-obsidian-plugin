import { TerrainIconName } from "icons";
import { KeysMatching } from "tools";

export interface TerrainSettings {
  fg: string;
  bg: string;
  icon?: TerrainIconName;
}

const ts = (
  bg: string,
  fg: string,
  icon?: TerrainIconName,
): TerrainSettings => ({
  bg,
  fg,
  icon,
});

export interface HexMapPluginSettings {
  orientation: string;
  offset: string;
  terrainKey: string;
  iconKey: string;
  size: number;
  margin: number;
  coordOffset: number;
  coordSize: number;
  iconSize: number;
  terrainIconSize: number;
  terrain: Record<string, TerrainSettings>;
  riverWidth: number;
  riverColour: string;
}

export type StringKey = KeysMatching<HexMapPluginSettings, string>;
export type NumberKey = KeysMatching<HexMapPluginSettings, number>;

export const DEFAULT_SETTINGS: HexMapPluginSettings = {
  orientation: "flat",
  offset: "odd",
  terrainKey: "terrain",
  iconKey: "icon",
  size: 10,
  margin: 5,
  coordOffset: 4,
  coordSize: 3,
  iconSize: 7,
  terrainIconSize: 12,
  riverWidth: 5,
  riverColour: "#8cb2d8",
  terrain: {
    Badlands: ts("#cd9b00", "#545556"),
    Barren: ts("#ffcc67", "#545556"),
    Beach: ts("#fff899", "white"),
    "Cultivated Farmland": ts("#9fd66b", "#aea002", "farm"),
    "Dense Forest": ts("#93c663", "#538000", "forestDense"),
    "Dense Mixed Forest": ts("#4f893a", "#315801", "forestDenseMixed"),
    "Evergreen Forest": ts("#7ab245", "#315b0f", "forestEvergreen"),
    "Extinct Volcano": ts("#d18e00", "black", "volcanoExtinct"),
    Farmland: ts("#9fd66b", "black"),
    Fen: ts("#afdba0", "#648a37", "fen"),
    "Forest Hills": ts("#8ebc51", "#426600", "hill"),
    Forest: ts("#93c663", "#538000", "forest"),
    "Forest Wetlands": ts("#879154", "#016225", "forestFen"),
    Grasslands: ts("#e5f29b", "#648a37"),
    "Grassland Hills": ts("#d8f296", "#5e8c1c", "hill"),
    "Grassy Hills": ts("#d8d163", "#3e6a0a", "hill"),
    Hills: ts("#e8ce59", "#826f0c", "hill"),
    Marsh: ts("#84ce93", "#49836c", "fen"),
    "Mixed Forest": ts("#4f9e44", "#2e5401", "forestMixed"),
    Mountain: ts("#b27f00", "#424826", "mountain"),
    Water: ts("#8cb2d8", "black"),
  },
};
