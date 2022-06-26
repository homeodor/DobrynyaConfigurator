import { readable, writable } from 'svelte/store';
import { colourOff } from './colour_utils';

export const isMacLike = readable(/(Mac|iPhone|iPod|iPad|Apple)/i.test(navigator.platform));

export let midi = null;
export const lastColourPaintLayer = writable(0);
export const lastColourPaintHex = writable(colourOff);

export let ignoreChanges = false;