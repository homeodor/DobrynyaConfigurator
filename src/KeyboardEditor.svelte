<script lang="ts">
	import { onMount } from "svelte";

	import * as keyboardUtils from "./ts/keyboard";
	import { isMacLike } from "./ts/stores";

	let {
		header = "",
		value = $bindable<number>(),
		onValueChange,
	}: {
		header: string;
		value: number;
		onValueChange: () => void;
	} = $props();

	let keyboardCatcher = $state<HTMLTextAreaElement>();

	let exoticSelectorValue = $state<string>("notacombo");

	interface ComboValue {
		comboName: string;
		comboValue: number;
	}

	interface ComboGroup {
		name: string;
		arr: ComboValue[];
	}

	let combosSorted: ComboGroup[] = [{ name: "Media keys", arr: [] }];
	let currentComboGroup: number = 0;

	{
		// Put all the complicated stuff in a single array for Svelte to make a selector from

		for (let exoticKeyName in keyboardUtils.keyboardMedia) // Media keys
			combosSorted[0].arr.push({
				comboName: exoticKeyName,
				comboValue: 0x4000 | keyboardUtils.keyboardMedia[exoticKeyName],
			});

		for (let comboName in keyboardUtils.keyboardCombinations) {
			// Mac & Win keys
			let comboValue = keyboardUtils.keyboardCombinations[comboName];

			if (comboValue == "notacombo") {
				// another group begins!
				currentComboGroup++;
				combosSorted.push({ name: comboName, arr: [] });
				continue;
			}

			combosSorted[currentComboGroup].arr.push({
				comboName: comboName,
				comboValue: comboValue,
			});
		}

		for (let exoticKeyName in keyboardUtils.keyboardJStoHID) // Odd keys: SysRq, Scroll Lock, Pause, Insert. Group added in previous code
			combosSorted[currentComboGroup].arr.push({
				comboName: exoticKeyName,
				comboValue: keyboardUtils.keyboardJStoHID[exoticKeyName],
			});
	}

	function triggerOnInput() {
		onValueChange();
	}

	function addModifier(v: number) {
		if (!value || value & 0xc000) return; // no data or it’s media key
		value |= v << 8;
		update();
	}

	function clear() {
		update(0);
	}

	function catchKeys(ev: KeyboardEvent) {
		ev.preventDefault();
		ev.stopPropagation();

		if (ev.type != "keydown") {
			return false;
		}

		let code: string = ev.code;

		if (!(code in keyboardUtils.keyboardJSToHIDCatchable)) {
			return false;
		}

		let hidCode = keyboardUtils.keyboardJSToHIDCatchable[code];

		if (hidCode >= 224 && hidCode <= 232) {
			// reset code for modifiers
			hidCode = 0;
		}

		// check if it is a combo
		if (ev.ctrlKey) {
			hidCode |= 0x100;
		}

		if (ev.shiftKey) {
			hidCode |= 0x200;
		}

		if (ev.altKey) {
			hidCode |= 0x400;
		}

		if (ev.metaKey) {
			hidCode |= 0x800;
		}

		value = hidCode;

		update();
	}

	export function update(v?: number) {
		if (!keyboardCatcher) {
			throw new Error("KeyboardCatcher called too early");
		}

		if (typeof v !== "undefined") {
			value = v;
		}

		if (!value) {
			keyboardCatcher.value = "";
			exoticSelectorValue = "notacombo";
		} else {
			keyboardCatcher.value = keyboardUtils.keycodeToHuman(value);
			if (
				combosSorted.find(v1 => {
					return v1.arr.find(v2 => {
						return v2.comboValue == 22;
					});
				})
			)
				exoticSelectorValue = String(value);
		}

		triggerOnInput();
	}

	$effect(() => {
		if (exoticSelectorValue && exoticSelectorValue != "notacombo") {
			update(parseInt(exoticSelectorValue));
		}
	});

	onMount(() => update());
</script>

{#if header}
	<h4 class="conditional cond-encrotate fixmargin">{header}</h4>
{/if}
<textarea
	class="keyboardcatcher"
	bind:this={keyboardCatcher}
	onkeydown={catchKeys}
	onkeyup={catchKeys}
	onkeypress={catchKeys}
	style="font-family: inherit"
></textarea><br />
Add
{#if $isMacLike}
	<span class="system-mac">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<span
			class="cbm-keycombo-addmodifier"
			data-keyboardcatcher="1"
			onclick={() => addModifier(8)}
			role="button"
			tabindex="0">⌘</span
		>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<span
			class="cbm-keycombo-addmodifier"
			data-keyboardcatcher="1"
			onclick={() => addModifier(2)}
			role="button"
			tabindex="0">⇧</span
		>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<span
			class="cbm-keycombo-addmodifier"
			data-keyboardcatcher="1"
			onclick={() => addModifier(4)}
			role="button"
			tabindex="0">⌥</span
		>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<span
			class="cbm-keycombo-addmodifier"
			data-keyboardcatcher="1"
			onclick={() => addModifier(1)}
			role="button"
			tabindex="0">⌃</span
		>
	</span>
{:else}
	<span class="system-win">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<span
			class="cbm-keycombo-addmodifier"
			data-keyboardcatcher="1"
			onclick={() => addModifier(1)}
			role="button"
			tabindex="0">Ctrl</span
		>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<span
			class="cbm-keycombo-addmodifier"
			data-keyboardcatcher="1"
			onclick={() => addModifier(2)}
			role="button"
			tabindex="0">Shift</span
		>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<span
			class="cbm-keycombo-addmodifier"
			data-keyboardcatcher="1"
			onclick={() => addModifier(4)}
			role="button"
			tabindex="0">Alt</span
		>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<span
			class="cbm-keycombo-addmodifier"
			data-keyboardcatcher="1"
			onclick={() => addModifier(8)}
			role="button"
			tabindex="0">Win</span
		>
	</span>
{/if}
<br />

<p>
	<select
		class="cbm-keycombo-exotic notselect"
		id="cbm-keycombo1-exotic"
		bind:value={exoticSelectorValue}
	>
		<option value="notacombo">More keys</option>
		{#each combosSorted as { name, arr }}
			<optgroup label={name}>
				{#each arr as { comboName, comboValue }}
					<option value={comboValue}> {comboName}</option>
				{/each}
			</optgroup>
		{/each}
	</select>
</p>

<button onclick={clear} class="auxaction">Clear</button>
