<script lang="ts">
	let {
		theDialog = null,
		okText = "OK",
		onok = () => {},
	}: {
		theDialog?: HTMLDialogElement | null;
		okText?: string;
		onok?: () => void;
	} = $props();

	let okButton = $state<HTMLButtonElement>();

	async function okOrCancel(ev: Event) {
		ev.preventDefault();
		ev.stopPropagation();

		if (theDialog) {
			theDialog.close();
		}

		onok();
	}

	function handleKeydown(ev: KeyboardEvent) {
		if (theDialog?.open) {
			if (ev.key != "Enter" && ev.key != "Escape") {
				return;
			}

			okButton!.click();

			ev.preventDefault();
			ev.stopPropagation();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="modal-buttons">
	<button
		bind:this={okButton}
		type="submit"
		class="modal-ok"
		onclick={okOrCancel}>{okText}</button
	>
</div>
