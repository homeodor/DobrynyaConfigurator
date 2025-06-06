<svelte:options accessors />

<script lang="ts">
	import { createEventDispatcher } from "svelte";

	import { ColourPaintLayer } from "colour_utils";

	import {
		ctStart,
		ctFinish,
		ctExit,
		assembleLayerFromHexes,
		getLayerFromHexes,
	} from "./common";
	import type { CTData, HexArrays } from "./common";

	import OkCancel from "../widgets/OkCancel.svelte";
	import Preview from "./Preview.svelte";
	import { HexColour } from "src/ts/hexcolour";

	export let ctData: CTData;
	export const isOpen = function () {
		return dialog.open;
	};

	// export let bank: BranchBank, pattern: number[], ctData.layer: ColourPaintLayer;

	let dialog: HTMLDialogElement;

	let dispatchEvent = createEventDispatcher();

	export function start() {
		ctData.hexStorage = ctStart(dialog, ctData);
	} // self-assignments keep Svelte happier
	function finish() {
		ctFinish(dialog, fade, params, ctData);
		dispatchEvent("input");
	}

	interface CTFadeParams {
		saturation: number;
		brightness: number;
		nonzerosaturation: boolean;
		nonzerobrightness: boolean;
		includeExplicit: boolean;
		includeBank: boolean;
	}

	let params: CTFadeParams = {
		saturation: 0,
		brightness: 0,
		nonzerosaturation: true,
		nonzerobrightness: true,
		includeExplicit: true,
		includeBank: false,
	};

	let before: HexColour[] | null = null;
	let after: HexColour[] | null = null;

	// let isSameLayer = false;
	let okEnabled: boolean = true;
	let enableTargetPreview = false;
	// let layerPrev: ColourPaintLayer = ColourPaintLayer.Off;

	$: {
		enableTargetPreview = dialog?.open;

		okEnabled =
			(params.saturation || params.brightness) &&
			(params.includeBank || params.includeExplicit);

		if (ctData.hexStorage) {
			let tempHex: HexArrays = fade(
				params,
				structuredClone(ctData.hexStorage),
				ctData.layer
			);
			before = tempHex.before;
			after = tempHex.after;
		}
	}

	function fade(
		params: CTFadeParams,
		currentHex: HexArrays,
		currentLayer: ColourPaintLayer
	): HexArrays {
		if (currentLayer == ColourPaintLayer.Off) {
			throw new Error("fade called with ColourPaintLayer.Off");
		}

		const multipliersV: number[] = [0.3, 0.5, 0.8, 1, 1.2, 1.8, 2.4];
		const multipliersS: number[] = [0.1, 0.4, 0.7, 1, 1.4, 1.8, 2.4];

		let toPattern = currentLayer == ColourPaintLayer.Pattern;

		let multiplyS = multipliersS[params.saturation + 3];
		let multiplyV = multipliersV[params.brightness + 3];

		currentHex.before = assembleLayerFromHexes(currentHex, currentLayer);

		let processValue = function (v: number, mult: number) {
			v = Math.round(mult * v);
			if (v > 0xf) v = 0xf;
			if (v == 0 && params.nonzerobrightness) v = 1;
			return v;
		};

		let doAllTransforms = function (col: HexColour): HexColour {
			if (col.isOff()) {
				return col;
			}

			return new HexColour(
				col.h,
				processValue(col.v, multiplyV),
				processValue(col.s, multiplyS)
			);
		};

		if (params.includeBank && !toPattern)
			currentHex.bank[currentLayer] = doAllTransforms(
				currentHex.bank[currentLayer]
			);

		if (params.includeExplicit) {
			let arrFrom = getLayerFromHexes(currentHex, currentLayer);

			for (let i in arrFrom) {
				if (arrFrom[i].isOff()) {
					continue;
				}

				if (currentLayer == ColourPaintLayer.Pattern)
					currentHex.pattern[i] = doAllTransforms(arrFrom[i]);
				else
					currentHex.pads[currentLayer][i] = doAllTransforms(
						arrFrom[i]
					);
			}
		}

		currentHex.after = assembleLayerFromHexes(currentHex, currentLayer);

		return currentHex;
	}
</script>

<dialog bind:this={dialog} class="dw-colour-toolmodal modal">
	<h2>Fade and brighten</h2>
	<p>Scale the colours up or down.</p>
	<Preview {before} {after} {enableTargetPreview} />
	<fieldset>
		<legend>Brightness</legend>
		<p>
			<input
				min={-3}
				max={3}
				bind:value={params.brightness}
				type="range"
			/>
		</p>
		<label>
			<input type="checkbox" bind:checked={params.nonzerobrightness} />
			Never go to zero</label
		>
	</fieldset>
	<fieldset>
		<legend>Saturation</legend>
		<p>
			<input
				min={-3}
				max={3}
				bind:value={params.saturation}
				type="range"
			/>
		</p>
		<label>
			<input type="checkbox" bind:checked={params.nonzerosaturation} />
			Never go to zero</label
		>
	</fieldset>

	<fieldset>
		<legend>Options</legend>
		<div class="checkboxblock">
			<label
				><input type="checkbox" bind:checked={params.includeExplicit} />
				Apply to explicitly set colours</label
			>
			<br />
			<label
				><input type="checkbox" bind:checked={params.includeBank} />
				Apply to the bank colour</label
			>
		</div>
	</fieldset>

	<OkCancel
		okDisabled={!okEnabled}
		theDialog={dialog}
		on:ok={finish}
		on:cancel={() => ctExit(dialog, ctData)}
		on:cancel
	/>
</dialog>
