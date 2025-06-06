<script lang="ts">
	import OkCancel from "./widgets/OkCancel.svelte";
	import ColourCanned from "./widgets/ColourCanned.svelte";
	import { sysExTestFill } from "midi_core";
	import { onMount, onDestroy, createEventDispatcher } from "svelte";
	import { HexColour, type HexObject } from "./ts/hexcolour";

	export let hex = HexColour.off();
	export let startHex = HexColour.off();
	export let auxHex = HexColour.off();
	export let name: string = "";

	let hexOriginal = HexColour.off();
	let hexWhite = new HexColour(0xf);
	let hexBlack = new HexColour(0x0);

	let theDialog: HTMLDialogElement;

	let range: HexObject = { h: 0, s: 0, v: 0 };
	let previousRangeColour: HexColour = new HexColour(...Object.values(range));

	let dispatchEvent = createEventDispatcher();

	let colourGen: HexColour[] = [];

	let gradS1: string;
	let gradS2: string;
	let gradV: string;

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
				colourGen.push(new HexColour(hg, sg, vLevels[vj][vi]));
			}
		}
	}

	onMount(() => {
		hexOriginal = hex;

		if (startHex.isOn()) {
			hex = new HexColour(startHex);
		}

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

	function ComplimentaryColourStorage(nowHex: HexColour) {
		this.inv = HexColour.off();
		this.dim = HexColour.off();
		this.dimInv = HexColour.off();
		this.wsh = HexColour.off();
		this.wshInv = HexColour.off();

		this.update = function (nowHex: HexColour) {
			this.inv = nowHex.invH();
			this.dim = nowHex.dimV();
			this.dimInv = this.dim.invH();
			this.wsh = nowHex.dimS();
			this.wshInv = this.wsh.invH();

			return this;
		};

		this.update(nowHex);
	}

	let mainComplimentaries = new ComplimentaryColourStorage(hex);
	let auxComplimentaries = new ComplimentaryColourStorage(auxHex);

	$: {
		mainComplimentaries = mainComplimentaries.update(hex);
		auxComplimentaries = auxComplimentaries.update(auxHex);

		const hexObject: HexObject = hex.toObject();

		if (previousRangeColour.isSame(hex)) {
			range = structuredClone(hexObject);
		} else {
			hex = new HexColour(range.h, range.s, range.v);
		}

		previousRangeColour = new HexColour(...Object.values(range));

		gradS1 = hex.desaturate().toCSS();
		gradS2 = hex.maxS().toCSS();
		gradV = hex.maxV().toCSS();

		sysExTestFill(hex);
	}
</script>

<dialog class="coloureditorholder" bind:this={theDialog}>
	<div class="colourselector">
		<div class="colourwellholder">
			<h3 id="modal-colour-name" class="colour-name">{name}</h3>
			<div
				class="colourwell"
				class:nocolour={hex.isOff()}
				style="background-color: {hex.toCSS()}"
			></div>
		</div>
	</div>

	<div class="complementarycolours">
		<div>
			<ColourCanned
				className="colourwell-comp nocolour"
				bind:selectedHex={hex}
			/>
			<ColourCanned
				className="colourwell-comp"
				bind:selectedHex={hex}
				fixedHex={hexBlack}
			/>
			<ColourCanned
				className="colourwell-comp"
				bind:selectedHex={hex}
				fixedHex={hexWhite}
			/>
			<ColourCanned
				className="colourwell-comp"
				bind:selectedHex={hex}
				fixedHex={hexOriginal}
			/>
		</div>
		<br />
		<div>
			<ColourCanned
				fixedHex={mainComplimentaries.wsh}
				bind:selectedHex={hex}
				className="colourwell-comp"
			/>
			<ColourCanned
				fixedHex={mainComplimentaries.dim}
				bind:selectedHex={hex}
				className="colourwell-comp"
			/>
			<ColourCanned
				fixedHex={mainComplimentaries.inv}
				bind:selectedHex={hex}
				className="colourwell-comp"
			/>
			<ColourCanned
				fixedHex={mainComplimentaries.wshInv}
				bind:selectedHex={hex}
				className="colourwell-comp"
			/>
			<ColourCanned
				fixedHex={mainComplimentaries.dimInv}
				bind:selectedHex={hex}
				className="colourwell-comp"
			/>
			{#if auxHex.isOn()}
				<ColourCanned
					fixedHex={auxComplimentaries.wsh}
					bind:selectedHex={hex}
					className="colourwell-comp"
				/>
				<ColourCanned
					fixedHex={auxComplimentaries.dim}
					bind:selectedHex={hex}
					className="colourwell-comp"
				/>
				<ColourCanned
					fixedHex={auxComplimentaries.inv}
					bind:selectedHex={hex}
					className="colourwell-comp"
				/>
				<ColourCanned
					fixedHex={auxComplimentaries.wshInv}
					bind:selectedHex={hex}
					className="colourwell-comp"
				/>
				<ColourCanned
					fixedHex={auxComplimentaries.dimInv}
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
			bind:value={range.h}
		/>
		<input
			type="range"
			class="colour-slider colour-slider-s"
			style="--grads1:{gradS1};--grads2:{gradS2}"
			min="0"
			max="15"
			step="1"
			bind:value={range.s}
		/>
		<input
			type="range"
			class="colour-slider colour-slider-v"
			style="--gradv:{gradV}"
			min="0"
			max="15"
			step="1"
			bind:value={range.v}
		/>
	</div>

	<div class="colourgenholder">
		<div class="colourgen">
			{#each colourGen as colourGenHex}
				<ColourCanned fixedHex={colourGenHex} bind:selectedHex={hex} />
			{/each}
		</div>
	</div>

	<OkCancel
		{theDialog}
		{dispatchEvent}
		resetAction={() => (hex = hexOriginal)}
	/>
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
