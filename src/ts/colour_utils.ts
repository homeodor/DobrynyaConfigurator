import { getRandomIntInclusive, map } from "basic";
import { type ColourArray, HexColour, type Pattern } from "./hexcolour";

export enum ColourPaintLayer {
	Off = -2,
	Pattern = -1,
	Idle = 0,
	Active = 1,
}

export const k_coloursPerBank = 4;
export const k_coloursPerPad = 2; // change definitions of HexArrays, too

export function gracefulGetColour(
	colourIndex: number, // colour index, which is 0 for idle and 1 for active
	padArrayIn: ColourArray | HexColour | null = null, // the pad array, which is 2 items, or a single colour (then transformed into array)
	bankArrayIn: ColourArray | null = null, // the bank array, can be 4 items
	isKeyOfScale: boolean = false, // is music key of the scale
	fallbackFromActive: boolean = true, // if no active colour is found, should we fall back to idle one?
	moreData: any = { noColour: false } // just a way to return some data for further use
): HexColour {
	if (padArrayIn instanceof HexColour) padArrayIn = [padArrayIn, padArrayIn];
	// if a signle colour was given, make an array out of it

	if (colourIndex >= k_coloursPerPad) {
		console.error(
			`gracefulGetColour received colour index ${colourIndex}, which is >= than allowed ${k_coloursPerPad}`
		);
		return HexColour.off();
	}

	const padArray =
		padArrayIn === null ? [] : padArrayIn.map(c => new HexColour(c));
	const bankArray =
		bankArrayIn === null ? [] : bankArrayIn.map(c => new HexColour(c));

	while (padArray.length < k_coloursPerPad) {
		padArray.push(HexColour.off());
	}

	while (bankArray.length < k_coloursPerBank) {
		bankArray.push(HexColour.off());
	}

	while (true) {
		if (padArray[colourIndex].isOn()) {
			return padArray[colourIndex];
			// if there is a colour in the pad itself, return it
		}

		if (isKeyOfScale && bankArray[colourIndex + k_coloursPerPad].isOn()) {
			moreData.noColour = true;
			return bankArray[colourIndex + k_coloursPerPad];
			// otherwise, if it is the key, try to get the key colour
		}

		if (bankArray[colourIndex].isOn()) {
			moreData.noColour = true;
			return bankArray[colourIndex];
			// if it is not the key, or the previous failed, get something from the bank colour
		}

		if (colourIndex === 0 || !fallbackFromActive) {
			moreData.noColour = true;
			return HexColour.off();
			// we have exhausted all the options now for colourIndex === 0
		}

		colourIndex--; // so we try to step down from Active (1) to Normal (0) colour and try again!
	}
}

export function hexOrAux(hex: HexColour, aux: HexColour): HexColour {
	return hex.isOn() ? hex : aux;
}

export function copyPattern(i: HexColour[], o: HexColour[]) {
	i.forEach((_, k) => (o[k] = i[k]));
}

export function randomPattern(currentPatchPattern: Pattern) {
	let arr: Pattern = [];

	let randomHue = getRandomIntInclusive(0, 255);
	let randomSat = getRandomIntInclusive(10, 15);
	let randomBri = getRandomIntInclusive(13, 15);

	let theColour = (randomHue << 8) | (randomSat << 4) | randomBri; // full brightness

	let colours = 0;

	while (colours < 4 || colours > 12) {
		arr = [];
		colours = 0;

		for (
			let i = 0;
			i < 16;
			i++ // !!!!!!!
		) {
			let isBlack = getRandomIntInclusive(0, 3);

			if (isBlack) {
				arr.push(HexColour.black());
			} else {
				colours++;
				arr.push(new HexColour(theColour));
			}
		}
	}

	copyPattern(arr, currentPatchPattern);
}

export function hueShiftPattern(currentPatchPattern: Pattern) {
	let hueOffset = getRandomIntInclusive(30, 220);

	currentPatchPattern.forEach((v: HexColour, k: number) => {
		currentPatchPattern[k] = v.shiftH(hueOffset);
	});
}
