<script lang="ts">
	import Spinner from "./widgets/Spinner.svelte";
	import SpinnerDead from "./widgets/SpinnerDead.svelte";

	let dialog: HTMLDialogElement;
	export let errorText = "";
	export let commandText = "";
	
	export function block()
	{
		if (dialog.open) return;
		dialog.showModal();
	}
	
	export function unblock()
	{
		errorText = "";
		commandText = "";
		dialog.close();
	}
	
	export function error(c: string, t: string)
	{
		commandText = c;
		errorText = t;
	}

</script>

<dialog id="blocker" bind:this={dialog}>
	{#if !errorText}
	<div id="blocker-active">
		<Spinner />
	</div>
	{:else}
	<div id="blocker-error" class="plashkabad plashka">
		<SpinnerDead />
		{#if commandText != ""}
		<p>The configurator failed to {commandText.toLowerCase()}.</p>
		{/if}
		<p>{@html errorText}</p>
		<p><button on:click={unblock}>Okay :(</button></p>
	</div>
	{/if}
	
</dialog>
