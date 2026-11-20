import { TerrainIconName } from "./icons";
import { KeysMatching } from "./tools";

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
  orientation: string; // 'flat' | 'pointy'
  offset: string; // 'even' | 'odd'
  terrainKey: string;
  iconKey: string;
  regionKey: string;
  controllerKey: string;
  size: number;
  margin: number;
  coordOffset: number;
  coordSize: number;
  iconSize: number;
  terrainIconSize: number;
  terrain: Record<string, TerrainSettings>;
  riverWidth: number;
  riverColour: string;
  useDataView: boolean;
  borderThickness: number;
  overlayOpacity: number;
  zoneColour: string;
  regionOpacity: number;
  terrainBg: string;
  terrainFg: string;
  zoneOpacity: number;
  minZoom: number;
  maxZoom: number;
}

export type StringKey = KeysMatching<HexMapPluginSettings, string>;
export type NumberKey = KeysMatching<HexMapPluginSettings, number>;

export const DEFAULT_SETTINGS: HexMapPluginSettings = {
  orientation: "flat",
  offset: "odd",
  terrainKey: "terrain",
  iconKey: "icon",
  regionKey: "parent",
  controllerKey: "controller",
  size: 10,
  margin: 5,
  coordOffset: 4,
  coordSize: 3,
  iconSize: 7,
  terrainIconSize: 12,
  riverWidth: 5,
  riverColour: "#8cb2d8",
  useDataView: false,
  borderThickness: 1,
  overlayOpacity: 0.4,
  zoneColour: "silver",
  regionOpacity: 0.2,
  terrainBg: "#222222",
  terrainFg: "black",
  zoneOpacity: 0.2,
  minZoom: 0.5,
  maxZoom: 3,
  terrain: {
    Badlands: ts("#cd9b00", "#545556", "broken"),
    Barren: ts("#ffcc67", "#545556", "broken"),
    Beach: ts("#fff899", "white", "dots"),
    "Cultivated Farmland": ts("#9fd66b", "#aea002", "farm"),
    "Dead Forest": ts("#b2b2b2", "#434343", "deadTree"),
    "Dead Forest Hills": ts("#9f9f9f", "#434343", "hill"),
    "Dead Forested Mountains": ts("#8f8f8f", "#434343", "mountain"),
    "Dead Soil": ts("#b2b2b2", "#54451e", "dots"),
    "Dense Forest": ts("#93c663", "#538000", "forestDense"),
    "Dense Mixed Forest": ts("#4f893a", "#315801", "forestDenseMixed"),
    Desert: ts("#f7f284", "#54451e", "dots"),
    "Evergreen Forest": ts("#7ab245", "#315b0f", "forestEvergreen"),
    "Extinct Volcano": ts("#d18e00", "black", "volcanoExtinct"),
    Farmland: ts("#9fd66b", "black"),
    Fen: ts("#afdba0", "#648a37", "fen"),
    "Forest Hills": ts("#8ebc51", "#426600", "hill"),
    Forest: ts("#93c663", "#538000", "forest"),
    "Forest Wetlands": ts("#879154", "#016225", "forestFen"),
    "Forested Mountains": ts("#87a334", "#416704", "mountain"),
    Grasslands: ts("#e5f29b", "#648a37", "grass"),
    "Grassland Hills": ts("#d8f296", "#5e8c1c", "hill"),
    "Grassy Hills": ts("#d8d163", "#3e6a0a", "hill"),
    Hills: ts("#e8ce59", "#826f0c", "hill"),
    Jungle: ts("#549e66", "#216e58", "jungle"),
    Marsh: ts("#84ce93", "#49836c", "fen"),
    "Mixed Forest": ts("#4f9e44", "#2e5401", "forestMixed"),
    Mountain: ts("#b27f00", "#424826", "mountain"),
    "Rocky Desert": ts("#f2e272", "#54451e", "dots"),
    Shrubland: ts("#d8db7f", "#638a36", "grass"),
    "Snowy Mountain": ts("#b27f00", "white", "mountain"),
    Volcano: ts("#b27f00", "red", "volcanoExtinct"),
    Water: ts("#8cb2d8", "black"),
  },
};
