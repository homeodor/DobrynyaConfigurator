"use strict";

import type { BranchBank } from "./types_patch";

export const fakeNoteUseScale = 0xfe;
export const fakeNoteOff = 0xff;
export const paramOff = 0xff;
export const paramOffNegative = -1;
export let octaveDAWOffset = 2;

export const Notes: string[] = [ "C","C#","D","D#","E","F","F#","G","G#","A","A#","B" ];

interface Scale
{
	readonly name: string;
	readonly totalnotes: number;
	readonly notes: number[];
};



export enum SysExCommand
{
	NONE = 0x0,
	STATUS,
	FREESPACE,
	PATCHLIST,
	READPATCH,
	WRITEPATCH,
	OVERWRITEPATCH,
	DELETEPATCH,
	READPATCHTHROUGH,
	GETPATCHINFO,
	LOADPATCH,
	RENAMEPATCH,
	COPYPATCH,  // 0xC

	GETSETTINGS = 0x10,
	SAVESETTINGS,
	GETCHIPID,
	GETSERIAL,
	GETFIRMWAREMODEL,
	GETFACTORYSETTINGS,
	GETVERSION,
	GETPRESENTDEVICES, // 0x17
	
	INVOKECONTROL = 0x20,
	LOCKPATCHSWITCHING,
	WAKE,
	LOADBANK, // 0x23
	
	LIGHTUP =	   0x40,
	BURST,
	PALETTE, // 0x42
	
	REBOOT = 0x60,
	REBOOT_MSC,
	REBOOT_BOOT,
};

export enum SysExStatus
{
	NONE,
	OK,
	REQUEST,
	RESET,
	COMPLETE,
	PUSH,
	GENERICERROR = 0x10,
	NO_FILE,
	NO_FILESYSTEM,
	NO_ENTITY,
	FILE_EXISTS,
	CANT_RENAME,
	WRONG_CHECKSUM,
	WRONG_LENGTH,
	WRONG_FILENAME,
	FILENAME_TOO_LONG,
	
	USECHECKSUM = 0x40,
	TIMEOUT = -1,
	OLD_FIRMWARE = -2,
};

export interface KeyInfo
{
	key: number,
	scale: number,
	octave: number,
	offset: number
}

export interface MidiResult
{
	command: SysExCommand,
	status: SysExStatus,
	model: any, 							// change to smth meaningful?
	hasControlSum: boolean,
	filename: string,
	data: any,
	success: boolean
};

export enum MidiCtrl
{
  OFF = 0x80,
  VELOCITY = 0x81,
  PITCH = 0x82,
  CC = 0x83,
  CCREL = 0x84,
  CHANNEL = 0x85,
  CABLE = 0x86,   // MIGHT implement this, however there will be no support for this over Bluetooth, and that sucks
  NOTE = 0x87,   // TBD, though mostly ok
  OTHER = 0x88,
  STARTSTOP = 0x89,
  CONTINUESTOP = 0x8a,
  REWIND = 0x8b,

  SONG_POS_POINTER   = 0xF2,
  SONG_SELECT        = 0xF3,
  START              = 0xFA,
  CONTINUE           = 0xFB,
  STOP               = 0xFC,
  ACTIVE_SENSING     = 0xFE,
  SYSTEM_RESET       = 0xFF,
//  TOTAL
};

export const scales: Scale[] =
[
	{ name: "Major", totalnotes: 7, notes: [ 0,2,4,5,7,9,11 ] }, // major
	{ name: "Minor", totalnotes: 7, notes: [ 0,2,3,5,7,8,10 ] }, // minor
	{ name: "Lydian", totalnotes: 7, notes: [ 0,2,4,6,7,9,11 ] }, // lydian
	{ name: "Myxolydian", totalnotes: 7, notes: [ 0,2,4,5,7,9,10 ] }, // myxolydian
	{ name: "Spanish", totalnotes: 7, notes: [ 0,1,4,5,7,8,10 ] }, // spanish  
	{ name: "Dorian", totalnotes: 7, notes: [ 0,2,3,5,7,9,10 ] }, // dorian
	{ name: "Phrygian", totalnotes: 7, notes: [ 0,1,3,5,7,8,10 ] }, // phrygian
	{ name: "Harmonic minor", totalnotes: 7, notes: [ 0,2,3,5,7,8,11 ] }, // harmonic minor
	{ name: "Melodic minor", totalnotes: 7, notes: [ 0,2,3,5,7,9,11 ] }, // melodic minor
	{ name: "Major pentatonic", totalnotes: 5, notes: [ 0,2,4,  7,9,     0,0 ] }, // major 5tonic
	{ name: "Minor pentatonic", totalnotes: 5, notes: [ 0,3,5,  7,10,    0,0 ] }, // minor 5tonic
	{ name: "Hemi pentatonic", totalnotes: 5, notes: [ 0,1,5,  7,8,     0,0 ] }, // hemi 5tonic
	{ name: "Chromatic", totalnotes: 12, notes: [ 0,0,0,0,0,0,0 ] }
];

export function octaveRangeToInline(v: number): string { return String(v - 2); }
export function octaveInlineToRange(v: string): number { return parseInt(v) + 2; }

export function ccToHuman(cc: number): number | string
{
	const ccNames = 
	{
		'1':   "Mod.",
		'128': "Off",
		'129': "G.Vel",
		'130': "Pitch",
		'133': "G.Ch",
		'137': "St/St",
		'138': "Cnt/St",
		'139': "Rew",
		'250': "Start",
		'251': "Cont.",
		'252': "Stop",
		'255': "Reset"
	};
	
	return ccNames[cc] ?? cc;
}

export function constrainValue(v: number): number
{
	v = Math.floor(v);
	if (v < 0) v = 0;
	if (v > 127) v = 127;
	return v;
}

export function noteAndOctaveToMidi(note: number, octave: number): number
{
	return constrainValue(Math.trunc(octave) * 12 + Math.trunc(note));
}

export function noteMidiToNoteAndOctave(note: number): number[]
{
	let octave = Math.floor(note / 12);
	note %= 12;
	return [note, octave];
}

export function noteMidiToHuman(note: number): string
{
	if (!note) return "";
	if (note > 127) return "X";
	let noteAndOctave = noteMidiToNoteAndOctave(note);
	return (Notes[noteAndOctave[0]] + (noteAndOctave[1] - octaveDAWOffset)).replace("-","–");
}

export function currentKeyInfoToKey(bank: BranchBank): KeyInfo | false
{
	return (bank?.bank?.keyinfo && bank?.bank?.keyinfo !== -1) ? keyInfoToKeyObject(bank.bank.keyinfo) : false;
}

export function keyObjectToKeyInfo(k: KeyInfo): number
{
	return ((k.key & 0xf) << 12) | ((k.scale & 0xf) << 8) | ((k.octave & 0xf) << 4) | (k.offset & 0xf);
}

export function keyInfoToKeyObject(v:number): KeyInfo
{
	return {
		key   :  (v >> 12) & 0xf,
		scale :  (v >> 8)  & 0xf,
		octave : (v >> 4)  & 0xf,
		offset :  v        & 0xf,
	};
}

export function getCurrentScaleName(currentBank: BranchBank): string
{
	if (currentBank?.bank?.keyinfo != undefined && currentBank.bank.keyinfo != -1)
	{
		let scaleInfo = currentKeyInfoToKey(currentBank);
		if (scaleInfo === false) return;
		return `${Notes[scaleInfo.key]} ${scales[scaleInfo.scale].name}`;
	}
	else
		return '';
}

interface NoteInScaleData 
{
	isKeyOfScale: boolean,
	note: number,
	noteName: string,
	key: number
} 

export function getNoteInCurrentScale(padNo: number, bank: BranchBank) : NoteInScaleData
{
	return getNoteInScale(padNo, currentKeyInfoToKey(bank));
}

function getNoteInScale(pad: number, key: false | number | KeyInfo): NoteInScaleData
{
	if (key === false) return {
		isKeyOfScale: false,
		key: -1,
		note: fakeNoteOff,
		noteName: ""
	};
	
	if (typeof key === "number") key = keyInfoToKeyObject(key);
	
	let theScale = scales[(key as KeyInfo).scale];
	
	let sumOffset: number = pad + (key as KeyInfo).offset;
	
	let offsetFromScale = (theScale.totalnotes >= 12) ?
		sumOffset % theScale.totalnotes :
		theScale.notes[ sumOffset % theScale.totalnotes ];
		
//		console.log(key, theScale, theScale.notes, sumOffset, theScale.notes[ sumOffset % theScale.totalnotes ], offsetFromScale);
	
	let noteValue = (key as KeyInfo).key +
		((key as KeyInfo).octave + Math.trunc(sumOffset / theScale.totalnotes)) * 12 +
		offsetFromScale;
	
	return {
		isKeyOfScale: offsetFromScale === 0,
		key: (key as KeyInfo).key,
		note: noteValue,
		noteName: noteMidiToHuman(noteValue)
		};
}

export function eightToSeven(arr: any): number[]
{
	let sevenBitCounter: number = 1;
	let nextByte: number = 0;
	let outArr: number[] = [];

	for (let i = 0; i < arr.length; ) // we are not incrementing the variable!
	{
		let resultByte;
		let byte = parseInt(arr[i]);
		if (isNaN(byte)) byte = parseInt(arr[i],16);

		if (byte > 255) throw `eightToSeven: value > 255 at byte ${i}`;

		if (sevenBitCounter < 8)
		{
			resultByte = nextByte | (byte >> sevenBitCounter); 
			nextByte   = (byte << (7 - sevenBitCounter)) & 0x7f;
			sevenBitCounter++;
			i++;												// because it’s done here
		} else {
			sevenBitCounter = 1;
			resultByte = nextByte;
			nextByte = 0;
		}

		outArr.push(resultByte);
	}

	outArr.push(nextByte);

	return outArr;
}
