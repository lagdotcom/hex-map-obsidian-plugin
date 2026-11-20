import { App, PluginSettingTab, Setting } from "obsidian";

import { iconOptions, TerrainIconName } from "./icons";
import HexMapPlugin from "./main";
import {
  DEFAULT_SETTINGS,
  NumberKey,
  StringKey,
  TerrainSettings,
} from "./settings";
import TextModal from "./TextModal";
import { asNumber } from "./tools";

export default class HexMapSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    public plugin: HexMapPlugin,
  ) {
    super(app, plugin);
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Default Map Settings" });
    this.addTextField("terrainKey", "Terrain Key");
    this.addTextField("iconKey", "Icon Key");
    this.addTextField("regionKey", "Region Key");
    this.addTextField("controllerKey", "Controller Key");
    this.addNumberField("size", "Hex Size");
    this.addNumberField("margin", "Margin Size");
    this.addNumberField("coordOffset", "Coordinate Offset");
    this.addNumberField("coordSize", "Coordinate Size");
    this.addNumberField("iconSize", "Icon Size");
    this.addNumberField("terrainIconSize", "Terrain Icon Size");
    this.addNumberField("riverWidth", "River Width");
    this.addColourField("riverColour", "River Colour");
    this.addNumberField("borderThickness", "Border Thickness");
    this.addNumberField("overlayOpacity", "Overlay Opacity");
    this.addColourField("zoneColour", "Default Zone Colour");
    this.addNumberField("regionOpacity", "Region Opacity");
    this.addNumberField("minZoom", "Minimum Zoom");
    this.addNumberField("maxZoom", "Maximum Zoom");
    this.addColourField("terrainBg", "Terrain Default Background");
    this.addColourField("terrainFg", "Terrain Default Foreground");

    containerEl.createEl("h2", { text: "Terrain Display" });
    const coloursEl = containerEl.createDiv();

    for (const [key, val] of Object.entries(this.plugin.settings.terrain).sort(
      ([a], [b]) => a.localeCompare(b),
    ))
      this.addTerrainColourField(coloursEl, key, val);

    new Setting(containerEl).addButton((el) =>
      el.setButtonText("Add").onClick(() => {
        new TextModal(
          this.app,
          "New Terrain Type",
          "Terrain Type",
          async (value) => {
            this.plugin.settings.terrain[value] = { bg: "black", fg: "white" };
            this.addTerrainColourField(
              coloursEl,
              value,
              this.plugin.settings.terrain[value],
            );
            await this.plugin.saveSettings();
          },
        ).open();
      }),
    );
  }

  addColourField(key: StringKey, name: string) {
    return new Setting(this.containerEl).setName(name).addColorPicker((el) =>
      el.setValue(this.plugin.settings[key]).onChange(async (value) => {
        this.plugin.settings[key] = value;
        await this.plugin.saveSettings();
      }),
    );
  }

  addTextField(key: StringKey, name: string) {
    return new Setting(this.containerEl).setName(name).addText((el) =>
      el.setValue(this.plugin.settings[key]).onChange(async (value) => {
        this.plugin.settings[key] = value;
        await this.plugin.saveSettings();
      }),
    );
  }

  addNumberField(key: NumberKey, name: string) {
    return new Setting(this.containerEl).setName(name).addText((el) =>
      el
        .setValue(this.plugin.settings[key].toString())
        .onChange(async (value) => {
          this.plugin.settings[key] = asNumber(value, DEFAULT_SETTINGS[key]);
          await this.plugin.saveSettings();
        }),
    );
  }

  addTerrainColourField(
    coloursEl: HTMLDivElement,
    key: string,
    val: TerrainSettings,
  ) {
    const setting = new Setting(coloursEl)
      .setName(key)
      .addColorPicker((el) =>
        el.setValue(val.bg).onChange(async (value) => {
          this.plugin.settings.terrain[key].bg = value;
          await this.plugin.saveSettings();
        }),
      )
      .addColorPicker((el) =>
        el.setValue(val.fg).onChange(async (value) => {
          this.plugin.settings.terrain[key].fg = value;
          await this.plugin.saveSettings();
        }),
      )
      .addDropdown((el) =>
        el
          .addOption("", "")
          .addOptions(iconOptions)
          .setValue(val.icon ?? "")
          .onChange(async (value) => {
            if (value)
              this.plugin.settings.terrain[key].icon = value as TerrainIconName;
            else delete this.plugin.settings.terrain[key].icon;
            await this.plugin.saveSettings();
          }),
      )
      .addExtraButton((el) =>
        el.setIcon("trash").onClick(async () => {
          setting.settingEl.remove();
          delete this.plugin.settings.terrain[key];
          await this.plugin.saveSettings();
        }),
      );

    return setting;
  }
}
