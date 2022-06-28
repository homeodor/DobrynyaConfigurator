import type { Model } from './device'
import { getFullModelCode } from './device'
import { writeUF2Data, exitBootloader } from './hid'
import type {  }

export enum UF2State
{
	Empty,
	Downloading,
	Failed,
	Downloaded,
	Custom,
}

interface UF2ParsedChunk { address: number, data: Uint8Array };
interface UF2StorageItem { data: null | UF2ParsedChunk[], state: UF2State };
interface UF2Storage { bootloader: UF2StorageItem, firmware: UF2StorageItem };

const uf2Storage: UF2Storage = 
{
	bootloader:
	{
		data: null,
		state: UF2State.Empty,
	},
	firmware:
	{
		data: null,
		state: UF2State.Empty,
	}
};

let customUF2Name = "Custom";

export function textState(theState: UF2State)
{
	switch (theState)
	{
		case UF2State.Empty: 		return "";
		case UF2State.Downloading: 	return "Downloading...";
		case UF2State.Failed: 		return "Failed";
		case UF2State.Downloaded: 	return "Ready";
		case UF2State.Custom: 		return `<i>${customUF2Name}</i>`;
	}
}

export function getFirmwareDataState():   UF2State { return uf2Storage.firmware.state; }
export function getBootloaderDataState(): UF2State { return uf2Storage.bootloader.state; }
export function allDownloaded(): boolean
{
	return  uf2Storage.firmware.state != UF2State.Custom &&
			uf2Storage.firmware.state == UF2State.Downloaded &&
			uf2Storage.bootloader.state == UF2State.Downloaded;
}

export function shouldWarn(): boolean
{
	return  uf2Storage.firmware.state == UF2State.Custom ||
			uf2Storage.firmware.state == UF2State.Downloading ||
			uf2Storage.bootloader.state == UF2State.Downloading;
}

export function anyErrors(): boolean
{
	return (
		uf2Storage.firmware.state != UF2State.Custom && (
			uf2Storage.firmware.state == UF2State.Failed ||
			uf2Storage.bootloader.state == UF2State.Failed
		));
}

let uiUpdateFunc = null;
let updateProgress = null;
let updateMaxProgress = null;

export function setUiUpdate(v: Function, p: Function, mp: Function) { uiUpdateFunc = v; updateProgress = p; updateMaxProgress = mp; }

function uiUpdate()
{
	if (uiUpdateFunc) uiUpdateFunc();
}

export function customUF2(ev: DragEvent)
{
	ev.preventDefault();
	let file = ev.dataTransfer.files[0];
	if (!file.name.endsWith(".uf2")) return;
	
	let reader = new FileReader();
	
	reader.onload = () => 
	{
		parseUF2(reader.result as ArrayBuffer, uf2Storage.firmware);
		uf2Storage.firmware.state = UF2State.Custom;
		uiUpdate();
		console.log(reader.result);
	}
	reader.readAsArrayBuffer(file);
	
	customUF2Name = file.name;
}

export async function resetUF2data()
{
	uf2Storage.bootloader.data = null;
	uf2Storage.firmware.data = null;
}

export async function getAllUF2s(model: string)
{
	getUF2Data(model, uf2Storage.bootloader, true);
	getUF2Data(model, uf2Storage.firmware);
	uiUpdate();
}

let waitBeforeRetry = false;

async function getUF2Data(model: string, target: UF2StorageItem, isBootloader: boolean = false)
{
	if (waitBeforeRetry || target.data !== null) return;
	
	target.state = UF2State.Downloading;
	uiUpdate();
	
	let maybeBootloader = (isBootloader) ? "/bootloader" : "";
	let response;
	try
	{
		response = await fetch(`https://config.mididobrynya.com/firmware/${model}${maybeBootloader}/latest/`, {
			mode: 'cors'
		});
		
		console.warn(response.status);
		
		if (response.status === 200)
		{
			parseUF2(await response.arrayBuffer(), target);
			target.state = UF2State.Downloaded;
			uiUpdate();
		} else if (response.status === 503) {
			if (response.headers.get("retry-after"))
			{
				let retryAfter = parseInt(response.headers.get("retry-after"));
				waitBeforeRetry = true;
				console.warn("We should retry after ", retryAfter );
				setTimeout(
					()=>waitBeforeRetry = false, retryAfter * 1000);
			}
		}
	} catch(e) {
		console.log(e);
		waitBeforeRetry = true;
		setTimeout(()=>waitBeforeRetry = false, 30000);
		target.data = null;
		target.state = UF2State.Failed;
		uiUpdate();
	}
}

// async function burnBL()
// {
// 	burnUF2(uf2bl);
// }
// 
// async function burnFW()
// {
// 	burnUF2(uf2);
// }

async function burn(target: UF2StorageItem)
{
	if (!target.data || (target.state != UF2State.Downloaded && target.state != UF2State.Custom)) return;
	
	updateMaxProgress(target.data.length - 1);
	
	let progress = 0;
	
	for (let chunk of target.data)
	{
//		let uf2Block = uf2Now[i];
		updateProgress(progress++);
		let pageAddress = new Uint32Array(1);
		pageAddress[0] = chunk.address;
		let requestArray = new Uint8Array([...new Uint8Array(pageAddress.buffer,0,4), ...chunk.data]);
			
		await writeUF2Data(requestArray); // oh god.
	}
	
	exitBootloader();
	resetUF2data();
}

export async function burnBootloader() { burn(uf2Storage.bootloader); }
export async function burnFirmware() { burn(uf2Storage.firmware); }

function parseUF2(arrayBuffer: ArrayBuffer, target: UF2StorageItem)
{
	target.data = []; // just in case
	
	let arr8 = new Uint8Array(arrayBuffer);
	
	const dataOffset = 32;
	
	let noFamilyID = false;

	for (let i=0; i<arr8.length; i+=512)
	{
		let block32 = new Uint32Array(arr8.buffer, i, 512 / 4);
		
		if (
			block32[0]   != 0x0A324655 || // magic number 1
			block32[1]	 != 0x9E5D5157 || // magic number 2
			(block32[7]  != 0x68ED2B88 && block32[7] != 0x0) || // family ID
			block32[5]   >= block32[6] || // block out of bounds
			block32[4]   == 0		   || // zero length of data
			block32[4]   >  475		   || // incorrect length of data
			block32[127] != 0x0AB16F30	  // magic number 3 (final)
		)
		{
			throw `Error in UF2 file at offset ${i}`;
		}
		
		noFamilyID ||= (block32[7] == 0); // warn if there is no family ID
		
		let lengthOfData = block32[4];
		
		if (lengthOfData != 256) console.warn(`Data length is ${lengthOfData} at offset ${i}`);
		
		let pushData = {
			address: block32[3],
			data: new Uint8Array(arr8.buffer, i+dataOffset, lengthOfData)
		};
		
		target.data.push(pushData);
	}
	
	if (noFamilyID) console.warn("No family ID present in UF2");
}