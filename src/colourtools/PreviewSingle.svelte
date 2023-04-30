<script lang="ts">
	import { sysExTestPattern } from 'midi_core';
	import { hexToCSS } from 'colour_utils'
	export let hexArray: number[] | null = null;
	export let inline = false;
	export let targetPreview = false;
	
	export function updatePreview() { sysExTestPattern(hexArray) }
	
	$:{
		hexArray = hexArray;
		if (targetPreview)
		{
			updatePreview();
		}
	}
</script>

{#if hexArray}
<div id="ct-preview-before" class="patternpreview" style="{inline?'display:inline-flex':''}">
{#each hexArray as hex}
	<span style="background-color:{hexToCSS(hex)}"></span>
{/each}
</div>
{/if}