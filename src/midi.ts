import { WaitingBlock } from './waitingblock'
import { SysExCommand, SysExStatus } from './midi_utils'
import type { MidiResult } from './midi_utils'
import { interpretMidiEvent, onMIDIMessage } from './midi_onmidi'
import type { HexColour, ColourArray, Hand } from './types'

let midi: MIDIAccess | null = null;
let portOut: MIDIOutput | null = null;
let portIn: MIDIInput | null = null;

let pingInterval = null;

let dobrynyaIsHere: boolean = false;
let dobrynyaWasHere: boolean = false;

export let isConnected = true;
export const flipConnected = function() {
	isConnected = !isConnected;
	if (isConnected) enablePing(); else disablePing();
	return isConnected;
	
}
export const resetConnected = function() { }

export let online = true;

function enablePing()
{
	if (pingInterval === null) pingInterval = setInterval(checkDobrynyaIsHere, 2000);
}

function disablePing()
{
	if (pingInterval !== null)
	{
		clearInterval(pingInterval);
		pingInterval = null;
	}
}

function dobrynyaEvent(evKind: string, data: object = {})
{
	const event = new CustomEvent(`dobrynya${evKind}`, { detail: data });
	document.body.dispatchEvent(event);
	return (evKind != 'gone');
}

async function checkDobrynyaIsHere()
{
	dobrynyaIsHere = false;
	
	// @ts-ignore
	if (!midi.outputs || Array.from(midi?.outputs.values()).length === 0)
	{
		dobrynyaEvent('gone');
		return false;
	}
	
	// @ts-ignore
	portOut = Array.from(midi?.outputs.values()).find((entry: MIDIOutput) => { return entry.name.startsWith("MIDI Dobrynya ") });
	// @ts-ignore
	portIn  = Array.from(midi?.inputs.values() ).find((entry: MIDIInput)  => { return entry.name.startsWith("MIDI Dobrynya ") });
	
	if (portIn) portIn.addEventListener("midimessage", onMIDIMessage);
	
	if (!portOut)
	{	
		dobrynyaWasHere = false;
		return dobrynyaEvent('gone');
	}
			
	try 
	{
		let result: MidiResult = await sysExAndWait(SysExCommand.STATUS, 300);
		
		if (result.status == SysExStatus.OLD_FIRMWARE) // we do not load anything really, we just want the version info and the serial
		{
			result = await sysExAndWait(SysExCommand.GETSERIAL, 300);
			result.data.version = (await sysExAndWait(SysExCommand.GETVERSION, 300)).data;
		}
		
		if (!result.success)
		{
			console.log(result);
			dobrynyaWasHere = false;
			return dobrynyaEvent('gone');
		}
		
		dobrynyaIsHere = true;
		
		if (dobrynyaIsHere != dobrynyaWasHere) // appeared after a pause
		{
			resetConnected();
			console.info("Dobrynya is here!");
			dobrynyaWasHere = dobrynyaIsHere;
			return dobrynyaEvent('here', result.data);
		}

	} catch(e) {
		dobrynyaWasHere = false;
		console.log(e);
		return dobrynyaEvent('gone');
	}
}

export async function init()
{
	try
	{
		midi = await navigator.requestMIDIAccess({sysex:true});
		
		enablePing();
		
		console.log("Got midi", midi);
		
	} catch(e) {
		console.log(e);
		document.location.href = "incompatible.html";
	}
}

function midiSend(v: number[] | Uint8Array): void
{
	if (!isConnected) return;
	if (!portOut)
		console.warn("portIn is likely found, but not portOut", portIn, portOut);
	else {
		portOut.send(v);
	}
}

function midiSendTerminated(v: number[]) { v.push(0xf7); midiSend(v); }

export interface SysExableStringData
{
	message: number[],
	hasForbiddenCharacters: boolean,
	hasUnicode: boolean
};

const charDC2 = 0x12;
const charDC4 = 0x14;
const charDLE = 0x10;

export function sysExableString(filename: string): SysExableStringData
{
	let message = [];
	
	const charUnderscore = 0x5f;
	const charDot = 0x2e;
	
	let encoder = new TextEncoder();
	
	let hasForbidden = false;
	let hasUnicode = false;
	
	const forbiddencharacters: Uint8Array = encoder.encode("/?^<>\\:*|\"");
	
	let encodedString = encoder.encode(filename);
	
	let utfSequence = false;
	
	if (encodedString[0] === charDot) encodedString[0] = charUnderscore;
	
	for (let charCode of encodedString)
	{
		if (charCode > 0x7f) // it is some kind of UTF-8 code
		{
			hasUnicode = true;
			
			if (!utfSequence)
			{
				message.push(charDC2); // insert a marker
				utfSequence = true;  // begin UTF8 sequence
			}
			
			charCode &= 0x7f; // shave off the 8th bit
		} else {
			if (utfSequence)
			{
				message.push(charDC4); // insert a marker
				utfSequence = false; // end UTF8 sequence
			}
		
			if (
				(charCode < 0x20 || charCode > 0x7e) ||
				forbiddencharacters.includes(charCode)
			)
			{
				hasForbidden = true;
				charCode = charUnderscore; 
			}
			
				// меняем любые запрещённые в FAT и просто странные символы на подчёркивание (_)
				// для подчёркиваниедрочеров: НЕ ПРОБЕЛ, СУКА. ПРОБЕЛ МОЖНО! 
				// Хотя нет, позвольте, ведь My_Cool_Patch.dbrpatch НАМНОГО КРУЧЕ И ПРОФЕССИОНАЛЬНЕЙ ВЫГЛЯДИТ, ДА????
				// Фух.
		}
		
		message.push(charCode); // filename;
	}
	
	// because file extenstions are always added by the configurator, the UTF8 sequence is guaranteed to end already, so this is a sanity check if anything
	if (utfSequence)
	{
		message.push(charDC4); // insert a marker
		utfSequence = false; // end UTF8 sequence
	}	
	
	message.push(0); // zero-terminated string!
	
	console.log("YHK", {
			message: message,
			hasForbiddenCharacters: hasForbidden,
			hasUnicode: hasUnicode
		})
	
	return {
		message: message,
		hasForbiddenCharacters: hasForbidden,
		hasUnicode: hasUnicode
	}
}

export interface SysExableStringDecodedData
{
	string: string,
	isThePatch: boolean,
	hasUnicode: boolean
};

export function sysExableStringToUTF8(msg: number[] | Uint8Array): SysExableStringDecodedData
{
	let decoder = new TextDecoder();
	let result: number[] = [];
	
	let utfFixer = 0x0;
	
	let hasUnicode = false;
	
	let isThePatch = msg[0] === charDLE;
	
	for (let char of msg)
	{
		if (char == charDC2)
		{
			hasUnicode = true;
			utfFixer = 0x80;
			continue;
		}
		if (char == charDC4)
		{
			utfFixer = 0x0;
			continue;
		}
		
		if ((char < 0x20 || char > 0x7e) && utfFixer == 0x0) continue; // out of range
		
		result.push(char | utfFixer);
	}
	
	return {
		hasUnicode: hasUnicode,
		isThePatch: isThePatch,
		string: decoder.decode(new Uint8Array(result)).trim()
	};
}

function sysExFilenameSanize(filename: string, message: number[]): number[]
{
	message = [...message, ...sysExableString(filename).message];
	
	while (message.length % 3 != 0) message.push(0); // добиваем до кратного трём значения — так ровно разбивается по пакетам...
	
	return message;
}

function sysEx2Filenames(cmd: SysExCommand, filename1: string, filename2: string)
{
	let message = [];
	let filenames = [filename1, filename2];
	for (let filename of filenames) message = sysExFilenameSanize(filename, message);
	sysEx(cmd,message);
}

function sysExFile(cmd: SysExCommand, filename: string, filedata: Uint8Array)
{
	// if (lockMidi) return;

	let message: number[] = sysExFilenameSanize(filename,[]);
	
	let sevenBitCounter: number = 1;
	let datapointer: number = 0;
	// let nowByte: number  = 0;
	let nextByte: number = 0;
	
	while (filedata.length > datapointer)
	{
		if (sevenBitCounter < 8)
		{
			message.push(nextByte | (filedata[datapointer] >> sevenBitCounter));
			nextByte =  (filedata[datapointer] << (7 - sevenBitCounter)) & 0x7f;
			sevenBitCounter++;
			datapointer++;
		} else {
			sevenBitCounter = 1;
			message.push(nextByte);
			nextByte = 0;
		}
	}

	message.push(nextByte);

	sysEx(cmd,message,true);
}

function sysExArray(cmd: SysExCommand, status = SysExStatus.REQUEST): number[]
{
	if (status == SysExStatus.USECHECKSUM) status |= SysExStatus.USECHECKSUM;
	return [0xf0, 0x0, 0x39, 0x40, 0x77, 0x76, 0x0, 0x0, 0x0, 0x0, cmd, status];
}

// function sysExBlob(cmd: SysExCommand, load: any)
// {
// 	var b1 = new Uint8Array(sysExArray(cmd));
// 	var b2 = new Uint8Array(load);
// 	var b3 = new Uint8Array([0xf7]);	
// 	
// 	var message = new Uint8Array(b1.length + b2.length + b3.length);
// 	message.set(b1);
// 	message.set(b2, b1.length);
// 	message.set(b3, b2.length);
// 	
// //	console.log("SysEx →", cmd, load, message);
// 	
// 	midiSend(message);		
// }
// 
// function sysExComplete(cmd: SysExCommand) { midiSendTerminated(sysExArray(cmd,SysExStatus.COMPLETE)); }

export function sysExLockPatchSwitching(lockOrUnlock: boolean)
{
	let message = sysExArray(SysExCommand.LOCKPATCHSWITCHING, lockOrUnlock ? SysExStatus.REQUEST : SysExStatus.RESET);
	midiSendTerminated(message);
}

function sysEx28bit(value: number): number[]
{
	if (value < 0 || value > 0xfffffff) return [0,0,0,0];

	let arr: number[] = [];

	for (let i = 0; i < 4; i++)
	{
		arr.push(value & 0x7f);
		value >>= 7;
	}

	return arr;
}

// function sysExWake() { sysEx(SysExCommand.WAKE); }

export function sysExBank(hand: Hand, shift: boolean, bank: number)
{
	sysEx(SysExCommand.LOADBANK, [
		(shift == true ? 0x10 : 0x0) | (hand & 0xf),
		bank & 0x7f
	]);
}

function sysEx(cmd: SysExCommand, load: any = null, usechecksum: boolean = false)
{
//	if (lockMidi) return;
	let message: number[] = 
		usechecksum ?
			sysExArray(cmd, SysExStatus.USECHECKSUM | SysExStatus.REQUEST) :
			sysExArray(cmd);

	let checksumposition: number = 0;
	let checksum: number = 0;

	if (usechecksum)
	{
		let length = sysEx28bit(load.length);
		for (let el of length) message.push(el);
		checksumposition = message.length;
		for (let i=0; i<5; i++) message.push(0); // checksum space
		// NB 9 bytes are allocated for the checksum data, because this is a multiple of a Midi-USB chunk (3 bytes)
	}

	for (let si in load) 
	{
		let b: number;
		if (typeof load == "string") b = load.charCodeAt(parseInt(si));
		else if (Array.isArray(load)) b = parseInt(load[si]);
		else return;

		b %= 128;

		if (usechecksum) checksum += b;
		
		message.push(b);
	}

	if (usechecksum)
	{
		let checksumArr = sysEx28bit(checksum % 0xfffffff);
		// console.log("Checksum", checksum); 
		for (let checksum28 of checksumArr) message[checksumposition++] = checksum28;
	}

	midiSendTerminated(message);
//		console.log("SysEx out →", cmd, load, message);
}

// function sysExRawBytes(cmd: SysExCommand, load: any)
// {
// 	let message = sysExArray(cmd);
// 	for (let b of load) message.push(parseInt(b));
// 	midiSendTerminated(message);
// }

function sysExFilename(cmd: SysExCommand, load: string)
{
	var message = sysExArray(cmd);
	for (let si of load) message.push(si.charCodeAt(0) % 128);
	message.push(0);
	midiSendTerminated(message);
}

async function waitForMidi(theCommand = null, timeout = 500): Promise<MidiResult>
{
	if (!portIn) throw "No midi port found";
	
	return new Promise((resolve,reject) =>
	{
		let failTimeout = setTimeout(()=>reject({reason: "timeout"}), timeout);
		
		const theListener = (ev: MIDIMessageEvent) =>
		{
			clearTimeout(failTimeout);
			let result: MidiResult | boolean = interpretMidiEvent(ev);
			
			if (result === false) return; // we don’t know what it was...
			if (theCommand !== null && (result as MidiResult).command && (result as MidiResult).command !== theCommand) return;
			
			portIn.removeEventListener('midimessage', theListener);
			
			resolve(result as MidiResult);
		}
		
		portIn.addEventListener('midimessage', theListener);
	});
}

export class MidiResultException
{
	cmd: SysExCommand;
	result: MidiResult;
	status: SysExStatus;
	
	constructor (theCommand: SysExCommand, result: MidiResult)
	{
		this.cmd = theCommand; this.result = result; this.status = result.status;
	}
}

async function waitForMidiResult(theCommand: SysExCommand, handler: Function, timeout: number = 500)
{
	try
	{
		let result: MidiResult = await waitForMidi(theCommand, timeout);
		
		if (theCommand == 4) console.log(result);
		
		if (!result.success)
		{
			WaitingBlock.unblockOrError(theCommand, result.status);
			enablePing();
			throw new MidiResultException(theCommand, result);
			// return false;
		}
		
		handler(result.data, result.filename);
		
		WaitingBlock.unblockOrError(theCommand, result.status);
		enablePing();
		
		return true;
	} catch(e)
	{
		WaitingBlock.unblockOrError(theCommand, SysExStatus.TIMEOUT);
		enablePing();
		throw e;
	}
}

export async function sysExFileAndDo(theCommand: SysExCommand, filename: string, filedata: any, handler: Function, timeout: number = 7000): Promise<any>
{
	WaitingBlock.block(theCommand);
	disablePing();
	sysExFile(theCommand, filename, filedata);
	try
	{
		let result = await waitForMidiResult(theCommand, handler, timeout);
		return result;
	} catch(e) { throw(e) }
}

export async function sysExTwoFilenamesAndDo(theCommand: SysExCommand, filename1: string, filename2: string, handler: Function, timeout: number = 4000): Promise<any>
{
	WaitingBlock.block(theCommand);
	disablePing();
	sysEx2Filenames(theCommand, filename1, filename2);
	try
	{
		let result = await waitForMidiResult(theCommand, handler, timeout);
		return result;
	} catch(e) { throw(e) }
}

export async function sysExFilenameAndDo(theCommand: SysExCommand, filename: string, handler: Function, timeout: number = 4000): Promise<any>
{
	WaitingBlock.block(theCommand);
	disablePing();
	sysExFilename(theCommand, filename);
	try
	{
		let result = await waitForMidiResult(theCommand, handler, timeout);
		return result;
	} catch(e) { throw e; }
}

export async function sysExAndDo(theCommand: SysExCommand, handler: Function, timeout: number = 500, load: any = null, useChecksum: boolean = false): Promise<any>
{	
	WaitingBlock.block(theCommand);
	disablePing();
	sysEx(theCommand, load, useChecksum);
	try
	{
		let result = await waitForMidiResult(theCommand, handler, timeout); 
		return result;
	} catch(e) { throw e; }
}

async function sysExAndWait(theCommand: SysExCommand, timeout: number = 500): Promise<any>
{
	sysEx(theCommand);
	return await waitForMidi(theCommand, timeout);
}

export function sysExTestFill(hex: HexColour)
{
	const futureExpansionBytes = [0,0,0]; // hand and other data
	sysEx(SysExCommand.LIGHTUP, [...futureExpansionBytes, ...colourToSysExArray(hex)]);
}

export function sysExColourReset()
{
	midiSendTerminated(sysExArray(SysExCommand.LIGHTUP, SysExStatus.RESET));
}

function colourToSysExArray(hex: HexColour)
{
	let testFillArray = [ hex >> 8, hex & 0xff, 0 ];
	if (testFillArray[0] & 0x80) 
	{
		testFillArray[0] &= 0x7f;
		testFillArray[2] |= 0x2;
	}
	if (testFillArray[1] & 0x80) 
	{
		testFillArray[1] &= 0x7f;
		testFillArray[2] |= 0x1;
	}
	
	return testFillArray;
}

export function sysExTestPattern(arr: ColourArray)
{
	let patternSysExArray = [];
	
	for (let hex of arr)
		patternSysExArray.push(colourToSysExArray(hex));
		
	const futureExpansionBytes = [0,0,0]; // hand and other data
	sysEx(SysExCommand.LIGHTUP, [
		...futureExpansionBytes,
		...patternSysExArray.reduce(function(a,b) { return [...a,...b] })
	]);
}

export function sysExDiskMode()
{
	sysEx(SysExCommand.REBOOT_MSC);
}

export function sysExBootloader(withMSC: boolean = false)
{
	sysEx(withMSC ? SysExCommand.REBOOT_BOOTMSC : SysExCommand.REBOOT_BOOT);
}

// function listMIDI()
// {
// 	midi.inputs.forEach(
// 		function(entry) {
// 			console.log(entry);
// 		});
// 		
// 	midi.outputs.forEach(
// 	function(entry) {
// 		console.log(entry);
// 		});
// 
// }

