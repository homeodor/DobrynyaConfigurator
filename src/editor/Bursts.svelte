<script lang="ts">
	import { flagToArray, arrayToFlag } from "../ts/data_utils";
	import { sleep } from "../ts/basic";
	import { patchChanged } from "../ts/event_helpers";
	import * as utils from "../ts/bursts";

	import Halp from "../widgets/Halp.svelte";
	import PaletteCheckboxes from "../widgets/PaletteCheckboxes.svelte";

	let { burst = $bindable<number>() } = $props();

	function getKind(i: number): boolean {
		return (burst >>> (i + 16)) & 1 ? true : false;
	}

	function setKind(i: number, val: boolean): void {
		const offset = i + 16;

		if (val) {
			burst |= 1 << offset;
		} else {
			burst &= ~(1 << offset);
		}
		patchChangedOverTick();
	}

	function getPaletteFlags(): boolean[] {
		let burstFlagPalette = [
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
		];
		flagToArray(burstFlagPalette, utils.burstToPaletteFlags(burst));
		return burstFlagPalette;
	}

	function setPaletteFlags(flags: boolean[]): void {
		const palettes = arrayToFlag(flags);
		burst = (burst & 0xffff00ff) | (palettes << 8);
		patchChangedOverTick();
	}

	function getMode(): number {
		return utils.burstToMode(burst);
	}

	function setMode(mode: number): void {
		if (mode == 0) {
			burst = 0;
			return;
		}

		if (getMode() == 0 && mode != 0) {
			burst |= 0xffff00; // enable all modes and palettes
		}

		burst = (burst & 0xffffff00) | mode;
		patchChangedOverTick();
	}

	let noMode = $derived(getMode() === 0);
	let noPalettesMode = $derived(getMode() < utils.k_palettesUsedFromMode);

	async function patchChangedOverTick() {
		await sleep(5);
		patchChanged();
	}
</script>

<fieldset>
	<legend
		>Bursts
		<Halp
			>A “burst” is a quick fun animation triggered by a button press.</Halp
		>
	</legend>

	<div class="ce-block">
		<div class="likep">
			Colour mode
			<Halp>
				<p>
					Bursts can be of many different colours and tints. You can
					just pick a setting you like or be really precise in your
					artistic expression (if you want something very certain for
					your performance, for instance).
				</p>
				<p>
					<i>Preset colours</i> are just that: fixed bright colours. White
					is pure white, and vivid are yellow, cyan and magenta colours.
				</p>
				<p>
					<i>Pad’s colour</i> will make bursts using the same colour as
					the pad when pressed.
				</p>
				<p>
					<i>Colours from palettes</i> make the bursts most varied, but
					can also be precisely controlled. You can have it as chaotic
					or as precise as you wish. The bursts will use the palettes chosen,
					including custom ones (if available).
				</p>
				<p>
					With <i>Single colour</i>, the burst will have only one
					colour from a selected palette while playing;
					<i>Rolling colour</i>
					means that the burst colour will evolve through the whole palette;
					<i>Random colour</i> is, well, a random colour from a palette.
				</p>
				<p>
					The starting colour in the Rolling mode can be chosen in
					different ways. By default, it will be the first colour of
					the palette. The <i>random</i>
					will pick a different colour each time, and the
					<i>mapped to pad</i>
					will map all sixteen palette colours to the corresponding pads.
				</p>
				<p>
					The <i>random</i> and <i>mapped to pad</i> colour selection modes
					are also applicable to Single colour options.
				</p>
			</Halp>
		</div>
		<select bind:value={getMode, setMode}>
			<option value={0}>None (bursts disabled)</option>
			<optgroup label="Preset colour">
				<option value={1}>Plain white</option>
				<option value={2}>Vivid colours</option>
				<option value={3}>White and vivid</option>
			</optgroup>
			<optgroup label="Pad’s colour">
				<option value={4}>Active colour</option>
				<!-- <option value="5">Burst colour</option> -->
			</optgroup>
			<optgroup label="Colour from palettes">
				<option value={6}>Single colour, mapped to pad number</option>
				<option value={7}>Single colour, random</option>
				<option value={8}>Rolling colour</option>
				<option value={9}>Rolling colour, start mapped to pad</option>
				<option value={10}>Rolling colour, random start</option>
				<option value={11}>Random colours</option>
				<option value={12}>Any of these, surprise me</option>
			</optgroup>
		</select>
	</div>
	<div class="ce-block">
		<p class:disabled={noMode}>Animations</p>
		<div class="checkboxblock">
			<label
				><input
					disabled={noMode}
					type="checkbox"
					bind:checked={
						() => getKind(0), (v: boolean) => setKind(0, v)
					}
				/> <mark>Shockwave</mark></label
			><br />
			<label
				><input
					disabled={noMode}
					type="checkbox"
					bind:checked={
						() => getKind(1), (v: boolean) => setKind(1, v)
					}
				/> <mark>Star</mark></label
			><br />
			<label
				><input
					disabled={noMode}
					type="checkbox"
					bind:checked={
						() => getKind(2), (v: boolean) => setKind(2, v)
					}
				/> <mark>Isotope</mark></label
			><br />
			<label
				><input
					disabled={noMode}
					type="checkbox"
					bind:checked={
						() => getKind(3), (v: boolean) => setKind(3, v)
					}
				/> <mark>Projectile</mark></label
			><br />
			<label
				><input
					disabled={noMode}
					type="checkbox"
					bind:checked={
						() => getKind(4), (v: boolean) => setKind(4, v)
					}
				/> <mark>Billiards</mark></label
			><br />
			<label
				><input
					disabled={noMode}
					type="checkbox"
					bind:checked={
						() => getKind(5), (v: boolean) => setKind(5, v)
					}
				/> <mark>Firecracker</mark></label
			><br />
		</div>
	</div>

	<PaletteCheckboxes
		bind:flags={getPaletteFlags, setPaletteFlags}
		disabled={noPalettesMode}
	/>
</fieldset>
