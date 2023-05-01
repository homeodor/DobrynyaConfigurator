import { dispatchEditorClose, dispatchNewInterfaceClose } from 'event_helpers';
import type { Patch, BranchInfo } from 'types_patch'
import { getPatch, sortPatchList, fixAndExpandPatch } from 'data_utils'
import { SysExCommand, SysExStatus } from 'midi_utils'
import type { Model } from 'device'
import BSON from 'bson';
import { sysExFileAndDo } from 'midi_core';
import { deepClone } from 'basic';
import { patchTemplates } from 'patchtemplates';
import { createPadsIfAbsent } from 'data_utils';
import { Hand } from './types';
import type { PatchInfoItem } from 'types_patch';
import { sysExFilenameAndDo, sysExAndDo } from 'midi_core';
import { get, writable } from 'svelte/store';
import { getDevice } from 'device';

import Confirm from '../widgets/Confirm.svelte'

export const patchList = writable([]);
export const patchListHasBeenLoaded = writable(false);

export interface CurrentPatchInfo
{
	data: Patch,
	originalState: Patch,
	name: string,
	value: string,
	isSaved: boolean,
};

export interface CurrentEditorState
{
	hand: Hand,
	bank: number,
};

export const currentPatch: CurrentPatchInfo = 
{
	data: undefined,
	originalState: undefined,
	name: "",
	value: "",
	isSaved: true,
};

export const editorState: CurrentEditorState =
{
	hand: Hand.LEFT,
	bank: 0,
};

export function getCurrentPatch(): Patch { return currentPatch.data; }
export function setCurrentPatchName(v: string) { currentPatch.value = currentPatch.name = v; }

export function patchAction (data: Patch, filename: string)
{
	currentPatch.data = data; // new Proxy (data, markUnsaved);

	currentPatch.originalState = deepClone(currentPatch.data);
	fixAndExpandPatch(currentPatch.data, getDevice().model);
	
	currentPatch.name = filename;
	editorState.hand = Hand.LEFT;
	currentPatch.isSaved = true;
	
	let patchListNow: PatchInfoItem[] = get(patchList);
	patchListNow.forEach((v,k,a)=>{a[k].isThePatch = (v.name === currentPatch.name)});
	patchList.set(patchListNow);
};

export async function loadCurrentPatch()
{
	let patchListNow: PatchInfoItem[] = get(patchList);
	
	for (let patch of patchListNow)
	{
		if (patch.isThePatch)
		{
			await sysExFilenameAndDo(SysExCommand.READPATCH, patch.name, patchAction);	
			return;
		}
	}

	console.warn("No patch has been selected, so the first was loaded");
	await sysExFilenameAndDo(SysExCommand.READPATCH, patchListNow[0].name, patchAction); // default	
}

export async function patchToDevice(sysExCommand: SysExCommand, uploadPatchName: string, handler: Function, patchData: Patch)
{
	await getPatch(patchData, getDevice().model, async ()=>
	{
		let filedata = BSON.serialize(patchData); // Uint8Array
		await sysExFileAndDo(sysExCommand, uploadPatchName, filedata, handler);
		dispatchNewInterfaceClose();
	});
}

	export async function newPatch(
		cleanSlate: boolean, 									// use an empty template for patch, or the current data?
		patternFunction: Function | null,							// generate random pattern (or just shift hues)
		uploadPatchName: string, 								// the filename
		loadPatchAfter: boolean = true,							// load the patch afterwards?
		uiSuccessHandler: Function,								// function that gives the user feedback on success
		patchData: Patch | null = null							// the patch data. Null will make it clone the currentPatch
	)
	{
		dispatchEditorClose();
		
		const confirmDiscard = new Confirm({
		  target: document.getElementById("confirmplaceholder"),
		  props: { html: 'You have unsaved changes. Do you want to discard them and open another patch?', okText: "Discard" },
		});
		
		console.log(confirmDiscard);
		
		if (patchData === currentPatch.data && !currentPatch.isSaved && !await confirmDiscard.props.confirm())
			return;
		
		if (cleanSlate)
		{
			patchData = deepClone(patchTemplates[getDevice().model.code]);
			createPadsIfAbsent(patchData.padbanks[0][0]);
		} else {
			if (patchData === null)
			{
				patchData = deepClone(currentPatch.data);
			}
		}
		
		uploadPatchName += ".dbrpatch";
		
		if (patternFunction !== null) patternFunction(patchData.info.pattern);
		
		let sysExCommand: SysExCommand = SysExCommand.WRITEPATCH;
		
		let handler: Function = () => //(data: any, filename: string) =>
		{
//			isSaved = loadPatchAfter;

			let patchListNow: PatchInfoItem[] = get(patchList);
			
			if (loadPatchAfter)
			{
				currentPatch.data = patchData;
				currentPatch.value = currentPatch.name = uploadPatchName;
				patchListNow.forEach((_,k,a)=>{a[k].isThePatch = false});
			}
			
			patchListNow.push({name: uploadPatchName, isThePatch: loadPatchAfter, info: deepClone(patchData.info)});
			
			uiSuccessHandler(patchListNow[patchListNow.length - 1]); // maybe do something in the UI, pass the variable then
			
			patchListNow.sort(sortPatchList);
			
			patchList.set(patchListNow);		
		}
		
		await patchToDevice(sysExCommand, uploadPatchName, handler, patchData);
	}
	
	export async function fillPatchList()
	{
		await sysExAndDo(SysExCommand.PATCHLIST, (d: PatchInfoItem[])=>{
			patchList.set(d);
		});
	}
	
	export async function loadPatchInfo()
	{
		patchListHasBeenLoaded.set(false);
		
		let recoverFromError = false;
		
		let patchListNow: PatchInfoItem[] = get(patchList);
		
		do
		{
			recoverFromError = false;
			
			for (let patch of patchListNow)
			{
				try
				{
					if (patch.name == "__tmpupl.dbrpatch" || patch.name == "__tmpcpy.dbrpatch")
					{
						console.warn(`Cleaning up the mess: deleting ${patch.name}`);
						await sysExFilenameAndDo(SysExCommand.DELETEPATCH, patch.name, ()=>{});
						patchListNow = patchListNow.filter(v=>{return v.name != patch.name});
						recoverFromError = true;
						break;
					} else
						await sysExFilenameAndDo(SysExCommand.GETPATCHINFO, patch.name, (pinfo: BranchInfo /*, pname: string*/)=>patch.info = pinfo, 700);
				} catch(e) {
					if (e.status == SysExStatus.NO_ENTITY)
					{
						console.error(`File ${patch.name} failed miserably with unreachable data. Will try to recover...`);
						patchListNow = patchListNow.filter(v=>{return v.name != patch.name});
						recoverFromError = true;
						break;					
					} else throw e;
				}
			}
		} while (recoverFromError)
		
		patchList.set(patchListNow);
			
		patchListHasBeenLoaded.set(true);
	}