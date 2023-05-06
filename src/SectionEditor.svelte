<script lang="ts">
	import { onMount, createEventDispatcher, tick } from 'svelte';
	
	import { openPatternEditor } from 'event_helpers'
	import type { InvokeControlEventData } from 'event_helpers'
	import { isAlt, isColourPreviewMode } from 'stores'
	import { defaultPatches } from 'defaultpatches';
 	
	import { sysExFilenameAndDo, sysExLockPatchSwitching, sysExBank, sysExColourReset } from 'midi_core'
	import { SysExCommand, currentKeyInfoToKey } from 'midi_utils';
	import { importantFactorySettings } from 'settings_utils'
	import type { MidiResult } from 'midi_utils';
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
	
	import { Control, Hand, NewPatchDecision } from 'types';
	import { NameFailsBecause, checkIfPatchNameIsValid, getNewPatchName } from 'editor';
	import { deepClone, isSame } from 'basic';
	import { ExpanderSanizer } from 'data_expandsanize'
	
	import type { DeviceOrBankValue } from 'types'
	import type { Patch } from 'types_patch'
	import { ColourPaintLayer, randomPattern, hueShiftPattern, hexToCSS } from 'colour_utils'
	import { CaseColour, deviceDefinition } from 'device';
	
	import { patchToDevice, patchList } from 'patch';
	
	export let deviceLevelVelocity: number;
	export let deviceLevelChannel: number;
	export let openSection: string;
	export let isOnline: boolean;
	export function getIsSaved(): boolean { return currentPatch.isSaved }
	
	// let isSaved: boolean = true;
	
	// let currentPatch: Patch;
	// export function getCurrentPatch() { return currentPatch; }
	// let currentPatch.originalState: Patch;
	// let currentPatch.name: string;
	// let editorState.hand: Hand = Hand.LEFT;
	// let editorState.bank: number = 0;
	// let currentPatch.value: string;
	
//	import type { CurrentPatchInfo } from 'patch'
	import { currentPatch, newPatch, patchAction, editorState } from 'patch'

	let numberOfActiveBanks = 0;

	let controlEditor: ControlEditor;
	
	
	let newInterfaceOpen: boolean;
	let newPatchNameIsValid: NameFailsBecause = NameFailsBecause.Empty;
	let newPatchName = "";
	let useCleanSlate: NewPatchDecision = NewPatchDecision.Duplicate;
	let useCleanSlatePrev: NewPatchDecision = NewPatchDecision.Invalid;
	let useTemplate = "fd";
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
	});
	
	let confirmDiscard: Confirm;
	let confirmDiscardThis: Confirm;
	
	let patchSelector: HTMLSelectElement;
	
	export async function selectPatch(ev: Event | CustomEvent | string, quiet: boolean = false)
	{
		// @ts-ignore
		let patchNameRequested = (typeof ev === "string") ? ev : (ev.detail?.name ?? ev.target.value);
			// use the value directly if it is a string, otherwise either take the detail.name from CustomEvent or target.value from Select event
		closeEditor();
		
		let confirmationDialog = 
			(typeof ev === "string" && (ev === currentPatch.name)) ?
				confirmDiscardThis :
				confirmDiscard;
		
		if (!currentPatch.isSaved && !await confirmationDialog.confirm())
		{
			if (typeof ev !== "string") ev.preventDefault();
			currentPatch.value = currentPatch.name;
			return false;
		} else {
			currentPatch.value = patchNameRequested;
		}
		
		if (patchSelector) patchSelector.value = patchNameRequested;
		
		await sysExFilenameAndDo(SysExCommand.READPATCH, patchNameRequested, (data: Patch, filename: string)=>
		{
			patchAction(data, filename);
			if (!quiet) dispatch('section', {section: "editor"});
		});	
	}
	
	let uploadButton: ButtonUpload;
	
	function openNewUI(force: boolean = false)
	{
		newPatchNameIsValid = checkIfPatchNameIsValid(newPatchName,$patchList);
		newInterfaceOpen = force ? true : !newInterfaceOpen;
	}
	
	function uploadOrRevert(ev: MouseEvent)
	{
		if (ev.altKey)
			selectPatch(currentPatch.name);			
		else
			uploadThePatch();
	}
	
	async function uploadThePatch()
	{
		await patchToDevice(
			SysExCommand.OVERWRITEPATCH,
			currentPatch.name,
			() => //(data: any, filename: string) =>
			{
				if (drawer === "colourpaint") colourPaintDrawer.updateDevicePreview(true); // force device to redraw
				uploadButton.ok();
				currentPatch.isSaved = true;
			},
			currentPatch.data
		);
		
		if ($isColourPreviewMode)
		{
			colourPaintDrawer.updateDevicePreview();
		}
	}
	
	let alertJsonLoadFailed: Alert;
	
	const defaultNewPatchHandler = ()=>{ uploadButton.ok() };
	
	function createNewLocal()
	{
		createNew(useCleanSlate, useTemplate, )
	}
	
	export async function createNew(useCleanSlateNow: NewPatchDecision, template: string, useHueShiftIfDuplicating: boolean = true)
	{
		if (useCleanSlateNow == NewPatchDecision.Template)
		{
			// Block?
			try
			{
				let patchData = await fetch(`defaultpatches/${$deviceDefinition.model.code}-${template}.json`);
				let patchJson = await patchData.json();
				
				newPatch(
					false, // not a clean slate
					useHueShiftIfDuplicating ? hueShiftPattern : null, // shift hue
					newPatchName,
					true, // load patch afterwards
					defaultNewPatchHandler, // default handler
					patchJson
				);
				
			} catch(e) {
				console.log(e);
				await alertJsonLoadFailed.confirm();
				return;
			}
			
			
		} else {
			newPatch(
				useCleanSlateNow == NewPatchDecision.CleanSlate,
				useCleanSlateNow == NewPatchDecision.CleanSlate ? randomPattern : (useHueShiftIfDuplicating ? hueShiftPattern : null),
				newPatchName,
				true,
				defaultNewPatchHandler,
			);
		}
	}
	
	function checkIfNewPatchNameIsValid(ev: any)
	{
		nameHasBeenChanged = true;
		newPatchNameIsValid = checkIfPatchNameIsValid(ev.currentTarget.value.trim(), $patchList);
	}
	
	async function updateNewPatchName()
	{
		if (nameHasBeenChanged) return;
		newPatchName = getNewPatchName($patchList, useCleanSlate === NewPatchDecision.Duplicate ? currentPatch.name : null);
		nameHasBeenChanged = false;
	}
	
	let editorAlive = false;
	let editorData = null;
	let editorControlKind: Control = Control.Generic;
	let editorControlNumber: number = -1;
	
	
	let theOutline: HTMLDivElement;
	let editorBigRadius = 0;
	
	function selectBankFromEvent(ev: CustomEvent)
	{
		editorState.hand = ev.detail.hand as Hand;
		selectBank(ev.detail.bankNo + (ev.detail.isShift ? 4 : 0), false);
	}
	
	async function selectBank(no: number, sendSysEx: boolean = true)
	{
		if (editorState.bank == no) return;
		ExpanderSanizer.latchAll();
		if (sendSysEx) sysExBank(editorState.hand, (no > 3), no % 4);
		editorState.bank = no;
	}
	
	async function closeEditor()
	{
		const editorEl = document.getElementById("controleditor");
		
		if (!editorEl) return; // no editor === no problem
		
		editorEl.style.clipPath = editorEl.style.clipPath.replace(`${editorBigRadius}px`,`1px`);
		setTimeout(() => {
			currentPatch.data = currentPatch.data; // uh, svelte
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

		if (currentPatch?.data)
		{
			for (let bank of currentPatch?.data?.padbanks[editorState.hand])
			{
				if (!isSame(bank, {})) numberOfActiveBanks++;
			}
		}
		
		if ($patchList && currentPatch.data) $patchList.find(v=>{return v.isThePatch}).info = deepClone(currentPatch.data.info);
		
		if (
			!newInterfaceOpen || // if it is safe to update the name, because the interface is closed, or
			useCleanSlate != useCleanSlatePrev // if the user changed the useCleanSlate param
		)
		{
			updateNewPatchName();
			useCleanSlatePrev = useCleanSlate;
		}
		
		currentPatch.value = currentPatch.name;
		
		if (currentPatch?.data)
		{
//			deviceLevelVelocity
			if (currentPatch?.data?.padbanks?.[editorState.hand][editorState.bank]?.bank?.vel !== undefined)
			{
				globalVelocity.value = currentPatch?.data?.padbanks?.[editorState.hand][editorState.bank].bank.vel;
				globalVelocity.isDeviceLevel = false;
			} else {
				globalVelocity.value = deviceLevelVelocity;
				globalVelocity.isDeviceLevel = true;
			}

			
			if (currentPatch?.data?.padbanks?.[editorState.hand][editorState.bank]?.bank?.ch !== undefined && currentPatch?.data?.padbanks?.[editorState.hand][editorState.bank].bank.ch !== -1)
			{
				globalChannel.value = currentPatch?.data?.padbanks?.[editorState.hand][editorState.bank].bank.ch;
				globalChannel.isDeviceLevel = false;
			} else {
				globalChannel.value = deviceLevelChannel;
				globalChannel.isDeviceLevel = true;
			}
			
			if (!("encoders" in currentPatch?.data))
			{
				currentPatch.data.encoders = [];
				for (let i=0; i<$deviceDefinition.model.encoders; i++) currentPatch?.data?.encoders.push({});
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
		currentPatch.isSaved = true;
		sysExLockPatchSwitching(false);
	}
	
	function markUnsaved()
	{
		clearCheckPatchEqualTimeout()
		checkPatchEqualTimeout = setTimeout(()=>
		{
			if (isSame(currentPatch.data, currentPatch.originalState)) markUnsaved();
			clearCheckPatchEqualTimeout();
		}, 300);
		
		currentPatch.isSaved = false;
		sysExLockPatchSwitching(true);
	}
	
	function setDrawer (d: string)
	{
		$isColourPreviewMode = (drawer == "colourpaint");
		
		if (drawer == "colourpaint")
			sysExColourReset(); // if current drawer is colourpaint, reset colour preview

		drawer = (d == drawer) ? "" : d;
		if (drawer == "colourpaint") closeEditor(); // if the selected drawer is colourpaint, close the editor	
	}
	
	function ondrawer(ev: CustomEvent) { setDrawer(ev.detail.drawer); }
	
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

<svelte:body on:click={bodyClick} on:patchchange={markUnsaved} on:patchlock={alertAboutPatchLock} on:sysexpush={handleSysExPush} on:drawer="{ondrawer}" on:invokebank={selectBankFromEvent} on:closeeditor={closeEditor} on:opennewui="{()=>openNewUI(true)}" on:closenewui="{()=>{newInterfaceOpen = false}}"></svelte:body>

<!-- export function deviceRefusedToChangePatches() { quickNormal("patchlock"); }
export function invokeControl(kind: number, no: number) { quickCustom("invoke", {controlKind: kind, controlNo: no}); }
export function pushFromSysEx(data: MidiResult) { quickCustom('sysexpush', { data: data }) } -->

{#if currentPatch?.data && openSection == "editor"}
<section id="tab-config">
	
	<GotIt cookieName="editorworks">
		No changes to the patch apply instantly. Press “Upload to the device” to apply the changes and try them in action!
		A red dot <span class="reddot">●</span> will suggest you’ve got unsaved changes.
	</GotIt>
				
	<div id="toolbar-top" class="donotcloseeditor">
		<div class="patchlist-pattern patternpreview" style="display: inline-flex; width: 2.5rem; height: 2.5rem; vertical-align: middle; position: relative; top: -0.11rem;">
		{#if currentPatch.data.info.pattern}
		{#each currentPatch.data.info.pattern as colour}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<span data-colour="0" style="background-color: {hexToCSS(colour)}" on:click={openPatternEditor}></span>
		{/each}
		{/if}
		</div>
		<select bind:this={patchSelector} disabled={!isOnline } id="patchselector" on:input={selectPatch} value={currentPatch.value} style="height:2.5rem">
		{#each $patchList as patch}
			<option value="{patch.name}">{patch.name.replace(".dbrpatch","")}</option>
		{/each}
		</select>
		<ButtonUpload disabled={!isOnline} on:click="{uploadOrRevert}" isSaved={currentPatch.isSaved} bind:this={uploadButton}>{#if $isAlt}Revert{:else}Upload to device{/if}</ButtonUpload>
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
			
			<p class="checkboxblock">
				<label><input type="radio" bind:group={useCleanSlate} value={NewPatchDecision.Duplicate} /> Duplicate from current</label><br />
				<label><input type="radio" bind:group={useCleanSlate} value={NewPatchDecision.CleanSlate} /> Create an empty patch</label><br />

				{#if $deviceDefinition?.model?.code && defaultPatches[$deviceDefinition.model.code] }
				<label><input type="radio" bind:group={useCleanSlate} value={NewPatchDecision.Template} /> From template: 
				<select disabled="{useCleanSlate != NewPatchDecision.Template}" bind:value={useTemplate} style="width:auto">
				{#each defaultPatches[$deviceDefinition.model.code] as defpatch }
					<option value="{defpatch.id}">{defpatch.name}</option>
				{/each}
				</select>
				</label>
				{/if}
<!-- //				{/if} -->
			</p>
			
			<p>
				<button on:click={createNewLocal} disabled={!isOnline || newPatchNameIsValid != NameFailsBecause.Nothing}>New</button>
				<button on:click="{()=>{newInterfaceOpen = false}}">Close</button>
			</p>
			
		</fieldset>
	</div>
	{/if}
	
	<div class="bankselector donotcloseeditor">
		<div class="bsw-holder">
<!-- 					<p class="b">Banks</p> -->
			<ul class="bankswitcher" id="bsw-left">
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<li class:bsw-empty="{!(currentPatch.data.padbanks[0][0]?.pads?.length)}" class:sel="{editorState.bank == 0}" on:click="{()=>selectBank(0)}">1</li>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<li class:bsw-empty="{!(currentPatch.data.padbanks[0][1]?.pads?.length)}" class:sel="{editorState.bank == 1}" on:click="{()=>selectBank(1)}">2</li>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<li class:bsw-empty="{!(currentPatch.data.padbanks[0][2]?.pads?.length)}" class:sel="{editorState.bank == 2}" on:click="{()=>selectBank(2)}">3</li>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<li class:bsw-empty="{!(currentPatch.data.padbanks[0][3]?.pads?.length)}" class:sel="{editorState.bank == 3}" on:click="{()=>selectBank(3)}">4</li>
			</ul>
			<ul class="bankswitcher" id="bsw-shift">
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<li class:bsw-empty="{!(currentPatch.data.padbanks[0][4]?.pads?.length)}" class:sel="{editorState.bank == 4}" on:click="{()=>selectBank(4)}">-1</li>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<li class:bsw-empty="{!(currentPatch.data.padbanks[0][5]?.pads?.length)}" class:sel="{editorState.bank == 5}" on:click="{()=>selectBank(5)}">-2</li>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<li class:bsw-empty="{!(currentPatch.data.padbanks[0][6]?.pads?.length)}" class:sel="{editorState.bank == 6}" on:click="{()=>selectBank(6)}">-3</li>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<li class:bsw-empty="{!(currentPatch.data.padbanks[0][7]?.pads?.length)}" class:sel="{editorState.bank == 7}" on:click="{()=>selectBank(7)}">-4</li>
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
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<span class="unreal" class:sel={drawer === oneDrawer.id} on:click="{()=>setDrawer(oneDrawer.id)}">{oneDrawer.title}</span>
		{/each}
		</div>
		
		{#if drawer == "patchsettings"}
			<div class="drawerwrapper" id="dw-wrapper-patchsettings"><DrawerPatch {currentPatch} model={$deviceDefinition.model} /></div>
		{/if}
		{#if drawer == "banksettings"}
			<div class="drawerwrapper" id="dw-wrapper-banksettings"><DrawerBank bind:currentBank={currentPatch.data.padbanks[editorState.hand][editorState.bank]} {deviceLevelChannel} /></div>
		{/if}
		{#if drawer == "colourpaint"}
			<div class="drawerwrapper" id="dw-wrapper-colourpaint"><DrawerColour bind:this={colourPaintDrawer} bind:colourPaintMode bind:colourPaintShowBank {paintData} bind:bank={currentPatch.data.padbanks[editorState.hand][editorState.bank]} bind:pattern={currentPatch.data.info.pattern} /></div>
		{/if}
		{#if drawer == "banktemplates"}
			<div class="drawerwrapper" id="dw-wrapper-banktemplates"><DrawerTemplate bind:currentBank={currentPatch.data.padbanks[editorState.hand][editorState.bank]} {numberOfActiveBanks} /></div>
		{/if}
		
		
		<div class="drawer" id="dw-paintcolour">

		</div>
	</div>
	
	<div id="bankdescriptor">
		{#if drawer == "colourpaint"}
		<i>Device is in colour preview mode</i>
		{:else}
		{#if !(currentPatch?.data?.padbanks[editorState.hand][editorState.bank]?.pads?.length)}Bank is off.{/if}
		{/if}
	</div>

	<div class="dobrynya-outline" class:dark={importantFactorySettings.caseColour == CaseColour.Dark} class:gray={importantFactorySettings.caseColour == CaseColour.Gray} class:colourpaint={colourPaintMode != ColourPaintLayer.Off} id="dobrynya-outline-miniv2" bind:this={theOutline}>
		<div class="dobrynya-encoders" data-control-name="Encoder" data-control-type="encrotate">
			<Encoder on:click="{(ev)=>openEditor(ev.detail.encEl, Control.EncRotate, 0)}" controlNo={0} dataAll={currentPatch.data.encoders} />
			<Encoder on:click="{(ev)=>openEditor(ev.detail.encEl, Control.EncRotate, 1)}" controlNo={1} dataAll={currentPatch.data.encoders} />
			<Encoder on:click="{(ev)=>openEditor(ev.detail.encEl, Control.EncRotate, 2)}" controlNo={2} dataAll={currentPatch.data.encoders} />
			{#if $deviceDefinition.model.code == "miniv2"}<Encoder on:click="{(ev)=>openEditor(ev.detail.encEl, Control.EncRotate, 3)}" controlNo={3} dataAll={currentPatch.data.encoders}  />{/if}
		</div>
	
		<Pads on:click={openEditorForPad} on:paint="{(ev)=>paintData=ev.detail}" bank={currentPatch?.data?.padbanks?.[editorState.hand][editorState.bank]} pattern={currentPatch.data.info.pattern} {colourPaintMode} {colourPaintShowBank} />

		{#if editorData}
		<div id="controleditor" class="controleditor" class:dead={!editorAlive}>

			<ControlEditor on:closeeditor currentPatch={currentPatch.data} {editorState} controlKind={editorControlKind} controlNumber={editorControlNumber} bind:this={controlEditor} {globalVelocity} {globalChannel} globalColours={currentPatch?.data?.padbanks?.[editorState.hand][editorState.bank].bank?.colour} scaleIsOn={currentKeyInfoToKey(currentPatch?.data?.padbanks?.[editorState.hand][editorState.bank]) !== false} />
		</div>
		{/if}
	</div>
</section>
{/if} <!-- if openSection == editor -->
<Confirm bind:this={confirmDiscard} okText="Discard">
	<p>You have unsaved changes. Do you want to discard them and open another patch?</p>
</Confirm>
<Confirm bind:this={confirmDiscardThis} okText="Revert">
	<p>You have unsaved changes. Do you want to revert to the last saved version?</p>
</Confirm>
<Alert bind:this={alertPatchLock} okText="Fine...">
	<p>You have unsaved changes. Patch switching is locked on the $deviceDefinition.</p>
</Alert>
<Alert bind:this={alertJsonLoadFailed}>
	<p>Failed loading template patch.</p>
</Alert>