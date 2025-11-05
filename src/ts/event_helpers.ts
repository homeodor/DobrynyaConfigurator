import type { Result } from "./configurator";
import type { Hand, Control, HexColour } from "./types";

import { lastColourPaintLayer } from "./stores";
import { ColourPaintLayer } from "./colour_utils";

export interface InvokeControlData {
	target: HTMLElement;
	controlKind: Control;
	controlNo: number;
	buttons?: number;
	altKey?: boolean;
	shiftKey?: boolean;
	hex?: HexColour;
	ultimateHex?: HexColour;
}

export interface BankInvokeData {
	hand: Hand;
	bankNo: number;
	isShift: boolean;
}

export interface ControlInvokeData {
	controlKind: Control;
	controlNo: number;
}

export function quickCustom<T>(which: string, detail: T) {
	document.body.dispatchEvent(new CustomEvent<T>(which, { detail }));
}
function quickNormal(which: string) {
	document.body.dispatchEvent(new Event(which));
}

export function patchChanged() {
	quickNormal("patchchange");
}
export function deviceRefusedToChangePatches() {
	quickNormal("patchlock");
}
export function invokeControl(kind: number, no: number) {
	quickCustom<ControlInvokeData>("invoke", {
		controlKind: kind,
		controlNo: no,
	});
}
export function invokeBank(hand: Hand, bankNo: number, isShift: boolean) {
	quickCustom<BankInvokeData>("invokebank", {
		hand: hand,
		bankNo: bankNo,
		isShift: isShift,
	});
}

export function pushFromSysEx(data: Result) {
	quickCustom<Result>("sysexpush", data);
}
export function section(name: string) {
	quickCustom<string>("section", name);
}

export function drawer(name: string) {
	quickCustom<string>("drawer", name);
}

export function filterInvoke(
	ev: CustomEvent<InvokeControlData>,
	controlKind: Control,
	controlNo: number,
	action: Function
) {
	if (
		ev.detail.controlKind == controlKind &&
		ev.detail.controlNo == controlNo
	) {
		action();
	}
}

export function openPatternEditor() {
	lastColourPaintLayer.set(ColourPaintLayer.Pattern); // hacking into the store to open the pattern!
	drawer("colourpaint");
}

export function dispatchEditorClose() {
	quickNormal("closeeditor");
}
export function dispatchNewInterfaceClose() {
	quickNormal("closenewui");
}
