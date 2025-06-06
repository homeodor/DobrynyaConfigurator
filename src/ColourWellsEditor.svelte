<script lang="ts">
	import { k_coloursPerPad } from "./ts/colour_utils";
	import { type ColourArray, HexColour } from "./ts/hexcolour";
	import type { PatchColourArray } from "./ts/types_patch";
	import ColourWell from "./widgets/ColourWell.svelte";

	export let colours: PatchColourArray;

	export let globalColours: ColourArray;
	export let isKeyOfScale: boolean;

	let hexColours = colours.map(c => new HexColour(c));
	let previousHexColours = colours.map(c => new HexColour(c));

	$: {
		if (colours.length !== k_coloursPerPad) {
			throw new Error(
				`ColourWellsBank must have ${k_coloursPerPad} colours`
			);
		}

		for (const i in hexColours) {
			if (hexColours[i].hex !== previousHexColours[i].hex) {
				colours[i] = hexColours[i].hex;
			}
		}

		hexColours = colours.map(c => new HexColour(c));
		previousHexColours = colours.map(c => new HexColour(c));
	}
</script>

<div class="colourselector">
	<ColourWell
		on:input
		name="Idle"
		bind:hex={hexColours[0]}
		coloursArray={hexColours}
		{isKeyOfScale}
		{globalColours}
		colourIndex={0}
	/>
	<ColourWell
		on:input
		name="Active"
		bind:hex={hexColours[1]}
		coloursArray={hexColours}
		{isKeyOfScale}
		{globalColours}
		colourIndex={1}
	/>
</div>
