import type { BranchBank } from "../types_patch";
import { numberOfPads, createPadsIfAbsent } from '../data_utils'
import { patchChanged } from "../events";
import { copyPattern, colourOff, ColourPaintLayer, gracefulGetColour } from '../colour_utils'
import type { ColourArray  } from "../types";
import { getNoteInCurrentScale } from '../midi_utils'

/*

	Constants

*/

const coloursPerBank = 4;
const coloursPerPad = 2; // change definitions of HexArrays, too

/*
	
	Types
	
*/

export interface HexArrays
{
	pattern: number[],
	bank: number[],
	pads: [number[],number[]],
	before?: number[],
	after?: number[],
	keys: boolean[],
};

export interface CTData
{
	hexStorage: HexArrays | null,
	bank: BranchBank,
	pattern: number[],
	layer?: ColourPaintLayer,
	hex?: number
}

export enum CTAffect
{
	All, Explicit, Bank
}

/*
	
	Colour transform lifecycle functions
	
*/

export function ctStart(dialog: HTMLDialogElement, data: CTData)
{
	dialog.showModal();
	data.hexStorage = getCurrentHexes(data.bank, data.pattern);
	return data; // svelte will be happy
}

export function ctExit(dialog: HTMLDialogElement, data: CTData)
{
	data.hexStorage = null;
	dialog.close();
}

export function ctFinish(dialog: HTMLDialogElement, action: Function, params: any, data: CTData)
{
	if (data.hexStorage)
	{
		action(params, data.hexStorage, data.layer);
		setCurrentHexes(data.hexStorage, data.bank, data.pattern);
		patchChanged();
	} else {
		throw "Tried to apply colour transforms, but hexStorage was null";
	}
	
	ctExit(dialog, data);
	
	return data; // make svelte happy
}

/*

	Hex array manipulation functions
	
*/

export function getEmptyHexArray()
{
	return {
		pattern: [],
		bank: [],
		pads: [[],[]],
		before: null,
		after: null
	}
}

export function getCurrentHexes(theBank: BranchBank, pattern: number[]): HexArrays
{
	let hex: HexArrays = {
		pattern: [],
		bank: [],
		pads: [[],[]],
		keys: [],
	};
	
//	console.log("PATTERN", pattern);
	
	copyPattern(pattern, hex.pattern);
	
//	console.log("PATTERN", hex.pattern);

	
	for (let i=0; i<coloursPerBank; i++) hex.bank.push(
		(theBank?.bank?.colour !== undefined) ?
			(theBank.bank.colour?.[i] ?? colourOff) :
			colourOff
	);
	
	for (let i=0; i<numberOfPads; i++)
	{
		hex.keys.push(getNoteInCurrentScale(i, theBank).isKeyOfScale);
		
		for (let j=0; j<coloursPerPad; j++)
		{
			hex.pads[j].push(
			(theBank?.pads?.[i]?.colour !== undefined) ?
				(theBank?.pads?.[i]?.colour?.[j] ?? colourOff) :
				colourOff
			);
		}
	}
	
	return hex;
}

export function colourIsExplicitlySet(hex: number, layerNo: ColourPaintLayer)
{
	return (hex != 0 && layerNo == -1) || (hex != colourOff && layerNo != -1);
}

export function assembleLayerFromHexes(hex: HexArrays, layerNo: ColourPaintLayer): ColourArray
{
	let layer = getLayerFromHexes(hex, layerNo);
	
	if (layerNo == ColourPaintLayer.Pattern) return [...layer]; // pattern
	
	let result = [];
	
	layer.forEach(
		(lhex, i) => {
			result.push(gracefulGetColour(layerNo, [lhex,lhex], hex.bank, hex.keys[i], false))
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

export function getLayerFromHexes(hex: HexArrays, layer: ColourPaintLayer): number[]
{
	return [...((layer == ColourPaintLayer.Pattern) ? hex.pattern : hex.pads[layer])];
}

function getNumberOfValidColours(a: number[])
{
	let result = 0;
	let totalCounter = 0;
	
	for (let v of a)
	{
		totalCounter++;
		if (v != colourOff) result = totalCounter;
	}
	
	return result;
}

export function setCurrentHexes(hex: HexArrays, theBank: BranchBank, pattern: number[])
{
	if (
		!hex.bank || !hex.pattern || !hex.pads ||
		hex.bank.length != coloursPerBank ||
		hex.pattern.length != numberOfPads ||
		hex.pads.length != coloursPerPad || hex.pads[0].length != numberOfPads || hex.pads[1].length != numberOfPads
	)
	{
		console.log(hex);
		throw "setCurrentHexes received wrong data";
	}

	copyPattern(hex.pattern, pattern);
	
	// console.log("Droppin colourz", window.currentPatch.padbanks[0][0]?.bank?.colour?.[0], theBank.bank.colour, hex.bank);
	
	if (theBank?.bank?.colour) delete theBank.bank.colour;

	let validBankColours = getNumberOfValidColours(hex.bank);
	
	// console.log("Droppin colourz", window.currentPatch.padbanks[0][0]?.bank?.colour?.[0], theBank.bank.colour, hex.bank, validBankColours);

	if (validBankColours)
	{
		if (!("bank" in theBank)) theBank.bank = {};
		theBank.bank.colour = [];
		for (let i=0; i < validBankColours; i++) theBank.bank.colour.push(hex.bank[i]);
	}
	// console.log("Droppin colourz", window.currentPatch.padbanks[0][0]?.bank?.colour?.[0], theBank.bank.colour, hex.bank, validBankColours);
	
	for (let pad of hex.pads)
	{
		for (let hx of pad)
		{
			if (hx != colourOff) // we find at least one colour
			{
				// if found, we try to create the pads array
				createPadsIfAbsent(theBank);
				break; // and break out
			} // if no colours were on, we do nothing
		}
	}
	
	if ("pads" in theBank)
	{
		for (let i=0; i<numberOfPads; i++)
		{
			let validColoursOfThisPad = 0;
		 
			if (hex.pads[0][i] == colourOff && hex.pads[1][i] == colourOff)
				validColoursOfThisPad = 0;
			else if (hex.pads[1][i] == colourOff)
				validColoursOfThisPad = 1;
			else
				validColoursOfThisPad = 2;
		 
			if (!validColoursOfThisPad)
			{
				if (theBank.pads[i].colour) delete theBank.pads[i].colour;
			} else {
				theBank.pads[i].colour = [];
				for (let j=0; j < validColoursOfThisPad; j++) theBank.pads[i].colour.push(hex.pads[j][i]);
			}
		}
	}
}

