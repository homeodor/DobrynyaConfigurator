import { WaitingBlock } from './waitingblock'
import { sysExAndDo } from './midi';
import { CaseColour } from './device'
import { eightToSeven, SysExCommand } from './midi_utils';
import { deepClone } from './data_utils';

import { getPaletteCSS } from './palettes'

import type ButtonUpload from './widgets/ButtonUpload.svelte'

interface SettingsObjectItem
{
	length?: number,
	reserved?: boolean,
	isFlag?: boolean,
	fixFunc?: Function,
	value?: number,
	flag?: boolean[],
	fixfunc?: Function,
}

interface SettingsObject
{
	[index: string]: {
		[index: string]: SettingsObjectItem
	}	
};

function fixValueToZero(v: number): number { return (v == 0xff) ? 0    : v; }
function fixValueTo7F  (v: number): number { return (v >  0x7f) ? 0x7f : v; }

export let isSaved: boolean = true;
let settingsRawData: Uint8Array;
let settingsNeedFixing: boolean = false;
let settingsObjectIsValid: boolean = false;

export function markSettingsUnsaved() { isSaved = false; }
export function markSettingsDirty()   { settingsNeedFixing = true }

export interface ImportantFactorySettings
{
	hasDecolight: boolean,
	caseColour: CaseColour
};

function factorySettingsModel(): ImportantFactorySettings
{
	return {
		hasDecolight: false,
		caseColour: CaseColour.Light
	};
}

export let importantFactorySettings: ImportantFactorySettings;

function settingsModel(): SettingsObject
{
	return {
		control: 
		{
			control:
			{
				length: 4
			}
		},
	
		screen: 
		{
			brightness:
			{
				reserved: true
			},
			contrast:
			{},
			timeout:
			{
				length: 2
			},
			reserved1:
			{
				reserved: true,
				length: 8
			}
		},
	
		leds:
		{
			brightness: {},    
			brightnesschill: {},    
			brightnessdeco: {},        
			brightnessblink: {},
			timeoutchill:
			{
				length: 2
			},
			timeoutoff:
			{
				reserved: true,
				length: 2
			},
			timeoutpalette:
			{},
			palettes:
			{
				isFlag: true
			},
			flags:
			{
				isFlag:true,
				reserved:true
			},
			blinkmode:
			{},
			chillanimations:
			{
				isFlag:true
			},
			reserved2:
			{
				reserved:true,
				length:3
			}
		},
	
		midi:
		{
			channel: {},
			outputs:
			{
				isFlag:true
			},
			inputs:
			{
				isFlag:true
			},
			hwmidi:
			{
				fixfunc: fixValueToZero,
				isFlag:true
			},
			vel:
			{
				fixfunc: fixValueTo7F,
			},
			reserved1:
			{
				reserved:true,
				length:11
			}
		},
	
		input:
		{
			debouncepad: {},
			debounceother: {},
			smoothfader:
			{
				reserved:true
			},
			smoothjoystick:
			{
				reserved:true
			},
			encoderkinetics:
			{
				reserved:true,
				length:4
			},
			direction:
			{
				isFlag:true
			},
			reserved1:
			{
				reserved:true,
				length:7
			}
		},
		
		lowpower:
		{
			reserved1:
			{
				reserved:true,
				length:16
			}
		},
		
		ble:
		{
			reserved1:
			{
				reserved:true,
				length:16
			}
		},
		
		haptic:
		{
			events:
			{
				length:2,
				isFlag:true
			},
			channel: {}
		}
	}
}

export let settings = settingsModel();

export function parseSettingsData()
{
	console.log(settingsObjectIsValid);
	
	if (settingsObjectIsValid) return; // it’s all good, no need to re-parse
	
	if (!isSaved) return; // there was a previous state available
	
	let arp = 0;
	
	for (let i in settings)
	{
		if (i == "fakeparam") continue;
		
		
		for (let j in settings[i])
		{
			let param = settings[i][j];
			
			if (typeof param.length == "undefined") param.length = 1;
			
			if (param.reserved) 
			{
				arp += param.length;
				continue;
			} 
			
			param.value = 0;
			
			for (let byteshift = 0; byteshift < param.length; byteshift++)
			{
				param.value |= (settingsRawData[arp++] << (byteshift * 8));
			}
			
			if (typeof param.fixfunc == "function") {
				param.value = param.fixfunc(param.value);
			}
			
			if (param.isFlag)
			{
				param.flag = [];
				
				for (let bitshift = 0; bitshift < 8; bitshift++)
				{
					param.flag[bitshift] = (((param.value >> bitshift) & 1) == 1 ? true : false);
				}
			}
		}
	}
	
	console.log(settings);
	
	settingsObjectIsValid = true;
}

export async function saveSettings(settingsLength: number, uploadButton: ButtonUpload = null)
{
	let b8 = [];
	
	for (let i in settings)
	{
		for (let j in settings[i])
		{
			let param: SettingsObjectItem = settings[i][j];

			let l = param.length;
			
			let reserved = (typeof param.reserved == "boolean" && param.reserved);				
			
			if (!reserved && typeof param.isFlag == "boolean" && param.isFlag)
			{
				console.log(param);
				param.value = 0;
				for (let bf = 0; bf < 8; bf++)
					param.value |= (param.flag[bf] ? (1 << bf) : 0);
			}
			
			let byteshift = 0;
			
			while (l--)
			{
				let theByte =
					reserved ?
						0xff : // пишем просто 0xff если это резерв
						(param.value >> byteshift) & 0xff;	// иначе бьём на байты value					
				
				b8.push(theByte);
				
				byteshift += 8;
			}
		}
	}
	
	while (b8.length > settingsLength) b8.pop();
	while (b8.length < settingsLength) b8.push(0xff);
	
	WaitingBlock.block(SysExCommand.SAVESETTINGS);
	await sysExAndDo(SysExCommand.SAVESETTINGS, ()=>
	{
		if (uploadButton) uploadButton.ok();
		isSaved = true;
	}, 1000, eightToSeven(b8), true);
}

export async function getSettingsFromDevice()
{
	await sysExAndDo(SysExCommand.GETSETTINGS, (d: Uint8Array)=> settingsRawData = d);
	parseSettingsData();
}

export async function fixSettings(settingsLength: number)
{
	if (!settingsNeedFixing) return;
	console.warn("Fixing settings requested");
	
	settingsObjectIsValid = false; // invalidate the object
	settings = settingsModel(); // reset the object
	
	await getSettingsFromDevice();
	await saveSettings(settingsLength);
	
	settingsNeedFixing = false;
}

function isNotZeroOrFF(v: number)
{
	return v !== 0 && v !== 0xff;
}

function ffMeansZero(v: number)
{
	return v == 0xff ? 0 : v;
}

export async function getFactorySettings()
{
	await sysExAndDo(SysExCommand.GETFACTORYSETTINGS, (d: Uint8Array)=> {
		importantFactorySettings = factorySettingsModel();
		importantFactorySettings.hasDecolight = isNotZeroOrFF(d[21]) || isNotZeroOrFF(d[22]) || isNotZeroOrFF(d[23]); // decolight points
		importantFactorySettings.caseColour = ffMeansZero(d[50]) 
	});
}