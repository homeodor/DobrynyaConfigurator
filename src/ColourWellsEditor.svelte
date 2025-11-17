<script lang="ts">
	import type { ColourArray } from "./ts/types";
	import ColourWell from "./widgets/ColourWell.svelte";

	let {
		colours = $bindable<ColourArray>(),
		globalColours,
		oninput,
		isKeyOfScale,
	}: {
		colours: ColourArray;
		globalColours: ColourArray;
		oninput: () => void;
		isKeyOfScale: boolean;
	} = $props();
</script>

<div class="colourselector">
	<ColourWell
		{oninput}
		name="Idle"
		bind:hex={colours[0]}
		coloursArray={colours}
		{isKeyOfScale}
		{globalColours}
		colourIndex={0}
	/>
	<ColourWell
		{oninput}
		name="Active"
		bind:hex={colours[1]}
		coloursArray={colours}
		{isKeyOfScale}
		{globalColours}
		colourIndex={1}
	/>
</div>
