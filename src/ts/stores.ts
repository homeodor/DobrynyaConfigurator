import { readable, writable } from "svelte/store";
import { type BatteryInfo, BatteryStatus } from "./types";
import { HexColour } from "./hexcolour";

export const isMacLike = readable(
	/(Mac|iPhone|iPod|iPad|Apple)/i.test(navigator.platform)
);

export let isElectron =
	navigator.userAgent.toLowerCase().indexOf(" electron/") > -1;

export let midi = null;
export const lastColourPaintLayer = writable(0);
export const lastColourPaintHex = writable<HexColour>(HexColour.off());

export const isColourPreviewMode = writable(false);

export let ignoreChanges = false;

export const persistentSettings = writable(null);

export const isAlt = writable(false);

export const stateOfCharge = writable(-1);

export const batteryInfo = writable<BatteryInfo>({
	status: BatteryStatus.noBattery,
	percent: 0,
});
