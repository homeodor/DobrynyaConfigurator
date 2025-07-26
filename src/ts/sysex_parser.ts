import * as BSON from "bson";
import { sortPatchList } from "./data_utils";
import {
	models,
	defaultStatusResult,
	capabilityFlags,
	ChipIDs,
} from "./device";
import { isConnected, sysExableStringToUTF8 } from "./midi_core";
import { type Result, Status, Command } from "./configurator";
import { type StatusResult, BatteryStatus } from "./types";
import {
	pushFromSysEx,
	deviceRefusedToChangePatches,
	invokeControl,
	invokeBank,
} from "./event_helpers";

interface SevenToEightData {
	filename: Uint8Array | null;
	data: Uint8Array;
}

const headerLength: number = 12;

export class SysExParser {
	constructor() {
		this.onMessage = this.onMessage.bind(this);
		this.interpretMidiEvent = this.interpretMidiEvent.bind(this);
	}

	public interpretMidiEvent(event: MIDIMessageEvent): Result | boolean {
		const d = this.assemble(event.data);

		if (!d) {
			return false;
		}

		let midiResult: Result = {
			command: d[10],
			status: d[11] & 0x3f,
			model:
				d[4] in models && d[5] in models[d[4]]
					? models[d[4]][d[5]]
					: models[0][0],
			hasControlSum: (d[11] & 0x40) == 0x40,
			filename: "",
			data: null,
			success: (d[11] & 0x3f) == Status.OK,
		};

		switch (midiResult.command) {
			case Command.STATUS: {
				if (!midiResult.success) break;

				if (d.length <= 14) {
					// old fw
					midiResult.status = Status.OLD_FIRMWARE;
					break;
				}

				let pureData = this.sevenToEight(d).data;

				let output: StatusResult = defaultStatusResult();

				output.isCorrect = pureData[0] === 0x1;

				if (output.isCorrect) {
					this.serialDataToOutput(pureData, output);
				}

				let capabilityFlagsData =
					(pureData[12] << 24) |
					(pureData[11] << 16) |
					(pureData[10] << 8) |
					pureData[9];

				for (let flag in capabilityFlags) {
					if (
						capabilityFlagsData &
						(1 << (flag as unknown as number))
					) {
						// meh
						output.has[capabilityFlags[flag]] = true;
					}
				}

				output.version = this.versionDataToString(
					pureData.slice(9 + 4)
				); // 9 bytes of serial number, 4 bytes of flags

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

			case Command.PATCHLIST: {
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

			case Command.GETPATCHINFO: {
				if (!midiResult.success) break;

				let s2eResult = this.sevenToEight(d, true);
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

			case Command.READPATCHTHROUGH: {
				if (!midiResult.success) break;

				let s2eResult = this.sevenToEight(d, true);

				midiResult.data = new Uint8Array(s2eResult.data);
				midiResult.filename = sysExableStringToUTF8(
					s2eResult.filename
				).string;

				break;
			}

			case Command.READPATCH: {
				if (!midiResult.success) break;

				let s2eResult = this.sevenToEight(d, true);

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

			case Command.GETSERIAL: {
				// this is relevant for old firmwares that do not send the serial in status response
				if (!midiResult.success) break;

				let pureData = Array.from(this.sevenToEight(d).data);
				pureData.unshift(1); // add a byte, which normally is a factory marker, but isn’t sent with GETSERIAL

				let output: StatusResult = defaultStatusResult();

				output.isCorrect = true; // again, normally it’s decided based on the factory marker === 1

				this.serialDataToOutput(Uint8Array.from(pureData), output);

				midiResult.data = output;

				break;
			}

			case Command.GETVERSION: {
				// this is relevant for old firmwares that do not send the serial in status response
				if (!midiResult.success) break; // nothing to do then

				let vrs = this.versionDataToString(this.sevenToEight(d).data);

				if (!vrs)
					alert(
						"No firmware version is reported. Consider updating your Dobrynya's firmware."
					);
				else {
					midiResult.data = vrs;
				}
				break;
			}

			case Command.GETFACTORYSETTINGS: // not used in the Configurator
			case Command.GETSETTINGS: {
				if (!midiResult.success) break;
				midiResult.data = this.sevenToEight(d).data; // just pass (almost) raw data
				break;
			}
		}

		return midiResult;
	}

	public onMessage(event: MIDIMessageEvent) {
		if (!isConnected) {
			return;
		}

		const d = this.assemble(event.data);

		if (!d) {
			return false;
		}

		let midiResult: Result = {
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
				(d[11] & 0x3f) == Status.REQUEST ||
				(d[11] & 0x3f) == Status.PUSH,
		};

		switch (midiResult.command) {
			case Command.READPATCH: {
				if (midiResult.status != Status.PUSH) break;

				let temporaryArray = this.sevenToEight(d, true);

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

			case Command.LOCKPATCHSWITCHING:
				if (midiResult.status == Status.REQUEST)
					deviceRefusedToChangePatches();
				break;
			case Command.INVOKECONTROL:
				if (midiResult.status == Status.REQUEST)
					invokeControl(d[12], d[13]);
				break;
			case Command.LOADBANK:
				if (midiResult.status == Status.REQUEST)
					invokeBank(d[12] & 0xf, d[13], (d[12] & 0x10) == 0x10);
				break;
		}
	}

	private dataStash: number[] = [];

	private serialDataToOutput(pureData: Uint8Array, output: StatusResult) {
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

	private assemble(d: Uint8Array): Uint8Array | null {
		if (d[d.length - 1] != 0xf7) {
			this.dataStash.push(...d);
			console.warn(
				`Pushing a chunk to data stash, it is now ${this.dataStash.length} bytes long`
			);
			console.log(d);
			return null;
		}

		if (d[0] != 0xf0 || d[1] != 0 || d[2] != 0x39 || d[3] != 0x40) {
			if (this.dataStash.length) {
				this.dataStash.push(...d);
				console.warn(
					`Pushing the last chunk to data stash, it is now ${this.dataStash.length} bytes long`
				);
			} else {
				return null;
			}
		} else {
			if (this.dataStash.length) {
				console.warn(
					"A data stash was active, but a whole message arrived"
				);
				this.dataStash = [];
			}
		}

		if (this.dataStash.length) {
			return Uint8Array.from(this.dataStash);
		}

		return d;
	}

	private versionDataToString(versionArray: Uint8Array) {
		const versionArrayNormal: number[] = Array.from(versionArray);

		while (!versionArrayNormal[versionArrayNormal.length - 1])
			versionArrayNormal.pop();
		return new TextDecoder().decode(new Uint8Array(versionArrayNormal));
	}

	private sevenToEight(
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
	}
}
