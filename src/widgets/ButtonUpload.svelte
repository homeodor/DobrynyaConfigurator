<script lang="ts">
	import Tick from "./Tick.svelte";

	let {
		children,
		onclick = () => {},
		isSaved,
		disabled = false,
	}: {
		children: Function;
		onclick?: (ev: MouseEvent) => void;
		isSaved: boolean;
		disabled?: boolean;
	} = $props();

	let tick = $state<Tick>();

	export function ok() {
		if (!tick) {
			throw new Error("Tick not defined");
		}
		tick.reAnimate();
	}
</script>

<button {disabled} {onclick} class="b-upload">
	<Tick bind:this={tick} animated={true} />
	<span class="vh">●</span>{@render children?.()}<span class:vh={isSaved}
		>●</span
	>
</button>
