<script lang="ts">
	// import { createEventDispatcher } from 'svelte';;

	import Pad from "./Pad.svelte";

	import type { ColourPaintLayer } from "../ts/colour_utils.svelte";
	import type { ColourArray, Control, Pattern } from "../ts/types";
	import type { BranchBank, BranchControl } from "../ts/types_patch";
	import { getNoteInCurrentScale } from "../ts/midi_utils";
	import { numberOfPads } from "../ts/data_utils";
	import type { InvokeControlData } from "../ts/event_helpers";

	let {
		openEditor,
		onPaint,
		pattern,
		bank,
		colourPaintMode,
		colourPaintShowBank,
	}: {
		openEditor: (element: HTMLElement, kind: Control, i: number) => void;
		onPaint: (data: InvokeControlData) => void;
		pattern: Pattern;
		bank: BranchBank;
		colourPaintMode: ColourPaintLayer;
		colourPaintShowBank: boolean;
	} = $props();

	interface PadObject {
		object: BranchControl | null;
		scaleNote: number;
		isKeyOfScale: boolean;
	}

	let pads = $derived.by<PadObject[]>(() => {
		let pads = [];

		for (let i = 0; i < numberOfPads; i++) {
			let noteInfo = getNoteInCurrentScale(i, bank);

			pads.push({
				object: bank?.pads?.[i] ?? null,
				scaleNote: noteInfo.note,
				isKeyOfScale: noteInfo.isKeyOfScale,
			});
		}

		return pads;
	});

	let globalColours = $derived<ColourArray>(bank?.bank?.colour ?? []);
</script>

<div
	class="dobrynya-pads"
	id="pads-left"
	data-control-name="Pad"
	data-control-type="pad"
>
	{#each pads as pad, i}
		<Pad
			{openEditor}
			{onPaint}
			data={pad.object}
			controlNo={i}
			{globalColours}
			isKeyOfScale={pad.isKeyOfScale}
			pattern={pattern[i]}
			scaleNote={pad.scaleNote}
			{colourPaintMode}
			{colourPaintShowBank}
		/>
	{/each}
</div>
