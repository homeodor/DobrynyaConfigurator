import { readable, writable } from 'svelte/store';
import { colourOff } from 'colour_utils';

export const isMacLike = readable(/(Mac|iPhone|iPod|iPad|Apple)/i.test(navigator.platform));

export let isElectron = navigator.userAgent.toLowerCase().indexOf(' electron/') > -1;

export let midi = null;
export const lastColourPaintLayer = writable(0);
export const lastColourPaintHex = writable(colourOff);

export const isColourPreviewMode = writable(false);

export let ignoreChanges = false;

export const persistentSettings = writable(null);

export const isAlt = writable(false);

export const stateOfCharge = writable(-1);
