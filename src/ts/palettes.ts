import { getCSSfromURL, getURLfromSVG } from "icons";

let svgStorage = [null, null, null, null, null, null, null, null];

export const predefinedPalettes = [
	[
		0xdbffc6, 0xe2ff9d, 0xf7ff83, 0xffeb6c, 0xffc857, 0xffa144, 0xff7631,
		0xff4419, 0xff140d, 0xff0760, 0xff0cdc, 0xc30aff, 0x4e04ff, 0x0925ff,
		0x068cff, 0x0cedf3,
	],
	[
		0x006400, 0x006400, 0x556b2f, 0x006400, 0x008000, 0x228b22, 0x6b8e23,
		0x008000, 0x2e8b57, 0x66cdaa, 0x32cd32, 0x9acd32, 0x90ee90, 0x7cfc00,
		0x66cdaa, 0x228b22,
	],
	[
		0x191970, 0x00008b, 0x191970, 0x000080, 0x00008b, 0x0000cd, 0x2e8b57,
		0x008080, 0x5f9ea0, 0x0000ff, 0x008b8b, 0x6495ed, 0x7fffd4, 0x2e8b57,
		0x00ffff, 0x87cefa,
	],
	[
		0x5500ab, 0x84007c, 0xb5004b, 0xe5001b, 0xe81700, 0xb84700, 0xab7700,
		0xabab00, 0xab5500, 0xdd2200, 0xf2000e, 0xc2003e, 0x8f0071, 0x5f00a1,
		0x2f00d0, 0x0007f9,
	],
];

let customPalettes = [
	[
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
	],
	[
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
	],
	[
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
	],
	[
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
		"transparent",
	],
];

function colourFromNumber(v: number) {
	return "#" + v.toString(16).padStart(6, "0");
}

export function getPaletteCSS(i: number) {
	if (!svgStorage[i]) {
		let palette = i >= 4 ? customPalettes[i % 4] : predefinedPalettes[i];

		svgStorage[i] = getURLfromSVG(getPaletteSVG(palette));
	}

	return getCSSfromURL(svgStorage[i]);
}

export function getPaletteSVG(palette: number[] | string[]): string {
	let svg = `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
			 viewBox="0 0 16 1" style="enable-background:new 0 0 16 1;" xml:space="preserve">
		`;

	for (let i = 0; i < 16; i++) {
		let theColour =
			typeof palette[i] === "string"
				? palette[i]
				: colourFromNumber(palette[i] as number);
		svg += `<rect x="${i}" fill='${theColour}' width="1.5" height="1"/>`;
	}

	svg += "</svg>";

	return svg;
}
