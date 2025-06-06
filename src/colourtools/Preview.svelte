<script lang="ts">
	import { isSame } from "basic";
	import PreviewSingle from "./PreviewSingle.svelte";
	import type { ColourArray } from "src/ts/hexcolour";

	export let enableTargetPreview = false;
	export let before: ColourArray | null = null;
	export let after: ColourArray | null = null;

	let noChange = true;

	let possibleTarget: PreviewSingle;

	export const updatePreview = () => possibleTarget.updatePreview();

	$: noChange = isSame(before, after);
</script>

<div id="ct-preview">
	<PreviewSingle hexArray={before} />
	<div style="width:1em">
		{#if noChange}<span style="color:orange">=</span>{:else}→{/if}
	</div>
	<PreviewSingle
		bind:this={possibleTarget}
		targetPreview={enableTargetPreview}
		hexArray={after}
	/>
</div>
