<script lang="ts">
	import { tick } from 'svelte';
	import * as BSON from 'bson'
	
	import { isMacLike } from './stores';
	
	import { models } from './device';
	import { quickCustom } from './events'
		
	import type { Patch } from './types_patch';
	import type SectionEditor from './SectionEditor.svelte';
		
	import { sysExFilenameAndDo, sysExTwoFilenamesAndDo } from './midi';
	import { SysExCommand } from './midi_utils';
	
	import iconTune from '../i/patchtune.svg'
	import iconDuplicate from '../i/patchduplicate.svg'
	import iconDelete from '../i/patchdelete.svg'
	import iconDownload from '../i/patchdownload.svg'
	
	import Halp from './widgets/Halp.svelte';
	import RenameInline from './widgets/RenameInline.svelte';
	import Confirm from './widgets/Confirm.svelte';
		
	import { NameFailsBecause, checkIfPatchNameIsValid, nbsp, getNewPatchName } from './editor'
	import { sortPatchList, patchAsFileFromData, getPatch } from './data_utils';
	import { hexToCSS } from './colour_utils'
	import { sysExDiskMode, sysExBootloader } from './midi'
	import type { PatchInfoItem } from './types_patch'
	import type { StatusResult } from './types'

	export let patchesInfo: PatchInfoItem[];
	export let patchesInfoHasBeenLoaded: boolean; // maybe indicate it is still loading smh?
	export let editor: SectionEditor;
	export let changeSection: Function;
	export let device: StatusResult;
	export let isOnline: boolean;
	
	console.log(patchesInfo);
	
	async function tune(name: string, isThePatch: boolean, openDrawer: boolean = false)
	{
		if (isThePatch) changeSection("editor"); else await editor.selectPatch(name);
		if (openDrawer) quickCustom("drawer", {drawer:"patchsettings"});
	}
	
	
	let justUploadedName = "";
	
	async function getPatchData(name: string): Promise<Patch>
	{
		let result: Patch;
		await sysExFilenameAndDo(SysExCommand.READPATCH, name, (data: Patch)=>result=data);
		return result;
	}
	
	let confirmDuplicateOfCurrent: Confirm;
	let confirmDownloadOfCurrent: Confirm;
	
	function validatePatchNameSimple(name: string)
	{
		let result: NameFailsBecause = checkIfPatchNameIsValid(name, patchesInfo);
		console.log("RESULT", result);
		return result === NameFailsBecause.Nothing; // || result === NameFailsBecause.Exists; 
	}
	
	async function rename(name: string, isThePatch: boolean, event: CustomEvent)
	{
		let inlineElement = event.detail.inline;
		
		console.log("OK here we go");
		
		function ohJustFail()
		{
			event.detail.setValue(event.detail.prevValue);
			console.log("We just failed...");
		}
		
		let result = checkIfPatchNameIsValid(event.detail.value, patchesInfo);
		
		if (
			result  !== NameFailsBecause.Nothing
		) return ohJustFail();
		
		let newValue = `${event.detail.value.replace(nbsp," ").trim()}.dbrpatch`;
		
		try
		{
			await sysExTwoFilenamesAndDo(SysExCommand.RENAMEPATCH, name, newValue, ()=>{});
		} catch(e) {
			inlineElement.classList.remove("inline-success");
			inlineElement.classList.add("inline-fails");
			return ohJustFail();
		}
		
		inlineElement.classList.remove("inline-fails");
		inlineElement.classList.add("inline-success");
		
		patchesInfo.find(v=>{return v.name == name}).name = newValue;
		patchesInfo.sort(sortPatchList);
		
		if (isThePatch) editor.setCurrentPatchName(newValue);
		
		await tick();
		
		// inlineElement.scrollIntoView({block: "center", behavior: "smooth"});
		
	}
	
	async function getWithChangesOrNot(name: string, isThePatch: boolean, confirmDialog: Confirm): Promise<{ patchData: Patch, isCurrent: boolean }>
	{
		if (!(isThePatch && (editor.getIsSaved() || await confirmDialog.confirm())))
			return { patchData: await getPatchData(name), isCurrent: false };
		else
			return { patchData: null, isCurrent: true }; // patchData == null makes the newPatch function use currentPatch data
	}
	
	async function duplicate(name: string, isThePatch: boolean)
	{
		let { patchData } = await getWithChangesOrNot(name,isThePatch,confirmDuplicateOfCurrent);
		
		editor.newPatch(
			false,								// not a clean slate
			false,								// do not generate random pattern, shift hues
			getNewPatchName(patchesInfo, name), // get a name + Copy n
			false, 								// do not load afterwards
			async (patchInfo: PatchInfoItem)=>	// fix UI
			{
				justUploadedName = patchInfo.name;
				setTimeout(()=>justUploadedName="", 3500);
				await tick();
				patchList.querySelector(".uploaded-patch")?.scrollIntoView({block: "center", behavior: "smooth"});
			},
			patchData							// well, patch data
		);
		// if it is the current patch and it either had no changes,
		// or the user decides to push all changes to the duplicate,
		// we just get the editor data and write them to Dobrynya
	}
	
	async function download(name: string, isThePatch: boolean, isJson: boolean)
	{
		let { patchData } = await getWithChangesOrNot(name,isThePatch,confirmDownloadOfCurrent);
		
		if (patchData === null && isThePatch) patchData = editor.getCurrentPatch();
		
		let downloadAction = async ()=>
		{
			patchAsFileFromData(
				isJson ? JSON.stringify(patchData, null, 2) : BSON.serialize(patchData),
				name,
				isJson
			);
		};
		
		getPatch(patchData, device.model, downloadAction);
	}
	
	let confirmDeletePatch: Confirm;
	let fileToBeDeleted = "";
	
	async function deletePatch(name: string, isThePatch: boolean, element: EventTarget)
	{
		fileToBeDeleted = name;
		await tick();
		if (!await confirmDeletePatch.confirm()) { fileToBeDeleted = ""; return false; }
		
			// setTimeout(()=>{ patchEl.innerHTML = ""; }, 200);
		await sysExFilenameAndDo(SysExCommand.DELETEPATCH, name, ()=>
		{
			let patchEl = (element as HTMLButtonElement).closest(".patchlist-item");
			let patchH = patchEl.getBoundingClientRect().height;
			(patchEl as HTMLElement).style.setProperty('--computed-height', `${patchH}px`);
			patchEl.classList.add("deleted-patch");
			
			setTimeout(()=>{ 
				patchesInfo = patchesInfo.filter((v)=>{return v.name != name});
				patchEl.classList.remove("deleted-patch");
			}, 600);
			
			if (isThePatch)
			{
				editor.markSaved(); // the patch is gone, so whatever
				editor.selectPatch(patchesInfo.find(v=>{return v.name!=name}).name, true); // quietly load the patch if we deleted the current, making sure IT IS NOT THE CURRENT
			}
		});
		
		fileToBeDeleted = "";
	}
	
	function rebootToDisk(ev: MouseEvent)
	{
		if (ev.altKey) sysExBootloader(!ev.shiftKey); else sysExDiskMode();
	}
	
	function openNewUI()
	{
		quickCustom("opennewui", {});
		changeSection("editor");
	}
	
	let patchList: HTMLDivElement;
	let needToScroll = false;
	let currentPatchName = "";
	
	function getThisDobrynyaModel(mID: number)
	{
		let dbrIsLegacy = mID > 0xff;
		
		let dbrClassID = mID >> (dbrIsLegacy ? 8 : 4); // legacy patches have been using a 0xA0B formant, where A is class and B is model ID
		let dbrModelID = mID & 0xf;
		
		if (models?.[dbrClassID]?.[dbrModelID])
		{
			if (models[dbrClassID][dbrModelID].code == device.model.code)
				return "This is a legacy patch, but it still works fine."
			else
				return `This patch has been designed for MIDI Dobrynya ${models[dbrClassID][dbrModelID]}.`;
		}
		
		return "This patch has been designed for another Dobrynya.";
	}
	
	$:{
		if (patchesInfo) {
			let foundOrNot = patchesInfo.find(v=>{return v.isThePatch});
			if (foundOrNot) currentPatchName = foundOrNot.name; else console.warn("Did not find isThePatch");
		}
		
		let uploadedPatchElement: HTMLDivElement = patchList?.querySelector(".uploadedPatch");
		
		console.log(uploadedPatchElement);
		
		if (uploadedPatchElement && needToScroll)
		{
			needToScroll = false;
			uploadedPatchElement.scrollIntoView({block: "center", behavior: "smooth"});
		}
	}
	
</script>

<section id="tab-patches">
	<div style="margin-bottom:2rem" id="patchlist-diskmode"></div>
	
	<div>
		<button style="height:3em; vertical-align: bottom;" on:click={openNewUI}>New patch...</button>
		<button style="height:3em; vertical-align: bottom" on:click={rebootToDisk}>Disk mode <Halp>You may also manipulate your patches from the {#if $isMacLike }<span class="system-mac">Finder</span>{:else}<span class="system-win">Explorer</span>{/if}
			by switching Dobrynya to disk mode. It is especially useful for backing up your stuff! Don’t forget
			to safely disconnect the disk after you’re done (it is actually important).</Halp></button>
	</div>
	
	{#if !patchesInfoHasBeenLoaded}
	<p>Patches are still loading...</p>
	{/if}

	<div id="patchlist-patchlist" bind:this={patchList}>
	{#each patchesInfo as patch}
	{#if patch}
		<div class="patchlist-item" class:current-patch={patch.isThePatch} class:uploaded-patch={justUploadedName==patch.name}>
  		<div>
			<div class="patchlist-pattern patternpreview" on:click="{()=>tune(patch.name, patch.isThePatch)}">
			{#if patch.info.pattern}
			{#each patch.info.pattern as colour}
				<span data-colour="0" style="background-color: {hexToCSS(colour)}"></span>
			{/each}
			{/if}
			</div>
  		</div>
  		<div>
			<h3><RenameInline disabled={!isOnline} on:click="{()=>tune(patch.name, patch.isThePatch)}" validatorFunction={validatePatchNameSimple} on:input="{(ev)=>rename(patch.name, patch.isThePatch, ev)}" value={patch.name.replace(".dbrpatch","")} /></h3>
			<div class="patchlist-desc">{#if patch.info.desc}{patch.info.desc}{/if}</div>
			{#if patch.info.device != device.modelID}
				<div class="warn">{getThisDobrynyaModel(patch.info.device)} </div>
			{/if}
  		</div>
  		<div class="patchlist-actions">
			<button disabled={!isOnline} on:click="{()=>tune(patch.name, patch.isThePatch, true)}"><img alt="Tune" src="{iconTune}" ></button>
			<button disabled={!isOnline} on:click="{()=>duplicate(patch.name, patch.isThePatch)}"><img alt="Duplicate" src="{iconDuplicate}" /></button>
			<button disabled={!isOnline} on:click="{(ev)=>download(patch.name, patch.isThePatch, ev.altKey)}"><img alt="Download" src="{iconDownload}" /></button>
			<button disabled={!isOnline || patchesInfo.length <= 1} on:click="{(ev)=>deletePatch(patch.name, patch.isThePatch, ev.target)}" class="dangerous"><img alt="Delete" src="{iconDelete}" /></button>
  		</div>
		</div>
	{/if}
	{/each}
	</div>
</section>

<Confirm bind:this={confirmDuplicateOfCurrent} okText="Write changes" cancelText="Copy original">
	<p>You are trying to duplicate the current patch that has unsaved changes. Do you want to write those changes to
	the file that will be created?</p>
</Confirm>
<Confirm bind:this={confirmDownloadOfCurrent} okText="With changes" cancelText="Original">
	<p>You are trying to download the current patch that has unsaved changes. Do you want to download the file
		with these changes, or the original patch?</p>
</Confirm>
<Confirm bind:this={confirmDeletePatch} okText="Delete">
	<p>Do you want to delete {fileToBeDeleted}?</p>
	{#if currentPatchName == fileToBeDeleted}
	<p>This is your current patch{#if !editor.getIsSaved()}, and you have unsaved changes{/if}.</p>
	{/if}
</Confirm>