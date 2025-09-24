<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import InnerControl from "./InnerControl.svelte";
	import { Control } from "../ts/types";
	import type { InvokeControlEvent } from "../ts/event_helpers";
	import { filterInvoke } from "../ts/event_helpers";
	import type { BranchControl } from "../ts/types_patch";

	export let dataAll: BranchControl[];
	export let controlNo: number;

	let dispatch = createEventDispatcher();

	if (typeof dataAll == "undefined") {
		dataAll = [{}, {}, {}, {}];
	}

	let data: BranchControl;

	$: {
		data = dataAll?.[controlNo];
	}

	let theElement: HTMLDivElement;

	function dispatchClick() {
		dispatch("click", { encEl: theElement });
	}

	function invokeControl(ev: InvokeControlEvent) {
		filterInvoke(ev, Control.EncRotate, controlNo, dispatchClick);
	}
</script>

<svelte:body on:invoke={invokeControl} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	role="button"
	tabindex="0"
	class="dobrynya-encoder editablecontrol"
	bind:this={theElement}
	on:click={dispatchClick}
>
	{#if data}<InnerControl {data} />{/if}
</div>

<style>
</style>
