import { isConnected, sysExableStringToUTF8 } from "midi_core";
import { sortPatchList } from "data_utils";
import { SysExCommand, SysExStatus } from "midi_utils";
import type { MidiResult } from "midi_utils";
import { capabilityFlags, models, ChipIDs, defaultStatusResult } from "device";
import { BatteryStatus, type StatusResult } from "types";
import * as BSON from "bson";
import {
	deviceRefusedToChangePatches,
	invokeControl,
	pushFromSysEx,
	invokeBank,
} from "event_helpers";

const headerLength: number = 12;

interface SevenToEightData {
	filename: Uint8Array | null;
	data: Uint8Array;
}

function sevenToEight(
	d: Uint8Array,
	hasFilename: boolean = false
): SevenToEightData {
	let shifter: number = 1;
	let outArray: number[] = [];
	let filename: number[] = [];
	let zeroi: number = headerLength;

	if (hasFilename) {
		while (d[zeroi]) filename.push(d[zeroi++]);
		zeroi++; // skip null character
	}

	let nextbyte: number;

	for (let i: number = zeroi; i < d.length - 1; i++) {
		if (shifter == 8) {
			shifter = 1;
			continue;
		}

		nextbyte = d[i + 1];
		if (nextbyte > 0x7f) nextbyte = 0;

		let newbyte: number =
			((d[i] << shifter) | (nextbyte >> (7 - shifter))) & 0xff;

		outArray.push(newbyte);

		shifter++;
	}

	return {
		filename: hasFilename ? Uint8Array.from(filename) : null,
		data: Uint8Array.from(outArray),
	};
	//ignoreFilename ? [ filename, outArray ] : outArray;
}

function serialDataToOutput(pureData: Uint8Array, output: StatusResult) {
	output.class = pureData[2] >> 4;
	output.modelNumber = pureData[2] & 0xf;
	output.modelID = pureData[2];
	output.variant = pureData[3];
	output.revision = pureData[4];
	output.serialID =
		(pureData[5] << 24) |
		(pureData[6] << 16) |
		(pureData[7] << 8) |
		pureData[8];
	output.deviceID =
		output.modelID.toString(16) +
		output.variant.toString(16).padStart(2, "0") +
		output.revision.toString(16).padStart(2, "0");
	output.serial =
		output.deviceID + "-" + output.serialID.toString().padStart(4, "0");

	output.model = models[output.class][output.modelNumber];

	output.model.chip.name = ChipIDs[output.variant].name;
	output.model.chip.code = ChipIDs[output.variant].code;
}

function versionDataToString(versionArray: Uint8Array) {
	const versionArrayNormal: number[] = Array.from(versionArray);

	while (!versionArrayNormal[versionArrayNormal.length - 1])
		versionArrayNormal.pop();
	return new TextDecoder().decode(new Uint8Array(versionArrayNormal));
}

export function interpretMidiEvent(
	event: MIDIMessageEvent
): MidiResult | boolean {
	let d: Uint8Array = event.data;

	if (d[0] != 0xf0 || d[1] != 0 || d[2] != 0x39 || d[3] != 0x40) return false;

	let midiResult: MidiResult = {
		command: d[10],
		status: d[11] & 0x3f,
		model:
			d[4] in models && d[5] in models[d[4]]
				? models[d[4]][d[5]]
				: models[0][0],
		hasControlSum: (d[11] & 0x40) == 0x40,
		filename: "",
		data: null,
		success: (d[11] & 0x3f) == SysExStatus.OK,
	};

	switch (midiResult.command) {
		case SysExCommand.STATUS: {
			if (!midiResult.success) break;

			if (d.length <= 14) {
				// old fw
				midiResult.status = SysExStatus.OLD_FIRMWARE;
				break;
			}

			let pureData = sevenToEight(d).data;

			console.log(pureData);

			let output: StatusResult = defaultStatusResult();

			output.isCorrect = pureData[0] == 0x1 ? true : false;

			if (output.isCorrect) {
				serialDataToOutput(pureData, output);
			}

			let capabilityFlagsData =
				(pureData[12] << 24) |
				(pureData[11] << 16) |
				(pureData[10] << 8) |
				pureData[9];

			for (let flag in capabilityFlags) {
				if (capabilityFlagsData & (1 << (flag as unknown as number))) {
					// meh
					output.has[capabilityFlags[flag]] = true;
				}
			}

			output.version = versionDataToString(pureData.slice(9 + 4)); // 9 bytes of serial number, 4 bytes of flags

			if (pureData.length >= 35) {
				// battery info
				output.battery.status = pureData[33];
				output.battery.percent = pureData[34];
			} else {
				output.battery.status = BatteryStatus.noBattery;
				output.battery.percent = 0;
			}

			midiResult.data = output;

			break;
		}

		case SysExCommand.PATCHLIST: {
			if (!midiResult.success) break;

			midiResult.data = [];

			let patchData = d.slice(headerLength);

			let findIndex = 0;

			while (
				patchData.length &&
				(findIndex = patchData.indexOf(0)) !== -1
			) {
				let patchItemResult = sysExableStringToUTF8(
					patchData.slice(0, findIndex + 1)
				);
				patchData = patchData.slice(findIndex + 1);

				while (patchData.length && patchData[0] == 0) {
					patchData = patchData.slice(1);
					console.error(
						"Patch list data has double zeroes",
						findIndex
					);
				}

				midiResult.data.push({
					name: patchItemResult.string,
					isThePatch: patchItemResult.isThePatch,
				});
			}

			midiResult.data.sort(sortPatchList);

			break;
		}

		case SysExCommand.GETPATCHINFO: {
			if (!midiResult.success) break;

			let s2eResult = sevenToEight(d, true);
			midiResult.filename = sysExableStringToUTF8(
				s2eResult.filename
			).string;

			try {
				midiResult.data = BSON.deserialize(
					new Uint8Array(s2eResult.data)
				);
			} catch (e) {
				console.error(midiResult, s2eResult.data, d);
			}

			break;
		}

		case SysExCommand.READPATCHTHROUGH: {
			if (!midiResult.success) break;

			let s2eResult = sevenToEight(d, true);

			midiResult.data = new Uint8Array(s2eResult.data);
			midiResult.filename = sysExableStringToUTF8(
				s2eResult.filename
			).string;

			break;
		}

		case SysExCommand.READPATCH: {
			if (!midiResult.success) break;

			let s2eResult = sevenToEight(d, true);

			try {
				midiResult.data = BSON.deserialize(
					new Uint8Array(s2eResult.data)
				);
				midiResult.filename = sysExableStringToUTF8(
					s2eResult.filename
				).string;
			} catch (e) {
				console.log(e);
			}

			break;
		}

		case SysExCommand.GETSERIAL: { // this is relevant for old firmwares that do not send the serial in status response
			if (!midiResult.success) break;

			let pureData = Array.from(sevenToEight(d).data);
			pureData.unshift(1); // add a byte, which normally is a factory marker, but isn’t sent with GETSERIAL

			let output: StatusResult = defaultStatusResult();

			output.isCorrect = true; // again, normally it’s decided based on the factory marker === 1

			serialDataToOutput(Uint8Array.from(pureData), output);

			midiResult.data = output;

			break;
		}

		case SysExCommand.GETVERSION: { // this is relevant for old firmwares that do not send the serial in status response
			if (!midiResult.success) break; // nothing to do then

			let vrs = versionDataToString(sevenToEight(d).data);

			if (!vrs)
				alert(
					"No firmware version is reported. Consider updating your Dobrynya's firmware."
				);
			else {
				midiResult.data = vrs;
			}
			break;
		}

		case SysExCommand.GETFACTORYSETTINGS: // not used in the Configurator
		case SysExCommand.GETSETTINGS: {
			if (!midiResult.success) break;
			midiResult.data = sevenToEight(d).data; // just pass (almost) raw data
			break;
		}
	}

	return midiResult;
}

export function onMIDIMessage(event: MIDIMessageEvent) {
	if (!isConnected) return;

	let d = event.data;

	if (d[0] != 0xf0 || d[1] != 0 || d[2] != 0x39 || d[3] != 0x40) return;

	let midiResult: MidiResult = {
		command: d[10],
		status: d[11] & 0x3f,
		model:
			d[4] in models && d[5] in models[d[4]]
				? models[d[4]][d[5]]
				: models[0][0],
		hasControlSum: (d[11] & 0x40) == 0x40,
		filename: "",
		data: null,
		success:
			(d[11] & 0x3f) == SysExStatus.REQUEST ||
			(d[11] & 0x3f) == SysExStatus.PUSH,
	};

	switch (midiResult.command) {
		case SysExCommand.READPATCH: {
			if (midiResult.status != SysExStatus.PUSH) break;

			let temporaryArray = sevenToEight(d, true);

			try {
				midiResult.data = BSON.deserialize(
					new Uint8Array(temporaryArray.data)
				);
				midiResult.filename = sysExableStringToUTF8(
					temporaryArray.filename
				).string;
				pushFromSysEx(midiResult);
			} catch (e) {
				console.log(e);
			}

			break;
		}

		case SysExCommand.LOCKPATCHSWITCHING:
			if (midiResult.status == SysExStatus.REQUEST)
				deviceRefusedToChangePatches();
			break;
		case SysExCommand.INVOKECONTROL:
			if (midiResult.status == SysExStatus.REQUEST)
				invokeControl(d[12], d[13]);
			break;
		case SysExCommand.LOADBANK:
			if (midiResult.status == SysExStatus.REQUEST)
				invokeBank(d[12] & 0xf, d[13], (d[12] & 0x10) == 0x10);
			break;
	}
}
