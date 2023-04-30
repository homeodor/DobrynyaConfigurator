<script lang="ts">
	import Ramp from "./Ramp.svelte";
	import OkCancel from "../widgets/OkCancel.svelte";
	
	import { onMount, onDestroy, createEventDispatcher } from 'svelte'
	
	export let rampu: number;
	export let rampd: number;
	
	let dispatchEvent = createEventDispatcher();
	let theDialog: HTMLDialogElement;
	
	onMount(  () => theDialog.showModal());
	onDestroy(() => theDialog.close());
	
	let prevValueU = rampu;
	let prevValueD = rampd;

</script>

<dialog bind:this={theDialog}>
	<Ramp on:input bind:value={rampu} rampID="rampu">Ramp up (Attack)</Ramp>
	<Ramp on:input bind:value={rampd} rampID="rampd">Ramp down (Release)</Ramp>
	<OkCancel {theDialog} {dispatchEvent} on:close resetAction="{()=>{rampu=prevValueU;rampd=prevValueD}}" />
</dialog>

