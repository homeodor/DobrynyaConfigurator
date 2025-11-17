<script lang="ts">
	import InnerControl from "./InnerControl.svelte";
	import { Control } from "../ts/types";
	import type { InvokeControlData } from "../ts/event_helpers";
	import { filterInvoke } from "../ts/event_helpers";
	import type { BranchControl } from "../ts/types_patch";

	let {
		dataAll,
		controlNo,
		onclick,
	}: {
		dataAll: BranchControl[];
		controlNo: number;
		onclick: (element: HTMLDivElement) => void;
	} = $props();

	if (typeof dataAll == "undefined") {
		dataAll = [{}, {}, {}, {}];
	}

	let data: BranchControl = $derived(dataAll?.[controlNo]);

	let theElement: HTMLDivElement;

	function dispatchClick() {
		onclick(theElement);
	}

	function invokeControl(ev: CustomEvent<InvokeControlData>) {
		filterInvoke(ev, Control.EncRotate, controlNo, dispatchClick);
	}
</script>

<svelte:body oninvoke={invokeControl} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	role="button"
	tabindex="0"
	class="dobrynya-encoder editablecontrol"
	bind:this={theElement}
	onclick={dispatchClick}
>
	{#if data}<InnerControl {data} />{/if}
</div>

<style>
</style>
