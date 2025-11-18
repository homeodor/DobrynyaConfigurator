<script lang="ts">
	import Inline, { type NudgeDispatch } from "./DumbInline.svelte";

	let {
		disabled = false,
		min = 0,
		max = 127,
		step = 1,
		value = $bindable(0),
		defValue = 0,
		elId = "",
		width = "2.5em",
		list = null,
		nudgeMagnitude = 1,
		disabledShowsOff = true,
		inlineToRange = function (v: string): number | false {
			return parseInt(v.replace("–", "-"));
		},
		rangeToInline = function (v: number): string {
			return String(v).replace("-", "–");
		},
		oninput = () => {},
	}: {
		disabled?: boolean;
		min?: number;
		max?: number;
		step?: number;
		value?: number;
		defValue?: number;
		elId?: string;
		width?: string;
		list?: number[] | null;
		nudgeMagnitude?: number;
		disabledShowsOff?: boolean;
		inlineToRange?: (v: string) => number | false;
		rangeToInline?: (v: number) => string;
		oninput?: () => void;
	} = $props();

	let listElement = $state<HTMLDataListElement>();

	// export let inlineToRange = function (v: string): number | false {
	// 	return parseInt(v.replace("–", "-"));
	// };
	// export let rangeToInline = function (v: number): string {
	// 	return String(v).replace("-", "–");
	// }; // oh so pedantic

	function getInline(): string {
		return (disabled && disabledShowsOff) ? "Off" : rangeToInline(value);
	}

	function setInline(v: string) {
		const parsed = inlineToRange(v);
		value = parsed === false ? defValue : parsed;
	}

	export function reset() {
		value = defValue;
	}

	let range: HTMLInputElement;
	let inlineValue = $state("0");

	export function updateInline() {
		inlineValue =
			disabled && disabledShowsOff ? "Off" : rangeToInline(value);
	}

	function dispatchChange() {
		oninput();
	}

	function maybeReset(ev: MouseEvent) {
		if (!ev.altKey || range.disabled) return true;
		ev.stopPropagation();
		ev.preventDefault();
		value = defValue;
	}

	function nudge(nudge: NudgeDispatch) {
		value = value + nudge.value;

		if (nudge.value >= 0 && value > max) {
			value = max;
		}

		if (nudge.value < 0 && value < min) {
			value = min;
		}
		updateInline();
	}

	export function updateRange() {
		let integerValue: number | false = inlineToRange(inlineValue);
		let hasChanged: boolean = false;

		if (integerValue !== false && !isNaN(integerValue as number)) {
			// sanity check 1
			if (integerValue >= min && integerValue <= max) {
				hasChanged = true;
				value = integerValue as number; // sanity check 2
			}
		}

		if (hasChanged)
		{
			dispatchChange();
		}

		updateInline(); // reset, or just make sure it is synced
	}
</script>

{#if list}
	<datalist bind:this={listElement}>
		{#each list as li}
			<option value={li}> </option>{/each}
	</datalist>
{/if}
<div class="range-inline-container">
	<input
		type="range"
		{min}
		{max}
		{step}
		bind:this={range}
		bind:value
		id={elId}
		oninput={dispatchChange}
		onclick={maybeReset}
		{disabled}
		list={listElement ? listElement.id : ""}
	/>
	<Inline
		bind:value={getInline, setInline}
		oninput={updateRange}
		oncancel={updateInline}
		{width}
		{disabled}
		{nudgeMagnitude}
		onnudge={nudge}
		verticalalign="top"
	/>
</div>
<!-- <input type="text" class="inline-editable-new" bind:this={theInline} bind:value={inlineValue} on:change={updateRange} on:keydown="{keypress}" on:focus={selectAll} /> -->
