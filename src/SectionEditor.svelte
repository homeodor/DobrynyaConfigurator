<script lang="ts">
	import { onMount, createEventDispatcher, tick } from 'svelte';
	import * as BSON from 'bson'
	
	import { openPatternEditor } from './events'
	import type { InvokeControlEventData } from './events'
	import { createPadsIfAbsent } from './data_utils'
 	
	import { sysExFilenameAndDo, sysExFileAndDo, sysExLockPatchSwitching, sysExBank, sysExColourReset } from './midi'
	import { SysExCommand, currentKeyInfoToKey } from './midi_utils';
	import { importantFactorySettings } from './settings_utils'
	import type { MidiResult } from './midi_utils';
	import { patchTemplates } from './patchtemplates';
	import ControlEditor from './ControlEditor.svelte'
	
	import Pads from './editor/Pads.svelte'
	import Encoder from './editor/Encoder.svelte'
	
	import DrawerBank from './DrawerBank.svelte'
	import DrawerPatch from './DrawerPatch.svelte'
	import DrawerTemplate from './DrawerTemplate.svelte'
	import DrawerColour from './DrawerColour.svelte'
	
	import ButtonUpload from './widgets/ButtonUpload.svelte';
	import Confirm from './widgets/Confirm.svelte';
	import Alert from './widgets/Alert.svelte';
	import GotIt from './widgets/GotIt.svelte'
	
	import { Control, Hand } from './types';
	import { NameFailsBecause, checkIfPatchNameIsValid, getNewPatchName } from './editor';
	import { deepClone, isSame } from './basic';
	import { getPatch, sortPatchList, fixAndExpandPatch } from './data_utils'
	import { ExpanderSanizer } from './data_expandsanize'
	
	import type { DeviceOrBankValue, StatusResult } from './types'
	import type { Patch, PatchInfoItem } from './types_patch'
	import { ColourPaintLayer, randomPattern, hueShiftPattern, hexToCSS } from './colour_utils'
	import { CaseColour } from './device';
	
	export let deviceLevelVelocity: number;
	export let deviceLevelChannel: number;
	export let openSection: string;
//	export let patchList: PatchListItem[];
	export let patchesInfo: PatchInfoItem[];
	export let device: StatusResult;
	export let isOnline: boolean;
	export function getIsSaved(): boolean { return isSaved }
	export function setCurrentPatchName(v: string) { currentPatchValue = currentPatchName = v; console.log("Current patch name set to ", currentPatchName) }
	
	let isSaved: boolean = true;
	
	let currentPatch: Patch;
	export function getCurrentPatch() { return currentPatch; }
	let currentPatchOriginalState: Patch;
	let currentPatchName: string;
	let currentHand: Hand = Hand.LEFT;
	let currentBank: number = 0;

	let numberOfActiveBanks = 0;

	let controlEditor: ControlEditor;
	
	let currentPatchValue: string;
	
	let newInterfaceOpen: boolean;
	let newPatchNameIsValid: NameFailsBecause = NameFailsBecause.Empty;
	let newPatchName = "";
	let useCleanSlate = "no";
	let useCleanSlatePrev = "no";
	let nameHasBeenChanged = false;
	
	let dispatch = createEventDispatcher();
	
	let drawer = '';
	
	let colourPaintDrawer: DrawerColour;
	let colourPaintMode: ColourPaintLayer = ColourPaintLayer.Off;
	let colourPaintShowBank: boolean = true;
	let paintData: InvokeControlEventData;

	const drawers = 
	[
		{ id: 'banktemplates', 	title: "Bank templates" },
		{ id: 'banksettings', 	title: "Bank settings" },					
		{ id: 'colourpaint', 	title: "Colour paint" },
		{ id: 'patchsettings', 	title: "Patch settings" },
	];
	
	onMount(() => {
	// @ts-ignore
		window.controlEditor = controlEditor;
		console.log(device);
	});
	
	function patchAction (data: Patch, filename: string)
	{
		console.log(data, filename);
		currentPatch = data; // new Proxy (data, markUnsaved);
	// @ts-ignore
		window.currentPatch = currentPatch;
		currentPatchOriginalState = deepClone(currentPatch);
		
		fixAndExpandPatch(currentPatch, device.model);
		
		currentPatchName = filename;
		currentHand = Hand.LEFT;
		isSaved = true;
		
		
		patchesInfo.forEach((v,k,a)=>{a[k].isThePatch = (v.name === currentPatchName)});
		patchesInfo = patchesInfo; // svelte
	};
	
	let confirmDiscard: Confirm;
	
	let patchSelector: HTMLSelectElement;
	
	export async function selectPatch(ev: Event | CustomEvent | string, quiet: boolean = false)
	{
		// @ts-ignore
		let patchNameRequested = (typeof ev === "string") ? ev : (ev.detail?.name ?? ev.target.value);
			// use the value directly if it is a string, otherwise either take the detail.name from CustomEvent or target.value from Select event
		closeEditor();
		
		if (!isSaved && !await confirmDiscard.confirm())
		{
			if (typeof ev !== "string") ev.preventDefault();
			currentPatchValue = currentPatchName;
			return false;
		} else {
			currentPatchValue = patchNameRequested;
		}
		
		if (patchSelector) patchSelector.value = patchNameRequested;
		
		await sysExFilenameAndDo(SysExCommand.READPATCH, patchNameRequested, (data: Patch, filename: string)=>
		{
			patchAction(data,filename);
			if (!quiet) dispatch('section', {section: "editor"});
		});	
	}
	
	export async function loadCurrentPatch()
	{
		for (let patch of patchesInfo)
		{
			if (patch.isThePatch)
			{
				await sysExFilenameAndDo(SysExCommand.READPATCH, patch.name, patchAction);	
				return;
			}
		}
		
		console.warn("No patch has been selected, so the first was loaded");
		await sysExFilenameAndDo(SysExCommand.READPATCH, patchesInfo[0].name, patchAction); // default	
	}
	
	let uploadButton: ButtonUpload;
	
	function openNewUI(force: boolean = false)
	{
		newPatchNameIsValid = checkIfPatchNameIsValid(newPatchName,patchesInfo);
		newInterfaceOpen = force ? true : !newInterfaceOpen;
	}
	
	async function patchToDevice(sysExCommand: SysExCommand, uploadPatchName: string, handler: Function, patchData: Patch = currentPatch)
	{
		// currentPatch = sanizePatch(currentPatch, device.model);
		getPatch(patchData, device.model, async ()=>
		{
			let filedata = BSON.serialize(patchData); // Uint8Array
			await sysExFileAndDo(sysExCommand, uploadPatchName, filedata, handler);
			newInterfaceOpen = false;
		});
	}
	
	function uploadThePatch()
	{
		patchToDevice(
			SysExCommand.OVERWRITEPATCH,
			currentPatchName,
			() => //(data: any, filename: string) =>
			{
				if (drawer === "colourpaint") colourPaintDrawer.updateDevicePreview(true); // force device to redraw
				uploadButton.ok();
				isSaved = true;
			}
		);
	}

	export async function newPatch(
		cleanSlate: boolean, 									// use an empty template for patch, or the current data?
		generateRandomPattern: boolean,							// generate random pattern (or just shift hues)
		uploadPatchName: string, 								// the filename
		loadPatchAfter: boolean = true,							// load the patch afterwards?
		uiSuccessHandler: Function = ()=>{ uploadButton.ok() },	// function that gives the user feedback on success
		patchData: Patch | null = null							// the patch data. Null will make it clone the currentPatch
	)
	{
		closeEditor();
		
		if (patchData === currentPatch && !isSaved && !await confirmDiscard.confirm())
			return;
		
		if (cleanSlate)
		{
			patchData = deepClone(patchTemplates[device.model.code]);
			createPadsIfAbsent(patchData.padbanks[0][0]);
		} else {
			if (patchData === null)
			{
				patchData = deepClone(currentPatch);
			}
		}
		
		uploadPatchName += ".dbrpatch";
		
		if (generateRandomPattern)
			randomPattern(patchData.info.pattern);
		else
			hueShiftPattern(patchData.info.pattern);
		
		let sysExCommand: SysExCommand = SysExCommand.WRITEPATCH;
		
		let handler: Function = () => //(data: any, filename: string) =>
		{
//			isSaved = loadPatchAfter;
			
			if (loadPatchAfter)
			{
				currentPatch = patchData;
				currentPatchValue = currentPatchName = uploadPatchName;
				patchesInfo.forEach((_,k,a)=>{a[k].isThePatch = false});
			}
			
			patchesInfo.push({name: uploadPatchName, isThePatch: loadPatchAfter, info: deepClone(patchData.info)});
			
			uiSuccessHandler(patchesInfo[patchesInfo.length - 1]); // maybe do something in the UI, pass the variable then
			
			patchesInfo.sort(sortPatchList);
			
			patchesInfo = patchesInfo;			
		}
		
		patchToDevice(sysExCommand, uploadPatchName, handler, patchData);
	}
	
	function checkIfNewPatchNameIsValid(ev: any)
	{
		nameHasBeenChanged = true;
		newPatchNameIsValid = checkIfPatchNameIsValid(ev.currentTarget.value.trim(), patchesInfo);
	}
	
	async function updateNewPatchName()
	{
		if (nameHasBeenChanged) return;
		newPatchName = getNewPatchName(patchesInfo, useCleanSlate === "no" ? currentPatchName : null);
		nameHasBeenChanged = false;
	}
	
	let editorAlive = false;
	let editorData = null;
	let editorControlKind: Control = Control.Generic;
	let editorControlNumber: number = -1;
	
	
	let theOutline: HTMLDivElement;
	let editorBigRadius = 0;
	
	// function waitForControlEditor()
	// {
	// 	return new Promise((resolve) =>
	// 	{
	// 		while (controlEditor?.$set === undefined);
	// 		resolve(true);
	// 	});
	// }
	
	function selectBankFromEvent(ev: CustomEvent)
	{
		console.log(ev.detail)
		currentHand = ev.detail.hand as Hand;
		selectBank(ev.detail.bankNo + (ev.detail.isShift ? 4 : 0), false);
	}
	
	async function selectBank(no: number, sendSysEx: boolean = true)
	{
		if (currentBank == no) return;
		ExpanderSanizer.latchAll();
		if (sendSysEx) sysExBank(currentHand, (no > 3), no % 4);
		currentBank = no;
	}
	
	async function closeEditor()
	{
		const editorEl = document.getElementById("controleditor");
		
		if (!editorEl) return; // no editor === no problem
		
		editorEl.style.clipPath = editorEl.style.clipPath.replace(`${editorBigRadius}px`,`1px`);
		setTimeout(() => {
			currentPatch = currentPatch; // uh, svelte
			editorAlive = false;
			editorBigRadius = 0;
			editorData = null;
		}, 350);
	}
	
	async function openEditor(element: HTMLElement, kind: Control, i: number)
	{
		controlEditor?.sanizeNow();
		
		editorData = true;// = true;
		editorControlKind = kind;
		editorControlNumber = i;
		
		await tick(); // wait for the editor...
		
		const editorEl = document.getElementById("controleditor");
		
		const outlineRect = theOutline.getBoundingClientRect();
		const targetRect = element.getBoundingClientRect();
		
		const relY: number = targetRect.top - outlineRect.top;
		const relX: number = targetRect.left - outlineRect.left;
		const relR: number = Math.round(targetRect.width / 2);
		
		const circleX: number = Math.round(relX + relR);
		const circleY: number = Math.round(relY + relR);
		
		let bigR = Math.max.apply(null, 
		[
			Math.round(Math.sqrt(circleX ** 2 + circleY ** 2)),
			Math.round(Math.sqrt((outlineRect.width - circleX) ** 2 + circleY ** 2)),
			Math.round(Math.sqrt(circleX ** 2 + (outlineRect.height - circleY) ** 2)),
			Math.round(Math.sqrt((outlineRect.width - circleX) ** 2 + (outlineRect.height - circleY) ** 2)),
		]) + 500; // finding the longest distance from the center of the circle to the edge of the outline...
		
//		if (bigR + relX > bigR + relY) bigR += relX; else bigR += relY;
		
//		bigR = Math.ceil(bigR) + 500;
		
		editorAlive = true;
		editorBigRadius = bigR;
		
		editorEl.style.clipPath = `circle(1px at ${circleX}px ${circleY}px`;
		setTimeout(() => { editorEl.style.clipPath = `circle(${bigR}px at ${circleX}px ${circleY}px`; }, 5);
	}
	
	
	function openEditorForPad(ev: CustomEvent)
	{
		openEditor(
			ev.detail.target as HTMLElement, 
			ev.detail.controlKind as Control, 
			ev.detail.controlNo as number
		);
	}
	
	let globalChannel:  DeviceOrBankValue = { value: 0, isDeviceLevel: true };
	let globalVelocity: DeviceOrBankValue = { value: 0, isDeviceLevel: true };
	
	$:
	{		
		numberOfActiveBanks = 0;

		if (currentPatch)
		{
			for (let bank of currentPatch?.padbanks[currentHand])
			{
				if (!isSame(bank, {})) numberOfActiveBanks++;
			}
		}
		
		if (patchesInfo && currentPatch) patchesInfo.find(v=>{return v.isThePatch}).info = deepClone(currentPatch.info);
		
		if (
			!newInterfaceOpen || // if it is safe to update the name, because the interface is closed, or
			useCleanSlate != useCleanSlatePrev // if the user changed the useCleanSlate param
		)
		{
			updateNewPatchName();
			useCleanSlatePrev = useCleanSlate;
		}
		
		currentPatchValue = currentPatchName;
		
		if (currentPatch)
		{
//			deviceLevelVelocity
			if (currentPatch?.padbanks?.[currentHand][currentBank]?.bank?.vel !== undefined)
			{
				globalVelocity.value = currentPatch?.padbanks?.[currentHand][currentBank].bank.vel;
				globalVelocity.isDeviceLevel = false;
			} else {
				globalVelocity.value = deviceLevelVelocity;
				globalVelocity.isDeviceLevel = true;
			}

			
			if (currentPatch?.padbanks?.[currentHand][currentBank]?.bank?.ch !== undefined && currentPatch?.padbanks?.[currentHand][currentBank].bank.ch !== -1)
			{
				globalChannel.value = currentPatch?.padbanks?.[currentHand][currentBank].bank.ch;
				globalChannel.isDeviceLevel = false;
			} else {
				globalChannel.value = deviceLevelChannel;
				globalChannel.isDeviceLevel = true;
			}
			
			if (!("encoders" in currentPatch))
			{
				currentPatch.encoders = [];
				for (let i=0; i<device.model.encoders; i++) currentPatch.encoders.push({});
			}
		}
	}
	
	function bodyClick(ev: Event)
	{
		if (
			!editorData ||
			document.querySelector("dialog[open]") ||
			(ev.target as HTMLElement).closest(".dobrynya-outline, .donotcloseeditor")
		) return true;
		
		closeEditor();
	}
	
	let checkPatchEqualTimeout = null;
	
	function clearCheckPatchEqualTimeout()
	{
		if (!checkPatchEqualTimeout) return;
		clearTimeout(checkPatchEqualTimeout);
		checkPatchEqualTimeout = null;
	}
	
	export function markSaved()
	{
		isSaved = true;
		sysExLockPatchSwitching(false);
	}
	
	function markUnsaved()
	{
		clearCheckPatchEqualTimeout()
		checkPatchEqualTimeout = setTimeout(()=>
		{
			if (isSame(currentPatch, currentPatchOriginalState)) markUnsaved();
			clearCheckPatchEqualTimeout();
		}, 300);
		
		isSaved = false;
		sysExLockPatchSwitching(true);
	}
	
	function setDrawer (d: string)
	{
		if (drawer == "colourpaint") sysExColourReset(); // if current drawer is colourpaint, reset colour preview
		drawer = (d == drawer) ? "" : d;
		if (drawer == "colourpaint") closeEditor(); // if the selected drawer is colourpaint, close the editor	
	}
	
	function ondrawer(ev: CustomEvent) { setDrawer(ev.detail.drawer); }
	
	//@ts-ignore
//	window.ms = markSaved;
	//@ts-ignore
	document.body.addEventListener("keydown", (ev)=>{if (ev.key === "a") markSaved()})
	
	let alertPatchLock: Alert;
	
	async function alertAboutPatchLock() { await alertPatchLock.confirm(); }
	

	
	function handleSysExPush(ev: CustomEvent)
	{
		let midiResult: MidiResult = ev.detail.data;
		
		switch (midiResult.command)
		{
			case SysExCommand.READPATCH: patchAction(midiResult.data, midiResult.filename); break;
		}
	}
	
	
</script>

<svelte:body on:click={bodyClick} on:patchchange={markUnsaved} on:patchlock={alertAboutPatchLock} on:sysexpush={handleSysExPush} on:drawer="{ondrawer}" on:invokebank={selectBankFromEvent} on:selectpatch={selectPatch} on:opennewui={()=>openNewUI(true)}></svelte:body>

<!-- export function deviceRefusedToChangePatches() { quickNormal("patchlock"); }
export function invokeControl(kind: number, no: number) { quickCustom("invoke", {controlKind: kind, controlNo: no}); }
export function pushFromSysEx(data: MidiResult) { quickCustom('sysexpush', { data: data }) } -->

{#if currentPatch && openSection == "editor"}
<section id="tab-config">
	
	<GotIt cookieName="editorworks">
		No changes to the patch apply instantly. Press “Upload to the device” to apply the changes and try them in action!
		A red dot <span class="reddot">●</span> will suggest you’ve got unsaved changes.
	</GotIt>
				
	<div id="toolbar-top" class="donotcloseeditor">
		<div class="patchlist-pattern patternpreview" style="display: inline-flex; width: 2.5rem; height: 2.5rem; vertical-align: middle; position: relative; top: -0.11rem;">
		{#if currentPatch.info.pattern}
		{#each currentPatch.info.pattern as colour}
			<span data-colour="0" style="background-color: {hexToCSS(colour)}" on:click={openPatternEditor}></span>
		{/each}
		{/if}
		</div>
		<select bind:this={patchSelector} disabled={!isOnline } id="patchselector" on:input={selectPatch} value={currentPatchValue} style="height:2.5rem">
		{#each patchesInfo as patch}
			<option value="{patch.name}">{patch.name.replace(".dbrpatch","")}</option>
		{/each}
		</select>
		<ButtonUpload disabled={!isOnline} on:click="{()=>uploadThePatch()}" {isSaved} bind:this={uploadButton}>Upload to device</ButtonUpload>
		<button disabled={!isOnline} on:click="{()=>openNewUI()}">New...</button>

	</div>
	{#if newInterfaceOpen}
	<div class="drawerwrapper donotcloseeditor" id="dw-wrapper-newpatch">
		<fieldset id="new-patch" class="drawerlike">
			<legend>New patch</legend>
			<h3>Name</h3>
			<input type="text" on:input={checkIfNewPatchNameIsValid} bind:value={newPatchName} class:invalid={newPatchNameIsValid != NameFailsBecause.Empty && newPatchNameIsValid != NameFailsBecause.Nothing} />
			
			{#if newPatchNameIsValid == NameFailsBecause.BadCharacters}<p class="explain warn">The patch name has forbidden characters.</p>{/if}
			{#if newPatchNameIsValid == NameFailsBecause.TooLong}<p class="explain warn">The patch name is too long.</p>{/if}
			{#if newPatchNameIsValid == NameFailsBecause.Dot}<p class="explain warn">The patch name cannot start or end with a dot.</p>{/if}
			{#if newPatchNameIsValid == NameFailsBecause.Exists}<p class="explain warn">A patch with the same name exists.</p>{/if}
			
			<p class="explain">Names may only contain English letters, numbers, symbols allowed in filenames, and spaces. The name may be
				up to 50 characters long, and obviously shouldn’t be the same as existing patches.</p>
			
			<p>
				<label><input type="radio" bind:group={useCleanSlate} value="no" /> Duplicate from current</label><br />
				<label><input type="radio" bind:group={useCleanSlate} value="yes" /> Create an empty patch</label>
			</p>
			
			<p>
				<button on:click="{()=>{newPatch(useCleanSlate == 'yes', true, newPatchName)}}" disabled={!isOnline || newPatchNameIsValid != NameFailsBecause.Nothing}>New</button>
				<button on:click="{()=>{newInterfaceOpen = false}}">Close</button>
			</p>
			
		</fieldset>
	</div>
	{/if}
	
	<div class="bankselector donotcloseeditor">
		<div class="bsw-holder">
<!-- 					<p class="b">Banks</p> -->
			<ul class="bankswitcher" id="bsw-left">
				<li class:bsw-empty="{!(currentPatch.padbanks[0][0]?.pads?.length)}" class:sel="{currentBank == 0}" on:click="{()=>selectBank(0)}">1</li>
				<li class:bsw-empty="{!(currentPatch.padbanks[0][1]?.pads?.length)}" class:sel="{currentBank == 1}" on:click="{()=>selectBank(1)}">2</li>
				<li class:bsw-empty="{!(currentPatch.padbanks[0][2]?.pads?.length)}" class:sel="{currentBank == 2}" on:click="{()=>selectBank(2)}">3</li>
				<li class:bsw-empty="{!(currentPatch.padbanks[0][3]?.pads?.length)}" class:sel="{currentBank == 3}" on:click="{()=>selectBank(3)}">4</li>
			</ul>
			<ul class="bankswitcher" id="bsw-shift">
				<li class:bsw-empty="{!(currentPatch.padbanks[0][4]?.pads?.length)}" class:sel="{currentBank == 4}" on:click="{()=>selectBank(4)}">-1</li>
				<li class:bsw-empty="{!(currentPatch.padbanks[0][5]?.pads?.length)}" class:sel="{currentBank == 5}" on:click="{()=>selectBank(5)}">-2</li>
				<li class:bsw-empty="{!(currentPatch.padbanks[0][6]?.pads?.length)}" class:sel="{currentBank == 6}" on:click="{()=>selectBank(6)}">-3</li>
				<li class:bsw-empty="{!(currentPatch.padbanks[0][7]?.pads?.length)}" class:sel="{currentBank == 7}" on:click="{()=>selectBank(7)}">-4</li>
			</ul>
			<!-- <ul class="bankswitcher hh" id="bsw-right">
				<li>1</li>
				<li>2</li>
				<li>3</li>
				<li>4</li>
			</ul> -->
		</div>
	</div>

	<div id="drawerholder" class="donotcloseeditor" class:banktemplates={drawer=='banktemplates'} class:colourpaint={drawer=='colourpaint'} class:banksettings={drawer=='banksettings'} class:patchsettings={drawer=='patchsettings'}>
		<div id="drawerclick">
		{#each drawers as oneDrawer}
			<span class="unreal" class:sel={drawer === oneDrawer.id} on:click="{()=>setDrawer(oneDrawer.id)}">{oneDrawer.title}</span>
		{/each}
		</div>
		
		{#if drawer == "patchsettings"}
			<div class="drawerwrapper" id="dw-wrapper-patchsettings"><DrawerPatch {currentPatch} {currentPatchName} model={device.model} /></div>
		{/if}
		{#if drawer == "banksettings"}
			<div class="drawerwrapper" id="dw-wrapper-banksettings"><DrawerBank bind:currentBank={currentPatch.padbanks[currentHand][currentBank]} {deviceLevelChannel} /></div>
		{/if}
		{#if drawer == "colourpaint"}
			<div class="drawerwrapper" id="dw-wrapper-colourpaint"><DrawerColour bind:this={colourPaintDrawer} bind:colourPaintMode bind:colourPaintShowBank {paintData} bind:bank={currentPatch.padbanks[currentHand][currentBank]} bind:pattern={currentPatch.info.pattern} /></div>
		{/if}
		{#if drawer == "banktemplates"}
			<div class="drawerwrapper" id="dw-wrapper-banktemplates"><DrawerTemplate bind:currentBank={currentPatch.padbanks[currentHand][currentBank]} {numberOfActiveBanks} /></div>
		{/if}
		
		
		<div class="drawer" id="dw-paintcolour">

		</div>
	</div>
	
	<div id="bankdescriptor">
		{#if drawer == "colourpaint"}
		<i>Device is in colour preview mode</i>
		{:else}
		{#if !(currentPatch?.padbanks[currentHand][currentBank]?.pads?.length)}Bank is off.{/if}
		{/if}
	</div>

	<div class="dobrynya-outline" class:dark={importantFactorySettings.caseColour == CaseColour.Dark} class:gray={importantFactorySettings.caseColour == CaseColour.Gray} class:colourpaint={colourPaintMode != ColourPaintLayer.Off} id="dobrynya-outline-miniv2" bind:this={theOutline}>
		<div class="dobrynya-encoders" data-control-name="Encoder" data-control-type="encrotate">
			<Encoder on:click="{(ev)=>openEditor(ev.detail.encEl, Control.EncRotate, 0)}" controlNo={0} dataAll={currentPatch.encoders} />
			<Encoder on:click="{(ev)=>openEditor(ev.detail.encEl, Control.EncRotate, 1)}" controlNo={1} dataAll={currentPatch.encoders} />
			<Encoder on:click="{(ev)=>openEditor(ev.detail.encEl, Control.EncRotate, 2)}" controlNo={2} dataAll={currentPatch.encoders} />
			{#if device.model.code == "miniv2"}<Encoder on:click="{(ev)=>openEditor(ev.detail.encEl, Control.EncRotate, 3)}" controlNo={3} dataAll={currentPatch.encoders}  />{/if}
		</div>
	
		<Pads on:click={openEditorForPad} on:paint="{(ev)=>paintData=ev.detail}" bank={currentPatch?.padbanks?.[currentHand][currentBank]} pattern={currentPatch.info.pattern} {colourPaintMode} {colourPaintShowBank} />

		{#if editorData}
		<div id="controleditor" class="controleditor" class:dead={!editorAlive}>

			<ControlEditor on:close={closeEditor} {currentPatch} {currentBank} {currentHand} controlKind={editorControlKind} controlNumber={editorControlNumber} bind:this={controlEditor} {globalVelocity} {globalChannel} globalColours={currentPatch?.padbanks?.[currentHand][currentBank].bank?.colour} scaleIsOn={currentKeyInfoToKey(currentPatch?.padbanks?.[currentHand][currentBank]) !== false} />
		</div>
		{/if}
	</div>
</section>
{/if} <!-- if openSection == editor -->
<Confirm bind:this={confirmDiscard} okText="Discard">
	<p>You have unsaved changes. Do you want to discard them and open another patch?</p>
</Confirm>
<Alert bind:this={alertPatchLock} okText="Fine...">
	<p>You have unsaved changes. Patch switching is locked on the device.</p>
</Alert>