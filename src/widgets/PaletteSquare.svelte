<style>
	.coloursquare { width:3em; height: 3em; display:inline-block }
	input { visibility:hidden; width:0; height:0; }
	
	
</style>

<script lang="ts">
	export let value = "#000000";
	
	let input: HTMLInputElement;


</script>



<div class="coloursquare" style="background-color:{value}" on:click={()=>input.click()}>
	<input type="color" bind:value bind:this={input} on:change on:input />
</div>