<script lang="ts">
	import { sysExTestPattern } from "midi_core";
	import type { ColourArray } from "src/ts/hexcolour";

	export let hexArray: ColourArray | null = null;
	export let inline = false;
	export let targetPreview = false;

	export function updatePreview() {
		sysExTestPattern(hexArray);
	}

	$: {
		hexArray = hexArray;
		if (targetPreview) {
			updatePreview();
		}
	}
</script>

{#if hexArray}
	<div
		id="ct-preview-before"
		class="patternpreview"
		style={inline ? "display:inline-flex" : ""}
	>
		{#each hexArray as hex}
			<span style="background-color:{hex.toCSS()}"></span>
		{/each}
	</div>
{/if}
