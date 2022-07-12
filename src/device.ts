import { deepClone } from "./data_utils";

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
};

const minimumFirmware: VersionDataShort =
{
	fullVersion: "2.0-26.06.2022",
	comparableVersion: [2, 0, 2022, 6, 26],
	version: "2.0",
	date: "26.06.2022"
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

export interface Model
{
	name?: string,
	code?: string,
	template?: string,
	chipVaries?: boolean,
	chipName?: string,
	chipCode?: number,
	webpage?: string,
	settingsLength?: number
	encoders?: number,
	faders?: number,
	pots?: number,
	hasJoysitck?: true,
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

import type { StatusResult } from "./types";

export function defaultStatusResult(isC: boolean = false): StatusResult
{
	return { isCorrect: isC, class: 0, modelNumber: 0, modelID: 0, variant: 0, revision: 0, serialID: 0, deviceID: "", serial: "", version: "", model: {name:'',code:''}, has:{
		imu: false, battery: false, ble: false, proximity: false, haptic: false, pianoroll: false, decolight: false
	} };
}

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
			name: "Calculator",
			code: "calc"
		}
	],
	[	
		{},
		{
			name: "Micro V2",
			code: "microv2",
			template: "miniv2",
			encoders: 3,
			chipVaries: true,
			settingsLength: 64,
			webpage: "https://mididobrynya.com/#rec212217415#!/tproduct/212217415-1636487672317",
		},
		{},
		{},
		{},
		{},
		{
			name: "Micro#",
			code: "microsharp",
			template: "miniv2",
			encoders: 3,
			chipVaries: true,
			settingsLength: 64,
		}
	],
	[
		{},
		{
			name: "Mini V2",
			code: "miniv2",
			template: "miniv2",
			encoders: 4,
			chipVaries: true,
			settingsLength: 64,
			webpage: "https://mididobrynya.com/#rec212217415#!/tproduct/212217415-1594941660113",
		},
		{
			name: "Mini 25",
			code: "mini25",
			template: "mini25",
			encoders: 4,
			chipVaries: true,
			settingsLength: 64,
		}
	],
	[
		{},
		{
			name: "Pro M V2",
			code: 'promv2',
			template: 'prov2',
			encoders: 5,
			chipVaries: false,
			settingsLength: 112,
		},
		{
			name: "Pro M#",
			code: 'promsharp',
			template: 'prov2',
			encoders: 5,
			chipVaries: false,
			settingsLength: 112,
		},
		{
			name: "32 M",
			code: 'm32',
			template: 'l32',
			encoders: 2,
			chipVaries: false,
			settingsLength: 112,
		},
		{
			name: "32 M#",
			code: 'm32sharp',
			template: 'l32',
			encoders: 2,
			chipVaries: false,
			settingsLength: 112,
		}
	],
	[
		{},
		{
			name: "Pro V2",
			code: 'prov2',
			template: 'prov2',
			encoders: 5,
			faders: 4,
			pots: 5,
			hasJoysitck: true,
			chipVaries: false,
			settingsLength: 112,
		},
		{
			name: "Pro 25",
			code: 'pro25',
			encoders: 5,
			faders: 4,
			pots: 5,
			hasJoysitck: true,
			chipVaries: false,
			settingsLength: 112,
		},
		{
			name: "32",
			code: 'l32',
			template: 'l32',
			encoders: 2,
			hasJoysitck: true,
			chipVaries: false,
			settingsLength: 112,
		},
		{
			name: "41",
			code: 'l41',
			encoders: 2,
			hasJoysitck: true,
			chipVaries: false,
			settingsLength: 112,
		},
		{
			name: "50",
			code: 'l50',
			encoders: 2,
			hasJoysitck: true,
			chipVaries: false,
			settingsLength: 112,
		}
	]			
];

export const ChipIDs = 
{
	'5':
	{
		name: "SAMD21x18",
		code: 18
	},
	'6':
	{
		name: "SAMD21x17",
		code: 17
	},
	'21':
	{
		name: "SAME51J20",
		code: 20
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
		deepClone(newVersion.comparableVersion)
	);
}

export function isMinimumVersion(currentVersion: string)
{
	console.log(currentVersion, minimumFirmware, versionCompare(currentVersion, minimumFirmware));
	return !versionCompare(currentVersion, minimumFirmware);
}

export function getFullModelCode(model: Model)
{
	return model.chipVaries ? `${model.code}-${model.chipCode}` : model.code;
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