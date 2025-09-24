<script lang="ts">
	import Bursts from "./Bursts.svelte";
	import OkCancel from "../widgets/OkCancel.svelte";

	import { onMount, onDestroy } from "svelte";

	let {
		burst = $bindable(),
		onclose,
	}: {
		burst: number;
		onclose: Function;
	} = $props();

	let theDialog = $state<HTMLDialogElement>();

	onMount(() => theDialog!.showModal());
	onDestroy(() => theDialog!.close());
	let prevBurst = burst;
</script>

<dialog bind:this={theDialog}>
	<Bursts bind:burst />
	<OkCancel
		{theDialog}
		{onclose}
		resetAction={() => {
			burst = prevBurst;
		}}
	/>
</dialog>
