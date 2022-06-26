<script lang="ts">
	import type { ColourArray } from './types';
	import ColourWell from './widgets/ColourWell.svelte';
	export let colours: ColourArray;
	export let globalColours: number[];
	export let isKeyOfScale: boolean;
</script>


	<div class="colourselector">
		<ColourWell on:input name="Idle"   bind:hex={colours[0]} coloursArray={colours} {isKeyOfScale} {globalColours} colourIndex={0} />
		<ColourWell on:input name="Active" bind:hex={colours[1]} coloursArray={colours} {isKeyOfScale} {globalColours} colourIndex={1} />
	</div>
