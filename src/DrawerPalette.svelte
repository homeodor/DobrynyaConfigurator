<script lang="ts">
	import * as BSON from 'bson'
	import { onDestroy } from 'svelte'
	
	import { patchChanged, openPatternEditor } from 'event_helpers';
	import { patchAsFileFromData, getPatch, arrayToFlag, flagToArray } from 'data_utils'
	import { ExpanderSanizer } from 'data_expandsanize'
	
	import PaletteSquare from './widgets/PaletteSquare.svelte';
	import PaletteThief from './PaletteThief.svelte';
	import type { Model } from 'device';
	import type { Patch, BranchSettings } from 'types_patch'
	
	import Halp from './widgets/Halp.svelte';
	import PaletteCheckboxes from './widgets/PaletteCheckboxes.svelte';
	

	
	import type { CurrentPatchInfo } from 'patch'
	
	let paletteThief: PaletteThief;
	
	export let currentPatch: CurrentPatchInfo;
	export let model: Model;
	
	let paletteNow: string[] = 
	[
		"#ff0000", "#ff0000", "#000000", "#000000",
		"#000000", "#000000", "#000000", "#000000",
		"#000000", "#000000", "#00ff00", "#000000",
		"#000000", "#000000", "#000000", "#000000",
	];
	
	const patchSettingsModel: BranchSettings = 
	{
		burst: 0,
		encreset: false,
		subdbl: false,
		subhold: false,
		shhold: false,
		shdblsubbank: 3,
		desc: "",
	};
	
	let expanderSanizer = new ExpanderSanizer(
	// @ts-ignore
	{ model: patchSettingsModel			// data will be attached in reactive block
		},
		() =>
		{
			if (currentPatch.data.info.desc && currentPatch.data.info.desc.trim() == "") delete currentPatch.data.info.desc;
		} // cleanup function
	);
	
	onDestroy(()=>expanderSanizer.kill());
	

	
	$:
	{

	}
</script>

<div class="drawer columnizer-in" id="dw-palette">
	<p>Palette editor lets you add up to four custom palettes either globally or per patch. Those palettes
		can be used for bursts and idle animations.
	</p>
	<p>
	<button on:click="{()=>paletteThief.start()}">Steal...</button>
	<PaletteThief bind:this={paletteThief} bind:value={paletteNow} />
	</p>
	{#each paletteNow as _, i }
	<PaletteSquare bind:value={paletteNow[i]} />
	{/each}
</div>