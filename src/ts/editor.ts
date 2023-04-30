import { fakeNoteUseScale } from "midi_utils";
import { createObjectIfAbsent, numberOfPads } from "data_utils";
import type { BranchBank, PatchInfoItem } from "types_patch";

export const longestFilename = 64;
export const extensionLength = ".dbrpatch".length;

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

export const nbsp: string = String.fromCharCode(160);

export enum NameFailsBecause {
	Nothing,
	Empty,
	BadCharacters,
	Dot,
	TooLong,
	Exists
};

export function getNewPatchName(patchesInfo: PatchInfoItem[], thePatchName: string)
{
	if (patchesInfo === undefined || thePatchName === undefined || !patchesInfo.length) return; // come later
	
	let i: number = 1;
	let suggestedPatchName: string;
	
	do
	{
		if (!thePatchName)
			suggestedPatchName = `New ${i++}`;
		else
		{
			suggestedPatchName = `${thePatchName.
				replace(".dbrpatch",""). // remove extension
				substring(0,longestFilename - extensionLength - 10) // the filename is too long, so trim it down
			} Copy${i > 1 ? ` ${i}` : ""}`;
			i++;	
		}

	} while (patchesInfo.find(v => {return v.name === `${suggestedPatchName}.dbrpatch`}))
	
	return suggestedPatchName;
}

export function checkIfPatchNameIsValid(testName: string, patchesInfo: PatchInfoItem[]): NameFailsBecause
{	
	if (testName.length === 0) return NameFailsBecause.Empty;
	
	testName = testName.replaceAll(nbsp, " ").trim();
	// 
	// if (testName.match(/([^a-z0-9!. ]+)/gi)) return NameFailsBecause.BadCharacters;
	if (testName[0] == ".") return NameFailsBecause.Dot;
	
	const forbiddencharacters = [ "/","?","^","<",">","\\",":","*","|","\"" ];
	
	for (let char of testName)
	{
		let ccode = char.charCodeAt(0);
		
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
	
	if (testName.length >= longestFilename) return NameFailsBecause.TooLong; // Dobrynya actually allows longer filenames, but whatever
	
	if (patchesInfo.find((v: PatchInfoItem) => v.name === testName)) return NameFailsBecause.Exists;
	console.log("ALL GOOD");
	return NameFailsBecause.Nothing;
}