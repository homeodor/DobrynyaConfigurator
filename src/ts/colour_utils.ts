import type { HexColour, ColourArray, Pattern, HexObject } from 'types'
import { deepClone, getRandomIntInclusive, map } from 'basic'

export const colourOff = 0xff00;

export enum ColourPaintLayer {
	Off = -2,
	Pattern = -1,
	Idle = 0,
	Active = 1
};

export function getH(hex: HexColour): number { return hex >> 8; }
export function getS(hex: HexColour): number { return (hex >> 4) & 0xf; }
export function getV(hex: HexColour): number { return hex & 0xf; }

export function hexFromComponents(h: number, s: number, v: number): number { return ((h & 0xff) << 8) | ((s & 0xf) << 4) | (v & 0xf); }

export function dimV(colour: HexColour): HexColour
{
   if (colour == colourOff) return colour;
   return (colour & 0xfff0) | 4;
}

export function maxV(colour: HexColour): HexColour
{
   if (colour == colourOff) return colour;
   return (colour & 0xfff0) | 0xf;
}

export function dimS(colour: HexColour): HexColour
{
   if (colour == colourOff) return colour;
   return (colour & 0xff0f) | 0xa0;
}

export function maxS(colour: HexColour): HexColour
{
   if (colour == colourOff) return colour;
   return (colour & 0xff0f) | 0xf0;
}

export function invH(colour: HexColour): HexColour
{
   if (colour == colourOff) return colour;
   const hue = colour >> 8;
   const hInv = (hue + 128) % 256;
   return (colour & 0xff) | (hInv << 8);
}

// function applyGammaVideo(brightness, gamma)
// {
// 	let orig = brightness / 255.0;
// 	let	adj =  (orig ** gamma) * 255.0;
// 	let result = Math.trunc(adj);
// 	return result;
// }
// 
// function hsv2rgb(hue,saturation,value)
// {
// 	const HSV_SECTION_6 = 0x20;
// 	const HSV_SECTION_3 = 0x40;
// 	
// 	let r,g,b;
// 	
// 	hue = map(hue,0,255,0,191);
// 	
// 	let invsat = 255 - saturation;
// 	let brightness_floor = Math.trunc((value * invsat) / 256);
// 	let color_amplitude = value - brightness_floor;
// 
// 
// 	let section = Math.trunc(hue / HSV_SECTION_3); // 0..2
// 	let offset = hue % HSV_SECTION_3;  // 0..63
// 
// 	let rampup = offset; // 0..63
// 	let rampdown = (HSV_SECTION_3 - 1) - offset; // 63..0
// 
// 	// compute color-amplitude-scaled-down versions of rampup and rampdown
// 	let rampup_amp_adj   = Math.trunc((rampup   * color_amplitude) / 64);
// 	let rampdown_amp_adj = Math.trunc((rampdown * color_amplitude) / 64);
// 
// 	// add brightness_floor offset to everything
// 	let rampup_adj_with_floor   = rampup_amp_adj   + brightness_floor;
// 	let rampdown_adj_with_floor = rampdown_amp_adj + brightness_floor;
// 
// 	if( section ) {
// 		if( section == 1) {
// 			// section 1: 0x40..0x7F
// 			r = brightness_floor;
// 			g = rampdown_adj_with_floor;
// 			b = rampup_adj_with_floor;
// 		} else {
// 			// section 2; 0x80..0xBF
// 			r = rampup_adj_with_floor;
// 			g = brightness_floor;
// 			b = rampdown_adj_with_floor;
// 		}
// 	} else {
// 		// section 0: 0x00..0x3F
// 		r = rampdown_adj_with_floor;
// 		g = rampup_adj_with_floor;
// 		b = brightness_floor;
// 	}
// 	
// 	return "rgb(" + 
// 	r + "," + 
// 	g + "," + 
// 	b + ")";
//    
// }

export function hexToObj(hex: HexColour) : HexObject
{
	return { h: getH(hex), s: getS(hex), v: getV(hex) };
}

export function hsvToHex(h: number, s: number, v: number): HexColour
{
	return ((h & 0xff) << 8) | ((s & 0xf) << 4) | (v & 0xf);
}

export function gracefulGetColour(
	colourIndex: number,					// colour index, which is 0 for idle and 1 for active
	padArrayIn: ColourArray | HexColour | null = null,	// the pad array, which is 2 items, or a single colour (then transformed into array)
	bankArrayIn: ColourArray | null = null,	// the bank array, can be 4 items
	isKeyOfScale: boolean = false,					// is music key of the scale
	fallbackFromActive: boolean = true,		// if no active colour is found, should we fall back to idle one?
	moreData: any = {noColour: false})		// just a way to return some data for further use
	: number
{
	if (typeof padArrayIn === "number") padArrayIn = [ padArrayIn, padArrayIn ]; // if a signle colour was given, make an array out of it
	
	if (colourIndex >= 2)
	{
		console.error(`gracefulGetColour received colour index ${colourIndex}, which is >= than 2`);
		return colourOff;
	}
	
	let padArray  =  (padArrayIn === null) ? [] : deepClone(padArrayIn);
	let bankArray = (bankArrayIn === null) ? [] : deepClone(bankArrayIn);	
	
	
	while (padArray.length < 2) padArray.push(colourOff);
	while (bankArray.length < 4) bankArray.push(colourOff);

	// console.log("GRACEFUL", colourIndex, padArrayIn, padArray, bankArrayIn, bankArray, isKeyOfScale);
	
	while(true)
	{
		if (padArray[colourIndex] !== colourOff) return padArray[colourIndex];	// if there is a colour in the pad itself, return it
		if (isKeyOfScale && bankArray[colourIndex + 2] !== colourOff) { moreData.noColour = true; return bankArray[colourIndex + 2]; } // otherwise, if it is the key, try to get the key colour
		if (bankArray[colourIndex] !== colourOff) { moreData.noColour = true; return bankArray[colourIndex]; }	// if it is not the key, or the previous failed, get something from the bank colour
		if (colourIndex === 0 || !fallbackFromActive) { moreData.noColour = true; return colourOff; }								// we have exhausted all the options now for colourIndex === 0	
		colourIndex--; 															// so we try to step down from Active (1) to Normal (0) colour and try again!
	}
}

export function isSameColour(what: HexColour, against: HexColour): boolean
{
	if (what == against) return true;
	
	if (what == colourOff || against == colourOff) return false; // one colour is off, but the other is not

	let whatHSV:    HexObject = hexToObj(what);
	let againstHSV: HexObject = hexToObj(against);
	
	if (againstHSV.v == 0 && whatHSV.v == 0) return true; // black
	if (againstHSV.s == 0 && againstHSV.s == whatHSV.s && againstHSV.v == whatHSV.v) return true; // shade of gray
	
	return false;
}

export function hexToCSS(hex?: HexColour, defaultHex?: HexColour): string
{
	const corrector =  [0, 5, 13, 17, 24, 27, 29, 31, 33, 36, 38, 40, 42, 45, 48, 50];
	
//	if (!hex) return "";
	
	if (hex == colourOff)
	{
		if (!defaultHex || defaultHex == colourOff) return "";
		hex = defaultHex; // use defaultHex if provided
	}
	
	let hsv = hexToObj(hex);
	
	let correctS = map(hsv.s,0,15,0,100);
	let correctL = corrector[hsv.v] * ((100 - correctS) / 100 + 1);
		
	return "hsl("
		+ map(hsv.h,0,255,0,360) + ",  "
		+ correctS + "%, "
		+ correctL + "%)";
}

export function hexOrAux(hex: HexColour, aux: HexColour): HexColour
{
	return hex == colourOff ? aux : hex;
}

export function copyPattern(i: number[], o: number[])
{
	i.forEach((_,k)=>o[k]=i[k])
}

export function randomPattern(currentPatchPattern: Pattern)
{
	let arr = [];
	
	let randomHue = getRandomIntInclusive(0,255);
	let randomSat = getRandomIntInclusive(10,15);
	let randomBri = getRandomIntInclusive(13,15);
	
	let theColour = (randomHue << 8) | (randomSat << 4) | randomBri; // full brightness
	
	let colours = 0;

	while (colours < 4 || colours > 12)
	{
		arr = [];
		colours = 0;
		
		for (let i = 0; i < 16; i++) // !!!!!!!
		{
			let isBlack = getRandomIntInclusive(0,3);
			
			if (isBlack)
				arr.push(0);
			else
			{
				colours++;
				arr.push(theColour);
			}
		}
	}
	
	copyPattern(arr, currentPatchPattern);
}

export function hueShiftPattern(currentPatchPattern: Pattern)
{	
	let hueOffset = getRandomIntInclusive(30,220);
	
	currentPatchPattern.forEach((v,k) => {
		if ((v & 0xf) != 0) // not black
			currentPatchPattern[k] = ((((v >> 8) + hueOffset) & 0xff) << 8) | (v & 0xff);
		else
			currentPatchPattern[k] = 0; // if it is black, just make it zero
	});
}