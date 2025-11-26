import { readable, writable } from "svelte/store";
import { colourOff } from "colour_utils";
import { type BatteryInfo, BatteryStatus } from "./types";
import { ExtraContentState, type ExtraContent } from "./download";

export const isMacLike = readable(
	/(Mac|iPhone|iPod|iPad|Apple)/i.test(navigator.platform)
);

export let isElectron =
	navigator.userAgent.toLowerCase().indexOf(" electron/") > -1;

export let midi = null;
export const lastColourPaintLayer = writable(0);
export const lastColourPaintHex = writable(colourOff);

export const isColourPreviewMode = writable(false);

export let ignoreChanges = false;

export const persistentSettings = writable(null);

export const isAlt = writable(false);

export const stateOfCharge = writable(-1);

export const batteryInfo = writable<BatteryInfo>({
	status: BatteryStatus.noBattery,
	percent: 0,
});

export const extraContent = writable<ExtraContent | null>({
	state: ExtraContentState.Unknown,
	packs: [],
	videos: [],
});
