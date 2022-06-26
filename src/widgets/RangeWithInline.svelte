<svelte:options tag="dc-range-with-inline" />

<script lang="ts">
	import Inline from './DumbInline.svelte'
	import { createEventDispatcher } from 'svelte';
	
	const dispatch = createEventDispatcher();

	export let disabled: boolean = false;
	export let min: number = 0;
	export let max: number = 127;
	export let step: number = 1;
	export let value: number = 0;
	export let defValue: number = 0;
	export let elId: string = "";
	export let width: string = "2.5em"
	export let list: number[] | null = null;
	
	let listElement = null;
	
	export let inlineToRange = function (v: string): number | boolean { return parseInt(v); }
	export let rangeToInline = function (v: number): string { return String(v); }
	
	export function reset() { value = defValue; }
	
	let range: HTMLInputElement;
	let theInline: any;
	let inlineValue: string = "0";
	
	export function updateInline() { inlineValue = disabled ? "Off" : rangeToInline(value); }
	
//	onMount(updateInline);
	
	$: {
		if (!theInline || !theInline.isActive()) {
			inlineValue = rangeToInline(value);
		}
		
		if (disabled) inlineValue = "Off";
	
	}
	
	function dispatchChange() { dispatch("input"); dispatch("change");  }
	
	let scrubValueBefore = -1;
	
	// function scrub(ev)
	// {
	// 	let possibleValue = scrubValueBefore + ev.detail.distance * step;
	// 	if (possibleValue > max) possibleValue = max;
	// 	if (possibleValue < min) possibleValue = min;
	// 	value = possibleValue;
	// }
	
	// function scrubBegin(ev)
	// {
	// 	scrubValueBefore = value;
	// }
	// 
	// function scrubCancel(ev)
	// {
	// 	value = scrubValueBefore;
	// }
	// 	
	function maybeReset(ev: MouseEvent)
	{
		if (!ev.altKey || range.disabled) return true;
		ev.stopPropagation(); ev.preventDefault();
		value = defValue;
	}
	
	export function updateRange()
	{
		let integerValue: number | boolean = inlineToRange(inlineValue);
		let hasChanged: boolean = false;
		
		if (integerValue !== false && !isNaN(integerValue as number)) // sanity check 1
		{
			if (integerValue >= min && integerValue <= max)
			{
				hasChanged = true;
				value = integerValue as number; // sanity check 2
			}
		}
		
		if (hasChanged) dispatchChange();
		
		updateInline(); // reset, or just make sure it is synced
	}
</script>
{#if list}
<datalist id="jopacom" bind:this={listElement}>
	{#each list as li}
	<option value={li}>
	{/each}
</datalist>
{/if}
<input type="range" {min} {max} {step} bin:this={range} bind:value id={elId} on:input={dispatchChange} on:click={maybeReset} disabled={disabled} list={listElement?listElement.id:""}>
<Inline bind:this={theInline} bind:value={inlineValue} on:input={updateRange} on:cancel={updateInline} width={width} disabled={disabled} />
<!-- <input type="text" class="inline-editable-new" bind:this={theInline} bind:value={inlineValue} on:change={updateRange} on:keydown="{keypress}" on:focus={selectAll} /> -->