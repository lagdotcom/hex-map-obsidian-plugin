import HexMapSettingTab from "HexMapSettingTab";
import { TerrainIconName } from "icons";
import { Plugin } from "obsidian";
import renderHexMap from "rendering";
import { KeysMatching } from "tools";

export interface TerrainSettings {
  fg: string;
  bg: string;
  icon?: TerrainIconName;
}

const ts = (
  bg: string,
  fg: string,
  icon?: TerrainIconName
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
  terrain: {
    Badlands: ts("#cd9b00", "#545556"),
    Beach: ts("#fff899", "white"),
    "Cultivated Farmland": ts("#9fd66b", "#aea002", "farm"),
    "Dense Forest": ts("#93c663", "#538000", "forestDense"),
    "Dense Mixed Forest": ts("#4f893a", "#315801", "forestDenseMixed"),
    "Evergreen Forest": ts("#7ab245", "#315b0f", "forestEvergreen"),
    "Extinct Volcano": ts("#d18e00", "black", "volcanoExtinct"),
    Farmland: ts("#9fd66b", "black"),
    "Forest Hills": ts("#8ebc51", "#426600", "hill"),
    Forest: ts("#93c663", "#538000", "forest"),
    "Grassy Hills": ts("#d8d163", "#3e6a0a", "hill"),
    Hills: ts("#e8ce59", "#826f0c", "hill"),
    "Mixed Forest": ts("#4f9e44", "#2e5401", "forestMixed"),
    Mountain: ts("#b27f00", "#424826", "mountain"),
    Water: ts("#8cb2d8", "black"),
  },
};

export default class HexMapPlugin extends Plugin {
  settings: HexMapPluginSettings;

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new HexMapSettingTab(this.app, this));

    this.registerMarkdownCodeBlockProcessor("hexmap", (source, el) =>
      renderHexMap(this.app, this.settings, source, el)
    );
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

export function asNumber(value: any, defaultValue: number) {
  const number = Number(value);
  return isNaN(number) ? defaultValue : number;
}
