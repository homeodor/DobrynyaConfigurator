<script lang="ts">
	import Pads from "./Pads.svelte";
	import Encoder from "./Encoder.svelte";
	import { Control } from "src/ts/types";
	import type { CurrentEditorState, CurrentPatchInfo } from "src/ts/patch";
	import { deviceDefinition } from "src/ts/device";
	import type { InvokeControlEventData } from "src/ts/event_helpers";
	import { ColourPaintLayer } from "src/ts/colour_utils";

	export let openEditor: (
		element: HTMLElement,
		kind: Control,
		i: number
	) => void;
	export let currentPatch: CurrentPatchInfo;
	export let paintData: InvokeControlEventData;
	export let colourPaintMode: ColourPaintLayer;
	export let colourPaintShowBank: boolean;
	export let editorState: CurrentEditorState;

	function openEditorForPad(ev: CustomEvent) {
		openEditor(
			ev.detail.target as HTMLElement,
			ev.detail.controlKind as Control,
			ev.detail.controlNo as number
		);
	}
</script>

<div
	class="dobrynya-encoders"
	data-control-name="Encoder"
	data-control-type="encrotate"
>
	<Encoder
		on:click={ev => openEditor(ev.detail.encEl, Control.EncRotate, 0)}
		controlNo={0}
		dataAll={currentPatch.data.encoders}
	/>
	<Encoder
		on:click={ev => openEditor(ev.detail.encEl, Control.EncRotate, 1)}
		controlNo={1}
		dataAll={currentPatch.data.encoders}
	/>
	{#if $deviceDefinition.model.hardware.encoders >= 3}<Encoder
			on:click={ev => openEditor(ev.detail.encEl, Control.EncRotate, 2)}
			controlNo={2}
			dataAll={currentPatch.data.encoders}
		/>{/if}
	{#if $deviceDefinition.model.hardware.encoders >= 4}<Encoder
			on:click={ev => openEditor(ev.detail.encEl, Control.EncRotate, 3)}
			controlNo={3}
			dataAll={currentPatch.data.encoders}
		/>{/if}
</div>

<Pads
	on:click={openEditorForPad}
	on:paint={ev => (paintData = ev.detail)}
	bank={currentPatch?.data?.padbanks?.[editorState.hand][editorState.bank]}
	pattern={currentPatch.data.info.pattern}
	{colourPaintMode}
	{colourPaintShowBank}
/>
