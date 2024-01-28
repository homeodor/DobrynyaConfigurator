<script lang="ts">
	import Bursts from "./Bursts.svelte";
	import OkCancel from "../widgets/OkCancel.svelte";
	
	import { onMount, onDestroy, createEventDispatcher } from 'svelte'
	
	export let burst: number;
	
	let dispatchEvent = createEventDispatcher();
	let theDialog: HTMLDialogElement;
	
	onMount(  () => theDialog.showModal());
	onDestroy(() => theDialog.close());
	
	let prevBurst = burst;

</script>

<dialog bind:this={theDialog}>
	<Bursts bind:burst />
	<OkCancel {theDialog} {dispatchEvent} on:close resetAction="{()=>{burst=prevBurst}}" />
</dialog>

