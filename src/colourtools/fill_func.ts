import { numberOfPads } from "data_utils";
import { ColourPaintLayer } from "colour_utils";
import type { HexArrays } from "./common";
import { CTAffect, getLayerFromHexes, assembleLayerFromHexes } from "./common";
import { type ColourArray, HexColour } from "src/ts/hexcolour";

export enum HueMode {
	Short,
	Long,
	Rainbow,
}
export enum FillMode {
	Solid,
	GradientTD,
	GradientLR,
	GradientTLBR,
	GradientTRBL,
}

function getGradientComponent(
	v1: number,
	v2: number,
	point: number,
	total: number
): number {
	return Math.round(v1 + ((v2 - v1) / total) * point);
}

function getGradientAt(
	hex1: HexColour,
	hex2: HexColour,
	point: number,
	total: number,
	hueMode: HueMode = HueMode.Short
): HexColour {
	if (point == 0) {
		return hex1;
	}

	if (point == total) {
		return hex2;
	}

	let h1 = hex1.h;
	let h2 = hex2.h;
	let newH: number;

	if (h1 == h2) {
		newH = h1;
	} else {
		let pointH = point;
		let deltaH = h2 - h1;

		// console.log(h1,h2,deltaH);

		if (deltaH < 0) {
			let tempH2 = h2;
			h2 = h1;
			h1 = tempH2;
			pointH = total - pointH;
			deltaH = -deltaH;
		}

		// console.log(h1,h2,deltaH,deltaH > 0x7f);

		if (
			(deltaH > 0x7f && hueMode == HueMode.Short) ||
			(hueMode == HueMode.Long && deltaH < 0x7f)
		) {
			h1 += 0x100;
			newH = getGradientComponent(h1, h2, pointH, total);

			if (newH > 0xff) newH -= 0x100;
		} else {
			newH = getGradientComponent(h1, h2, pointH, total);
		}
	}

	return new HexColour(
		newH,
		getGradientComponent(hex1.s, hex2.s, point, total),
		getGradientComponent(hex1.v, hex2.v, point, total)
	);
}

export function fill(
	params: {
		well1: HexColour;
		well2: HexColour;
		mode: FillMode;
		huemode: HueMode;
		affect: CTAffect;
	},
	currentHex: HexArrays,
	currentLayer: ColourPaintLayer
): HexArrays {
	if (currentLayer === ColourPaintLayer.Off) {
		throw new Error("getLayerFromHexes called with ColourPaintLayer.Off");
	}

	let currentLayerArray = getLayerFromHexes(currentHex, currentLayer);

	currentHex.before = assembleLayerFromHexes(currentHex, currentLayer);

	let colour1 = params.well1;
	let colour2 = params.well2;
	let mode = params.mode;
	let hueMode = params.huemode;

	let fillarray: ColourArray = [];

	if (mode == FillMode.Solid) {
		for (let i = 0; i < numberOfPads; i++) fillarray.push(colour1);
	} else {
		let colourSafe1: HexColour = colour1.isOff()
			? currentHex.bank[currentLayer].isOff()
				? HexColour.black()
				: currentHex.bank[currentLayer]
			: colour1;
		let colourSafe2: HexColour = colour2.isOff()
			? currentHex.bank[currentLayer].isOff()
				? HexColour.black()
				: currentHex.bank[currentLayer]
			: colour2;
		// если где-то затесался выключенный цвет, попробуем взять цвет банка. Тупость со стороны пользователя. Но даже тут должна быть логика со стороны нас!

		let clrs = [
			colour1,
			getGradientAt(colourSafe1, colourSafe2, 1, 3, hueMode),
			getGradientAt(colourSafe1, colourSafe2, 2, 3, hueMode),
			colour2,
		]; // работает только с 16 кнопками

		let clrd = [
			colour1,
			getGradientAt(colourSafe1, colourSafe2, 1, 6, hueMode),
			getGradientAt(colourSafe1, colourSafe2, 2, 6, hueMode),
			getGradientAt(colourSafe1, colourSafe2, 3, 6, hueMode),
			getGradientAt(colourSafe1, colourSafe2, 4, 6, hueMode),
			getGradientAt(colourSafe1, colourSafe2, 5, 6, hueMode),
			colour2,
		]; // работает только с 16 кнопками

		switch (mode) {
			case FillMode.GradientTD: {
				fillarray = [
					clrs[3],
					clrs[3],
					clrs[3],
					clrs[3],
					clrs[2],
					clrs[2],
					clrs[2],
					clrs[2],
					clrs[1],
					clrs[1],
					clrs[1],
					clrs[1],
					clrs[0],
					clrs[0],
					clrs[0],
					clrs[0],
				];
				break;
			}
			case FillMode.GradientLR: {
				fillarray = [
					clrs[0],
					clrs[1],
					clrs[2],
					clrs[3],
					clrs[0],
					clrs[1],
					clrs[2],
					clrs[3],
					clrs[0],
					clrs[1],
					clrs[2],
					clrs[3],
					clrs[0],
					clrs[1],
					clrs[2],
					clrs[3],
				];
				break;
			}
			case FillMode.GradientTLBR: {
				fillarray = [
					clrd[3],
					clrd[4],
					clrd[5],
					clrd[6],
					clrd[2],
					clrd[3],
					clrd[4],
					clrd[5],
					clrd[1],
					clrd[2],
					clrd[3],
					clrd[4],
					clrd[0],
					clrd[1],
					clrd[2],
					clrd[3],
				];
				break;
			}
			case FillMode.GradientTRBL: {
				fillarray = [
					clrd[6],
					clrd[5],
					clrd[4],
					clrd[3],
					clrd[5],
					clrd[4],
					clrd[3],
					clrd[2],
					clrd[4],
					clrd[3],
					clrd[2],
					clrd[1],
					clrd[3],
					clrd[2],
					clrd[1],
					clrd[0],
				];
				break;
			}
		}
	}

	for (const i in currentLayerArray) {
		if (
			(params.affect == CTAffect.Bank &&
				currentLayerArray[i].isExplicit(currentLayer)) ||
			(params.affect == CTAffect.Explicit &&
				!currentLayerArray[i].isExplicit(currentLayer))
		) {
			continue;
		}

		if (currentLayer == ColourPaintLayer.Pattern) {
			currentHex.pattern[i] = fillarray[i];
		} else {
			currentHex.pads[currentLayer][i] = fillarray[i];
		}
	}

	currentHex.after = assembleLayerFromHexes(currentHex, currentLayer);

	return currentHex;
}
