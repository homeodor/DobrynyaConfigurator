<!-- NB the name of this module is intentional, as in https://www.google.com/search?&q=halp -->
<script lang="ts">
	import { tick } from 'svelte';
	
	export let dark = false;
	
	let hovered = false;
	let halpWidget: HTMLSpanElement;
	let halpDiv: HTMLDivElement;
	let innerWidth: number;
	let innerHeight: number;
	let scrollY: number;
	
	async function fixSlotPosition()
	{
		hovered = true;
		
		await tick();
		
		let rect1 = halpWidget.getBoundingClientRect();
		let rect2 = halpDiv.getBoundingClientRect();
		
		let left = rect1.left + rect1.width;
		
		if (left + rect2.width >= innerWidth)
		{
			halpDiv.style.left = "";
			halpDiv.style.right = "1em";
		} else {
			halpDiv.style.left = `${left}px`;
		}
		
		if (rect1.top + rect2.height >= innerHeight + scrollY)
		{
			halpDiv.style.top = "";
			halpDiv.style.bottom = "1em";
		} else {
			halpDiv.style.top = `${rect1.top + rect1.height + 2}px`;
		}
	}
</script>
<svelte:window bind:innerWidth bind:innerHeight bind:scrollY />

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<span bind:this={halpWidget} class="explain" class:dark={dark} on:mouseenter="{fixSlotPosition}" on:mouseleave="{()=>{hovered=false}}" on:mouseover={fixSlotPosition} ></span>
{#if hovered}
<span style="position: static">
<div class="babepleasegethelp" bind:this={halpDiv}>
	<slot></slot>
</div>
</span>
{/if}