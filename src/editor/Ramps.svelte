<script lang="ts">
	import Ramp from "./Ramp.svelte";
	import OkCancel from "../widgets/OkCancel.svelte";
	
	import { onMount, onDestroy, createEventDispatcher } from 'svelte'
	
	export let midi;
	
	let dispatchEvent = createEventDispatcher();
	let theDialog;
	
	onMount(  () => theDialog.showModal());
	onDestroy(() => theDialog.close());
	
	let prevValueU = midi.rampu;
	let prevValueD = midi.rampd;

</script>

<dialog bind:this={theDialog}>
	<Ramp on:input bind:value={midi.rampu} rampID="rampu">Ramp up (Attack)</Ramp>
	<Ramp on:input bind:value={midi.rampd} rampID="rampd">Ramp down (Release)</Ramp>
	<OkCancel {theDialog} {dispatchEvent} on:close resetAction="{()=>{midi.rampu=prevValueU;midi.rampd=prevValueD}}" />
</dialog>

