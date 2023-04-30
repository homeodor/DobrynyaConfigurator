<svelte:options accessors="{true}" />

<script lang="ts">
	import { tick, onDestroy } from 'svelte';
	import { controls } from 'control_defs'
	import type { ControlDefinition } from 'control_defs'
	import { fakeNoteOff, fakeNoteUseScale, paramOff, paramOffNegative, getNoteInCurrentScale, MidiCtrl } from 'midi_utils'
	import { colourOff } from 'colour_utils'
	import { Hand, Control, EncoderBehaviour } from 'types'
	import type { DeviceOrBankValue } from 'types'
	import type { Patch, BranchControl } from 'types_patch'
	import { deepClone } from 'basic'
	import { createPadsIfAbsent } from 'data_utils';
	import { ExpanderSanizer, expandData, sanizeData } from 'data_expandsanize';
	import { dispatchEditorClose } from 'event_helpers';
	
	import { patchChanged, quickCustom } from 'event_helpers';
	
	import NoteEditor from './NoteEditor.svelte'
	import MidiControl from './editor/MidiControl.svelte'
	import EncoderShadowCC from './editor/EncoderShadowCC.svelte';
	import ColourWellsEditor from './ColourWellsEditor.svelte'
	import KeyboardEditor from './KeyboardEditorDouble.svelte'
	
	// import RangeWithInline from './widgets/RangeWithInline.svelte';
	import Channel from './widgets/Channel.svelte';
	import Overridable from './widgets/Overridable.svelte'
	import Tick from './widgets/Tick.svelte';
	// import Halp from './widgets/Halp.svelte';
			
	// import UndoStack from './undo_stack'
	// import { tweened } from 'svelte/motion';
//	import { cubicOut } from 'svelte/easing';

//	let dispatchEvent = createEventDispatcher();
	
//	export let hand: Hand = Hand.None; // !!!!!!! Hand should be an enum, too
	export let currentPatch: Patch;
	
	export let controlKind: Control = Control.Pad;
	export let controlNumber: number = 0;
	export let currentHand: Hand = Hand.LEFT;
	export let currentBank: number = -1;
	
	let prevControlKind: Control = Control.Generic;
	let prevControlNumber: number = -1;
	let prevHand: Hand = Hand.NONE;
	let prevBank: number = -1;
	let patchCanChange: Boolean = false;

	export let globalChannel: DeviceOrBankValue;
	export let globalColours: number[] = [ colourOff, colourOff ];
	export let globalVelocity: DeviceOrBankValue;
	
	export let scaleIsOn: boolean;

	let theControl: ControlDefinition;
	let encoderIsRelative = false;
	let encoderIsScaleOrTempo = false;
	let encoderIsTempo = false;
	let encoderIsScale = false;
	
	let isKeyOfScale: boolean = false;
	let scaleNote: number;
	// let updateCCFromWhat: boolean = false;
	// let updateWhatFromCC: boolean = false;
	
	let encModePrev = -1;
	
	let midiControlEditor: MidiControl;
	let keyboardEditor: KeyboardEditor;
	
//	let isEncoderRotate: boolean = (controlKind == "encrotate");
	
	const fullDataTreeModel: BranchControl = 
	{
		encmode: 0,
		colour: [ colourOff, colourOff ],
		combo: 0,
		midi: 
		{
			ch: -1,
			note: fakeNoteOff,
			vel: paramOff,
			cc: MidiCtrl.OFF,
			min: paramOffNegative,
			max: paramOff,
			par: 0,
			rampu: 0,
			rampd: 0,
		}
	}
	
	let editorData: BranchControl;
	let editorDataPrev: BranchControl;
	
	export function sanizeNow() { sanizeData(fullDataTreeModel, editorData); }
	export function expandNow() { expandData(fullDataTreeModel, editorData); }
	
	let disableResetToBankColours = false;
	
	let expanderSanizer = new ExpanderSanizer(
	// @ts-ignore
	{ model: fullDataTreeModel			// data will be attached in reactive block
		},
		() => {  } // cleanup function
	);
	
	onDestroy(()=>expanderSanizer.kill());
	
	function setCorrectEditorData()
	{
		switch (controlKind)
		{
			case Control.EncRotate: editorData = currentPatch.encoders[controlNumber]; break;
			case Control.Pad:
			{
				createPadsIfAbsent(currentPatch.padbanks[currentHand][currentBank]);
				editorData = currentPatch.padbanks[currentHand][currentBank].pads[controlNumber];
				break;
			}
		}
		
		editorDataPrev = deepClone(editorData);
	}
	
	function resetAll()
	{
		let setTo = 
			currentPatch.padbanks[currentHand][currentBank].bank?.keyinfo !== undefined ?
			{ midi: { note: fakeNoteUseScale }} :		// if scale is set, reset to scale
			{};
		
		switch (controlKind)
		{
			case Control.EncRotate: currentPatch.encoders[controlNumber] = {}; break;
			case Control.Pad: currentPatch.padbanks[currentHand][currentBank].pads[controlNumber] = setTo; break;
		}
		
		dispatchEditorClose();
	}
	
	function revert()
	{
		editorData = deepClone(editorDataPrev);
		
		switch (controlKind)
		{
			case Control.EncRotate: currentPatch.encoders[controlNumber] = editorData; break;
			case Control.Pad: currentPatch.padbanks[currentHand][currentBank].pads[controlNumber] = editorData; break;
		}
	}
	
	let editorLocked = false;

	async function initEditorAfterTick()
	{
		midiControlEditor?.lock();
		if (!midiControlEditor)
		{
			console.warn("Waiting for a tick");
		}
		await tick();
		midiControlEditor.init();
		keyboardEditor.update();
		midiControlEditor.unlock();
		patchCanChange = true;
	}

	// async function setDefaultMinMaxAfterTick()
	// {
	// 	await tick();
	// 	midiControlEditor?.setDefaultMinMax();
	// }

	function openBankSettings() { quickCustom("drawer", {drawer:'banksettings'}); }
	
	function maybeCloseTheEditor(ev: KeyboardEvent)
	{
		if (ev.key != "Enter" && ev.key != "Escape") return;
		if (ev.key == "Escape") revert();
		dispatchEditorClose();
	}
	
	function patchMaybeChanged()
	{
		if (patchCanChange) patchChanged();
	}
	
	$:
	{
		if (currentHand != prevHand || controlKind != prevControlKind || controlNumber != prevControlNumber || currentBank != prevBank)
		{
			patchCanChange = false;
			
			if (controlKind == Control.Pad)
			{
				let noteData = getNoteInCurrentScale(controlNumber, currentPatch.padbanks[currentHand][currentBank]);
				isKeyOfScale = noteData.isKeyOfScale; // will return false if no scale set
				scaleNote = noteData.key; // will return -1 if no scale is set
			} else {
				isKeyOfScale = false;
				scaleNote = -1;
			}
			
			theControl = controls.find(v=>{return v.control == controlKind});
			expanderSanizer.sanize();
			setCorrectEditorData();
//			console.log("Creating data", editorData);
			console.warn(editorData.midi);
			expanderSanizer.expand(editorData);
			console.warn(editorData.midi.min);
//			console.log("Expadning data?", editorData.midi);
			prevHand = currentHand; prevControlKind = controlKind; prevControlNumber = controlNumber; prevBank = currentBank;
			encModePrev = -1;
			
			console.warn(editorData.midi.min);
			editorData = editorData; // svelte
			
			console.warn(editorData.midi.min);
			initEditorAfterTick();
			console.warn(editorData.midi.min);
			
		}
		
		console.warn(editorData.midi.min);

		expanderSanizer.expand(editorData);
		
		console.warn(editorData.midi.min);

		disableResetToBankColours = (editorData.colour[0] == colourOff && editorData.colour[1] == colourOff);
		
		encoderIsRelative = editorData.encmode >= 1 && editorData.encmode <= 3; // relative midi
		
		encoderIsScale = editorData.encmode >= EncoderBehaviour.ScaleKey && editorData.encmode <= EncoderBehaviour.ScaleKind;
		encoderIsTempo = editorData.encmode === EncoderBehaviour.InternalTempo;
		encoderIsScaleOrTempo = encoderIsScale || encoderIsTempo;
		
		
		if (encModePrev != editorData.encmode) // check if encmode has been changed, and make some reasonable changes...
		{
//			console.log("Encmode chnaged");
			if (encoderIsRelative)
			{
//				console.log("It is relative");
				if (editorData.midi.cc > 127)
					editorData.midi.cc = 1;
				
				initEditorAfterTick();
			}
			
			encModePrev = editorData.encmode;
		}
	}
	
</script>

<svelte:body on:keydown={maybeCloseTheEditor}></svelte:body>


	<header>
		<h2>{theControl.friendlyName} {controlNumber+1}</h2>
		<div class="cancelerholder" style="text-align: right; font-weight: bold">
			<span class="revert" on:click={revert}>↺</span>
			<span class="close" on:click={dispatchEditorClose}><Tick /></span>
		</div>
	</header>
	
	<main id="ce-main" class="columnizer">
		{#if theControl.notes}
		<NoteEditor bind:midiNote={editorData.midi.note} bind:velocity={editorData.midi.vel} {globalVelocity} {scaleNote} />
		{/if}
		{#if theControl.colours}
		<fieldset id="ce-colours" class="capability-colour conditional cond-pad cond-joystick">
			<legend>Colours <Overridable />
			</legend>
			<ColourWellsEditor on:input={patchMaybeChanged} bind:colours={editorData.colour} globalColours={globalColours} {isKeyOfScale} />
			<button disabled={disableResetToBankColours} on:click={patchMaybeChanged} on:click="{()=>editorData.colour[0] = editorData.colour[1] = colourOff}" class="auxaction">Reset to bank colours</button>
		</fieldset>
		{/if}
		
		{#if controlKind == Control.EncRotate}
		<fieldset id="ce-options">
			<legend>Behaviour</legend>
				<div>
					<select on:input={patchMaybeChanged} bind:value={editorData.encmode}>
						<optgroup label="Control Change">
							<option value={EncoderBehaviour.Absolute}>Absolute (normal)</option>
							<option value={EncoderBehaviour.Relative64Zero}>Relative, 64 is zero</option>
							<option value={EncoderBehaviour.Relative2Comp}>Relative, 2’s comp</option>
							<option value={EncoderBehaviour.RelativeSigned}>Relative, signed</option>
						</optgroup>
						<optgroup label="Change scale" disabled={!scaleIsOn && !encoderIsScale}>
							<option value={EncoderBehaviour.ScaleKey}>Key</option>
							<option value={EncoderBehaviour.ScaleOctave}>Octave</option>
							<option value={EncoderBehaviour.ScaleOffset}>Offset</option>
							<option value={EncoderBehaviour.ScaleKind}>Kind</option>
						</optgroup>
						<!-- <optgroup label="Tempo">
							<option value={EncoderBehaviour.InternalTempo}>Internal tempo</option>
						</optgroup> -->
					</select>
					{#if !scaleIsOn && encoderIsScale}
					<p class="warn explain" style="padding:0">This encoder is set to change scale parameters, but no scale is set.
						You can change the scale in <span class="unreal" on:click={openBankSettings}>bank settings</span>.</p>
					{:else if !encoderIsScale}
					<p class="explain">Encoder can be used to change scale parameters on the fly. You can set the scale in
						<span class="unreal" on:click={openBankSettings}>bank settings</span>.</p>
					{/if}
				</div>
				<EncoderShadowCC bind:cc={editorData.midi.cc} bind:min={editorData.midi.min} bind:max={editorData.midi.max} bind:par={editorData.midi.par} {encoderIsScaleOrTempo} encoderIsTempo={editorData.encmode === EncoderBehaviour.InternalTempo} />
		</fieldset>
		{/if}
		
		<fieldset id="ce-midisettings">
			<legend>Settings</legend>
				<div class="">
					<h4>Channel <Overridable /></h4>
					<Channel on:input={patchMaybeChanged} bind:value={editorData.midi.ch} channelDefault={globalChannel.value & 0xf} channelDefaultName="{globalChannel.isDeviceLevel?'Device default':'Bank default'}" />
				</div>
		</fieldset>
		{#if !encoderIsScaleOrTempo}
		<MidiControl bind:cc={editorData.midi.cc} bind:min={editorData.midi.min} bind:max={editorData.midi.max} bind:par={editorData.midi.par} bind:rampu={editorData.midi.rampu} bind:rampd={editorData.midi.rampd} isDiscrete={theControl.discrete} {encoderIsRelative} encmode={editorData.encmode} bind:this={midiControlEditor} />
		{/if} <!-- if not encoderScaleOrTempo -->
		<KeyboardEditor on:input={patchMaybeChanged} {controlKind} bind:value={editorData.combo} bind:this={keyboardEditor} />
		<fieldset id="ce-reset">
			<legend>Reset</legend>
			<div class="ce-block">
				<button class="dangerous" on:click={patchMaybeChanged} on:click={resetAll}>Reset all</button>
			</div>
			<div class="explain">
				This removes any settings and closes the editor.
				{#if controlKind == Control.Pad}If a scale and key is set, the pad will obey it,
					otherwise it won't do anything.{:else}The control will essentially be off.{/if}
			</div>
		</fieldset>
	</main>