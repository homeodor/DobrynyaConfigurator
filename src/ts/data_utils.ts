import { assertDefined, isEmpty } from "./basic";
import commitWatch from "./commit";
import { ExpanderSanizer } from "./data_expandsanize";
import type { DeepPartial } from "./defaults";

import type { Model } from "./device";
import { Control, Hand, type Pattern } from "./types";
import type {
	Patch,
	PatchLegacy,
	PatchInfoItem,
	BranchBank,
	BranchControl,
	BranchBankSettings,
} from "./types_patch";

export const numberOfPads = 16;

export function getEmptyPadDataArray() {
	const emptyPadDataArray = [];
	for (let i = 0; i < numberOfPads; i++) emptyPadDataArray.push({});
	return emptyPadDataArray;
}

// export interface PatchListItem
// {
// 	name: string, isThePatch: boolean
// }

export function downloadData(
	filedata: string | Buffer | Uint8Array,
	filename: string,
	filetype: string
) {
	let url = URL.createObjectURL(new Blob([filedata], { type: filetype }));

	let a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	a.remove();

	setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

export function patchAsFileFromData(
	filedata: string | Buffer,
	filename: string,
	json: boolean
) {
	filename = json ? filename.replace(".dbrpatch", ".json") : filename;
	let filetype = json ? "application/json" : "application/bson";

	downloadData(filedata, filename, filetype);
}

export function sortPatchList(aX: PatchInfoItem, bX: PatchInfoItem): number {
	let a = aX.name.toLowerCase();
	let b = bX.name.toLowerCase();

	let i: number = 0;
	let codeA;
	let codeB = 1;
	let posA = 0;
	let posB = 0;
	const alphabet =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЬЫЪЭЮЯабвгдеёжзийклмнопрстуфхцчшщьыъэюя";

	function getCode(str: string, pos: number, code: number | null) {
		if (code) {
			for (
				i = pos;
				(code = getCode(str, i, null)), code < 76 && code > 65;

			)
				++i;
			return +str.slice(pos - 1, i);
		}

		code = alphabet && alphabet.indexOf(str.charAt(pos));

		return code > -1
			? code + 76
			: ((code = str.charCodeAt(pos) || 0), code < 45 || code > 127)
			? code
			: code < 46
			? 65 // -
			: code < 48
			? code - 1
			: code < 58
			? code + 18 // 0-9
			: code < 65
			? code - 11
			: code < 91
			? code + 11 // A-Z
			: code < 97
			? code - 37
			: code < 123
			? code + 5 // a-z
			: code - 63;
	}

	if ((a += "") != (b += ""))
		for (; codeB; ) {
			codeA = getCode(a, posA++, null);
			codeB = getCode(b, posB++, null);

			if (codeA < 76 && codeB < 76 && codeA > 66 && codeB > 66) {
				codeA = getCode(a, posA, posA);
				codeB = getCode(b, posB, (posA = i));
				posB = i;
			}

			if (codeA != codeB) return codeA < codeB ? -1 : 1;
		}

	return 0;
}

export function arrayToFlag(arr: boolean[]): number {
	let flag: number = 0;
	for (let i: number = 0; i < arr.length; i++) flag |= arr[i] ? 1 << i : 0;
	return flag;
}

export function flagToArray(arr: boolean[], flag: number) {
	for (let i: number = 0; i < arr.length; i++) {
		arr[i] = (flag & (1 << i)) != 0;
	}
}

export async function getPatch(
	thePatch: Patch,
	model: Model,
	action: () => Promise<void>
) {
	commitWatch.commit(); // commit whatever is loaned to trunk
	sanizePatch(thePatch, model); // sanize the patch in general
	await action(); // wait for the actual stuff to happen, i.e. upload the patch or download it as file
	fixAndExpandPatch(thePatch, model); // re-expand it
	// the data we sanized in the beginning is expanded automatically
}

export function sanizePatch(currentPatch: Patch, model: Model) {
	let cleanObject: any = {};

	if (
		!("info" in currentPatch) ||
		!("padbanks" in currentPatch) ||
		currentPatch.padbanks.length != model.patch.hands ||
		currentPatch.padbanks[0].length != model.patch.banks ||
		(currentPatch.padbanks[1] &&
			currentPatch.padbanks[1].length != model.patch.banks)
	)
		throw "Patch is malformed";

	cleanObject.info = currentPatch.info;

	for (let fixDeviceAbsence of ["encoders", "faders", "pots", "accel"]) {
		if (model.hardware[fixDeviceAbsence]) {
			let anythingIsNotEmpty = currentPatch[fixDeviceAbsence].find(
				(v: BranchControl) => {
					return !isEmpty(v);
				}
			);
			if (!anythingIsNotEmpty) delete currentPatch[fixDeviceAbsence];
		}
	}

	if ("settings" in currentPatch) {
		if (isEmpty(currentPatch.settings)) delete currentPatch.settings;
		else cleanObject.settings = currentPatch.settings;
	}

	if ("encoders" in currentPatch) {
		cleanObject.encoders = currentPatch.encoders;

		console.log(cleanObject.encoders);

		while (cleanObject.encoders.length > model.hardware.encoders)
			cleanObject.encoders.pop();
		while (cleanObject.encoders.length < model.hardware.encoders)
			cleanObject.encoders.push({});
	}
	if ("joystick" in currentPatch)
		cleanObject.joystick = currentPatch.joystick;
	if ("faders" in currentPatch) cleanObject.faders = currentPatch.faders;
	if ("pots" in currentPatch) cleanObject.pots = currentPatch.pots;
	if ("auxbuttons" in currentPatch)
		cleanObject.auxbuttons = currentPatch.auxbuttons;
	if ("proximity" in currentPatch)
		cleanObject.proximity = currentPatch.proximity;

	if ("accel" in currentPatch) {
		cleanObject.accel = currentPatch.accel;
	}

	cleanObject.padbanks = currentPatch.padbanks;

	return cleanObject;
}

export function createObjectIfAbsent(
	obj: Record<string, any>,
	name: string,
	what: any = {}
): boolean {
	if (!(name in obj)) {
		obj[name] = what;
		return true;
	}
	return false;
}
export function createPadsIfAbsent(bank: BranchBank): boolean {
	return createObjectIfAbsent(bank, "pads", getEmptyPadDataArray());
}

export function fixAndExpandPatch(currentPatch: PatchLegacy, model: Model) {
	// the question is: should we be marking as unsaved if we make changes within this routine?
	// fixing absent keys...

	createObjectIfAbsent(currentPatch, "info");
	createObjectIfAbsent(
		currentPatch.info,
		"pattern",
		getEmptyPadDataArray().forEach(
			(_: any, k: number, a: Pattern) => (a[k] = 0)
		)
	); // add pattern array if it is not present, filled with zeroes
	createObjectIfAbsent(currentPatch, "settings");

	for (let fixDevicePresence of [
		"encoders",
		"faders",
		"pots",
		"auxbuttons",
		"accel",
	]) {
		if (model.hardware[fixDevicePresence]) {
			if (createObjectIfAbsent(currentPatch, fixDevicePresence, [])) {
				console.debug(`${fixDevicePresence} branch has been created!`);
				for (let i = 0; i < model.hardware[fixDevicePresence]; i++)
					currentPatch[fixDevicePresence].push({});
			}
		}
	}

	// fixing legacy stuff...

	if ("secbankhold" in currentPatch.settings) {
		currentPatch.settings.subhold = currentPatch.settings.secbankhold;
		delete currentPatch.settings.secbankhold;
	}

	if ("secbankdbl" in currentPatch.settings) {
		currentPatch.settings.subdbl = currentPatch.settings.secbankdbl;
		delete currentPatch.settings.secbankdbl;
	}

	interface BranchControlWithComboInMidi extends BranchControl {
		midi: any;
	}

	currentPatch?.encoders?.forEach(
		(theEncoder: BranchControlWithComboInMidi) => {
			if (theEncoder?.midi?.combo) {
				theEncoder.combo = theEncoder.midi.combo;
				delete theEncoder.midi.combo;

				if (isEmpty(theEncoder.midi)) delete theEncoder.midi;
			}
		}
	);

	currentPatch?.padbanks.forEach((theHand: BranchBank[]) => {
		theHand.forEach((theBank: BranchBank) => {
			theBank.pads?.forEach((thePad: BranchControlWithComboInMidi) => {
				if (thePad.midi?.combo) {
					thePad.combo = thePad.midi.combo;
					delete thePad.midi.combo;

					if (isEmpty(thePad.midi)) delete thePad.midi;
				}
			});
		});
	});
}

export function assertBranchParams(
	hand: Hand,
	bank: number,
	controlNumber: number = 0
) {
	if (hand !== Hand.LEFT && hand !== Hand.RIGHT) {
		throw new Error(`Unknown hand: ${hand}`);
	}

	if (bank < 0) {
		throw new Error(`Unknown bank number: ${bank}`);
	}

	if (controlNumber < 0) {
		throw new Error(`Unknown control number: ${controlNumber}`);
	}
}

export function getBranchBankSettings(
	currentPatchNow: Patch,
	bank: number,
	hand: Hand
): DeepPartial<BranchBankSettings> {
	assertBranchParams(hand, bank);

	if (!currentPatchNow.padbanks[hand][bank].bank) {
		currentPatchNow.padbanks[hand][bank].bank = {};
	}

	return currentPatchNow.padbanks[hand][bank].bank;
}

export function setBranchBankSettings(
	currentPatchNow: Patch,
	value: DeepPartial<BranchBankSettings> | undefined,
	bank: number,
	hand: Hand
): void {
	assertBranchParams(hand, bank);
	currentPatchNow.padbanks[hand][bank].bank = value;
}

export function getBranchControl(
	currentPatchNow: Patch,
	control: Control,
	number: number,
	hand: Hand,
	bank: number
): DeepPartial<BranchControl> {
	let editorDataNow: DeepPartial<BranchControl>;

	assertBranchParams(hand, bank, number);

	switch (control) {
		case Control.AccelX:
			editorDataNow = assertDefined(
				currentPatchNow.accel,
				"Accel branch must be defined"
			)[0];
			break;
		case Control.AccelY:
			editorDataNow = assertDefined(
				currentPatchNow.accel,
				"Accel branch must be defined"
			)[1];
			break;
		case Control.EncRotate:
			editorDataNow = currentPatchNow.encoders[number];
			break;
		case Control.Pad: {
			createPadsIfAbsent(currentPatchNow.padbanks[hand][bank]);
			editorDataNow = assertDefined(
				currentPatchNow.padbanks[hand][bank].pads,
				"Pads must be defined"
			)[number];
			break;
		}
		default:
			throw new Error(`Unknown control kind: ${control}`);
	}

	return editorDataNow;
}

export function setBranchControl(
	currentPatchNow: Patch,
	value: DeepPartial<BranchControl> | undefined,
	control: Control,
	number: number,
	hand: Hand,
	bank: number
): void {
	if (typeof value === "undefined") {
		throw new Error(
			`Trying to set currentPatch's branch with an undefined value`
		);
	}

	assertBranchParams(hand, bank, number);

	if (
		(control === Control.AccelX || control === Control.AccelY) &&
		!currentPatchNow.accel
	) {
		currentPatchNow.accel = [];
	}

	if (control === Control.EncRotate && !currentPatchNow.encoders) {
		currentPatchNow.encoders = [];
	}

	switch (control) {
		case Control.AccelX:
			currentPatchNow.accel![0] = value;
			return;
		case Control.AccelY:
			currentPatchNow.accel![1] = value;
			return;
		case Control.EncRotate:
			currentPatchNow.encoders[number] = value;
			return;
		case Control.Pad: {
			createPadsIfAbsent(currentPatchNow.padbanks[hand][bank]);
			currentPatchNow.padbanks[hand][bank].pads![number] = value;
			return;
		}
		default:
			throw new Error(`Unknown control kind: ${control}`);
	}
}

// export function sleep (ms = 1) { return new Promise((rs, rj) => setTimeout(_ => rs(), ms) }
