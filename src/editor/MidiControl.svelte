<script lang="ts">
	import { tick } from "svelte";

	import RangeWithInline from "../widgets/RangeWithInline.svelte";
	import Halp from "../widgets/Halp.svelte";
	import Ramps from "./Ramps.svelte";
		
	import { patchChanged } from '../events';
	import { MidiCtrl, paramOffNegative, paramOff } from '../midi_utils'
	import { map } from '../basic'
	
	import { EncoderBehaviour } from '../types'
	
	export let cc:  number;
	export let min: number;
	export let max: number;
	export let par: number;
	
	export let encmode: number;
	let encmodePrev = encmode;
	
	export let rampu: number;
	export let rampd: number;
	
	export let isDiscrete: boolean;
	export let encoderIsRelative: boolean;
	
	let what: number;
	let prevWhat: number;
		
	let isToggle: boolean;
	
	let relativeEncoderMin: number;
	let relativeEncoderMax: number;
	let relativeEncoderMinPrev: number = -200;
	let relativeEncoderMaxPrev: number = -200;
	
	let ccRangeMin: RangeWithInline;
	let ccRangeMax: RangeWithInline; // for forcing updates on switching between PB / CC
	
	let enableMin = true;
	let enableMax = true;
	
	let rampIsOpen = false;
	function openRampEditor() { rampIsOpen = true; }
	
	function ccTemplate(ev: Event)
	{
		let element: HTMLInputElement = ev.target as HTMLInputElement;
		let value = element.value;
		element.value = "notacc";
		
		isToggle = false;
		
		let upperValue = value.split("-")[1];
		
		enableMin = false;
		if (upperValue != "l")
			max = parseInt(upperValue);
			
		patchChanged();
	
		return true;
	}
	
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
	
	async function forceUpdateRanges()
	{
		await tick();
		if (!ccRangeMin || !ccRangeMax) return;
		
		ccRangeMin.updateInline(); ccRangeMax.updateInline();
	}
	
	function convertRelativeToAbsolute(v: number)
	{
		console.warn(`Converting ${v} to ${(v >= 0) ? v : (Math.abs(v) | 0x40)}`);
		return (v >= 0) ? v : (Math.abs(v) | 0x40); // always signed value
//		if (encmode == EncoderBehaviour.Relative64Zero) { console.log(v); return v + 64; }
//		if (v >= 0) return v;
//		if (encmode == EncoderBehaviour.Relative2Comp)  return 128 + v;
//		if (encmode == EncoderBehaviour.RelativeSigned) return Math.abs(v) | 0x40;
//		return Math.abs(v);
	}
	
	function convertAbsoluteToRelative(v: number)
	{
		return (v < 64) ? v : -(v - 64);
		// if (encmode == EncoderBehaviour.Relative64Zero) return v - 64;
		// if (v < 64) return v;
		// if (encmode == EncoderBehaviour.Relative2Comp)  return v - 128;
		// if (encmode == EncoderBehaviour.RelativeSigned) return -(v - 63);
		// return v % 64;
	}
	
	export function setDefaultMinMax()
	{
		if (isDiscrete) return;
		
		enableMin = true; enableMax = true;
		relativeEncoderMax = relativeEncoderMaxPrev = 1;
		relativeEncoderMin = relativeEncoderMinPrev = -1;
		
		// if (encmode == EncoderBehaviour.Relative64Zero)      { min = 63;  max = 65; }
		// else if (encmode == EncoderBehaviour.Relative2Comp)  { min = 127; max = 1;  }
		if (encmode == EncoderBehaviour.RelativeSigned || encmode == EncoderBehaviour.Relative64Zero || encmode == EncoderBehaviour.Relative2Comp) { min = 65;  max = 1;  }
		else if (what == MidiCtrl.PITCH)					{ min = 64; max = 127; console.log("YUP"); }
																  else { min = 0;   max = 127; }
	}
	
	export function init() // decompose the values
	{
		console.warn("INIT", cc, what, min, max, par);
		encmodePrev = encmode; // should not matter at the startup

		// cc
		
		if (cc > 127)
			what = cc;
		else
			what = MidiCtrl.CC;
			
		prevWhat = what; // all set!
			
		// min, max
		
		enableMin = enableMax = true;
			
		// disable checkboxes if the values are off for discrete controls...
		if (isDiscrete)
		{
			if (min == paramOffNegative) enableMin = false;
			if (max == paramOff) enableMax = false;
		} else {
			setDefaultMinMax(); // for non-discrete, set according to the encmode (will set good defaults even for controls other than encoders)
		}
		
		// toggle
		
		isToggle = isDiscrete && ((par & 0x1) == 0x1);
	}
	
	init(); // if the component has just loaded, do this now
	
	export let locked: boolean = true;
	
	export function lock() { locked = true; }
	export function unlock() { locked = false; }
	
	let canHaveMinMaxValue: boolean = false;
	
	function canHaveMinMax(w: MidiCtrl)
	{ return w === MidiCtrl.CC || w === MidiCtrl.PITCH; }
	
	$:{
		console.warn("Updating editor");
		
		if (!locked)
		{
			if (encmode != encmodePrev)
			{
				if (encmode <= EncoderBehaviour.RelativeSigned)
				{
					what = MidiCtrl.CC;
				}
				
				setDefaultMinMax();
				
				encmodePrev = encmode;
			}
			
			if (what != prevWhat)
			{
				if (what == MidiCtrl.CC)
				{
					cc = 1;
	//				enableMin = enableMax = true;
				} else {
					cc = what;
				}
				
				// set reasonable defaults for min/max if necessary
				
				if (!canHaveMinMax(what)) // it’s off or discrete, so min&max should be plain off
				{
					min = paramOffNegative;
					max = paramOff;
					enableMin = false; enableMax = false;
				} else if (canHaveMinMax(what) && !canHaveMinMax(prevWhat)) { // pitch bend or cc, switched from a discrete mode
					setDefaultMinMax();
					enableMin = true; enableMax = true;
				}
				
				forceUpdateRanges();
				
				prevWhat = what;			
			}
			
			if (encoderIsRelative)
			{
				if (relativeEncoderMinPrev != relativeEncoderMin)
				{
					relativeEncoderMinPrev = relativeEncoderMin; 
					min = convertRelativeToAbsolute(relativeEncoderMin);
				}
				else
					relativeEncoderMin = relativeEncoderMinPrev = convertAbsoluteToRelative(min);
				
				if (relativeEncoderMaxPrev != relativeEncoderMax)
				{
					relativeEncoderMaxPrev = relativeEncoderMax;
					max = convertRelativeToAbsolute(relativeEncoderMax);
				} else
					relativeEncoderMax = relativeEncoderMaxPrev = convertAbsoluteToRelative(max);
			}
			
			if (enableMin  && min == paramOffNegative) min = 0; else
			if (!enableMin && min != paramOffNegative) min = paramOffNegative;
			if (enableMax  && max == paramOff) max = 127; else
			if (!enableMax && max != paramOff) max = paramOff;
			
			if (isToggle) par |= 1; else par &= ~1;
			
			canHaveMinMaxValue = canHaveMinMax(what);
		}
	}

</script>

<fieldset id="ce-control">
	<legend>Control</legend>
	<div class="ce-block controlparammode">
		<h4>Mode</h4>
		<select on:input={patchChanged} id="cbm-what" name="what" bind:value={what}>
			<option value={128}>None</option>
			<option value={131}>Control Change</option>
			<option value={130} disabled={encoderIsRelative}>Pitch bend</option>
			{#if isDiscrete }
			<optgroup label="Extended MIDI">
				<option value={137}>Start / Stop</option>
				<option value={138}>Continue / Stop</option>
				<option value={250}>Start</option>
				<option value={251}>Stop</option>
				<option value={252}>Continue</option>
				<option value={255}>System reset</option>
			</optgroup>
			{/if}
			<!-- <option value="129">Global Velocity</option>
			<option value="133">Global Channel</option>								 -->
		</select>
	</div>
	
	{#if canHaveMinMaxValue }
		{#if isDiscrete }
		<div class="checkboxholder">
			<label><input on:input={patchChanged} type="checkbox" class="appleswitch" bind:checked={isToggle}>
				<mark></mark>Toggle
			</label>
		</div>
		{/if}
		
		{#if what == MidiCtrl.CC }
		<div class="ce-block">
			<h4>Control Change</h4>
			<RangeWithInline on:input={patchChanged} bind:value={cc} />
		</div>
		{/if}
		
		{#if encoderIsRelative && what == MidiCtrl.CC}
		<h4>Step <Halp>If you turn the encoder slowly in relative mode, it will always be sending +1 or –1. But
			you can set the step to be larger when you turn the encoder fast, i.e. +10 or –10 for the fastest
			rotation. Note however that not all host apps support steps other than 1.					
		</Halp></h4>
		<div class="ce-block ce-dont-remove-margin">
			<h4>Largest step back</h4>
			<RangeWithInline bind:this={ccRangeMin} on:input={patchChanged} width="3.6em" min={-64} max={63} bind:value={relativeEncoderMin} />
		</div>
		<div class="ce-block">
			<h4>Largest step forward</h4>
			<RangeWithInline bind:this={ccRangeMax} on:input={patchChanged} width="3.6em" min={-64} max={63} bind:value={relativeEncoderMax} />
		</div>
		

		<p class="explain" style="">Some applications do not support relative values other than 1 and –1.</p>

		
		{:else}
		<div id="ce-minmax-switcher" class:swap-min-max={isDiscrete}>
			<div class="ce-block ce-dont-remove-margin">
				{#if !isDiscrete}<h4>Minimum</h4>{/if}
				{#if isDiscrete }
				<h4>
					<label>
						<input on:input={patchChanged} type="checkbox" bind:checked={enableMin} title="Enable sending value"> {#if isToggle}Toggle off{:else}Release{/if}
					</label>
				</h4>
				{/if}
				<RangeWithInline bind:this={ccRangeMin} on:input={patchChanged} width="3.6em" inlineToRange={inlineToRangePitch} rangeToInline={rangeToInlinePitch} bind:value={min} disabled={!enableMin} />
			</div>
			<div class="ce-block">
				{#if !isDiscrete}<h4>Maximum</h4>{/if}
				{#if isDiscrete }
				<h4>
					<label>
						<input on:input={patchChanged} type="checkbox" bind:checked={enableMax} title="Enable sending value"> {#if isToggle}Toggle on{:else}Press{/if}
					</label>
				</h4>
				{/if}
				<RangeWithInline bind:this={ccRangeMax} on:input={patchChanged} width="3.6em" inlineToRange={inlineToRangePitch} rangeToInline={rangeToInlinePitch} bind:value={max} disabled={!enableMax} />
			</div>
		</div>
		{/if}
		
		{#if isDiscrete }
		<div class="ce-block">
			<p>
			<select class="notselect" on:input={ccTemplate}>
				<option value="notacc">Quick CC templates</option>
				<option value="x-l">Trigger</option>
				<optgroup label="Relative, 64 is zero">
					<option value="x-65">+ Increment</option>
					<option value="x-63">− Decrement</option>
				</optgroup>
				<optgroup label="Relative, 2’s comp">
					<option value="x-1">+ Increment</option>
					<option value="x-127">− Decrement</option>
				</optgroup>
				<optgroup label="Relative, signed">
					<option value="x-1">+ Increment</option>
					<option value="x-64">− Decrement</option>
				</optgroup>
			</select></p>
		</div>
		
		<div class="checkboxholder">
			<label on:click|stopPropagation|preventDefault={openRampEditor}>
			<input checked={(rampu || rampd)>0} class="appleswitch" type="checkbox" > <mark></mark><span class="unreal">Ramp...
			<Halp>
				Ramp allows pitch bend or CC to change smoothly, similar to attack and
				release envelopes. Ramps use external clock to operate, so don’t forget
				to send clock from your host to Dobrynya!
			</Halp>
			</span></label>
		{#if rampIsOpen}
		<Ramps on:input={patchChanged} bind:rampu bind:rampd on:close="{()=>rampIsOpen=false}" />
		{/if}
<!-- 			
	<div class="controlexplanation">Плавное изменение параметра от минимума до максимума и обратно</div> -->
		</div>
		{/if}
	{/if}

</fieldset>