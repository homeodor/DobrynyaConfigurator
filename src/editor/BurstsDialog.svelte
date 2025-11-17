<script lang="ts">
	import Bursts from "./Bursts.svelte";
	import OkCancel from "../widgets/OkCancel.svelte";

	import { onMount, onDestroy, untrack } from "svelte";
	import type { Control } from "../ts/types";

	let {
		burst = $bindable(),
		onclose,
		controlKind,
		controlNumber,
	}: {
		burst: number;
		onclose: Function;
		controlKind: Control;
		controlNumber: number;
	} = $props();

	let theDialog = $state<HTMLDialogElement>();
	let prevBurst = $state<number>(burst);

	$effect(() => {
		controlKind;
		controlNumber;

		untrack(() => (prevBurst = burst));
	});

	onMount(() => theDialog!.showModal());
	onDestroy(() => theDialog!.close());
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
