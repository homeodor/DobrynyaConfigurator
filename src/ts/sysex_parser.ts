import * as BSON from "bson";
import { sortPatchList } from "./data_utils";
import {
	models,
	defaultStatusResult,
	capabilityFlags,
	ChipIDs,
} from "./device";
import { isConnected, sysExableStringToUTF8 } from "./midi_core";
import {
	type Result,
	Status,
	Command,
	type InterpretedMessage,
} from "./configurator";
import { type StatusResult, BatteryStatus } from "./types";
import {
	pushFromSysEx,
	deviceRefusedToChangePatches,
	invokeControl,
	invokeBank,
} from "./event_helpers";
import { getChecksumCalculator, WhichChecksum } from "./checksum";

interface SevenToEightData {
	filename: Uint8Array | null;
	data: Uint8Array;
}

const k_headerLength: number = 12;

const k_decode7to8 = new Map<Command, boolean>();

k_decode7to8.set(Command.STATUS, false);
k_decode7to8.set(Command.GETPATCHINFO, true);
k_decode7to8.set(Command.READPATCHTHROUGH, true);
k_decode7to8.set(Command.READPATCH, true);
k_decode7to8.set(Command.GETSERIAL, false);
k_decode7to8.set(Command.GETVERSION, false);
k_decode7to8.set(Command.GETFACTORYSETTINGS, false);
k_decode7to8.set(Command.GETSETTINGS, false);

export class SysExParser {
	constructor() {
		this.onMessage = this.onMessage.bind(this);
		this.interpretMidiEvent = this.interpretMidiEvent.bind(this);
	}

	private get32from28(data: Uint8Array, pos: number) {
		let value = 0;

		for (let i = 0; i < 4; i++) {
			let val0 = data[pos++];
			value |= val0 << (7 * i);
		}

		return value;
	}

	private getResult(event: MIDIMessageEvent): InterpretedMessage | false {
		const d = this.assemble(event.data);

		if (!d) {
			return false;
		}

		const isV20 = d[7] == 0 && d[8] == 2;

		const whichChecksum: WhichChecksum =
			(d[11] & Status.USECHECKSUM) != Status.USECHECKSUM
				? WhichChecksum.NONE
				: isV20
					? WhichChecksum.LEGACY
					: WhichChecksum.CRC16;

		const usefulOffset =
			whichChecksum === WhichChecksum.NONE
				? k_headerLength
				: k_headerLength + 8;
		let rawData = d.subarray(usefulOffset, d.length - 1);
		let filename: string | null = null;

		const command = d[10] as Command;
		const status = d[11] & 0x3f;

		if (k_decode7to8.has(command)) {
			const hasFilename = k_decode7to8.get(command);
			const decodeResult = this.sevenToEightTEMP(rawData, hasFilename);

			rawData = decodeResult.data;
			filename = hasFilename
				? sysExableStringToUTF8(decodeResult.filename).string
				: null;
		}

		let checksum: number | undefined = undefined;
		let length: number | undefined = undefined;

		if (whichChecksum !== WhichChecksum.NONE) {
			const checksumCalculator = getChecksumCalculator(whichChecksum);

			for (const b of rawData) {
				checksumCalculator.next(b);
			}

			const expectedLength = this.get32from28(d, 12);
			const expectedChecksum = this.get32from28(d, 16);

			if (
				checksumCalculator.checksum !== expectedChecksum ||
				checksumCalculator.length !== expectedLength
			) {
				throw new Error(
					`Expected checksum: ${expectedChecksum}, calculated ${checksumCalculator.checksum}.\nExpected length: ${expectedLength}, calculated ${checksumCalculator.length}. `
				);
			}
		}

		return {
			rawData,
			filename,
			midiResult: {
				command,
				status,
				model:
					d[4] in models && d[5] in models[d[4]]
						? models[d[4]][d[5]]
						: models[0][0],
				filename: "",
				data: null,
				success: (d[11] & 0x3f) == Status.OK,
			},
			rawestData: d,
		};
	}

	public interpretMidiEvent(event: MIDIMessageEvent): Result | boolean {
		const parsed = this.getResult(event);

		if (parsed === false) {
			return false;
		}

		const { rawData, filename, midiResult } = parsed;

		switch (midiResult.command) {
			case Command.STATUS: {
				if (!midiResult.success) break;

				if (rawData.length <= 1) {
					// old fw
					midiResult.status = Status.OLD_FIRMWARE;
					break;
				}

				let output: StatusResult = defaultStatusResult();

				output.isCorrect = rawData[0] === 0x1;

				if (output.isCorrect) {
					this.serialDataToOutput(rawData, output);
				}

				let capabilityFlagsData =
					(rawData[12] << 24) |
					(rawData[11] << 16) |
					(rawData[10] << 8) |
					rawData[9];

				for (let flag in capabilityFlags) {
					if (
						capabilityFlagsData &
						(1 << (flag as unknown as number))
					) {
						// meh
						output.has[capabilityFlags[flag]] = true;
					}
				}

				output.version = this.versionDataToString(rawData.slice(9 + 4)); // 9 bytes of serial number, 4 bytes of flags

				output.legacyChecksum =
					output.version.startsWith("2.0") ||
					output.version.startsWith("1.");

				if (rawData.length >= 35) {
					// battery info
					output.battery.status = rawData[33];
					output.battery.percent = rawData[34];
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

				let findIndex = 0;
				let patchData = rawData;

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

			case Command.READPATCH:
			case Command.GETPATCHINFO: {
				if (!midiResult.success) {
					break;
				}

				try {
					midiResult.data = BSON.deserialize(new Uint8Array(rawData));
					midiResult.filename = filename;
				} catch (e) {
					console.error(midiResult, rawData);
				}

				break;
			}

			case Command.READPATCHTHROUGH: {
				if (!midiResult.success) break;

				midiResult.data = new Uint8Array(rawData);
				midiResult.filename = filename;

				break;
			}

			// case Command.READPATCH: {
			// 	if (!midiResult.success) break;

			// 	try {
			// 		midiResult.data = BSON.deserialize(new Uint8Array(rawData));
			// 		midiResult.filename = filename;
			// 	} catch (e) {
			// 		console.log(e);
			// 	}

			// 	break;
			// }

			case Command.GETSERIAL: {
				// this is relevant for old firmwares that do not send the serial in status response
				if (!midiResult.success) break;

				let pureData = Array.from(rawData);
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

				let vrs = this.versionDataToString(rawData);

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
				if (!midiResult.success) {
					break;
				}
				midiResult.data = rawData;
				break;
			}
		}

		return midiResult;
	}

	public onMessage(event: MIDIMessageEvent) {
		if (!isConnected) {
			return;
		}

		const parsed = this.getResult(event);

		if (parsed === false) {
			return false;
		}

		const { rawData, filename, midiResult } = parsed;

		switch (midiResult.command) {
			case Command.READPATCH: {
				if (midiResult.status != Status.PUSH) break;

				try {
					midiResult.data = BSON.deserialize(new Uint8Array(rawData));
					midiResult.filename = filename;
					pushFromSysEx(midiResult);
				} catch (e) {
					console.log(e);
				}

				break;
			}

			case Command.LOCKPATCHSWITCHING:
				if (midiResult.status == Status.REQUEST) {
					deviceRefusedToChangePatches();
				}
				break;
			case Command.INVOKECONTROL:
				if (midiResult.status == Status.REQUEST)
					invokeControl(rawData[0], rawData[1]);
				break;
			case Command.LOADBANK:
				if (midiResult.status == Status.REQUEST) {
					invokeBank(
						rawData[0] & 0xf,
						rawData[1],
						(rawData[0] & 0x10) == 0x10
					);
				}
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

	private sevenToEightTEMP(
		d: Uint8Array,
		hasFilename: boolean = false
	): SevenToEightData {
		let shifter: number = 1;
		let outArray: number[] = [];
		let filename: number[] = [];
		let zeroi: number = 0;

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
