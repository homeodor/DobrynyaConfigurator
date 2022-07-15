<script lang="ts">
	import { isSame } from '../basic'
	import PreviewSingle from './PreviewSingle.svelte';
	
	export let enableTargetPreview = false;
	export let before: number[] | null = null;
	export let after:  number[] | null = null;
	
	let noChange = true;
	
	let possibleTarget: PreviewSingle;
	
	export const updatePreview = () => possibleTarget.updatePreview();
	
	$: noChange = (isSame(before,after));
</script>

<div id="ct-preview">
	<PreviewSingle hexArray={before} />
	<div style="width:1em">{#if noChange}<span style="color:orange">=</span>{:else}→{/if}</div>
	<PreviewSingle bind:this={possibleTarget} targetPreview={enableTargetPreview} hexArray={after} />
</div>