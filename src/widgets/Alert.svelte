<svelte:options accessors/>

<script lang="ts">
	import Ok from './Ok.svelte';

	export let okText = "OK";
	
	let dialog: HTMLDialogElement;
	let resolveFunction: Function;
	
	export function confirm()
	{
		dialog.showModal();
		return new Promise((resolve,_)=>resolveFunction = resolve);
	};
	
</script>
<dialog bind:this={dialog} class="prompt-or-alert">
	<div>
	<slot></slot>
	<Ok theDialog={dialog} on:ok="{()=>resolveFunction(true)}" {okText} />
	</div>
</dialog>