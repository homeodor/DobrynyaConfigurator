<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { colourOff, hexToCSS, isSameColour } from 'colour_utils';
	
	const dispatch = createEventDispatcher();

	export let className: string = "";
	export let selectedHex: number = colourOff;
	export let hex: number = colourOff;
	
	function thisHex(ev: MouseEvent)
	{
		if (ev.type == "click" || ev.buttons & 0x1) selectedHex = hex;
	}
	
</script>

	<!-- svelte-ignore a11y-mouse-events-have-key-events --><!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class={className} class:thecolour={isSameColour(hex,selectedHex)} style="background-color: {hexToCSS(hex)}" on:click={thisHex} on:mouseover={thisHex}></div>