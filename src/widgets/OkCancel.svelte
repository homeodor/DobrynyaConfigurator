<script lang="ts">
	import { isMacLike } from "../ts/stores";

	let {
		theDialog,
		onok = null,
		oncancel = null,
		onclose = null,
		resetAction = null,
		okText = "OK",
		cancelText = "Cancel",
		okDisabled = false,
	}: {
		theDialog?: HTMLDialogElement;
		onok?: Function | null;
		oncancel?: Function | null;
		onclose?: Function | null;
		resetAction?: Function | null;
		okText?: string;
		cancelText?: string;
		okDisabled?: boolean;
	} = $props();

	let okButton: HTMLButtonElement;
	let cancelButton: HTMLButtonElement;

	async function okOrCancel(ev: Event) {
		ev.preventDefault();
		ev.stopPropagation();

		const isOK = (ev.currentTarget as HTMLButtonElement).type == "submit";

		if (isOK && onok) {
			await onok();
		}

		if (!isOK && oncancel) {
			await oncancel();
		}

		if (theDialog) {
			if (!isOK && resetAction) {
				resetAction();
			}

			theDialog.close();

			if (onclose) {
				await onclose();
			}
		}
	}

	function handleKeydown(ev: KeyboardEvent) {
		if (theDialog?.open) {
			if (ev.key != "Enter" && ev.key != "Escape") return;
			if (ev.key == "Enter") okButton.click();
			else cancelButton.click();

			ev.preventDefault();
			ev.stopPropagation();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="modal-buttons" class:mac-reorder={$isMacLike}>
	<button
		bind:this={okButton}
		disabled={okDisabled}
		type="submit"
		class="modal-ok"
		onclick={okOrCancel}>{okText}</button
	>
	<button
		bind:this={cancelButton}
		type="reset"
		class="modal-cancel"
		onclick={okOrCancel}>{cancelText}</button
	>
</div>
