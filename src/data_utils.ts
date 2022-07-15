import { fakeNoteUseScale } from './midi_utils'
import { ExpanderSanizer } from './data_expandsanize';

import type { Model } from './device';
import type { Pattern } from './types';
import type { Patch, PatchInfoItem, BranchBank, BranchControl } from './types_patch';

export const numberOfPads = 16;

export function getEmptyPadDataArray()
{
	const emptyPadDataArray = [];
	for (let i=0; i<numberOfPads; i++) emptyPadDataArray.push({});
	return emptyPadDataArray;
}

// export interface PatchListItem
// {
// 	name: string, isThePatch: boolean
// }

export function patchAsFileFromData(filedata: string | Buffer, filename: string, json: boolean)
{
	filename = json ? filename.replace(".dbrpatch",".json") : filename;
	let filetype = json ? "application/json" : "application/bson";
	
	let blob = new Blob([filedata], { type: filetype });
	
	let a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = filename;
	a.click();
}

export function sortPatchList(aX: PatchInfoItem, bX: PatchInfoItem): number
{
	let a = aX.name.toLowerCase();
	let b = bX.name.toLowerCase();
	
	let i;
	let codeA;
	let codeB = 1;
	let posA = 0;
	let posB = 0;
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЬЫЪЭЮЯабвгдеёжзийклмнопрстуфхцчшщьыъэюя";

	function getCode(str: string, pos: number, code: number | null) {
		if (code)
		{
			for (i = pos; code = getCode (str, i, null), code < 76 && code > 65;) ++i;
			return +str.slice(pos - 1, i);
		}
		
		code = alphabet && alphabet.indexOf(str.charAt(pos));
		
		return code > -1 ? code + 76 : ((code = str.charCodeAt(pos) || 0), code < 45 || code > 127) ? code
			: code < 46 ? 65               // -
			: code < 48 ? code - 1
			: code < 58 ? code + 18        // 0-9
			: code < 65 ? code - 11
			: code < 91 ? code + 11        // A-Z
			: code < 97 ? code - 37
			: code < 123 ? code + 5        // a-z
			: code - 63;
	}


	if ((a+="") != (b+="")) for (;codeB;)
	{
		codeA = getCode(a, posA++, null);
		codeB = getCode(b, posB++, null);

		if (codeA < 76 && codeB < 76 && codeA > 66 && codeB > 66)
		{
			codeA = getCode(a, posA, posA);
			codeB = getCode(b, posB, posA = i);
			posB = i;
		}

		if (codeA != codeB) return (codeA < codeB) ? -1 : 1;
	}
	
	return 0;
}

export function arrayToFlag(arr: boolean[]): number
{
	let flag: number = 0;
	for (let i: number = 0; i < arr.length; i++) flag |= (arr[i] ? (1 << i) : 0);
	return flag;
}

export function flagToArray(arr: boolean[], flag: number)
{
	for (let i: number = 0; i < arr.length; i++) arr[i] = ((flag & (1 << i)) != 0);
}

export function getKeyByValue(object: any, value: any)
{
	return Object.keys(object).find(key => object[key] === value);
}

export function deepClone(data: any) { return JSON.parse(JSON.stringify(data)); }
export function isSame(data1: any, data2: any) { return JSON.stringify(data1) === JSON.stringify(data2); }
export function isEmpty(a: any) { return Object.keys(a).length === 0; }

export function fillWithTemplate(bank: BranchBank, action: string, key: {trigger:boolean,toggle:boolean,key:string} | string, basevalue: number = 0, increment: number = 1)
{
	let isTrigger = false;
	let isToggle = false;
	
	if (typeof key == "object")
	{
		isTrigger = key.trigger;
		isToggle = key.toggle;
		key = key.key;
	}
	
	let what = key;
	
	console.log(what,key,isTrigger,isToggle);
	
	if (key == "scale")
	{
		basevalue = fakeNoteUseScale;
		increment = 0;
		key = "note";
	}
	
	createObjectIfAbsent(bank,"pads",[]);
	
	const removeCCAuxKeys = [ "min","max","rampu","rampd","par" ];
	
	for (let i = 0; i < numberOfPads; i++)
	{
		if (bank.pads[i] == undefined) bank.pads[i] = {};
		
		let thePad = bank.pads[i];
		
		if ("midi" in thePad)
		{
			if (action == "fill")
				delete(thePad.midi);
			else if (action == "append")
			{
				if (what == "cc")
				{
					for (let keyCC of removeCCAuxKeys)
					{
						if (keyCC in thePad.midi) delete(thePad.midi[keyCC]);
					}
				}
			}
		}
		
		createObjectIfAbsent(thePad,"midi");
		
		if (key == null) continue;
		
		let possibleValue = basevalue + i * increment;
		
		if (
			what != "scale" &&
			possibleValue != fakeNoteUseScale &&
			(possibleValue < 0 || possibleValue > 127)
		)
			continue;
			
		console.log("We are still here");
		
		thePad.midi[key] = possibleValue;
		
		console.log(thePad.midi)
		
		if (what == "cc")
		{
			thePad.midi["max"] = 127;
			if (!isTrigger) thePad.midi["min"] = 0;
			if (isToggle)   thePad.midi["par"] = 1;
		}
	}
}

export async function getPatch(currentPatch: Patch, model: Model, action: Function)
{
	ExpanderSanizer.latchAll(); // sanize all data and re-expand on the next ineration
	sanizePatch(currentPatch, model); // sanize the patch in general
	await action(); // wait for the actual stuff to happen, i.e. upload the patch or download it as file
	fixAndExpandPatch(currentPatch, model); // re-expand it
	// the data we sanized in the beginning is expanded automatically
}

export function sanizePatch(currentPatch: Patch, model: Model)
{
	let cleanObject: any = {};
	
	if (!("info" in currentPatch) || !("padbanks" in currentPatch) || currentPatch.padbanks.length != 1 || currentPatch.padbanks[0].length != 8)
		throw("Patch is malformed");

	cleanObject.info = currentPatch.info;
	
	for (let fixDeviceAbsence of [ 'encoders', 'faders', 'pots' ])
	{
		if (model[fixDeviceAbsence])
		{
			let anythingIsNotEmpty = currentPatch[fixDeviceAbsence].find((v: BranchControl)=>{return !isEmpty(v)});
			if (!anythingIsNotEmpty) delete currentPatch[fixDeviceAbsence];
		}
	}
	
	if (isEmpty(currentPatch.settings)) delete currentPatch.settings;
	
	if ("settings" in currentPatch) cleanObject.settings = currentPatch.settings;
	if ("encoders" in currentPatch)
	{
		cleanObject.encoders = currentPatch.encoders;
		
		console.log(cleanObject.encoders);
		
		while (cleanObject.encoders.length > model.encoders) cleanObject.encoders.pop();
		while (cleanObject.encoders.length < model.encoders) cleanObject.encoders.push({});
		
		// let hasAnyData = false;
		// 
		// for (let enc of cleanObject.encoders)
		// {
		// 	if (Object.keys(enc).length)
		// 	{
		// 		hasAnyData = true;
		// 		break;
		// 	}
		// }
	}
	if ("joystick" in currentPatch) cleanObject.joystick = currentPatch.joystick;
	if ("faders" in currentPatch) cleanObject.faders = currentPatch.faders;
	if ("pots" in currentPatch) cleanObject.pots = currentPatch.pots;
	if ("proximity" in currentPatch) cleanObject.proximity = currentPatch.proximity;
	if ("imu" in currentPatch) cleanObject.imu = currentPatch.imu;
	cleanObject.padbanks = currentPatch.padbanks;
	
	return cleanObject;
}

export function createObjectIfAbsent(obj: object, name: string, what: any = {}): boolean { if (!(name in obj)) { obj[name] = what; return true; } return false; }
export function createPadsIfAbsent(bank: BranchBank): boolean { return createObjectIfAbsent(bank, "pads", getEmptyPadDataArray()) }

export function fixAndExpandPatch(currentPatch: any, model: Model)
{
// the question is: should we be marking as unsaved if we make changes within this routine?
// fixing absent keys...
	
	createObjectIfAbsent(currentPatch, "info");
	createObjectIfAbsent(currentPatch.info, "pattern", getEmptyPadDataArray().forEach((_: any, k: number, a: Pattern)=>a[k]=0)); // add pattern array if it is not present, filled with zeroes
	createObjectIfAbsent(currentPatch, "settings");
	
	for (let fixDevicePresence of [ 'encoders', 'faders', 'pots' ])
	{
		if (model[fixDevicePresence])
		{
			console.info(`${fixDevicePresence} branch doesn’t exists!`);
			if (createObjectIfAbsent(currentPatch, fixDevicePresence, []))
			{
				console.info(`${fixDevicePresence} branch has been created!`);
				for (let i = 0; i < model[fixDevicePresence]; i++) currentPatch[fixDevicePresence].push({});
			}
		}
	}
	
// fixing legacy stuff...

	interface BranchControlWithComboInMidi extends BranchControl { midi: any }
	
	currentPatch?.encoders?.forEach((theEncoder: BranchControlWithComboInMidi) =>
	{
		if (theEncoder?.midi?.combo)
		{
			theEncoder.combo = theEncoder.midi.combo;
			delete theEncoder.midi.combo;
			
			if (isEmpty(theEncoder.midi)) delete theEncoder.midi;
		}
	});
	
	currentPatch?.padbanks.forEach((theHand: BranchBank[]) =>
	{
		theHand.forEach((theBank: BranchBank) => {
			

			
			theBank.pads?.forEach((thePad: BranchControlWithComboInMidi) =>
			{
				if (thePad.midi?.combo)
				{
					thePad.combo = thePad.midi.combo;
					delete thePad.midi.combo;
					
					if (isEmpty(thePad.midi)) delete thePad.midi;
				}
			})
		})
	});
}

export function getRandomIntInclusive(min: number, max: number, random: number = Math.random()) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(random * (max - min + 1)) + min; //Максимум и минимум включаются
}

export function map(x: number, in_min: number, in_max: number, out_min: number, out_max: number): number
{
	let divisor: number = (in_max - in_min);
//	if (divisor: number == 0) return -1;
	return Math.floor(Math.floor((x - in_min) * (out_max - out_min)) / divisor + out_min);
}

export enum NameFailsBecause {
	Nothing,
	Empty,
	BadCharacters,
	Dot,
	TooLong,
	Exists
};

export function checkIfPatchNameIsValid(testName: string, patchesInfo: PatchInfoItem[]): NameFailsBecause
{	
	if (testName.length === 0) return NameFailsBecause.Empty;
	// 
	// if (testName.match(/([^a-z0-9!. ]+)/gi)) return NameFailsBecause.BadCharacters;
	if (testName[0] == ".") return NameFailsBecause.Dot;
	
	const forbiddencharacters = [ "/","?","^","<",">","\\",":","*","|","\"" ];
	
	for (let char of testName)
	{
		let ccode = char.charCodeAt(0);
		
		if (ccode == 160) continue; // non-breaking space wtf
		
		if ((ccode < 0x20 || ccode > 0x7e) || forbiddencharacters.includes(char)) {
			
			console.log(ccode, ccode < 0x20, ccode > 0x7e, forbiddencharacters.includes(char), "FAILS HERE");
			return NameFailsBecause.BadCharacters; 
		
		}
		
			// меняем любые запрещённые в FAT и просто странные символы на подчёркивание (_)
			// для подчёркиваниедрочеров: НЕ ПРОБЕЛ, СУКА. ПРОБЕЛ МОЖНО! 
			// Хотя нет, позвольте, ведь My_Cool_Patch.dbrpatch НАМНОГО КРУЧЕ И ПРОФЕССИОНАЛЬНЕЙ ВЫГЛЯДИТ, ДА????
			// Фух.
	}
	
	if (testName[testName.length - 1] == ".") return NameFailsBecause.Dot;
	
	testName += ".dbrpatch";
	
	if (testName.length >= 32) return NameFailsBecause.TooLong;
	
	if (patchesInfo.find((v: PatchInfoItem) => v.name === testName)) return NameFailsBecause.Exists;
	console.log("ALL GOOD");
	return NameFailsBecause.Nothing;
}


// export function sleep (ms = 1) { return new Promise((rs, rj) => setTimeout(_ => rs(), ms) }