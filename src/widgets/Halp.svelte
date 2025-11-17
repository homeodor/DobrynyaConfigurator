<!-- NB the name of this module is intentional, as in https://www.google.com/search?&q=halp -->
<script lang="ts">
	import { tick } from "svelte";

	let { dark = false, children }: { dark?: boolean; children: Function } = $props();

	let hovered = $state(false);
	let halpWidget = $state<HTMLSpanElement>();
	let halpDiv = $state<HTMLDivElement>();
	let innerWidth = $state<number>();
	let innerHeight = $state<number>();
	let scrollY = $state<number>();

	async function fixSlotPosition() {
		hovered = true;

		await tick();

		if (
			!halpWidget ||
			!halpDiv ||
			!innerWidth ||
			!innerHeight ||
			!scrollY
		) {
			throw new Error("Undefined params in Halp.svelte");
		}

		let rect1 = halpWidget.getBoundingClientRect();
		let rect2 = halpDiv.getBoundingClientRect();

		let left = rect1.left + rect1.width;

		if (left + rect2.width >= innerWidth) {
			halpDiv.style.left = "";
			halpDiv.style.right = "1em";
		} else {
			halpDiv.style.left = `${left}px`;
		}

		if (rect1.top + rect2.height >= innerHeight + scrollY) {
			halpDiv.style.top = "";
			halpDiv.style.bottom = "1em";
		} else {
			halpDiv.style.top = `${rect1.top + rect1.height + 2}px`;
		}
	}
</script>

<svelte:window bind:innerWidth bind:innerHeight bind:scrollY />

<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<span
	role="tooltip"
	bind:this={halpWidget}
	class="explain"
	class:dark
	onmouseenter={fixSlotPosition}
	onmouseleave={() => {
		hovered = false;
	}}
	onmouseover={fixSlotPosition}
></span>
{#if hovered}
	<span style="position: static">
		<div class="babepleasegethelp" bind:this={halpDiv}>
			{@render children?.()}
		</div>
	</span>
{/if}
