import { writable, get } from "svelte/store";
import type { Writable } from "svelte/store";

export interface VersionDataShort {
	fullVersion: string;
	comparableVersion: number[];
	version: string;
	date: string;
}

export enum FirmwareState {
	Unknown,
	Checking,
	Obsolete,
	Outdated,
	UpToDate,
}

export enum CaseColour {
	Light,
	Dark,
	Gray,
}

const minimumFirmware = "2.0/1.05.2023";

// const minimumFirmware: VersionDataShort = {
// 	fullVersion: "2.0-1.05.2023",
// 	comparableVersion: [2, 0, 2023, 5, 1],
// 	version: "2.0",
// 	date: "1.05.2023",
// };

export interface VersionData extends VersionDataShort {
	isBootloader: boolean;
	model: string;
	chip: string;
	filename: string;
	bootloader: {
		version: string;
		fullVersion: string;
		comparableVersion: number[];
		filename: string;
	};
}

interface ModelChip {
	varies?: boolean;
	name?: string;
	code?: number;
	mhz?: number;
}

export enum BLEAvailable {
	None,
	Internal,
	External,
}

interface ModelHardware {
	encoders?: number;
	faders?: number;
	pots?: number;
	auxbuttons?: number;
	accel?: number;
	hasJoystick?: boolean;
	midiOut: boolean;
	ble: BLEAvailable;
	eyes: boolean;
}

interface ModelPatchSections {
	hands: number;
	banks: number;
}

export interface Model {
	name?: string;
	code?: string;
	template?: string;
	webpage?: string;
	settingsLength?: number;
	canHid?: boolean;
	chip?: ModelChip;
	hardware?: ModelHardware;
	patch?: ModelPatchSections;
	testSignResult?: string;
}

export interface Capabilities {
	accel: boolean;
	battery: boolean;
	ble: boolean;
	proximity: boolean;
	haptic: boolean;
	pianoroll: boolean;
	decolight: boolean;
	sidestick: boolean;
}

export const capabilityFlags: string[] = [
	"accel",
	"battery",
	"ble",
	"proximity",
	"haptic",
	"pianoroll",
	"decolight",
	"sidestick",
];

export enum OnlineStatus {
	Disconnect = -1,
	Offline = 0,
	Online = 1,
}

import { BatteryStatus, type StatusResult } from "./types";

export function defaultStatusResult(isC: boolean = false): StatusResult {
	return {
		isCorrect: isC,
		class: 0,
		modelNumber: 0,
		modelID: 0,
		variant: 0,
		revision: 0,
		serialID: 0,
		deviceID: "",
		serial: "",
		version: "",
		model: { name: "", code: "" },
		has: {
			accel: false,
			battery: false,
			ble: false,
			proximity: false,
			haptic: false,
			pianoroll: false,
			decolight: false,
			sidestick: false,
		},
		battery: { status: BatteryStatus.noBattery, percent: 0 },
		legacyChecksum: false,
		supportsSigning: false,
	};
}

const patch1Hand8Banks: ModelPatchSections = {
	hands: 1,
	banks: 8,
};

const patch2Hands4Banks: ModelPatchSections = {
	hands: 2,
	banks: 4,
};

export const models: Model[][] = [
	[
		{
			name: "Unknown",
			code: "none",
		},
	],
	[
		{},
		{
			name: "Pocket",
			code: "pocket",
			canHid: false,
			template: "miniv2",
			hardware: {
				encoders: 2,
				accel: 2,
				midiOut: true,
				ble: BLEAvailable.Internal,
				eyes: true,
			},
			chip: { varies: false },
			settingsLength: 112,
			patch: {
				hands: 1,
				banks: 4,
			},
			testSignResult: "okL3BhtuImFQmQuLM5TdW3mFjpHBNdZZkrM4hw3tI3g=",
		},
	],
	[
		{},
		{
			name: "Micro V2",
			code: "microv2",
			canHid: true,
			template: "miniv2",
			hardware: {
				encoders: 3,
				midiOut: false,
				ble: BLEAvailable.None,
				eyes: false,
			},
			chip: { varies: true },
			settingsLength: 64,
			webpage:
				"https://mididobrynya.com/#rec212217415#!/tproduct/212217415-1636487672317",
			patch: patch1Hand8Banks,
		},
		{},
		{},
		{},
		{},
		{
			name: "Micro#",
			code: "microsharp",
			canHid: true,
			template: "miniv2",
			hardware: {
				encoders: 3,
				midiOut: false,
				ble: BLEAvailable.None,
				eyes: false,
			},
			chip: { varies: true },
			settingsLength: 64,
			patch: patch1Hand8Banks,
		},
	],
	[
		{},
		{
			name: "Mini V2",
			code: "miniv2",
			canHid: true,
			template: "miniv2",
			hardware: {
				encoders: 4,
				midiOut: false,
				ble: BLEAvailable.None,
				eyes: false,
			},
			chip: { varies: true },
			settingsLength: 64,
			webpage:
				"https://mididobrynya.com/#rec212217415#!/tproduct/212217415-1594941660113",
			patch: patch1Hand8Banks,
		},
		{
			name: "Mini 25",
			code: "mini25",
			canHid: true,
			template: "mini25",
			hardware: {
				encoders: 4,
				midiOut: false,
				ble: BLEAvailable.None,
				eyes: false,
			},
			chip: { varies: true },
			settingsLength: 64,
			patch: patch1Hand8Banks,
		},
	],
	[
		{},
		{
			name: "Pro M V2",
			code: "promv2",
			canHid: true,
			template: "prov2",
			hardware: {
				encoders: 5,
				midiOut: true,
				ble: BLEAvailable.External,
				eyes: false,
			},
			chip: { varies: false },
			settingsLength: 112,
			patch: patch1Hand8Banks,
		},
		{
			name: "Pro M#",
			code: "promsharp",
			canHid: true,
			template: "prov2",
			hardware: {
				encoders: 5,
				midiOut: true,
				ble: BLEAvailable.External,
				eyes: false,
			},
			chip: { varies: false },
			settingsLength: 112,
			patch: patch1Hand8Banks,
		},
		{
			name: "32 M",
			code: "m32",
			canHid: true,
			template: "l32",
			hardware: {
				encoders: 2,
				midiOut: false,
				ble: BLEAvailable.Internal,
				eyes: false,
			},
			chip: { varies: false },
			settingsLength: 112,
			patch: patch2Hands4Banks,
		},
		{
			name: "32 M#",
			code: "m32sharp",
			template: "l32",
			hardware: {
				encoders: 2,
				midiOut: false,
				ble: BLEAvailable.Internal,
				eyes: false,
			},
			chip: { varies: false },
			settingsLength: 112,
			patch: patch2Hands4Banks,
		},
	],
	[
		{},
		{
			name: "Pro V2",
			code: "prov2",
			canHid: false,
			template: "prov2",
			hardware: {
				encoders: 5,
				faders: 4,
				pots: 5,
				auxbuttons: 5,
				hasJoystick: true,
				midiOut: true,
				ble: BLEAvailable.External,
				eyes: false,
			},
			chip: { varies: false },
			settingsLength: 112,
			patch: patch1Hand8Banks,
		},
		{
			name: "Pro 25",
			code: "pro25",
			canHid: false,
			hardware: {
				encoders: 5,
				faders: 4,
				pots: 5,
				auxbuttons: 5,
				hasJoystick: true,
				midiOut: true,
				ble: BLEAvailable.External,
				eyes: false,
			},
			chip: { varies: false },
			settingsLength: 112,
			patch: patch1Hand8Banks,
		},
		{
			name: "32",
			code: "l32",
			canHid: false,
			template: "l32",
			hardware: {
				encoders: 2,
				hasJoystick: true,
				midiOut: false,
				ble: BLEAvailable.Internal,
				eyes: false,
			},
			chip: { varies: false },
			settingsLength: 112,
			patch: patch2Hands4Banks,
		},
		{
			name: "41",
			code: "l41",
			canHid: false,
			hardware: {
				encoders: 2,
				hasJoystick: true,
				midiOut: false,
				ble: BLEAvailable.Internal,
				eyes: false,
			},
			chip: { varies: false },
			settingsLength: 112,
			patch: patch2Hands4Banks,
		},
		{
			name: "50",
			code: "l50",
			canHid: false,
			hardware: {
				encoders: 2,
				hasJoystick: true,
				midiOut: false,
				ble: BLEAvailable.Internal,
				eyes: false,
			},
			chip: { varies: false },
			settingsLength: 112,
			patch: patch2Hands4Banks,
		},
	],
];

export const ChipIDs: Record<number, ModelChip> = {
	5: {
		name: "SAMD21x18",
		code: 18,
		mhz: 48,
		supportsSigning: false,
	},
	6: {
		name: "SAMD21x17",
		code: 17,
		mhz: 48,
		supportsSigning: false,
	},
	21: {
		name: "SAME51J20",
		code: 20,
		mhz: 120,
		supportsSigning: false,
	},
	1: {
		name: "ESP32-S3",
		code: 2,
		mhz: 240,
		supportsSigning: true,
	},
	2: {
		name: "ESP32-S3",
		code: 2,
		mhz: 240,
		supportsSigning: true,
	},
};

function fixOldVersion(version: string[] | number[]): number[] {
	const versionToNumber: number[] = version.map((v: string | number) =>
		typeof v === "string" ? parseInt(v) : v
	);

	if (versionToNumber.length == 5) {
		return [
			versionToNumber[0],
			versionToNumber[1],
			0,
			versionToNumber[2],
			versionToNumber[3],
			versionToNumber[4],
		];
	}

	if (versionToNumber.length == 3) {
		return [
			versionToNumber[0],
			versionToNumber[1],
			versionToNumber[2],
			0,
			0,
			0,
		];
	}

	return versionToNumber;
}

export function versionCompareRaw(
	currVersionSplitIn: string[],
	newVersionSplitIn: string[] | number[]
) {
	const currVersionSplit = fixOldVersion(currVersionSplitIn);
	const newVersionSplit = fixOldVersion(newVersionSplitIn);

	if (currVersionSplit.length != newVersionSplit.length)
		throw "Version lengths are not the same";

	while (currVersionSplit.length) {
		let pCurrent = currVersionSplit.shift();
		let pNew = newVersionSplit.shift();

		if (pCurrent === undefined || pNew === undefined) {
			throw new Error(
				"Cannot compare versions: either pCurrent or pNew are undefined"
			);
		}

		if (typeof pNew === "string") {
			pNew = parseInt(pNew);
		}

		if (isNaN(pCurrent) || isNaN(pNew))
			throw "One of the version components is NaN";

		if (pNew > pCurrent) return true;
		if (pNew < pCurrent) return false;
	}

	return false;
}

function explodeVersionPart(incoming: string): string[] {
	return incoming.trim().replace(/\0/g, "").split(".");
}

function explodeVersion(version: string) {
	let currVersionWithoutTime = version.split("-")[0].split("/");

	const incomingVersion = [
		...explodeVersionPart(currVersionWithoutTime[0]),
		...explodeVersionPart(currVersionWithoutTime[1]).reverse(),
	];

	return incomingVersion;
}

export function versionCompare(currentVersionIn: string, newVersionIn: string) {
	// 2.0/26.06.2022-13:51

	const currentVersion = explodeVersion(currentVersionIn);
	const newVersion = explodeVersion(newVersionIn);

	if (currentVersion[2] === "L") {
		return false;
	}

	return versionCompareRaw(currentVersion, newVersion);
}

export function isMinimumVersion(currentVersion: string) {
	//	console.log(currentVersion, minimumFirmware, versionCompare(currentVersion, minimumFirmware));
	return !versionCompare(currentVersion, minimumFirmware);
}

export function getFullModelCode(model: Model): string {
	return model.chip?.varies
		? `${model.code}-${model.chip.code}`
		: model.code ?? "";
}

let waitBeforeRetry = false;

export async function getDefaultPatch(model: Model) {
	let result = null;
	let fetchJSON: Response;

	try {
		fetchJSON = await fetch(`defaultpatches/${model.code}.json`);

		if (fetchJSON.status === 200) result = await fetchJSON.json();
		else if (fetchJSON.status === 503) {
			const retryAfterHeader = fetchJSON.headers.get("retry-after");

			if (retryAfterHeader) {
				let retryAfter = parseInt(retryAfterHeader);
				console.warn("We should retry after ", retryAfter);
				setTimeout(() => (waitBeforeRetry = false), retryAfter * 1000);
			}
		}
	} catch (e) {
		console.log(e);
		waitBeforeRetry = true;
		setTimeout(() => (waitBeforeRetry = false), 30000);
		return;
	}

	return result;
}

export async function getLatestVersion(model: Model | string) {
	if (waitBeforeRetry) return null;

	let result = null;

	if (typeof model !== "string") model = getFullModelCode(model);

	let fetchJSON: Response;

	try {
		fetchJSON = await fetch(
			`https://dobrynyadev.kt8.ru/firmware/${model}/latest.json`,
			{
				mode: "cors",
			}
		);

		if (fetchJSON.status === 200) result = await fetchJSON.json();
		else if (fetchJSON.status === 503) {
			const retryAfterHeader = fetchJSON.headers.get("retry-after");

			if (retryAfterHeader) {
				let retryAfter = parseInt(retryAfterHeader);
				console.warn("We should retry after ", retryAfter);
				setTimeout(() => (waitBeforeRetry = false), retryAfter * 1000);
			}
		}
	} catch (e) {
		console.log(e);
		waitBeforeRetry = true;
		setTimeout(() => (waitBeforeRetry = false), 30000);
		return;
	}

	if (!result) return;

	return result;
}

export let deviceDefinition: Writable<StatusResult> = writable(
	defaultStatusResult(true)
);

export function getDevice() {
	return get(deviceDefinition);
}
export function setDevice(dev: StatusResult) {
	deviceDefinition.set(dev);
}
