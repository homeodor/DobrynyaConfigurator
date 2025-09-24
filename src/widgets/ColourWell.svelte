<script lang="ts">
	import { sysExColourReset } from "../ts/midi_core";
	import type { HexColour } from "../ts/types";
	import { colourOff, hexToCSS, gracefulGetColour } from "../ts/colour_utils";
	import Colour from "../Colour.svelte";

	let {
		hex = colourOff,
		name = "",
		large = false,
		colourIndex = -1,
		coloursArray = [colourOff, colourOff],
		globalColours = [colourOff, colourOff, colourOff, colourOff],
		isKeyOfScale = false,
		resetColour = true,
		onopen = () => {},
		onclose = () => {},
		oninput = () => {},
	}: {
		hex: HexColour;
		name?: string;
		large?: boolean;
		colourIndex?: number;
		coloursArray?: HexColour[];
		globalColours?: HexColour[];
		isKeyOfScale?: boolean;
		resetColour?: boolean;
		onopen?: () => void;
		onclose?: () => void;
		oninput?: () => void;
	} = $props();

	export const isOpen = function () {
		return modalIsOpen;
	};

	export function show() {
		modalIsOpen = true;
		onopen();
	}

	let modalIsOpen = $state<boolean>(false);

	let previousHex = hex;

	function modalClose() {
		onclose();
		modalIsOpen = false;
		if (resetColour) sysExColourReset();
	}

	let backgroundColourHex = $derived(
		colourIndex == -1
			? hex
			: gracefulGetColour(
					colourIndex,
					coloursArray,
					globalColours,
					isKeyOfScale,
					false
				)
	);

	let auxHex = $derived(
		colourIndex == -1
			? colourOff
			: gracefulGetColour(
					colourIndex == 0 ? 1 : 0,
					coloursArray,
					globalColours,
					isKeyOfScale,
					false
				)
	);

	$effect(() => {
		hex;
		oninput();
	});
</script>

<div class="colourwellholder">
	{#if name}
		<h4>{name}</h4>
	{/if}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		class:large
		class="colourwell"
		class:nocolour={hex == colourOff}
		style="background-color: {hexToCSS(backgroundColourHex)}"
		onclick={show}
	></div>
	{#if modalIsOpen}
		<Colour
			startHex={backgroundColourHex}
			bind:hex
			{auxHex}
			{name}
			onclose={modalClose}
		/>
	{/if}
</div>

<style>
	.colourwellholder {
		display: inline-block;
		padding: 0 1em 1em 1em;
	}
	.colourwell {
		display: inline-block;
		width: 5em;
		height: 5em;
		box-shadow:
			inset 0.2em 0.2em 0.4em rgba(0, 0, 0, 0.3),
			inset -0.2em -0.2em 0.4em rgba(255, 255, 255, 0.1);
		border-radius: 0.5em;
		transition: background-color 0.1s;
	}
	.colourwell.large {
		width: 7em;
		height: 7em;
	}
</style>
