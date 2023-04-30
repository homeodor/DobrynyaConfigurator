<style>
	.colourwellholder { display:inline-block; padding: 0 1em 1em 1em }
	.colourwell { display:inline-block; width:5em; height:5em; box-shadow: inset 0.2em 0.2em 0.4em rgba(0,0,0,0.3), inset -0.2em -0.2em 0.4em rgba(255,255,255,0.1); border-radius:0.5em; transition: background-color 0.1s; }
	.colourwell.large { width:7em; height: 7em; }
</style>

<script lang="ts">
	import { sysExColourReset } from 'midi_core'
	import type { HexColour } from 'types';
	import { createEventDispatcher } from 'svelte';
	import { colourOff, hexToCSS, gracefulGetColour } from 'colour_utils';
	import Colour from '../Colour.svelte'

	export let hex: HexColour = colourOff;
	export let name: string = "";
	export let large: boolean = false;
	export let colourIndex = -1;											// only needed for graceful colour search
	export let coloursArray = [ colourOff, colourOff ];
	export let globalColours = [ colourOff, colourOff, colourOff, colourOff ];
	export let isKeyOfScale = false;
	export let resetColour = true;
	export const isOpen = function() { return modalIsOpen; }
	
	export function show()
	{
		modalIsOpen = true;
		dispatchEvent("open");
	}
	
	let modalIsOpen: boolean = false;
	
	let previousHex = hex;
	
	let auxHex: HexColour = colourOff;
	
	let dispatchEvent = createEventDispatcher();
	
	let backgroundColourHex = colourOff;
	
	function modalClose()
	{
		dispatchEvent("close");
		modalIsOpen = false;
		if (resetColour) sysExColourReset();
	}
	
	$:{
		if (colourIndex == -1)
		{
			backgroundColourHex = hex;
		} else {
			backgroundColourHex = gracefulGetColour(colourIndex, coloursArray, globalColours, isKeyOfScale, false);
			auxHex = gracefulGetColour(colourIndex == 0 ? 1 : 0, coloursArray, globalColours, isKeyOfScale, false); // the opposite colour, if available
		}		
		
		if (previousHex != hex)
		{
			previousHex = hex;
			dispatchEvent("input");
		}
	}
</script>

<div class="colourwellholder">
	{#if name}
	<h4>{name}</h4>
	{/if}
	<div class:large class="colourwell" class:nocolour={hex == colourOff} style="background-color: {hexToCSS(backgroundColourHex)}" on:click="{show}"></div>
	{#if modalIsOpen}
	<Colour startHex={backgroundColourHex} bind:hex={hex} auxHex={auxHex} name={name} on:close="{modalClose}" />
	{/if}
</div>