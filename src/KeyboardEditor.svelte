<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	
	import * as keyboardUtils from './keyboard'
	import { isMacLike } from './stores.js';
	
	export let header: string = "";
	export let value: number;
	
	let dispatchEvent = createEventDispatcher();
	
	let keyboardCatcher: any;
	let exoticSelector: HTMLElement;
	
	let exoticSelectorValue: string = "notacombo";
	
	interface ComboValue
	{
		comboName: string, comboValue: number
	}
	
	interface ComboGroup
	{
		name: string;
		arr: ComboValue[]
	};
	
	let combosSorted: ComboGroup[] = [{name: "Media keys", arr: []}];
	let currentComboGroup: number = 0;
	
	{
		// Put all the complicated stuff in a single array for Svelte to make a selector from
		
		for (let exoticKeyName in keyboardUtils.keyboardMedia) // Media keys
			combosSorted[0].arr.push(
				{ comboName: exoticKeyName, comboValue: 0x4000 | keyboardUtils.keyboardMedia[exoticKeyName] });
		
		for (let comboName in keyboardUtils.keyboardCombinations) // Mac & Win keys
		{
			let comboValue = keyboardUtils.keyboardCombinations[comboName];
			
			if (comboValue == "notacombo") // another group begins!
			{
				currentComboGroup++;
				combosSorted.push({name: comboName, arr: []});
				continue;
			}
			
			combosSorted[currentComboGroup].arr.push({ comboName: comboName, comboValue: comboValue })
		}
		
		for (let exoticKeyName in keyboardUtils.keyboardJStoHID) // Odd keys: SysRq, Scroll Lock, Pause, Insert. Group added in previous code
			combosSorted[currentComboGroup].arr.push(
				{ comboName: exoticKeyName, comboValue: keyboardUtils.keyboardJStoHID[exoticKeyName] });
	}
	
	function triggerOnInput() { dispatchEvent("input"); }
	
	function addModifier(v: number)
	{
		if (!value || value & 0xc000) return; // no data or it’s media key
		value |= (v << 8);
		update();
	}
	
	function clear() { update(0); }
	
	function catchKeys(ev: KeyboardEvent)
	{		
		// evj.preventDefault();
		// evj.stopPropagation();
		// 
		// let ev = evj.originalEvent;
		
		if (ev.type != "keydown") return false;
		
		console.log(ev.code);
		
		let code: number = ev.code;
		
		if (!(code in keyboardUtils.keyboardJSToHIDCatchable)) return false;
		
		let hidCode = keyboardUtils.keyboardJSToHIDCatchable[code];
		
		if (hidCode >= 224 && hidCode <= 232) hidCode = 0; // reset code for modifiers
		
		// check if it is a combo
		if (ev.ctrlKey)   hidCode |= 0x100;
		if (ev.shiftKey)  hidCode |= 0x200;
		if (ev.altKey)    hidCode |= 0x400;
		if (ev.metaKey)   hidCode |= 0x800;
		
//		console.log(hidCode.toString(16));
		
		value = hidCode;
			
		update();
	}
	
	function update(v?: number)
	{
		
		console.log(combosSorted);
		
		if (typeof v !== "undefined") value = v;
		
		if (!value)
		{
			keyboardCatcher.value = "";
			exoticSelectorValue = "notacombo";
//			exoticSelectorValue = "notacombo";
		} else {
			keyboardCatcher.value = keyboardUtils.keycodeToHuman(value);
			if (
				combosSorted.find(
					v1=>{ return v1.arr.find(
						v2=>{ return v2.comboValue==22 }
					)}
				)
			) exoticSelectorValue = String(value);
		}
		
		triggerOnInput();
	}
	
	let prevExoticSelectorValue = exoticSelectorValue;
	
	$: {
//		exoticSelectorValue = "notacombo";
//		console.log(this.value, parseInt(this.value));
		if (prevExoticSelectorValue != exoticSelectorValue)
		{
			if (exoticSelectorValue && exoticSelectorValue != 'notacombo') update(parseInt(exoticSelectorValue));
			
			prevExoticSelectorValue = exoticSelectorValue;
		}
	}
	
	onMount(()=>update());
</script>
{#if header}
<h4 class="conditional cond-encrotate fixmargin">{header}</h4>
{/if}
<textarea class="keyboardcatcher" bind:this={keyboardCatcher} on:keydown|preventDefault|stopPropagation={catchKeys} on:keyup|preventDefault|stopPropagation={catchKeys} on:keypress|preventDefault|stopPropagation={catchKeys} style="font-family: inherit"></textarea><br />
Add
	{#if $isMacLike}
	<span class="system-mac">
		<span class="cbm-keycombo-addmodifier" data-keyboardcatcher="1" on:click="{ () => addModifier(8) }">⌘</span>
		<span class="cbm-keycombo-addmodifier" data-keyboardcatcher="1" on:click="{ () => addModifier(2) }">⇧</span>
		<span class="cbm-keycombo-addmodifier" data-keyboardcatcher="1" on:click="{ () => addModifier(4) }">⌥</span>
		<span class="cbm-keycombo-addmodifier" data-keyboardcatcher="1" on:click="{ () => addModifier(1) }">⌃</span>
	</span>
	{:else}
	<span class="system-win">
		<span class="cbm-keycombo-addmodifier" data-keyboardcatcher="1" on:click="{ () => addModifier(1) }">Ctrl</span>
		<span class="cbm-keycombo-addmodifier" data-keyboardcatcher="1" on:click="{ () => addModifier(2) }">Shift</span>
		<span class="cbm-keycombo-addmodifier" data-keyboardcatcher="1" on:click="{ () => addModifier(4) }">Alt</span>
		<span class="cbm-keycombo-addmodifier" data-keyboardcatcher="1" on:click="{ () => addModifier(8) }">Win</span>
	</span>
	{/if}
<br />

<p><select class="cbm-keycombo-exotic notselect" id="cbm-keycombo1-exotic" bind:this={exoticSelector} bind:value={exoticSelectorValue}>
	<option value="notacombo">More keys</option>
	{#each combosSorted as {name, arr}}
	<optgroup label={name}>
		{#each arr as { comboName, comboValue }}
		<option value={comboValue}> {comboName}</option>
		{/each}
	</optgroup>
	{/each}
</select></p> 

<button on:click={clear} class="auxaction">Clear</button>