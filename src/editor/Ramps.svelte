<script lang="ts">
	import Ramp from "./Ramp.svelte";
	import OkCancel from "../widgets/OkCancel.svelte";

	import { onMount, onDestroy, createEventDispatcher } from "svelte";

	let {
		rampu,
		rampd,
		onclose,
	}: {
		rampu: number;
		rampd: number;
		onclose: Function;
	} = $props();

	let theDialog = $state<HTMLDialogElement>();

	onMount(() => theDialog!.showModal());
	onDestroy(() => theDialog!.close());

	let prevValueU = rampu;
	let prevValueD = rampd;
</script>

<dialog bind:this={theDialog}>
	<Ramp on:input bind:value={rampu} rampID="rampu">Ramp up (Attack)</Ramp>
	<Ramp on:input bind:value={rampd} rampID="rampd">Ramp down (Release)</Ramp>
	<OkCancel
		{theDialog}
		{onclose}
		resetAction={() => {
			rampu = prevValueU;
			rampd = prevValueD;
		}}
	/>
</dialog>
