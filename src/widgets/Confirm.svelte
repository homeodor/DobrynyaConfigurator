<svelte:options accessors/>

<script lang="ts">
	import OkCancel from './OkCancel.svelte';

	export let okText = "OK";
	export let cancelText = "Cancel";
	
	let dialog;
	let resolveFunction;
	
	export function confirm()
	{
		dialog.showModal();
		return new Promise((resolve,reject)=>resolveFunction = resolve);
	};
	
</script>
<dialog bind:this={dialog} class="prompt-or-alert">
	<div>
	<slot></slot>
	<OkCancel theDialog={dialog} on:ok="{()=>resolveFunction(true)}" on:cancel="{()=>resolveFunction(false)}" {okText} {cancelText} />
	</div>
</dialog>