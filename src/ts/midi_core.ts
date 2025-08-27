import { WaitingBlock } from "./waitingblock";
import { type Result, Command, Status } from "./configurator";
import { SysExParser } from "./sysex_parser";
import type { HexColour, ColourArray, Hand } from "./types";
import { batteryInfo } from "./stores";
import {
	getChecksumCalculator,
	type LengthChecksum,
	selectChecksum,
	WhichChecksum,
} from "./checksum";
import { getDevice } from "./device";
import { eightToSeven } from "./midi_utils";

let midi: MIDIAccess | null = null;
let portOut: MIDIOutput | null = null;
let portIn: MIDIInput | null = null;

let pingInterval: null | number = null;

let dobrynyaIsHere: boolean = false;
let dobrynyaWasHere: boolean = false;

export let isConnected = true;
export const flipConnected = function () {
	isConnected = !isConnected;
	if (isConnected) enablePing();
	else disablePing();
	return isConnected;
};
export const resetConnected = function () {};

export let online = true;

function enablePing() {
	if (pingInterval === null)
		pingInterval = window.setInterval(checkDobrynyaIsHere, 2000);
}

function disablePing() {
	if (pingInterval !== null) {
		clearInterval(pingInterval);
		pingInterval = null;
	}
}

function dobrynyaEvent(evKind: string, data: object = {}) {
	const event = new CustomEvent(`dobrynya${evKind}`, { detail: data });
	document.body.dispatchEvent(event);
	return evKind != "gone";
}

const generalSysExParser = new SysExParser();

async function checkDobrynyaIsHere() {
	if (!midi) return;

	dobrynyaIsHere = false;

	if (!midi.outputs || Array.from(midi?.outputs.values()).length === 0) {
		dobrynyaEvent("gone");
		return false;
	}

	portOut =
		Array.from(midi?.outputs.values()).find((entry: MIDIOutput) => {
			return entry.name?.startsWith("MIDI Dobrynya ");
		}) ?? null;
	portIn =
		Array.from(midi?.inputs.values()).find((entry: MIDIInput) => {
			return entry.name?.startsWith("MIDI Dobrynya ");
		}) ?? null;

	if (portIn)
		portIn.addEventListener("midimessage", generalSysExParser.onMessage);

	if (!portOut) {
		dobrynyaWasHere = false;
		return dobrynyaEvent("gone");
	}

	try {
		let result: Result = await sysExAndWait(Command.STATUS, 300);

		if (result.status == Status.OLD_FIRMWARE) {
			// we do not load anything really, we just want the version info and the serial
			result = await sysExAndWait(Command.GETSERIAL, 300);
			result.data.version = (
				await sysExAndWait(Command.GETVERSION, 300)
			).data;
		}

		if (!result.success) {
			console.debug(result);
			dobrynyaWasHere = false;
			return dobrynyaEvent("gone");
		}

		dobrynyaIsHere = true;

		if (dobrynyaIsHere != dobrynyaWasHere) {
			// appeared after a pause
			resetConnected();
			console.debug("Dobrynya is here!");
			dobrynyaWasHere = dobrynyaIsHere;
			return dobrynyaEvent("here", result.data);
		}

		batteryInfo.set(result.data.battery);
	} catch (e) {
		dobrynyaWasHere = false;
		console.debug(e);
		return dobrynyaEvent("gone");
	}
}

export async function init() {
	if (navigator.requestMIDIAccess == undefined) {
		document.location.href = "incompatible.html";
	}

	try {
		midi = await navigator.requestMIDIAccess({ sysex: true });

		enablePing();
	} catch (e) {
		console.warn("MIDI Failed");
		console.log(e);
	}
}

function midiSend(v: number[] | Uint8Array): void {
	if (!isConnected) return;
	if (!portOut)
		console.warn(
			"portIn is likely found, but not portOut",
			portIn,
			portOut
		);
	else {
		portOut.send(v);
	}
}

function midiSendTerminated(v: number[]) {
	v.push(0xf7);
	midiSend(v);
}

export interface SysExableStringData {
	message: number[];
	hasForbiddenCharacters: boolean;
	hasUnicode: boolean;
}

const charDC2 = 0x12;
const charDC4 = 0x14;
const charDLE = 0x10;

function sysExableString(
	filename: string,
	checksum: LengthChecksum | null
): SysExableStringData {
	const message = [];

	const charUnderscore = 0x5f;
	const charDot = 0x2e;

	let encoder = new TextEncoder();

	let hasForbidden = false;
	let hasUnicode = false;

	const forbiddencharacters: Uint8Array = encoder.encode('/?^<>\\:*|"');

	let encodedString = encoder.encode(filename);

	let utfSequence = false;

	if (encodedString[0] === charDot) encodedString[0] = charUnderscore;

	for (let charCode of encodedString) {
		if (charCode > 0x7f) {
			// it is some kind of UTF-8 code
			hasUnicode = true;

			if (!utfSequence) {
				message.push(charDC2); // insert a marker
				utfSequence = true; // begin UTF8 sequence
			}

			charCode &= 0x7f; // shave off the 8th bit
		} else {
			if (utfSequence) {
				message.push(charDC4); // insert a marker
				utfSequence = false; // end UTF8 sequence
			}

			if (
				charCode < 0x20 ||
				charCode > 0x7e ||
				forbiddencharacters.includes(charCode)
			) {
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
	if (utfSequence) {
		message.push(charDC4); // insert a marker
		utfSequence = false; // end UTF8 sequence
	}

	message.push(0); // zero-terminated string!

	if (checksum) {
		for (const byte of message) {
			checksum.next(byte);
		}
	}

	return {
		message: message,
		hasForbiddenCharacters: hasForbidden,
		hasUnicode: hasUnicode,
	};
}

export interface SysExableStringDecodedData {
	string: string;
	isThePatch: boolean;
	hasUnicode: boolean;
}

export function sysExableStringToUTF8(
	msg: number[] | Uint8Array
): SysExableStringDecodedData {
	let decoder = new TextDecoder();
	let result: number[] = [];

	let utfFixer = 0x0;

	let hasUnicode = false;

	let isThePatch = msg[0] === charDLE;

	for (let char of msg) {
		if (char == charDC2) {
			hasUnicode = true;
			utfFixer = 0x80;
			continue;
		}
		if (char == charDC4) {
			utfFixer = 0x0;
			continue;
		}

		if ((char < 0x20 || char > 0x7e) && utfFixer == 0x0) continue; // out of range

		result.push(char | utfFixer);
	}

	return {
		hasUnicode: hasUnicode,
		isThePatch: isThePatch,
		string: decoder.decode(new Uint8Array(result)).trim(),
	};
}

function sysExFilenameSanize(
	filename: string,
	message: number[],
	checksum: LengthChecksum | null
): number[] {
	message = [...message, ...sysExableString(filename, checksum).message];

	if (getDevice().legacyChecksum) {
		while (message.length % 3 != 0) {
			message.push(0); // добиваем до кратного трём значения — так ровно разбивается по пакетам...
		}
	}

	return message;
}

function sysEx2Filenames(cmd: Command, filename1: string, filename2: string) {
	let message: number[] = [];
	let filenames = [filename1, filename2];
	for (let filename of filenames)
		message = sysExFilenameSanize(filename, message, null);
	sysEx(cmd, message);
}

function sysExFile(cmd: Command, filename: string, filedata: Uint8Array) {
	// if (lockMidi) return;

	const checksum = getChecksumCalculator(selectChecksum());
	sysEx(
		cmd,
		[
			...sysExFilenameSanize(filename, [], checksum),
			...eightToSeven(filedata, checksum),
		],
		checksum
	);
}

function sysExArray(cmd: Command, status = Status.REQUEST): number[] {
	if (status == Status.USECHECKSUM) status |= Status.USECHECKSUM;
	return [0xf0, 0x0, 0x39, 0x40, 0x77, 0x76, 0x0, 0x0, 0x0, 0x0, cmd, status];
}

export function sysExLockPatchSwitching(lockOrUnlock: boolean) {
	let message = sysExArray(
		Command.LOCKPATCHSWITCHING,
		lockOrUnlock ? Status.REQUEST : Status.RESET
	);
	midiSendTerminated(message);
}

function sysEx28bit(value: number): number[] {
	if (value < 0 || value > 0xfffffff) return [0, 0, 0, 0];

	let arr: number[] = [];

	for (let i = 0; i < 4; i++) {
		arr.push(value & 0x7f);
		value >>= 7;
	}

	return arr;
}

// function sysExWake() { sysEx(Command.WAKE); }

export function sysExBank(hand: Hand, shift: boolean, bank: number) {
	sysEx(Command.LOADBANK, [
		(shift == true ? 0x10 : 0x0) | (hand & 0xf),
		bank & 0x7f,
	]);
}

function sysEx(
	cmd: Command,
	load: number[] | string | null = null,
	checksum: LengthChecksum | null = null
) {
	//	if (lockMidi) return;
	let message: number[] = checksum
		? sysExArray(cmd, Status.USECHECKSUM | Status.REQUEST)
		: sysExArray(cmd);

	if (checksum) {
		const lengthChecksum = [
			...sysEx28bit(checksum.length),
			...sysEx28bit(checksum.checksum),
		];
		for (let el of lengthChecksum) {
			message.push(el);
	}
	}

	for (let si = 0; si < (load?.length ?? 0); si++) {
		let b: number;
		if (typeof load == "string") {
			b = load.charCodeAt(parseInt(si));
		} else if (Array.isArray(load)) {
			b = parseInt(load[si]);
		} else {
			return;
		}

		b %= 128;

		message.push(b);
	}

	midiSendTerminated(message);
}

function sysExFilename(cmd: Command, load: string) {
	console.log("Command is ", Command[cmd]);
	const message = sysExArray(cmd);
	for (let si of load) {
		message.push(si.charCodeAt(0) % 128);
	}
	message.push(0);
	midiSendTerminated(message);
}

async function waitForMidi(theCommand = null, timeout = 500): Promise<Result> {
	if (portIn === null) {
		throw "No midi port found";
	}

	const parser = new SysExParser();

	return new Promise((resolve, reject) => {
		let failTimeout = setTimeout(
			() => reject({ reason: "timeout" }),
			timeout
		);

		if (portIn === null) {
			throw "No midi port found";
		}

		const theListener = (ev: MIDIMessageEvent) => {
			clearTimeout(failTimeout);

			if (portIn === null) {
				throw "No midi port found";
			}

			let result: Result | boolean = parser.interpretMidiEvent(ev);

			if (result === false) {
				return; // we don’t know what it was...
			}

			if (
				theCommand !== null &&
				(result as Result).command &&
				(result as Result).command !== theCommand
			)
				return;

			portIn.removeEventListener("midimessage", theListener);

			resolve(result as Result);
		};

		portIn.addEventListener("midimessage", theListener);
	});
}

export class MidiResultException {
	cmd: Command;
	result: Result;
	status: Status;

	constructor(theCommand: Command, result: Result) {
		this.cmd = theCommand;
		this.result = result;
		this.status = result.status;
	}
}

async function waitForMidiResult(
	theCommand: Command,
	handler: Function,
	timeout: number = 500
) {
	try {
		let result: Result = await waitForMidi(theCommand, timeout);

		if (!result.success) {
			WaitingBlock.unblockOrError(theCommand, result.status);
			enablePing();
			throw new MidiResultException(theCommand, result);
			// return false;
		}

		handler(result.data, result.filename);

		WaitingBlock.unblockOrError(theCommand, result.status);
		enablePing();

		return true;
	} catch (e) {
		WaitingBlock.unblockOrError(theCommand, Status.TIMEOUT);
		enablePing();
		throw e;
	}
}

export async function sysExFileAndDo(
	theCommand: Command,
	filename: string,
	filedata: any,
	handler: Function,
	timeout: number = 7000
): Promise<any> {
	WaitingBlock.block(theCommand);
	disablePing();
	sysExFile(theCommand, filename, filedata);
	try {
		let result = await waitForMidiResult(theCommand, handler, timeout);
		return result;
	} catch (e) {
		throw e;
	}
}

export async function sysExTwoFilenamesAndDo(
	theCommand: Command,
	filename1: string,
	filename2: string,
	handler: Function,
	timeout: number = 4000
): Promise<any> {
	WaitingBlock.block(theCommand);
	disablePing();
	sysEx2Filenames(theCommand, filename1, filename2);
	try {
		let result = await waitForMidiResult(theCommand, handler, timeout);
		return result;
	} catch (e) {
		throw e;
	}
}

export async function sysExFilenameAndDo(
	theCommand: Command,
	filename: string,
	handler: Function,
	timeout: number = 4000
): Promise<any> {
	WaitingBlock.block(theCommand);
	disablePing();
	sysExFilename(theCommand, filename);
	try {
		let result = await waitForMidiResult(theCommand, handler, timeout);
		return result;
	} catch (e) {
		throw e;
	}
}

export async function sysExAndDo(
	theCommand: Command,
	handler: Function,
	timeout: number = 500,
	load: any = null,
	checksum: LengthChecksum | null = null
): Promise<any> {
	WaitingBlock.block(theCommand);
	disablePing();
	sysEx(theCommand, load, checksum);
	try {
		let result = await waitForMidiResult(theCommand, handler, timeout);
		return result;
	} catch (e) {
		throw e;
	}
}

async function sysExAndWait(
	theCommand: Command,
	timeout: number = 500
): Promise<any> {
	sysEx(theCommand);
	return await waitForMidi(theCommand, timeout);
}

// window.sysExAndWait = sysExAndWait;

export function sysExTestFill(hex: HexColour) {
	const futureExpansionBytes = [0, 0, 0]; // hand and other data
	sysEx(Command.LIGHTUP, [
		...futureExpansionBytes,
		...colourToSysExArray(hex),
	]);
}

export function sysExColourReset() {
	midiSendTerminated(sysExArray(Command.LIGHTUP, Status.RESET));
}

function colourToSysExArray(hex: HexColour) {
	let testFillArray = [hex >> 8, hex & 0xff, 0];
	if (testFillArray[0] & 0x80) {
		testFillArray[0] &= 0x7f;
		testFillArray[2] |= 0x2;
	}
	if (testFillArray[1] & 0x80) {
		testFillArray[1] &= 0x7f;
		testFillArray[2] |= 0x1;
	}

	return testFillArray;
}

export function sysExTestPattern(arr: ColourArray) {
	let patternSysExArray = [];

	for (let hex of arr) patternSysExArray.push(colourToSysExArray(hex));

	const futureExpansionBytes = [0, 0, 0]; // hand and other data
	sysEx(Command.LIGHTUP, [
		...futureExpansionBytes,
		...patternSysExArray.reduce(function (a, b) {
			return [...a, ...b];
		}),
	]);
}

export function sysExDiskMode() {
	sysEx(Command.REBOOT_MSC);
}

export function sysExEsp32Bootloader() {
	sysEx(Command.REBOOT_ESP32);
}

export function sysExBootloader(withMSC: boolean = false) {
	sysEx(withMSC ? Command.REBOOT_BOOTMSC : Command.REBOOT_BOOT);
}

export function sysExCalibrateAccel() {
	sysEx(Command.CALIBRATEACCEL);
}

export function sysExStorageMode() {
	sysEx(Command.STORAGEMODE);
}
