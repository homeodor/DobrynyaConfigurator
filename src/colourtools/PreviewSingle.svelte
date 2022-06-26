<script lang="ts">
	import { sysExTestPattern } from '../midi';
	import { hexToCSS } from '../colour_utils'
	export let hexArray: number[] | null = null;
	export let inline = false;
	export let targetPreview = false;
	
	$:{
		if (targetPreview) sysExTestPattern(hexArray);
	}
</script>

{#if hexArray}
<div id="ct-preview-before" class="patternpreview" style="{inline?'display:inline-flex':''}">
{#each hexArray as hex}
	<span style="background-color:{hexToCSS(hex)}"></span>
{/each}
</div>
{/if}