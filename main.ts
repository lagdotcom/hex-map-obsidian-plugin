import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import renderHexMap from "rendering";
import TextModal from "TextModal";
import { KeysMatching } from "tools";

export interface HexMapPluginSettings {
	terrainKey: string;
	iconKey: string;
	size: number;
	margin: number;
	coordOffset: number;
	coordSize: number;
	iconSize: number;
	terrainColours: Record<string, string>;
}

type StringKey = KeysMatching<HexMapPluginSettings, string>;
type NumberKey = KeysMatching<HexMapPluginSettings, number>;

const DEFAULT_SETTINGS: HexMapPluginSettings = {
	terrainKey: "terrain",
	iconKey: "icon",
	size: 10,
	margin: 5,
	coordOffset: 4,
	coordSize: 3,
	iconSize: 7,
	terrainColours: {
		Badlands: "#ffcc66",
		Beach: "#fff899",
		"Cultivated Farmland": "#9fd66b",
		"Dense Mixed Forest": "#4f893a",
		"Extinct Volcano": "#d18e00",
		Farmland: "#9fd66b",
		"Forest Hills": "#8ebc51",
		Forest: "#93c663",
		"Grassy Hills": "#d8d163",
		Hills: "#e8ce59",
		"Mixed Forest": "#4f9e44",
		Mountain: "#b27f00",
		Water: "#8cb2d8",
	},
};

export default class HexMapPlugin extends Plugin {
	settings: HexMapPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new HexMapSettingTab(this.app, this));

		this.registerMarkdownCodeBlockProcessor("hexmap", (source, el) =>
			renderHexMap(this.settings, source, el)
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

function asNumber(value: any, defaultValue: number) {
	const number = Number(value);
	return isNaN(number) ? defaultValue : number;
}

class HexMapSettingTab extends PluginSettingTab {
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

		containerEl.createEl("h1", { text: "Terrain Colours" });
		this.coloursEl = containerEl.createDiv();

		for (const [key, val] of Object.entries(
			this.plugin.settings.terrainColours
		))
			this.addColourField(key, val);

		new Setting(containerEl).addButton((el) =>
			el.setButtonText("Add").onClick(() => {
				new TextModal(
					this.app,
					"New Terrain Colour",
					"Terrain Type",
					async (value) => {
						this.plugin.settings.terrainColours[value] = "#000000";
						this.addColourField(value, "#000000");
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
					this.plugin.settings[key] = asNumber(
						value,
						DEFAULT_SETTINGS[key]
					);
					await this.plugin.saveSettings();
				})
		);
	}

	addColourField(key: string, val: string) {
		const setting = new Setting(this.coloursEl)
			.setName(key)
			.addColorPicker((el) =>
				el.setValue(val).onChange(async (value) => {
					this.plugin.settings.terrainColours[key] = value;
					await this.plugin.saveSettings();
				})
			)
			.addExtraButton((el) =>
				el.setIcon("trash").onClick(async () => {
					setting.settingEl.remove();
					delete this.plugin.settings.terrainColours[key];
					await this.plugin.saveSettings();
				})
			);

		return setting;
	}
}
