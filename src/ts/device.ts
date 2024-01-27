import { writable, get } from 'svelte/store';
import type { Writable } from 'svelte/store';

export interface VersionDataShort
{
	fullVersion: string,
	comparableVersion: number[],
	version: string,
	date: string,
}

export enum FirmwareState
{
	Unknown,
	Checking,
	Obsolete,
	Outdated,
	UpToDate,	
};

export enum CaseColour
{
	Light,
	Dark,
	Gray,
};

const minimumFirmware: VersionDataShort =
{
	fullVersion: "2.0-1.05.2023",
	comparableVersion: [2, 0, 2023, 5, 1],
	version: "2.0",
	date: "1.05.2023"
};

export interface VersionData extends VersionDataShort
{
	isBootloader:	boolean,
	model:	string,
	chip:	string,
	filename:	string,
	bootloader:	{
		version:	string,
		fullVersion: string,
		comparableVersion: number[],
		filename:	string
	}
}

interface ModelChip
{
	varies?: boolean,
	name?: string,
	code?: number,
};

export enum BLEAvailable
{
	None,
	Internal,
	External,
};

interface ModelHardware
{
	encoders?: number,
	faders?: number,
	pots?: number,
	auxbuttons?: number,
	hasJoystick?: boolean,
	midiOut: boolean,
	ble: BLEAvailable,
};

interface ModelPatchSections
{
	hands: number,
	banks: number,
};

export interface Model
{
	name?: string,
	code?: string,
	template?: string,
	webpage?: string,
	settingsLength?: number,
	canHid?: boolean,
	chip?: ModelChip,
	hardware?: ModelHardware,
	patch?: ModelPatchSections,
};

export interface Capabilities
{
	imu: boolean,
	battery: boolean,
	ble: boolean,
	proximity: boolean,
	haptic: boolean,
	pianoroll: boolean,
	decolight: boolean,
	sidestick: boolean,
}


export const capabilityFlags: string[] = [ 'imu','battery','ble','proximity','haptic','pianoroll','decolight','sidestick' ];

export enum OnlineStatus
{
	Disconnect = -1, Offline = 0, Online = 1
};

import type { StatusResult } from 'types';

export function defaultStatusResult(isC: boolean = false): StatusResult
{
	return { isCorrect: isC, class: 0, modelNumber: 0, modelID: 0, variant: 0, revision: 0, serialID: 0, deviceID: "", serial: "", version: "", model: {name:'',code:''}, has:{
		imu: false, battery: false, ble: false, proximity: false, haptic: false, pianoroll: false, decolight: false, sidestick: false,
	} };
}

const patch1Hand8Banks: ModelPatchSections = 
{
	hands: 1,
	banks: 8,
};

const patch2Hands4Banks: ModelPatchSections = 
{
	hands: 2,
	banks: 4,
};


export const models: Model[][] = 
[
	[
		{
			name: "Unknown",
			code: 'none'
		}
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
				midiOut: true,
				ble: BLEAvailable.Internal,
			},
			chip: { varies: false },
			settingsLength: 112,
			patch:
			{
				hands: 1,
				banks: 4,
			},
		}
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
			},
			chip: { varies: true },
			settingsLength: 64,
			webpage: "https://mididobrynya.com/#rec212217415#!/tproduct/212217415-1636487672317",
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
			},
			chip: { varies: true },
			settingsLength: 64,
			patch: patch1Hand8Banks,
		}
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
			},
			chip: { varies: true },
			settingsLength: 64,
			webpage: "https://mididobrynya.com/#rec212217415#!/tproduct/212217415-1594941660113",
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
			},
			chip: { varies: true },
			settingsLength: 64,
			patch: patch1Hand8Banks,
		}
	],
	[
		{},
		{
			name: "Pro M V2",
			code: 'promv2',
			canHid: true,
			template: 'prov2',
			hardware: {
				encoders: 5,
				midiOut: true,
				ble: BLEAvailable.External,
			},
			chip: { varies: false },
			settingsLength: 112,
			patch: patch1Hand8Banks,
		},
		{
			name: "Pro M#",
			code: 'promsharp',
			canHid: true,
			template: 'prov2',
			hardware: {
				encoders: 5,
				midiOut: true,
				ble: BLEAvailable.External,
			},
			chip: {varies: false},
			settingsLength: 112,
			patch: patch1Hand8Banks,
		},
		{
			name: "32 M",
			code: 'm32',
			canHid: true,
			template: 'l32',
			hardware: {
				encoders: 2,
				midiOut: false,
				ble: BLEAvailable.Internal,
			},
			chip: { varies: false },
			settingsLength: 112,
			patch: patch2Hands4Banks,
		},
		{
			name: "32 M#",
			code: 'm32sharp',
			template: 'l32',
			hardware: {
				encoders: 2,
				midiOut: false,
				ble: BLEAvailable.Internal,
			},
			chip: { varies: false },
			settingsLength: 112,
			patch: patch2Hands4Banks,
		}
	],
	[
		{},
		{
			name: "Pro V2",
			code: 'prov2',
			canHid: false,
			template: 'prov2',
			hardware: {
				encoders: 5,
				faders: 4,
				pots: 5,
				auxbuttons: 5,
				hasJoystick: true,
				midiOut: true,
				ble: BLEAvailable.External,
			},
			chip: { varies: false },
			settingsLength: 112,
			patch: patch1Hand8Banks,
		},
		{
			name: "Pro 25",
			code: 'pro25',
			canHid: false,
			hardware: {
				encoders: 5,
				faders: 4,
				pots: 5,
				auxbuttons: 5,
				hasJoystick: true,
				midiOut: true,
				ble: BLEAvailable.External,
			},
			chip: { varies: false },
			settingsLength: 112,
			patch: patch1Hand8Banks,
		},
		{
			name: "32",
			code: 'l32',
			canHid: false,
			template: 'l32',
			hardware:
			{
				encoders: 2,
				hasJoystick: true,
				midiOut: false,
				ble: BLEAvailable.Internal,
			},
			chip: { varies: false },
			settingsLength: 112,
			patch: patch2Hands4Banks,
		},
		{
			name: "41",
			code: 'l41',
			canHid: false,
			hardware:
			{
				encoders: 2,
				hasJoystick: true,
				midiOut: false,
				ble: BLEAvailable.Internal,
			},
			chip: { varies: false },
			settingsLength: 112,
			patch: patch2Hands4Banks,
		},
		{
			name: "50",
			code: 'l50',
			canHid: false,
			hardware:
			{
				encoders: 2,
				hasJoystick: true,
				midiOut: false,
				ble: BLEAvailable.Internal,
			},
			chip: { varies: false },
			settingsLength: 112,
			patch: patch2Hands4Banks,
		}
	]			
];

export const ChipIDs = 
{
	5:
	{
		name: "SAMD21x18",
		code: 18,
		mhz: 48,
	},
	6:
	{
		name: "SAMD21x17",
		code: 17,
		mhz: 48,
	},
	21:
	{
		name: "SAME51J20",
		code: 20,
		mhz: 120,
	},
	2:
	{
		name: "ESP32-S3",
		code: 2,
		mhz: 240,
	}
};

export function versionCompareRaw(currVersionSplit: string[], newVersionSplit: string[] | number[])
{
	if (currVersionSplit.length != newVersionSplit.length) throw "Version lengths are not the same";
	
	while (currVersionSplit.length)
	{
		let pCurrent = parseInt(currVersionSplit.shift());
		let pNew     = newVersionSplit.shift();
		
		if (typeof pNew === "string") pNew = parseInt(pNew);
		
		if (isNaN(pCurrent) || isNaN(pNew)) throw "One of the version components is NaN";
		
		if (pNew > pCurrent) return true;
		if (pNew < pCurrent) return false;
	}
	
	return false;
}

export function versionCompare(currentVersion: string, newVersion: VersionDataShort)
{
	// 2.0/26.06.2022-13:51

	let currVersionWithoutTime = currentVersion.split("-")[0].split("/");
	
	return versionCompareRaw(
		[...currVersionWithoutTime[0].split("."), ...currVersionWithoutTime[1].split(".").reverse()],
		structuredClone(newVersion.comparableVersion)
	);
}

export function isMinimumVersion(currentVersion: string)
{
//	console.log(currentVersion, minimumFirmware, versionCompare(currentVersion, minimumFirmware));
	return !versionCompare(currentVersion, minimumFirmware);
}

export function getFullModelCode(model: Model)
{
	return model.chip.varies ? `${model.code}-${model.chip.code}` : model.code;
}

let waitBeforeRetry = false;

export async function getDefaultPatch(model: Model)
{
	let result = null;
	let fetchJSON: Response;
	
	try 
	{
		fetchJSON = await fetch(`defaultpatches/${model.code}.json`);
		
		if (fetchJSON.status === 200)
			result = await fetchJSON.json();
		else if (fetchJSON.status === 503)
		{
			if (fetchJSON.headers.get("retry-after"))
			{
				let retryAfter = parseInt(fetchJSON.headers.get("retry-after"));
				console.warn("We should retry after ", retryAfter );
				setTimeout(
					()=>waitBeforeRetry = false, retryAfter * 1000);
			}
		}
	} catch(e)
	{
		console.log(e);
		waitBeforeRetry = true;
		setTimeout(()=>waitBeforeRetry = false, 30000);
		return;
	}
	
	return result;
}

export async function getLatestVersion(model: Model | string)
{
	if (waitBeforeRetry) return null;
	
	let result = null;
	
	if (typeof model !== "string") model = getFullModelCode(model);
	
	let fetchJSON: Response;
	
	try 
	{
		fetchJSON = await fetch(`https://config.mididobrynya.com/firmware/${model}/latest.json`, 
			{
				mode:'cors',
			}
		);
		
		if (fetchJSON.status === 200)
			result = await fetchJSON.json();
		else if (fetchJSON.status === 503)
		{
			if (fetchJSON.headers.get("retry-after"))
			{
				let retryAfter = parseInt(fetchJSON.headers.get("retry-after"));
				console.warn("We should retry after ", retryAfter );
				setTimeout(
					()=>waitBeforeRetry = false, retryAfter * 1000);
			}
		}
	} catch(e)
	{
		console.log(e);
		waitBeforeRetry = true;
		setTimeout(()=>waitBeforeRetry = false, 30000);
		return;
	}
	
	if (!result) return;
	
	return result;
}

export let deviceDefinition: Writable<StatusResult> = writable(defaultStatusResult(true));

export function getDevice() { return get(deviceDefinition); }
export function setDevice(dev: StatusResult) { deviceDefinition.set(dev); }