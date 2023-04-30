<svelte:options accessors/>

<script lang="ts">
	import OkCancel from './OkCancel.svelte';

	export let okText = "OK";
	export let cancelText = "Cancel";
	export let html = "";
	
	let dialog: HTMLDialogElement;
	let resolveFunction: Function;
	
	export function confirm(): Promise<boolean>
	{
		dialog.showModal();
		return new Promise((resolve,_)=>resolveFunction = resolve);
	};
	
</script>
<dialog bind:this={dialog} class="prompt-or-alert">
	<div>
	<slot>{@html html}</slot>
	<OkCancel theDialog={dialog} on:ok="{()=>resolveFunction(true)}" on:cancel="{()=>resolveFunction(false)}" {okText} {cancelText} />
	</div>
</dialog>