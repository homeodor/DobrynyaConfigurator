import type { MidiResult } from 'midi_utils'
import type { Hand, Control, HexColour } from 'types'

import { lastColourPaintLayer } from 'stores';
import { ColourPaintLayer } from 'colour_utils';

export interface InvokeControlEventData
{
	target: HTMLElement,
	controlKind: Control,
	controlNo: number,
	buttons?: number,
	altKey?: boolean,
	shiftKey?: boolean,
	hex?: HexColour,
	ultimateHex?: HexColour,
}

export interface InvokeControlEvent extends CustomEvent
{
	detail: InvokeControlEventData
}

export function quickCustom(n: string, d: object = {}) { document.body.dispatchEvent(new CustomEvent(n,{detail:d})); }
function quickNormal(n: string)				  { document.body.dispatchEvent(new       Event(n)); }

export function patchChanged() { quickNormal("patchchange"); }
export function drawer(name: string) { quickCustom("drawer",{drawer: name}); }

export function deviceRefusedToChangePatches() { quickNormal("patchlock"); }
export function invokeControl(kind: number, no: number) { quickCustom("invoke", {controlKind: kind, controlNo: no}); }
export function invokeBank(hand:Hand, bankNo: number, isShift: boolean) { quickCustom("invokebank", {hand: hand, bankNo: bankNo, isShift: isShift}); }
export function pushFromSysEx(data: MidiResult) { quickCustom('sysexpush', { data: data }) }
export function section(name: string) { quickCustom('section',{section:name})};

export function filterInvoke(ev: InvokeControlEvent, controlKind: Control, controlNo: number, action: Function) { if (ev.detail.controlKind == controlKind && ev.detail.controlNo == controlNo) action(); }

export function openPatternEditor()
{
	lastColourPaintLayer.set(ColourPaintLayer.Pattern); // hacking into the store to open the pattern!
	quickCustom("drawer", {drawer:'colourpaint'});
}

export function dispatchEditorClose() { quickNormal('closeeditor'); }
export function dispatchNewInterfaceClose() { quickNormal('closenewui'); }