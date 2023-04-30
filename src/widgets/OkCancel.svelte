<script lang="ts">
	import { isMacLike } from 'stores';
	import { createEventDispatcher } from 'svelte';
	
	const dispatch = createEventDispatcher();
	
	export let theDialog: HTMLDialogElement = null;
	export let dispatchEvent = null;
	export let resetAction = null;
	
	export let okText = "OK";
	export let okDisabled = false;
	export let cancelText = "Cancel";
	
	let okButton: HTMLButtonElement;
	let cancelButton: HTMLButtonElement;
	
	async function okOrCancel(ev: Event)
	{
		ev.preventDefault();
		ev.stopPropagation();
		
		let isOK = (ev.currentTarget as HTMLButtonElement).type == "submit";
		
		if (theDialog)
		{
			if (!isOK && resetAction) resetAction();
			theDialog.close();
			if (dispatchEvent) dispatchEvent("close");
		}
		
		dispatch(isOK ? "ok" : "cancel");
	}
	

	function handleKeydown(ev: KeyboardEvent)
	{
		if (theDialog?.open)
		{
			if (ev.key != "Enter" && ev.key != "Escape") return;
			if (ev.key == "Enter")
				okButton.click();
			else
				cancelButton.click();
				
			ev.preventDefault();
			ev.stopPropagation();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown}/>

<div class="modal-buttons" class:mac-reorder={$isMacLike}>
	<button bind:this={okButton} disabled={okDisabled} type="submit" class="modal-ok" on:click={okOrCancel}>{okText}</button>
	<button bind:this={cancelButton} type="reset" class="modal-cancel" on:click={okOrCancel}>{cancelText}</button>
</div>