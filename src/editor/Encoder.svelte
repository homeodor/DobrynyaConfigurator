<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import InnerControl from './InnerControl.svelte';
	
	export let dataAll;
	export let id;
	
	let dispatch = createEventDispatcher();
	
	if (typeof dataAll == "undefined")
	{
		dataAll = [{},{},{},{}];
	}
	
	let data;
	
	$: {
		data = dataAll?.[id];
	}

</script>




<div class="dobrynya-encoder editablecontrol" on:click="{(ev)=>dispatch('click',{encEl: ev.currentTarget})}">
	{#if data}<InnerControl {data} />{/if}
	</div>