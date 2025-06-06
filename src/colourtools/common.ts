import type { BranchBank } from "types_patch";
import { numberOfPads, createPadsIfAbsent } from "data_utils";
import { patchChanged } from "event_helpers";
import {
	copyPattern,
	ColourPaintLayer,
	gracefulGetColour,
	k_coloursPerBank,
	k_coloursPerPad,
} from "colour_utils";
import { getNoteInCurrentScale } from "midi_utils";
import { type ColourArray, HexColour } from "src/ts/hexcolour";

/*
	
	Types
	
*/

export interface HexArrays {
	pattern: HexColour[];
	bank: HexColour[];
	pads: [HexColour[], HexColour[]];
	before?: HexColour[];
	after?: HexColour[];
	keys: boolean[];
}

export interface CTData {
	hexStorage: HexArrays | null;
	bank: BranchBank;
	pattern: HexColour[];
	layer?: ColourPaintLayer;
	hex?: HexColour;
}

export enum CTAffect {
	All,
	Explicit,
	Bank,
}

/*
	
	Colour transform lifecycle functions
	
*/

export function ctStart(dialog: HTMLDialogElement, data: CTData): HexArrays {
	dialog.showModal();
	return getCurrentHexes(data.bank, data.pattern);
}

export function ctExit(dialog: HTMLDialogElement, data: CTData) {
	data.hexStorage = null;
	dialog.close();
}

export function ctFinish(
	dialog: HTMLDialogElement,
	action: Function,
	params: any,
	data: CTData
) {
	if (data.hexStorage) {
		action(params, data.hexStorage, data.layer);
		setCurrentHexes(data.hexStorage, data.bank, data.pattern);
		patchChanged();
	} else {
		throw "Tried to apply colour transforms, but hexStorage was null";
	}

	ctExit(dialog, data);
}

/*

	Hex array manipulation functions
	
*/

export function getEmptyHexArray() {
	return {
		pattern: [],
		bank: [],
		pads: [[], []],
		before: null,
		after: null,
	};
}

export function getCurrentHexes(
	theBank: BranchBank,
	pattern: HexColour[]
): HexArrays {
	let hex: HexArrays = {
		pattern: [],
		bank: [],
		pads: [[], []],
		keys: [],
	};

	copyPattern(pattern, hex.pattern);

	for (let i = 0; i < k_coloursPerBank; i++)
		hex.bank.push(
			theBank?.bank?.colour !== undefined
				? theBank.bank.colour?.[i]
					? new HexColour(theBank.bank.colour?.[i])
					: HexColour.off()
				: HexColour.off()
		);

	for (let i = 0; i < numberOfPads; i++) {
		hex.keys.push(getNoteInCurrentScale(i, theBank).isKeyOfScale);

		for (let j = 0; j < k_coloursPerPad; j++) {
			hex.pads[j].push(
				theBank?.pads?.[i]?.colour !== undefined
					? theBank?.pads?.[i]?.colour?.[j]
						? new HexColour(theBank?.pads?.[i]?.colour?.[j])
						: HexColour.off()
					: HexColour.off()
			);
		}
	}

	return hex;
}

export function assembleLayerFromHexes(
	hex: HexArrays,
	layerNo: ColourPaintLayer
): ColourArray {
	let layer = getLayerFromHexes(hex, layerNo);

	if (layerNo == ColourPaintLayer.Pattern) return [...layer]; // pattern

	let result = [];

	layer.forEach((lhex, i) => {
		result.push(
			gracefulGetColour(
				layerNo,
				[lhex, lhex],
				hex.bank,
				hex.keys[i],
				false
			)
		);
	});

	// for (let lhex of layer)
	// {
	// result.push(
	// 	lhex != colourOff ?
	// 		lhex :
	// 		hex.bank[layerNo] // не уверен что всё так просто. не уверен, что всё надо усложнять в то же время
	// );
	// }

	return [...result];
}

export function getLayerFromHexes(
	hex: HexArrays,
	layer: ColourPaintLayer
): ColourArray {
	if (layer === ColourPaintLayer.Off) {
		throw new Error("getLayerFromHexes called with ColourPaintLayer.Off");
	}

	return [
		...(layer == ColourPaintLayer.Pattern ? hex.pattern : hex.pads[layer]),
	];
}

function getNumberOfValidColours(a: ColourArray): number {
	let result = 0;
	let totalCounter = 0;

	for (let v of a) {
		totalCounter++;

		if (v.isOn()) {
			result = totalCounter;
		}
	}

	return result;
}

export function setCurrentHexes(
	hex: HexArrays,
	theBank: BranchBank,
	pattern: ColourArray
) {
	if (
		!hex.bank ||
		!hex.pattern ||
		!hex.pads ||
		hex.bank.length != k_coloursPerBank ||
		hex.pattern.length != numberOfPads ||
		hex.pads.length != k_coloursPerPad ||
		hex.pads[0].length != numberOfPads ||
		hex.pads[1].length != numberOfPads
	) {
		console.log(hex);
		throw new Error("setCurrentHexes received wrong data");
	}

	copyPattern(hex.pattern, pattern);

	if (theBank?.bank?.colour) {
		delete theBank.bank.colour;
	}

	let validBankColours = getNumberOfValidColours(hex.bank);

	// console.log("Droppin colourz", window.currentPatch.padbanks[0][0]?.bank?.colour?.[0], theBank.bank.colour, hex.bank, validBankColours);

	if (validBankColours) {
		if (!("bank" in theBank)) theBank.bank = {};
		theBank.bank.colour = [];
		for (let i = 0; i < validBankColours; i++)
			theBank.bank.colour.push(hex.bank[i].hex);
	}
	// console.log("Droppin colourz", window.currentPatch.padbanks[0][0]?.bank?.colour?.[0], theBank.bank.colour, hex.bank, validBankColours);

	for (let pad of hex.pads) {
		for (let hx of pad) {
			if (hx.isOn()) {
				// we find at least one colour
				// if found, we try to create the pads array
				createPadsIfAbsent(theBank);
				break; // and break out
			} // if no colours were on, we do nothing
		}
	}

	if ("pads" in theBank) {
		for (let i = 0; i < numberOfPads; i++) {
			let validColoursOfThisPad = 0;

			if (hex.pads[0][i].isOff() && hex.pads[1][i].isOff()) {
				validColoursOfThisPad = 0;
			} else if (hex.pads[1][i].isOff()) {
				validColoursOfThisPad = 1;
			} else {
				validColoursOfThisPad = 2;
			}

			if (!validColoursOfThisPad) {
				if (theBank.pads[i].colour) delete theBank.pads[i].colour;
			} else {
				theBank.pads[i].colour = [];
				for (let j = 0; j < validColoursOfThisPad; j++)
					theBank.pads[i].colour.push(hex.pads[j][i].hex);
			}
		}
	}
}
