<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	const dispatch = createEventDispatcher();
	
	export let theDialog = null;
	export let dispatchEvent = null;
	
	export let okText = "OK";
	
	let okButton: HTMLButtonElement;
	
	async function okOrCancel(ev: Event)
	{
		ev.preventDefault();
		ev.stopPropagation();
		
		if (theDialog)
		{
			theDialog.close();
			if (dispatchEvent) dispatchEvent("close");
		}
		
		dispatch("ok");
	}
	

	function handleKeydown(ev: KeyboardEvent)
	{
		if (theDialog?.open)
		{
			if (ev.key != "Enter" && ev.key != "Escape") return;
			
			okButton.click();
				
			ev.preventDefault();
			ev.stopPropagation();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown}/>

<div class="modal-buttons">
	<button bind:this={okButton} type="submit" class="modal-ok" on:click={okOrCancel}>{okText}</button>
</div>