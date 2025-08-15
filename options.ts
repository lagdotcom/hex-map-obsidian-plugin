import { HexMapPluginSettings } from "main";
import { KeysMatching } from "tools";

interface HexMapOptions {
	key: string;
	terrainKey: string;
	iconKey: string;
	size: number;
	margin: number;
	coordOffset: number;
	coordSize: number;
	iconSize: number;
}
type NumberKey = KeysMatching<HexMapOptions, number>;
type StringKey = KeysMatching<HexMapOptions, string>;
const numberKeys: NumberKey[] = [
	"size",
	"margin",
	"coordOffset",
	"coordSize",
	"iconSize",
] as const;

const keyValuePattern = /(\w+)=(\w+)/g;

export function getOptions(source: string, settings: HexMapPluginSettings) {
	const {
		terrainKey,
		iconKey,
		size,
		margin,
		coordOffset,
		coordSize,
		iconSize,
	} = settings;
	const options: HexMapOptions = {
		key: "",
		terrainKey,
		iconKey,
		size,
		margin,
		coordOffset,
		coordSize,
		iconSize,
	};

	for (const [, key, value] of source.matchAll(keyValuePattern)) {
		if (numberKeys.includes(key as NumberKey))
			options[key as NumberKey] = Number(value);
		else options[key as StringKey] = value;
	}

	return options;
}
