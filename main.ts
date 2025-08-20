import HexMapSettingTab from "HexMapSettingTab";
import { Plugin } from "obsidian";
import renderHexMap from "rendering";
import { DEFAULT_SETTINGS, HexMapPluginSettings } from "settings";

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
