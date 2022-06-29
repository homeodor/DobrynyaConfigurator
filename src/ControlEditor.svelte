<svelte:options accessors="{true}" />

<script lang="ts">
	import { tick, createEventDispatcher, onDestroy } from 'svelte';
	import { controls } from './control_defs'
	import type { ControlDefinition } from './control_defs'
	import { fakeNoteOff, fakeNoteUseScale, paramOff, paramOffNegative, getNoteInCurrentScale, MidiCtrl } from './midi_utils'
	import { colourOff } from './colour_utils'
	import { Hand, Control, EncoderBehaviour } from './types'
	import type { DeviceOrBankValue } from './types'
	import type { Patch, BranchControl } from './types_patch'
	import { map, createPadsIfAbsent, emptyPadDataArray, deepClone } from './data_utils'
	import { ExpanderSanizer, expandData, sanizeData } from './data_expandsanize';
	
	import { patchChanged } from './events';
	
	import NoteEditor from './NoteEditor.svelte'
	import ColourWellsEditor from './ColourWellsEditor.svelte'
	import KeyboardEditor from './KeyboardEditorDouble.svelte'
	import Ramps from './editor/Ramps.svelte';
	
	import RangeWithInline from './widgets/RangeWithInline.svelte';
	import Channel from './widgets/Channel.svelte';
	import Overridable from './widgets/Overridable.svelte'
	import Tick from './widgets/Tick.svelte';
	import Halp from './widgets/Halp.svelte';
			
	// import UndoStack from './undo_stack'
	// import { tweened } from 'svelte/motion';
//	import { cubicOut } from 'svelte/easing';

	let dispatchEvent = createEventDispatcher();
	
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


	export let globalChannel: DeviceOrBankValue;
	export let globalColours: number[] = [ colourOff, colourOff ];
	export let globalVelocity: DeviceOrBankValue;

	let theControl: ControlDefinition;
	let encoderIsRelative = false;
	let encoderIsScaleOrTempo = false;
	
	let isKeyOfScale: boolean = false;
	let scaleNote: number;
	// let updateCCFromWhat: boolean = false;
	// let updateWhatFromCC: boolean = false;
	
	let enableMin = false;
	let enableMax = false;
	
	let what = MidiCtrl.OFF; // 128
	let prevWhat = MidiCtrl.OFF;
	let ccValPrev = -1;
	let ccVal = paramOff;
	let isToggle: boolean = false;
	
	let paramPrev = -1
	let encModePrev = -1;
	let relativeEncoderMin = 0;
	let relativeEncoderMax = 0;
	let relativeEncoderMinPrev = 0;
	let relativeEncoderMaxPrev = 0;
	
	let ccRangeMin:RangeWithInline;
	let ccRangeMax: RangeWithInline; // for forcing updates on switching between PB / CC
	
	
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
	
	// export let editorData;
	// 
	// let editor = { data: editorData };
//	let undoStack = new UndoStack(editor);

	

	
	export function sanizeNow() { sanizeData(fullDataTreeModel, editorData); }
	export function expandNow() { expandData(fullDataTreeModel, editorData); }
	
//	whatFromCC();

	// export function loadData(data: any)
	// {
	// 	editorData = UndoStack.deepClone(data);

		
	// undoStack.reset();
	// undoStack.push();
	// }
	
	
	// onDestroy(()=>{
	// 	sanizeNow();
	// });
	
	// async function pushUndo()
	// {
	// 	await tick();
	// 	undoStack.push();
	// }
	
	function ccTemplate(ev: Event)
	{
		let element: HTMLInputElement = ev.target as HTMLInputElement;
		let value = element.value;
		element.value = "notacc";
		
		isToggle = false;
		
		let upperValue = value.split("-")[1];
		
		enableMin = false;
		if (upperValue != "l")
			editorData.midi.max = parseInt(upperValue);
			
		patchChanged();
		
//		undoStack.push();	
		return true;
	}
	
	let rampIsOpen = false;
	
	function openRampEditor() { rampIsOpen = true; }

	let inlineToRangePitch = function (v: string): number | boolean
	{
		let numV = parseInt(v);
		
		if (what != MidiCtrl.PITCH || isNaN(numV)) return numV;
		
		if (what === MidiCtrl.PITCH)
			return numV ? map(numV, -8192, 8191, 0, 127) : 64;
	}
	
	let rangeToInlinePitch = function (v: number): string
	{
		return (what === MidiCtrl.PITCH) ? String(
			v >= 64 ?
				map(v, 64, 127, 0, 8191) :
				map(v, 0, 63, -8192, -129)
		) : String(v);
	}
	
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
		
		dispatchEvent('close');
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
	
	async function forceUpdateRanges()
	{
		await tick();
		if (!ccRangeMin || !ccRangeMax) return;
		
		ccRangeMin.updateInline(); ccRangeMax.updateInline();
	}
	
	function convertRelativeToAbsolute(v: number)
	{
		if (editorData.encmode == EncoderBehaviour.Endless64Zero) { console.log(v); return v + 64; }
		if (v >= 0) return v;
		if (editorData.encmode == EncoderBehaviour.Endless2Comp)  return 128 + v;
		if (editorData.encmode == EncoderBehaviour.EndlessSigned) return Math.abs(v) | 0x40;
		return Math.abs(v);
	}
	
	function convertAbsoluteToRelative(v: number)
	{
		if (editorData.encmode == EncoderBehaviour.Endless64Zero) return v - 64;
		if (v < 64) return v;
		if (editorData.encmode == EncoderBehaviour.Endless2Comp)  return v - 128;
		if (editorData.encmode == EncoderBehaviour.EndlessSigned) return -(v - 63);
		return v % 64;
	}
	
	function setDefaultMinMax()
	{
		enableMin = true; enableMax = true;
		
		if (editorData.encmode == EncoderBehaviour.Endless64Zero)      { editorData.midi.min = 63;  editorData.midi.max = 65; }
		else if (editorData.encmode == EncoderBehaviour.Endless2Comp)  { editorData.midi.min = 127; editorData.midi.max = 1;  }
		else if (editorData.encmode == EncoderBehaviour.EndlessSigned) { editorData.midi.min = 64;  editorData.midi.max = 1;  }
																  else { editorData.midi.min = 0;   editorData.midi.max = 127; }
	}
	
	function maybeCloseTheEditor(ev: KeyboardEvent)
	{
		if (ev.key != "Enter" && ev.key != "Escape") return;
		if (ev.key == "Escape") revert();
		dispatchEvent('close');
	}
	
	$:
	{
		
		if (currentHand != prevHand || controlKind != prevControlKind || controlNumber != prevControlNumber || currentBank != prevBank)
		{
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
			console.log("Creating data", editorData);
			expanderSanizer.expand(editorData);
			console.log("Expadning data?", editorData.midi);
			prevHand = currentHand; prevControlKind = controlKind; prevControlNumber = controlNumber; prevBank = currentBank;
			encModePrev = -1;
			
			whatFromCC();
		}

		expanderSanizer.expand(editorData);

		disableResetToBankColours = (editorData.colour[0] == colourOff && editorData.colour[1] == colourOff);
		
		encoderIsRelative = editorData.encmode >= 1 && editorData.encmode <= 3; // relative midi
		encoderIsScaleOrTempo = editorData.encmode >= EncoderBehaviour.ScaleKey && editorData.encmode <= EncoderBehaviour.InternalTempo;
		
		
		if (encModePrev != editorData.encmode) // check if encmode has been changed, and make some reasonable changes...
		{
			console.log("Encmode chnaged");
			if (encoderIsRelative)
			{
				console.log("It is relative");
				if (what != MidiCtrl.CC)
				{
					prevWhat = what = MidiCtrl.CC;
					editorData.midi.cc = 1;
				}
				
				setDefaultMinMax();
			}
			
			encModePrev = editorData.encmode;
		}
		
		if (relativeEncoderMinPrev != relativeEncoderMin)
		{
			relativeEncoderMinPrev = relativeEncoderMin; 
			editorData.midi.min = convertRelativeToAbsolute(relativeEncoderMin);
		}
		else
			relativeEncoderMin = relativeEncoderMinPrev = convertAbsoluteToRelative(editorData.midi.min);
		
		if (relativeEncoderMaxPrev != relativeEncoderMax)
		{
			relativeEncoderMaxPrev = relativeEncoderMax;
			editorData.midi.max = convertRelativeToAbsolute(relativeEncoderMax);
		} else
			relativeEncoderMax = relativeEncoderMaxPrev = convertAbsoluteToRelative(editorData.midi.max);

		
		
		if (paramPrev != editorData.midi.par)
		{
			paramPrev = editorData.midi.par;
			
			isToggle = ((editorData.midi.par & 0x1) == 0x1)
		}
		
		if (prevWhat != what || ccValPrev != ccVal)
		{
			console.log("OK", editorData.midi.cc, what);
			if (editorData.midi.cc > 127 && (what == MidiCtrl.CC || what == MidiCtrl.PITCH))
			{
				if (what == MidiCtrl.CC)
				{
					ccVal = 1;
					editorData.midi.cc = 1;
				} else
					editorData.midi.cc = what;
				
				setDefaultMinMax();
			}
			else
				editorData.midi.cc = (what === MidiCtrl.CC) ? ccVal : what;
				
			if (what == MidiCtrl.PITCH && editorData.midi.min == 0)
			{
				editorData.midi.min = 64;
			}
			
			prevWhat = what;
			ccValPrev = ccVal;
			
			forceUpdateRanges();
			
		//	console.log("Editor CC is ", editorData.midi.cc)
		}
		
		if (ccValPrev != ccVal)
		{
			if (what === MidiCtrl.CC) editorData.midi.cc = ccVal;
		}
		
		
		
		if (enableMin  && editorData.midi.min == paramOffNegative) editorData.midi.min = 0;
		if (enableMax  && editorData.midi.max == paramOff) editorData.midi.max = 127;
		if (!enableMin && editorData.midi.min != paramOffNegative) editorData.midi.min = paramOffNegative;
		if (!enableMax && editorData.midi.max != paramOff) editorData.midi.max = paramOff;
		
		whatFromCC();
				
		if (isToggle) editorData.midi.par |= 1; else editorData.midi.par &= ~1;
	}
	
	async function whatFromCC()
	{
		// console.log("Editor data is ", editorData);
		what = prevWhat =
		(editorData.midi.cc > 127) ?
			(editorData.midi.cc == paramOff ? MidiCtrl.OFF : editorData.midi.cc) :
			MidiCtrl.CC;
			
		if (what === MidiCtrl.CC)
		{
			ccVal = editorData.midi.cc;
		}
		
		if (
			!theControl.discrete &&
			(what == MidiCtrl.CC || what == MidiCtrl.PITCH)
		)
		{
			if (editorData.midi.min == paramOffNegative) editorData.midi.min = 0
			if (editorData.midi.max == paramOff) editorData.midi.max = 127;
		} // fix non-discrete controls 
		
		if (what === MidiCtrl.OFF) // disabled if set to off
		{
			editorData.midi.min = paramOffNegative;
			editorData.midi.max = paramOff;
		}
		
		if (what !== MidiCtrl.CC && encoderIsRelative)
			encModePrev = editorData.encmode = EncoderBehaviour.Absolute;
		
		enableMin = (editorData.midi.min != paramOffNegative);
		enableMax = (editorData.midi.max != paramOff);
	}
	
</script>

<svelte:body on:keydown={maybeCloseTheEditor}></svelte:body>


	<header>
		<h2>{theControl.friendlyName} {controlNumber+1}</h2>
		<div class="cancelerholder" style="text-align: right; font-weight: bold">
			<span class="revert" on:click={revert}>↺</span>
			<span class="close" on:click="{()=>{dispatchEvent('close')}}"><Tick /></span>
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
			<ColourWellsEditor on:input={patchChanged} bind:colours={editorData.colour} globalColours={globalColours} {isKeyOfScale} />
			<button disabled={disableResetToBankColours} on:click={patchChanged} on:click="{()=>editorData.colour[0] = editorData.colour[1] = colourOff}" class="auxaction">Reset to bank colours</button>
		</fieldset>
		{/if}
		
		{#if controlKind == Control.EncRotate}
		<fieldset id="ce-options">
			<legend>Behaviour</legend>
				<div>
					<h4>Mode</h4>
					<select on:input={patchChanged} bind:value={editorData.encmode}>
						<optgroup label="Control Change">
							<option value={EncoderBehaviour.Absolute}>Absolute (normal)</option>
							<option value={EncoderBehaviour.Endless64Zero}>Relative, 64 is zero</option>
							<option value={EncoderBehaviour.Endless2Comp}>Relative, 2’s comp</option>
							<option value={EncoderBehaviour.EndlessSigned}>Relative, signed</option>
						</optgroup>
						<optgroup label="Change scale">
							<option value={EncoderBehaviour.ScaleKey}>Key</option>
							<option value={EncoderBehaviour.ScaleOctave}>Octave</option>
							<option value={EncoderBehaviour.ScaleOffset}>Offset</option>
							<option value={EncoderBehaviour.ScaleKind}>Kind</option>
						</optgroup>
						<!-- <optgroup label="Tempo">
							<option value={EncoderBehaviour.InternalTempo}>Internal tempo</option>
						</optgroup> -->
					</select>
				</div>
				<div class="ce-block">
					<h4>
						<label>
							<input on:input="{(ev)=>{patchChanged();what = ev.target.checked ? MidiCtrl.CC : MidiCtrl.OFF;}}" disabled={!encoderIsScaleOrTempo} type="checkbox" checked={what === MidiCtrl.CC} title="Enable sending value"> Send this as CC
						</label>
					</h4>
					<RangeWithInline disabled={!(encoderIsScaleOrTempo && what === MidiCtrl.CC)} on:input={patchChanged} bind:value={ccVal} />
					{#if editorData.encmode === EncoderBehaviour.InternalTempo}
					<p class="warn explain" style="padding:0">Tempo will be sent from 60 to 187<wbr /> as CC values 0 to 127.</p>
					{/if}
				</div>
		</fieldset>
		{/if}
		
		<fieldset id="ce-midisettings">
			<legend>Settings</legend>
				<div class="">
					<h4>Channel <Overridable /></h4>
					<Channel on:input={patchChanged} bind:value={editorData.midi.ch} channelDefault={globalChannel.value & 0xf} channelDefaultName="{globalChannel.isDeviceLevel?'Device default':'Bank default'}" />
				</div>
		</fieldset>
		{#if !encoderIsScaleOrTempo}
		<fieldset id="ce-control">
			<legend>Control</legend>
				<div class="ce-block controlparammode">
					<h4>Mode</h4>
					<select on:input={patchChanged} id="cbm-what" name="what" bind:value={what}>
						<option value={128}>None</option>
						<option value={131}>Control Change</option>
						<option value={130}>Pitch bend</option>
						{#if theControl.discrete }
						<optgroup label="Extended MIDI" class="conditional cond-pad cond-encpush cond-joypush">
							<option value={137}>Start / Stop</option>
							<option value={138}>Continue / Stop</option>
							<option value={250}>Start</option>
							<option value={251}>Stop</option>
							<option value={252}>Continue</option>
							<option value={255}>System reset</option>
						</optgroup>
						{/if}
						<!-- <option value="129" class="conditional cond-pad cond-encpush   cond-joystick">Global Velocity</option>
						<option value="133" class="conditional cond-pad cond-encpush   cond-joystick">Global Channel</option>								 -->
					</select>
				</div>
				
				{#if what != MidiCtrl.OFF }
				
					{#if theControl.discrete }
					<div class="checkboxholder">
						<label><input on:input={patchChanged} type="checkbox" class="appleswitch" bind:checked={isToggle}>
							<mark></mark>Toggle
						</label>
					</div>
					{/if}
					
					{#if what == MidiCtrl.CC }
					<div class="ce-block">
						<h4>Control Change</h4>
						<RangeWithInline on:input={patchChanged} bind:value={ccVal} />
						<!-- <input id="cbm-cc" name="cc" type="range" min="0" max="127" value="1" data-default="1"> <label class="inline-editable ie-midivalue"></label> -->
					</div>
					{/if}
					
					{#if encoderIsRelative && what == MidiCtrl.CC}
					<div class="ce-block ce-dont-remove-margin">
						<h4>Slow</h4>
						<RangeWithInline bind:this={ccRangeMin} on:input={patchChanged} width="3.6em" min={-64} max={63} bind:value={relativeEncoderMin} />
					</div>
					<div class="ce-block">
						<h4>Fast</h4>
						<RangeWithInline bind:this={ccRangeMax} on:input={patchChanged} width="3.6em" min={-64} max={63} bind:value={relativeEncoderMax} />
					</div>
					
					{#if relativeEncoderMin < -1 || relativeEncoderMin > 1 || relativeEncoderMax > 1 || relativeEncoderMax < -1 }
					<p class="warn explain" style="padding:0">Some applications do not support relative values greater than 1 and -1.</p>
					{/if}
					
					{:else}
					<div id="ce-minmax-switcher" class:swap-min-max={theControl.discrete}>
						<div class="ce-block ce-dont-remove-margin">
							{#if !theControl.discrete}<h4>Minimum</h4>{/if}
							{#if theControl.discrete }
							<h4>
								<label>
									<input on:input={patchChanged} type="checkbox" bind:checked={enableMin} title="Enable sending value"> {#if isToggle}Toggle off{:else}Release{/if}
								</label>
							</h4>
							{/if}
							<RangeWithInline bind:this={ccRangeMin} on:input={patchChanged} width="3.6em" inlineToRange={inlineToRangePitch} rangeToInline={rangeToInlinePitch} bind:value={editorData.midi.min} disabled={!enableMin} />
						</div>
						<div class="ce-block">
							{#if !theControl.discrete}<h4>Maximum</h4>{/if}
							{#if theControl.discrete }
							<h4>
								<label>
									<input on:input={patchChanged} type="checkbox" bind:checked={enableMax} title="Enable sending value"> {#if isToggle}Toggle on{:else}Press{/if}
								</label>
							</h4>
							{/if}
							<RangeWithInline bind:this={ccRangeMax} on:input={patchChanged} width="3.6em" inlineToRange={inlineToRangePitch} rangeToInline={rangeToInlinePitch} bind:value={editorData.midi.max} disabled={!enableMax} />
						</div>
					</div>
					{/if}
					
					{#if theControl.discrete }
					<div class="ce-block">
						<p>
						<select class="notselect" on:input={ccTemplate}>
							<option value="notacc">Quick CC templates</option>
							<option value="x-l">Trigger</option>
							<optgroup label="Relative, 64 is zero">
								<option value="x-65">+ Increment</option>
								<option value="x-63">– Decrement</option>
							</optgroup>
							<optgroup label="Relative, 2’s comp">
								<option value="x-1">+ Increment</option>
								<option value="x-127">– Decrement</option>
							</optgroup>
							<optgroup label="Relative, signed">
								<option value="x-1">+ Increment</option>
								<option value="x-64">– Decrement</option>
							</optgroup>
						</select></p>
					</div>
					
					<div class="checkboxholder">
						<label on:click|stopPropagation|preventDefault={openRampEditor}>
						<input checked={(editorData.midi.rampu||editorData.midi.rampd)>0} class="appleswitch" type="checkbox" > <mark></mark><span class="unreal">Ramp...
						<Halp>
							Ramp allows pitch bend or CC to change smoothly, similar to attack and
							release envelopes. Ramps use external clock to operate, so don’t forget
							to send clock from your host to Dobrynya!
						</Halp>
						</span></label>
					{#if rampIsOpen}
					<Ramps on:input={patchChanged} midi={editorData.midi} on:close="{()=>rampIsOpen=false}" />
					{/if}
	<!-- 			
				<div class="controlexplanation">Плавное изменение параметра от минимума до максимума и обратно</div> -->
					</div>
					{/if}
				{/if}

		</fieldset>
		{/if} <!-- if not encoderScaleOrTempo -->
		<KeyboardEditor on:input={patchChanged} {controlKind} bind:value={editorData.combo} />
		<fieldset id="ce-reset">
			<legend>Reset</legend>
			<div class="ce-block">
				<button class="dangerous" on:click={patchChanged} on:click={resetAll}>Reset all</button>
			</div>
			<div class="explain">
				This removes any settings and closes the editor.
				{#if controlKind == Control.Pad}If a scale and key is set, the pad will obey it,
					otherwise it won't do anything.{:else}The control will essentially be off.{/if}
			</div>
		</fieldset>
	</main>