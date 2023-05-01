<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import InnerControl from './InnerControl.svelte';
	import { Control } from 'types';
	import type { InvokeControlEvent } from 'event_helpers'
	import { filterInvoke } from 'event_helpers'
	import type { BranchControl } from 'types_patch'
		
	export let dataAll: BranchControl[];
	export let controlNo: number;
	
	let dispatch = createEventDispatcher();
	
	if (typeof dataAll == "undefined")
	{
		dataAll = [{},{},{},{}];
	}
	
	let data: BranchControl;
	
	$: {
		data = dataAll?.[controlNo];
	}
	
	let theElement: HTMLDivElement;
	
	function dispatchClick() { dispatch('click',{encEl: theElement}); }
	
	function invokeControl(ev: InvokeControlEvent)
	{
		filterInvoke(ev, Control.EncRotate, controlNo, dispatchClick);
	}

</script>

<svelte:body on:invoke={invokeControl}></svelte:body>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="dobrynya-encoder editablecontrol" bind:this={theElement} on:click={dispatchClick}>
	{#if data}<InnerControl {data} />{/if}
</div>