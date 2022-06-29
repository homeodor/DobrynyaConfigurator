<script lang="ts">
	import { hexToCSS, gracefulGetColour, ColourPaintLayer, colourOff } from '../colour_utils';
	import type { BranchControl } from '../types_patch'
	import { Control } from '../types';
	import type { HexColour } from '../types'
	import { filterInvoke } from '../events';
	import type { InvokeControlEvent, InvokeControlEventData } from '../events'
	import InnerControl from './InnerControl.svelte';
	
	import { createEventDispatcher } from 'svelte';
	
	export let colourPaintShowBank: boolean;
	export let colourPaintMode: ColourPaintLayer;

	export let controlNo: number;
	export let data: BranchControl;
	
	export let pattern: number;
	export let globalColours: number[];
	export let isKeyOfScale: boolean = false;
	export let scaleNote: number = 0;
	
	let dispatch = createEventDispatcher();
	
	let padColours = [];
	
	let activeColour: string = "transparent";
	let normalColour: string = "transparent";
	let backgroundColour: string = "transparent";
	
	let isColourPaint: boolean = colourPaintMode != ColourPaintLayer.Off;

	let moreData: { noColour: boolean } = { noColour: false };
	
	let hex = colourOff;
	let ultimateHex = 0;
	
	let theDiv: HTMLDivElement;
	
	function customClick(ev: MouseEvent)
	{
		sendEvent(ev.type, ev.buttons, ev.altKey, ev.shiftKey);
		ev.stopPropagation();
	}
	
	function sendEvent (evType: string, evButtons: number = 0, evAltKey: boolean = false, evShiftKey: boolean = false)
	{
		let eventToDispatch: string = "";
		
		if (colourPaintMode != ColourPaintLayer.Off) // colour paint
		{
			if (
				(evType != "click" && (evButtons & 0x1))
			) eventToDispatch = "paint";
		} else {
			if (evType != "click") return; // mouseover?
			eventToDispatch = "click";
		}
		
		if (!eventToDispatch) return;
		
		let dispatchData: InvokeControlEventData =
		{
			controlKind: Control.Pad, 
			target: theDiv, 
			controlNo: controlNo, 
			hex: hex, 
			ultimateHex: ultimateHex, 
			altKey: evAltKey, 
			shiftKey: evShiftKey
		}
		
		dispatch(eventToDispatch, dispatchData);
	}
	
	function invokeControl(ev: InvokeControlEvent) { filterInvoke(ev, Control.Pad, controlNo, ()=>sendEvent('click')); }
	
	$:{
		isColourPaint = colourPaintMode != ColourPaintLayer.Off;
		
		padColours = [];
		
		if (data?.colour) padColours = data.colour;
		
		activeColour = hexToCSS(gracefulGetColour(1, padColours, globalColours, isKeyOfScale));
		normalColour = hexToCSS(gracefulGetColour(0, padColours, globalColours, isKeyOfScale));
		
		moreData.noColour = false;
		
		if (isColourPaint)
		{
			let backgroundHex: HexColour;
			
			if (colourPaintMode != ColourPaintLayer.Pattern)
			{
				backgroundHex = ultimateHex = gracefulGetColour(colourPaintMode, padColours, (colourPaintShowBank ? globalColours : []), isKeyOfScale, false, moreData);
				hex = padColours[colourPaintMode] ?? colourOff;				
			} else {
				backgroundHex = hex = ultimateHex = pattern;
			}
			
			if ((ultimateHex & 0xf) == 0) ultimateHex = 0;
			
			backgroundColour = "background-color: " + hexToCSS(backgroundHex == colourOff ? 0 : backgroundHex);
		} else {
			hex = colourOff; // not needed in non-colourpaint
			ultimateHex = 0; // same
			backgroundColour = "";
		}
		// 
		// console.log(moreData.noColour);		
		// console.log(activeColour, normalColour, backgroundColour, isColourPaint, colourPaintMode);
	}
	// 
	// console.log("DATA IS ", data)
</script>

<svelte:body on:invoke={invokeControl}></svelte:body>

<style>
	div.colourpaint { border-width:0!important; }
	div { border-color: var(--normal-colour) }
	div:hover { border-color: var(--active-colour) }
</style>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div bind:this={theDiv} on:click={customClick} on:mouseover={customClick} on:mousedown={customClick} class:nocolour={moreData.noColour} class="dobrynya-pad editablecontrol colourablecontrol" class:colourpaint={isColourPaint} style="{backgroundColour}; --normal-colour: {normalColour}; --active-colour: {activeColour}" class:ramp={data?.midi?.rampu || data?.midi?.rampd}>
	{#if data && !isColourPaint}
	<InnerControl {data} {scaleNote} />
	{/if}
</div>