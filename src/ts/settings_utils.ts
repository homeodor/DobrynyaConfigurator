import { WaitingBlock } from "waitingblock";
import { sysExAndDo } from "midi_core";
import { CaseColour } from "device";
import { eightToSeven } from "midi_utils";
import { Command } from "configurator";

import type ButtonUpload from "../widgets/ButtonUpload.svelte";
import { writable, type Writable } from "svelte/store";
import { getChecksumCalculator, selectChecksum } from "./checksum";

interface SettingsObjectItem {
	length?: number;
	reserved?: boolean;
	isFlag?: boolean;
	value?: number;
	text?: string;
	flag?: boolean[];
	fixfunc?: (v: number) => number;
}

interface SettingsObject {
	[index: string]: {
		[index: string]: SettingsObjectItem;
	};
}

declare global {
	interface Window {
		settings: SettingsObject;
	}
}

function fixValueToZero(v: number): number {
	return v == 0xff ? 0 : v;
}
function fixValueTo7F(v: number): number {
	return v > 0x7f ? 0x7f : v;
}

function fixDeviceName(v) {
	return v;
}

export let isSaved: boolean = true;
let settingsRawData: Uint8Array;
let settingsNeedFixing: boolean = false;
let settingsObjectIsValid: boolean = false;

export function markSettingsUnsaved() {
	isSaved = false;
}
export function markSettingsDirty() {
	settingsNeedFixing = true;
}

export interface ImportantFactorySettings {
	hasDecolight: boolean;
	caseColour: CaseColour;
	batteryCapacity: number;
	boardRevision: string | null;
}

function factorySettingsModel(): ImportantFactorySettings {
	return {
		hasDecolight: false,
		caseColour: CaseColour.Light,
		batteryCapacity: 0,
		boardRevision: null,
	};
}

export let importantFactorySettings: Writable<ImportantFactorySettings> =
	writable({
		hasDecolight: false,
		caseColour: CaseColour.Light,
		batteryCapacity: 0,
		boardRevision: null,
	});

function settingsModel(): SettingsObject {
	return {
		control: {
			control: {
				length: 4,
			},
		},

		screen: {
			brightness: {
				reserved: true,
			},
			contrast: {},
			timeout: {
				length: 2,
			},
			reserved1: {
				reserved: true,
				length: 8,
			},
		},

		leds: {
			brightness: {},
			brightnesschill: {},
			brightnessdeco: {},
			brightnessblink: {},
			timeoutchill: {
				length: 2,
			},
			timeoutoff: {
				reserved: true,
				length: 2,
			},
			timeoutpalette: {},
			palettes: {
				isFlag: true,
			},
			flags: {
				isFlag: true,
			},
			blinkmode: {},
			chillanimations: {
				isFlag: true,
			},
			reserved2: {
				reserved: true,
				length: 3,
			},
		},

		midi: {
			channel: {},
			outputs: {
				isFlag: true,
			},
			inputs: {
				isFlag: true,
			},
			hwmidi: {
				fixfunc: fixValueToZero,
				isFlag: true,
			},
			vel: {
				fixfunc: fixValueTo7F,
			},
			passthruusb: {},
			passthruble: {},
			reserved1: {
				reserved: true,
				length: 9,
			},
		},

		input: {
			offset: 0x30,
			debouncepad: {},
			debounceother: {},
			smoothfader: {
				reserved: true,
			},
			smoothjoystick: {
				reserved: true,
			},
			encoderkinetics: {
				reserved: true,
				length: 4,
			},
			direction: {
				isFlag: true,
			},
			hapticevents: {
				isFlag: true,
				reserved: true,
				length: 2,
			},
			flags: {
				isFlag: true,
			},
			reserved1: {
				reserved: true,
				length: 4,
			},
		},

		lowpower: {
			offset: 0x40,
			reserved1: {
				reserved: true,
				length: 4,
			},
			timeoutleds: {
				length: 2,
				reserved: true,
			},
			timeoutpoweroff: {
				length: 2,
				reserved: true,
			},
			reserved2: {
				reserved: true,
				length: 8,
			},
		},

		ble: {
			offset: 0x50,
			flags: {
				isFlag: true,
			},
			power: {
				fixfunc: (v: number) => {
					return v < 1 || v > 3 ? 2 : v;
				},
			},
			name: {
				fixfunc: fixDeviceName,
				text: "",
				length: 29,
			},
		},

		haptic: {
			events: {
				length: 2,
				isFlag: true,
			},
			channel: {},
		},
	};
}

window.settings = settingsModel();

export let settings = window.settings;

export function parseSettingsData() {
	if (settingsObjectIsValid) return; // it’s all good, no need to re-parse

	if (!isSaved) return; // there was a previous state available

	let arp = 0;

	for (let i in window.settings) {
		if (i == "fakeparam") continue;

		for (let j in window.settings[i]) {
			const param = window.settings[i][j];

			if (typeof param === "number") {
				if (arp !== param) {
					throw new Error(
						`Offset failed: expected ${param}, got ${arp} at ${i}`
					);
				}

				console.warn(`Offset verified for ${i}`);

				continue;
			}

			if (typeof param.length == "undefined") {
				param.length = 1;
			}

			if (param.reserved) {
				arp += param.length;
				continue;
			}

			if (typeof param.text != "undefined") {
				param.text = new TextDecoder()
					.decode(settingsRawData.slice(arp, arp + param.length))
					.replace(/\0/g, "");
				arp += param.length;
				continue;
			}

			param.value = 0;

			for (let byteshift = 0; byteshift < param.length; byteshift++) {
				param.value |= settingsRawData[arp++] << (byteshift * 8);
			}

			if (typeof param.fixfunc == "function") {
				param.value = param.fixfunc(param.value);
			}

			if (param.isFlag) {
				param.flag = [];

				for (let bitshift = 0; bitshift < 8; bitshift++) {
					param.flag[bitshift] =
						((param.value >> bitshift) & 1) == 1 ? true : false;
				}
			}
		}
	}

	settingsObjectIsValid = true;
}

function encodeStringToUtf8Array(input: string, length: number): Uint8Array {
	if (length <= 0) {
		throw new Error("Length must be greater than 0.");
	}

	const encoded = new TextEncoder().encode(input);

	if (encoded.length >= length) {
		throw new Error(
			`String ${input} is too long to fit within the specified length of ${length}.`
		);
	}

	const result = new Uint8Array(length);
	result.set(encoded.slice(0, length - 1));
	result[length - 1] = 0;

	return result;
}

export async function saveSettings(
	settingsLength: number,
	uploadButton: ButtonUpload = null
) {
	let b8 = [];

	for (let i in window.settings) {
		for (let j in window.settings[i]) {
			let param: SettingsObjectItem | number = window.settings[i][j];

			if (typeof param === "number") {
				continue;
			}

			let l = param.length;

			if (typeof param.text == "string") {
				b8.push(...encodeStringToUtf8Array(param.text, l));
				continue;
			}

			let reserved = typeof param.reserved == "boolean" && param.reserved;

			if (!reserved && typeof param.isFlag == "boolean" && param.isFlag) {
				param.value = 0;
				for (let bf = 0; bf < 8; bf++)
					param.value |= param.flag[bf] ? 1 << bf : 0;
			}

			let byteshift = 0;

			while (l--) {
				let theByte = reserved
					? 0xff // пишем просто 0xff если это резерв
					: (param.value >> byteshift) & 0xff; // иначе бьём на байты value

				b8.push(theByte);

				byteshift += 8;
			}
		}
	}

	while (b8.length > settingsLength) b8.pop();
	while (b8.length < settingsLength) b8.push(0xff);

	WaitingBlock.block(Command.SAVESETTINGS);
	const checksum = getChecksumCalculator(selectChecksum());
	await sysExAndDo(
		Command.SAVESETTINGS,
		() => {
			if (uploadButton) uploadButton.ok();
			isSaved = true;
		},
		1000,
		eightToSeven(b8, checksum),
		checksum
	);
}

export async function getSettingsFromDevice() {
	await sysExAndDo(
		Command.GETSETTINGS,
		(d: Uint8Array) => (settingsRawData = d)
	);
	parseSettingsData();
}

export async function getPalettesFromDevice() {
	await sysExAndDo(Command.PALETTE, (d: Uint8Array) => {});
}

export async function fixSettings(settingsLength: number) {
	if (!settingsNeedFixing) return;
	console.warn("Fixing settings requested");

	settingsObjectIsValid = false; // invalidate the object
	window.settings = settingsModel(); // reset the object
	settings = window.settings;

	await getSettingsFromDevice();
	await saveSettings(settingsLength);

	settingsNeedFixing = false;
}

function isNotZeroOrFF(v: number) {
	return v !== 0 && v !== 0xff;
}

function ffMeansZero(v: number) {
	return v == 0xff ? 0 : v;
}

export async function getFactorySettings() {
	await sysExAndDo(Command.GETFACTORYSETTINGS, (d: Uint8Array) => {
		// does not work for pocket?!
		console.log("FACTORY: ", d);

		const dataview = new DataView(d.buffer);

		const importantFactorySettingsNew = factorySettingsModel();
		importantFactorySettingsNew.hasDecolight =
			isNotZeroOrFF(d[21]) ||
			isNotZeroOrFF(d[22]) ||
			isNotZeroOrFF(d[23]); // decolight points
		importantFactorySettingsNew.caseColour = ffMeansZero(d[50]);
		importantFactorySettingsNew.batteryCapacity = dataview.getUint16(
			52,
			true
		);

		if (importantFactorySettingsNew.batteryCapacity == 0xffff) {
			importantFactorySettingsNew.batteryCapacity = 0;
		}

		const boardRevision = [dataview.getUint8(10), dataview.getUint8(9)];

		importantFactorySettingsNew.boardRevision =
			boardRevision[0] !== 0 &&
			boardRevision[0] !== 0xff &&
			boardRevision[1] !== 0xff
				? `${boardRevision[0]}.${boardRevision[1]}`
				: null;

		importantFactorySettings.set(importantFactorySettingsNew);
	});
}
