<script lang="ts">
	import type { ColourArray } from "./ts/types";
	import ColourWell from "./widgets/ColourWell.svelte";

	let {
		colours = $bindable<ColourArray>(),
		oninput,
	}: { colours: ColourArray; oninput: () => void } = $props();
</script>

<div class="colourselector">
	<ColourWell {oninput} name="Idle" bind:hex={colours[0]} />
	<ColourWell {oninput} name="Active" bind:hex={colours[1]} />
	<br />
	<ColourWell {oninput} name="Root Note" bind:hex={colours[2]} />
	<ColourWell {oninput} name="Root Active" bind:hex={colours[3]} />
</div>
