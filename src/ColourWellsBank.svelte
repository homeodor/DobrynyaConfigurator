<script lang="ts">
	import { k_coloursPerBank } from "./ts/colour_utils";
	import { HexColour } from "./ts/hexcolour";
	import type { PatchColourArray } from "./ts/types_patch";
	import ColourWell from "./widgets/ColourWell.svelte";

	export let colours: PatchColourArray;

	let hexColours = colours.map(c => new HexColour(c));
	let previousHexColours = colours.map(c => new HexColour(c));

	$: {
		if (colours.length !== k_coloursPerBank) {
			throw new Error(
				`ColourWellsBank must have ${k_coloursPerBank} colours`
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
	<ColourWell on:input name="Idle" bind:hex={hexColours[0]} />
	<ColourWell on:input name="Active" bind:hex={hexColours[1]} />
	<br />
	<ColourWell on:input name="Root Note" bind:hex={hexColours[2]} />
	<ColourWell on:input name="Root Active" bind:hex={hexColours[3]} />
</div>
