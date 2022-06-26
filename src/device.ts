export interface Model
{
	name?: string,
	code?: string,
	template?: string,
	chipVaries?: boolean,
	chipName?: string,
	chipCode?: number,
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
	decolight: boolean
}



export const capabilityFlags: string[] = [ 'imu','battery','ble','proximity','haptic','pianoroll','decolight' ];

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

export interface VersionData
{
	isBootloader:	boolean,
	model:	string,
	chip:	string,
	version:	string,
	date:	string,
	filename:	string,
	bootloader:	{
		version:	string,
		filename:	string
	}
}

export function versionCompare(currentVersion: string, newVersion: VersionData)
{
	// 2.0/26.06.2022-13:51
	
	let currVersionWithoutTime = currentVersion.split("-")[0].split("/");
	
	let currVersionSplit = [...currVersionWithoutTime[0].split("."), ...currVersionWithoutTime[1].split(".").reverse()];
	let newVersionSplit  = [...newVersion.version.split("."), ...newVersion.date.split(".").reverse()];
	
	// console.log(currVersionSplit, newVersionSplit);
	
	if (currVersionSplit.length != newVersionSplit.length) throw "Version lengths are not the same";
	
	while (currVersionSplit.length)
	{
		let pCurrent = parseInt(currVersionSplit.shift());
		let pNew = parseInt(newVersionSplit.shift());
		
		if (isNaN(pCurrent) || isNaN(pNew)) throw "One of the version components is NaN";
		
		if (pNew > pCurrent) return true;
	}
	
	return false;
}

export function getFullModelCode(model: Model)
{
	return model.chipVaries ? `${model.code}-${model.chipCode}` : model.code;
}

export async function getLatestVersion(model: Model)
{
	let result = null;
	
	try 
	{
		let fetchJSON = await fetch(`https://config.mididobrynya.com/firmware/${getFullModelCode(model)}/latest/?json=json`, 
			{
				mode:'cors',
			}
		);
	
		result = await fetchJSON.json();
	} catch(e)
	{
		console.error(e);
		return;
	}
	
	if (!result) return;
	
	return result;
	
	// let vCompare = versionCompare(getVersionPure(),result.version);
	// 
	// if ($("#fw-oldfw").hasClass("hh"))
	// {
	// 	if ((vCompare < 0 || (vCompare == 0 && isAvailableVersionNewer(getVersionDate(),result.date))))
	// 	{
	// 		$("#show-firmware").addClass("fw-updateavailable");
	// 		$("#fw-updateavailable").show();
	// 	}        
	// 	else
	// 		$("#fw-noupdates").show();
	// }
}