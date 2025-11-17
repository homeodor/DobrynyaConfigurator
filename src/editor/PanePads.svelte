<script lang="ts">
	import Pads from "./Pads.svelte";
	import Encoder from "./Encoder.svelte";
	import { Control } from "../ts/types";
	import type {
		CurrentEditorState,
		CurrentPatchInfo,
	} from "../ts/patch.svelte";
	import { deviceDefinition } from "../ts/device";
	import type { InvokeControlData } from "../ts/event_helpers";
	import { ColourPaintLayer } from "../ts/colour_utils.svelte";
	import Accelerometer from "./Accelerometer.svelte";

	let {
		openEditor,
		onPaint,
		currentPatch,
		colourPaintMode,
		colourPaintShowBank,
		editorState,
	}: {
		openEditor: (element: HTMLElement, kind: Control, i: number) => void;
		onPaint: (data: InvokeControlData) => void;
		currentPatch: CurrentPatchInfo;
		colourPaintMode: ColourPaintLayer;
		colourPaintShowBank: boolean;
		editorState: CurrentEditorState;
	} = $props();

	let pocket = $derived<boolean>($deviceDefinition.model.code == "pocket");
</script>

<div
	class="dobrynya-encoders"
	data-control-name="Encoder"
	data-control-type="encrotate"
>
	{#if pocket}
		<div class="balance-accel-div">
			<Accelerometer dataAll={currentPatch.data!.accel!} {openEditor} />
		</div>
	{/if}
	<Encoder
		onclick={encEl => openEditor(encEl, Control.EncRotate, 0)}
		controlNo={0}
		dataAll={currentPatch.data!.encoders}
	/>
	<Encoder
		onclick={encEl => openEditor(encEl, Control.EncRotate, 1)}
		controlNo={1}
		dataAll={currentPatch.data!.encoders}
	/>
	{#if $deviceDefinition.model.hardware!.encoders! >= 3}<Encoder
			onclick={encEl => openEditor(encEl, Control.EncRotate, 2)}
			controlNo={2}
			dataAll={currentPatch.data!.encoders}
		/>{/if}
	{#if $deviceDefinition.model.hardware!.encoders! >= 4}<Encoder
			onclick={encEl => openEditor(encEl, Control.EncRotate, 3)}
			controlNo={3}
			dataAll={currentPatch.data!.encoders}
		/>{/if}

	{#if pocket}
		<div class="balance-accel-div">&nbsp;</div>
	{/if}
</div>

<Pads
	{openEditor}
	{onPaint}
	bank={currentPatch?.data?.padbanks?.[editorState.hand][editorState.bank]!}
	pattern={currentPatch.data!.info.pattern}
	{colourPaintMode}
	{colourPaintShowBank}
/>

<style>
	.balance-accel-div {
		flex-grow: 1;
		flex-basis: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
