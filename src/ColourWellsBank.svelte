<script lang="ts">
	import type { ColourArray } from '../ts/types';
	import ColourWell from './widgets/ColourWell.svelte';
	export let colours: ColourArray;
</script>


	<div class="colourselector">
		<ColourWell on:input name="Idle"   bind:hex={colours[0]} />
		<ColourWell on:input name="Active" bind:hex={colours[1]} />
		<br />
		<ColourWell on:input name="Root Note"  bind:hex={colours[2]} />
		<ColourWell on:input name="Root Active" bind:hex={colours[3]} />
	</div>
