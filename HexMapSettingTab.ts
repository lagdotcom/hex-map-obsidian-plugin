import { iconOptions, TerrainIconName } from "icons";
import HexMapPlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";
import {
  DEFAULT_SETTINGS,
  NumberKey,
  StringKey,
  TerrainSettings,
} from "settings";
import TextModal from "TextModal";
import { asNumber } from "tools";

export default class HexMapSettingTab extends PluginSettingTab {
  coloursEl: HTMLDivElement;

  constructor(app: App, public plugin: HexMapPlugin) {
    super(app, plugin);
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h1", { text: "Default Map Settings" });
    this.addTextField("terrainKey", "Terrain Key");
    this.addTextField("iconKey", "Icon Key");
    this.addNumberField("size", "Hex Size");
    this.addNumberField("margin", "Margin Size");
    this.addNumberField("coordOffset", "Coordinate Offset");
    this.addNumberField("coordSize", "Coordinate Size");
    this.addNumberField("iconSize", "Icon Size");
    this.addNumberField("terrainIconSize", "Terrain Icon Size");
    this.addNumberField("riverWidth", "River Width");

    new Setting(this.containerEl).setName("River Colour").addColorPicker((el) =>
      el.setValue(this.plugin.settings.riverColour).onChange(async (value) => {
        this.plugin.settings.riverColour = value;
        await this.plugin.saveSettings();
      })
    );

    containerEl.createEl("h1", { text: "Terrain Display" });
    this.coloursEl = containerEl.createDiv();

    for (const [key, val] of Object.entries(this.plugin.settings.terrain).sort(
      ([a], [b]) => a.localeCompare(b)
    ))
      this.addTerrainColourField(key, val);

    new Setting(containerEl).addButton((el) =>
      el.setButtonText("Add").onClick(() => {
        new TextModal(
          this.app,
          "New Terrain Type",
          "Terrain Type",
          async (value) => {
            this.plugin.settings.terrain[value] = { bg: "black", fg: "white" };
            this.addTerrainColourField(
              value,
              this.plugin.settings.terrain[value]
            );
            await this.plugin.saveSettings();
          }
        ).open();
      })
    );
  }

  addTextField(key: StringKey, name: string) {
    return new Setting(this.containerEl).setName(name).addText((el) =>
      el.setValue(this.plugin.settings[key]).onChange(async (value) => {
        this.plugin.settings[key] = value;
        await this.plugin.saveSettings();
      })
    );
  }

  addNumberField(key: NumberKey, name: string) {
    return new Setting(this.containerEl).setName(name).addText((el) =>
      el
        .setValue(this.plugin.settings[key].toString())
        .onChange(async (value) => {
          this.plugin.settings[key] = asNumber(value, DEFAULT_SETTINGS[key]);
          await this.plugin.saveSettings();
        })
    );
  }

  addTerrainColourField(key: string, val: TerrainSettings) {
    const setting = new Setting(this.coloursEl)
      .setName(key)
      .addColorPicker((el) =>
        el.setValue(val.bg).onChange(async (value) => {
          this.plugin.settings.terrain[key].bg = value;
          await this.plugin.saveSettings();
        })
      )
      .addColorPicker((el) =>
        el.setValue(val.fg).onChange(async (value) => {
          this.plugin.settings.terrain[key].fg = value;
          await this.plugin.saveSettings();
        })
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
          })
      )
      .addExtraButton((el) =>
        el.setIcon("trash").onClick(async () => {
          setting.settingEl.remove();
          delete this.plugin.settings.terrain[key];
          await this.plugin.saveSettings();
        })
      );

    return setting;
  }
}
