import { isConnected, sysExableStringToUTF8 } from './midi'
import { sortPatchList } from './data_utils'
import { SysExCommand, SysExStatus } from './midi_utils'
import type { MidiResult } from './midi_utils'
import { capabilityFlags, models, ChipIDs, defaultStatusResult } from './device'
import type { StatusResult } from './types'
import * as BSON from 'bson'
import { deviceRefusedToChangePatches, invokeControl, pushFromSysEx, invokeBank } from './events'
// import type { Models } from './model'

const headerLength: number = 12;

interface SevenToEightData
{
	filename: number[],
	data: number[]
};

function sevenToEight (d: Uint8Array, hasFilename: boolean = false): SevenToEightData
{
	let shifter: number = 1;
	let outArray: number[] = [];
	let filename: number[] = [];
	let zeroi: number = headerLength;
	
	if (hasFilename)
	{
		while (d[zeroi]) filename.push(d[zeroi++]);		
		zeroi++; // skip null character
	}
	
	let nextbyte: number;
	
	for (let i: number = zeroi; i < d.length - 1; i++)
	{
		if (shifter == 8) { shifter = 1; continue; }
		
		nextbyte = d[i+1];
		if (nextbyte > 0x7f) nextbyte = 0;
		
		let newbyte: number = ((d[i] << shifter) | (nextbyte >> (7 - shifter))) & 0xff;
		
		outArray.push(newbyte);
		
		shifter++;
	}
	
	return { filename: hasFilename ? filename : null, data: outArray };
	//ignoreFilename ? [ filename, outArray ] : outArray;
}

export function interpretMidiEvent (event: MIDIMessageEvent): MidiResult | boolean
{
	let d: Uint8Array = event.data;
	
	if (d[0] != 0xf0 || d[1] != 0 || d[2] != 0x39 || d[3] != 0x40) return false;
	
	let midiResult: MidiResult = 
	{
		command: d[10],
		status: d[11] & 0x3f,
		model: (d[4] in models && d[5] in models[d[4]]) ? models[d[4]][d[5]] : models[0][0],
		hasControlSum: (d[11] & 0x40) == 0x40,
		filename: "",
		data: null,
		success: ((d[11] & 0x3f) == SysExStatus.OK)
	};
	
	switch(midiResult.command)
	{
		case SysExCommand.STATUS:
		{
			if (!midiResult.success) break;
			
			if (d.length < 13) break; // old fw
			
			let pureData = sevenToEight(d).data;
			
//			console.log(pureData);
			
			let output: StatusResult = defaultStatusResult();
			
			output.isCorrect = (pureData[0] == 0x1) ? true : false;
			output.class = pureData[2] >> 4;
			output.modelNumber = pureData[2] & 0xf;
			output.modelID = pureData[2];
			output.variant = pureData[3];
			output.revision = pureData[4];
			output.serialID = ((pureData[5] << 24) | (pureData[6] << 16) | (pureData[7] << 8) | pureData[8]);
			output.deviceID = 
				output.modelID.toString(16) +
				output.variant.toString(16).padStart(2,"0") +
				output.revision.toString(16).padStart(2,"0");
			output.serial = output.deviceID + "-" + output.serialID.toString().padStart(4,"0");
			
			output.model = models[output.class][output.modelNumber];
			
			output.model['chipName'] = ChipIDs[output.variant].name;
			output.model['chipCode'] = ChipIDs[output.variant].code;
			
			let capabilityFlagsData = ((pureData[12] << 24) | (pureData[11] << 16) | (pureData[10] << 8) | pureData[9]);
			
			for (let flag in capabilityFlags)
			{
				if (capabilityFlagsData & (1 << (flag as unknown as number))) // meh
				{
					output.has[capabilityFlags[flag]] = true;
				}
			}
			
			let versionArray = pureData.slice(9 + 4); // 9 bytes of serial number
			
			while (!versionArray[versionArray.length - 1]) versionArray.pop();
			
			output.version = String.fromCharCode(...versionArray);
			
			midiResult.data = output;
			
			break;
		}
		
		case SysExCommand.PATCHLIST:
		{
			if (!midiResult.success) break;
			
			midiResult.data = [];
			
			let patchData = d.slice(headerLength);
			
			let findIndex = 0;
			
			while (patchData.length && (findIndex = patchData.indexOf(0)) !== -1)
			{
				let patchItemResult = sysExableStringToUTF8(patchData.slice(0, findIndex + 1));
				patchData = patchData.slice(findIndex + 1);
				
				while (patchData.length && patchData[0] == 0) 
				{
					patchData = patchData.slice(1);
					console.error("Patch list data has double zeroes", findIndex);
				}
				
				midiResult.data.push({ name: patchItemResult.string, isThePatch: patchItemResult.isThePatch });
			}
			
			console.log("Patchlist", midiResult.data);
			
			midiResult.data.sort(sortPatchList);
			
			break;
		}
		
		case SysExCommand.GETVERSION:
		{
			if (!midiResult.success) break; // nothing to do then
			
			let arr = sevenToEight(d).data;
			
			let arr2 = [];

			for (let arx of arr)
				arr2.push(String.fromCharCode(arx));
				
			let vrs = arr2.join("");
			
			if (!vrs) 
				alert("No firmware version is reported. Consider updating your Dobrynya's firmware.")
			else
			{
				midiResult.data = vrs;
			}
		}
		
		// case SysExCommand.GETPRESENTDEVICES:
		// {
		// 	if (!midiResult.success) break; // nothing to do then
		// 	
		// 	let devicesPresent = sevenToEight(d).data;
		// 	
		// 	if (!devicesPresent) break;
		// 	
		// 	for (let i in devicesPresentFlags)
		// 	{
		// 		if (!(devicesPresent & (1 << i))) continue;
		// 		midiResult.data.has[devicesPresentFlags[i]] = true;
		// 	}
		// 	
		// 	break;
		// }

		case SysExCommand.GETPATCHINFO:
		{				
			if (!midiResult.success) break;
 
			let s2eResult = sevenToEight(d, true);
			midiResult.filename = sysExableStringToUTF8(s2eResult.filename).string;
			
			try
			{
				midiResult.data = BSON.deserialize(new Uint8Array(s2eResult.data));
			} catch(e)
			{
				console.error(midiResult,s2eResult.data,d);
			}

			break;
		}
		
	
		case SysExCommand.READPATCHTHROUGH:
		{				
			if (!midiResult.success) break;
		
			let s2eResult = sevenToEight(d, true);

			midiResult.data     = new Uint8Array(s2eResult.data);
			midiResult.filename = sysExableStringToUTF8(s2eResult.filename).string;
		
			break;
		}
		
		case SysExCommand.READPATCH:
		{
			if (!midiResult.success) break;

			let s2eResult = sevenToEight(d, true);
			
			try
			{
				midiResult.data = BSON.deserialize(new Uint8Array(s2eResult.data));
				midiResult.filename = sysExableStringToUTF8(s2eResult.filename).string;
			} catch(e)
			{
				console.log(e);
			}

			break;
		}

		case SysExCommand.GETCHIPID:
		{
			if (!midiResult.success) break;
			
			midiResult.data = sevenToEight(d).data;
			
			for (let i in midiResult.data)
				midiResult.data[i] = midiResult.data[i].toString(16);
				
			if (midiResult.data.length < 16)
			{
				console.log("Wrong chip ID length...");
				midiResult.data = null;
			}
			
			while (midiResult.data.length > 16) midiResult.data.pop();
			
			break;
		}
		
		case SysExCommand.GETSERIAL:
		{
			if (!midiResult.success) break;
			
			let arr = sevenToEight(d).data;
			let arr2 = [];

			console.log("Serial read was ", arr);
			
			for (let i = 0; i < 4; i++)
				arr2[i] = arr[i].toString(16);
				
			let sn = (arr[4] << 24) | (arr[5] << 16) | (arr[6] << 8) | (arr[7] << 0);
				
			midiResult.data = `${arr2.join("")}-${sn.toString().padStart(4,"0")}`;
			
			break;
		}
		
		case SysExCommand.GETFACTORYSETTINGS:
		case SysExCommand.GETSETTINGS:
		{
			if (!midiResult.success) break;
			midiResult.data = sevenToEight(d).data; // just pass (almost) raw data
			break;
		}
	}
	
	return midiResult;
}

export function onMIDIMessage (event: MIDIMessageEvent)
{
	if (!isConnected) return;
	
	let d = event.data;
	
	if (d[0] != 0xf0 || d[1] != 0 || d[2] != 0x39 || d[3] != 0x40) return;
	
	let midiResult: MidiResult = 
	{
		command: d[10],
		status: d[11] & 0x3f,
		model: (d[4] in models && d[5] in models[d[4]]) ? models[d[4]][d[5]] : models[0][0],
		hasControlSum: (d[11] & 0x40) == 0x40,
		filename: "",
		data: null,
		success: ((d[11] & 0x3f) == SysExStatus.REQUEST || (d[11] & 0x3f) == SysExStatus.PUSH)
	};
	
	switch(midiResult.command)
	{
		case SysExCommand.READPATCH:
		{
			if (midiResult.status != SysExStatus.PUSH) break;
		
			let temporaryArray = sevenToEight(d, true);
			
			try
			{
				midiResult.data = BSON.deserialize(new Uint8Array(temporaryArray.data));
				midiResult.filename = sysExableStringToUTF8(temporaryArray.filename).string;
				pushFromSysEx(midiResult);
			} catch(e)
			{
				console.log(e);
			}
		
			break;
		}
		
		case SysExCommand.LOCKPATCHSWITCHING: if (midiResult.status == SysExStatus.REQUEST) deviceRefusedToChangePatches(); break;
		case SysExCommand.INVOKECONTROL: if (midiResult.status == SysExStatus.REQUEST) invokeControl(d[12],d[13]); break;
		case SysExCommand.LOADBANK: if (midiResult.status == SysExStatus.REQUEST) invokeBank(d[12] & 0xf, d[13], ((d[12] & 0x10) == 0x10)); break;
	}
}