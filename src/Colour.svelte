<script lang="ts">
	import OkCancel from "./widgets/OkCancel.svelte";
	import ColourCanned from "./widgets/ColourCanned.svelte";
	import { sysExTestFill } from "./ts/midi_core";
	import { onMount, onDestroy } from "svelte";
	import {
		colourOff,
		hexToObj,
		hsvToHex,
		hexToCSS,
		invH,
		dimV,
		dimS,
	} from "./ts/colour_utils.svelte";
	import { isSame } from "./ts/basic";
	import type { HexColour, HexObject } from "./ts/types";

	let {
		hex = $bindable(colourOff),
		startHex = colourOff,
		auxHex = colourOff,
		name = "",
		onclose = () => {},
	}: {
		hex: HexColour;
		startHex: HexColour;
		auxHex: HexColour;
		name: string;
		onclose?: () => void;
	} = $props();

	let hexOriginal: number = colourOff;
	const hexWhite: number = 0xf;
	const hexBlack: number = 0x0;

	let theDialog: HTMLDialogElement;

	let colourGen: number[] = [];

	const vLevels = [
		[15, 8, 5, 3],
		[15, 8, 5, 3],
		[13, 7, 5, 3],
		[11, 6, 4, 3],
	];

	let vj = 0;

	for (let sg: number = 15; sg >= 3; sg -= 4, vj++) {
		for (let vi: number = 0; vi < 4; vi++) {
			// from vLevels array
			for (let hg: number = 0; hg < 256; hg += 8) {
				colourGen.push(hsvToHex(hg, sg, vLevels[vj][vi]));
			}
		}
	}

	onMount(() => {
		hexOriginal = hex;
		if (startHex != colourOff) hex = startHex;
		theDialog.showModal();
	});

	onDestroy(() => theDialog.close());

	// async function dispatchAndClose(isOK: boolean)
	// {
	// 	if (!isOK) hex = hexOriginal;
	// 	await tick();
	// 	theDialog.close();
	// 	dispatchEvent("close");
	// }

	class ComplimentaryColourStorage {
		inv: HexColour = colourOff;
		dim: HexColour = colourOff;
		dimInv: HexColour = colourOff;
		wsh: HexColour = colourOff;
		wshInv: HexColour = colourOff;

		constructor(nowHex: number) {
			this.inv = invH(nowHex);
			this.dim = dimV(nowHex);
			this.dimInv = invH(this.dim);
			this.wsh = dimS(nowHex);
			this.wshInv = invH(this.wsh);
		}
	}

	let mainComplimentaries = $derived.by(
		() => new ComplimentaryColourStorage(hex)
	);
	let auxComplimentaries = $derived.by(
		() => new ComplimentaryColourStorage(auxHex)
	);

	//let hexObject = $derived.by(() => hexToObj(hex));

	let range = $derived.by(() => hexToObj(hex));

	function updateHexFromRange() {
		hex = hsvToHex(range.h, range.s, range.v);
	}

	$effect(() => {
		sysExTestFill(hex);
	});

	let cssColurs = $derived.by(() => {
		const hexObject = hexToObj(hex);

		return {
			gradS1: hexToCSS(hsvToHex(hexObject.h, 0, hexObject.v)),
			gradS2: hexToCSS(hsvToHex(hexObject.h, 15, hexObject.v)),
			gradV: hexToCSS(hsvToHex(hexObject.h, hexObject.s, 15)),
		};
	});
</script>

<dialog class="coloureditorholder" bind:this={theDialog}>
	<div class="colourselector">
		<div class="colourwellholder">
			<h3 id="modal-colour-name" class="colour-name">{name}</h3>
			<div
				class="colourwell"
				class:nocolour={hex == colourOff}
				style="background-color: {hexToCSS(hex)}"
			></div>
		</div>
	</div>

	<div class="complementarycolours">
		<div>
			<ColourCanned
				className="colourwell-comp nocolour"
				bind:selectedHex={hex}
				hex={colourOff}
			/>
			<ColourCanned
				className="colourwell-comp"
				bind:selectedHex={hex}
				hex={hexBlack}
			/>
			<ColourCanned
				className="colourwell-comp"
				bind:selectedHex={hex}
				hex={hexWhite}
			/>
			<ColourCanned
				className="colourwell-comp"
				bind:selectedHex={hex}
				hex={hexOriginal}
			/>
		</div>
		<br />
		<div>
			<ColourCanned
				hex={mainComplimentaries.wsh}
				bind:selectedHex={hex}
				className="colourwell-comp"
			/>
			<ColourCanned
				hex={mainComplimentaries.dim}
				bind:selectedHex={hex}
				className="colourwell-comp"
			/>
			<ColourCanned
				hex={mainComplimentaries.inv}
				bind:selectedHex={hex}
				className="colourwell-comp"
			/>
			<ColourCanned
				hex={mainComplimentaries.wshInv}
				bind:selectedHex={hex}
				className="colourwell-comp"
			/>
			<ColourCanned
				hex={mainComplimentaries.dimInv}
				bind:selectedHex={hex}
				className="colourwell-comp"
			/>
			{#if auxHex != colourOff}
				<ColourCanned
					hex={auxComplimentaries.wsh}
					bind:selectedHex={hex}
					className="colourwell-comp"
				/>
				<ColourCanned
					hex={auxComplimentaries.dim}
					bind:selectedHex={hex}
					className="colourwell-comp"
				/>
				<ColourCanned
					hex={auxComplimentaries.inv}
					bind:selectedHex={hex}
					className="colourwell-comp"
				/>
				<ColourCanned
					hex={auxComplimentaries.wshInv}
					bind:selectedHex={hex}
					className="colourwell-comp"
				/>
				<ColourCanned
					hex={auxComplimentaries.dimInv}
					bind:selectedHex={hex}
					className="colourwell-comp"
				/>
			{/if}
		</div>
	</div>

	<div id="modal-colour-sliders">
		<input
			type="range"
			class="colour-slider colour-slider-h"
			min="0"
			max="254"
			step="1"
			oninput={updateHexFromRange}
			bind:value={range.h}
		/>
		<input
			type="range"
			class="colour-slider colour-slider-s"
			style="--grads1:{cssColurs.gradS1};--grads2:{cssColurs.gradS2}"
			min="0"
			max="15"
			step="1"
			oninput={updateHexFromRange}
			bind:value={range.s}
		/>
		<input
			type="range"
			class="colour-slider colour-slider-v"
			style="--gradv:{cssColurs.gradV}"
			min="0"
			max="15"
			step="1"
			oninput={updateHexFromRange}
			bind:value={range.v}
		/>
	</div>

	<div class="colourgenholder">
		<div class="colourgen">
			{#each colourGen as colourGenHex}
				<ColourCanned hex={colourGenHex} bind:selectedHex={hex} />
			{/each}
		</div>
	</div>

	<OkCancel {theDialog} resetAction={() => (hex = hexOriginal)} {onclose} />
</dialog>

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
	}
</style>
