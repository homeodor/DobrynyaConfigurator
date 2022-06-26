<script lang="ts">
	import Tick from "./Tick.svelte";
	
	let tick;
	
	export let disabled: boolean = false;
	export let isSaved: boolean;
	export function ok() { tick.reAnimate(); }
	
</script>
<button {disabled} on:click class="b-upload">
	<Tick bind:this={tick} animated={true} />
	<span class="vh">●</span><slot></slot><span class:vh={isSaved}>●</span>
</button>