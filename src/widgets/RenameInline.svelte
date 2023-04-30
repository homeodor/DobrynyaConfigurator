<script lang="ts">
	import { createEventDispatcher, tick } from 'svelte';

	const dispatch = createEventDispatcher();
	
	export let value: string;
	export let width: string = "auto";
	export let disabled: boolean = false;
	export let display: string = "inline-block";
	export let validatorFunction: Function = (v: any) => { v; return true };
	
	let prevValue: string;
	
	let theInline: Element;
	let inlineHolder: Element;
	let doNotSend: boolean = false;
	
	let isValid = true;
	
	let laskKey: string | null = null;

	// onMount(updateInline);
	// 
	export function isActive(): boolean { return document.activeElement == theInline; }
	
	function keypress(ev: KeyboardEvent)
	{
		if (ev.key == "Enter" || ev.key == "Escape")
		{
			if (ev.key == "Escape")
			{
				doNotSend = true;
				value = prevValue;
			}
			
			laskKey = ev.key;

			// @ts-ignore
			theInline.blur(); // onblur fires → maybeDispatch
			ev.stopPropagation();
		}
	}
	
	async function maybeDispatch()
	{
		await tick();
		
		if (doNotSend)
		{
			doNotSend = false;
			dispatch("cancel",{value: value,prevValue: prevValue,inline: inlineHolder, setValue: setValue});	
		}
		else
			dispatch("input",{value: value,prevValue: prevValue,inline: inlineHolder, setValue: setValue});
	}
	
	function setValue(v: string)
	{
		value = v; // needed for external calling
	}
	
	function blur()
	{
		if (!isValid)
		{
			doNotSend = true;
			value = prevValue;
		}
		
		inlineActive = false;
		
		maybeDispatch();
		
		isValid = true;
	}

	function doNotFocus()
	{
		if (!inlineActive && !disabled) dispatch("click");
	}
	
	let inlineActive = false;
	
	async function click()
	{
		if (disabled) return;
		
		if (inlineActive)
		{
			doNotSend = false;
			// @ts-ignore
			theInline.blur();
		} else {
			inlineActive = true;
			await tick();
			//@ts-ignore	
			theInline.focus();
		}
	}
	
	function focus(ev: Event): boolean
	{
		laskKey = null;
		
		let range = document.createRange();
		let sel = window.getSelection();
		
		if (disabled)
		{
			doNotSend = true;
			ev.preventDefault();
			ev.stopPropagation();
			// @ts-ignore we actually know it is there!
			Inline.blur();
			return false;
		}
		
		prevValue = theInline.textContent;
		
		range.selectNodeContents(theInline);
		
		sel.removeAllRanges();
		sel.addRange(range);		
		
		ev.stopPropagation();
	}
	
	$:{
		if (theInline) isValid = (validatorFunction(value) || (prevValue == value)); else isValid = true;
	}
	
</script>
<!-- <svelte:document on:mouseover={maybeChangeValue} on:mouseup={releaseValueChange}></svelte:body> -->

<span class="rename-inline-holder" bind:this={inlineHolder}>
	{#if inlineActive}
	<span style="width:{width}; display:{display}" role="textbox" contenteditable class:invalid={!isValid && prevValue != value} class:disabled={disabled} type="text" class="rename-inline" bind:this={theInline} bind:textContent={value} on:keydown="{keypress}" on:focus={focus} on:blur={blur} on:click={doNotFocus}></span>
	{:else}
	<span style="width:{width}; display:{display}" bind:this={theInline} class:disabled={disabled} class="rename-inline" on:click={doNotFocus}>{value}</span>
	{/if}
	<svg on:click={click} enable-background="new 0 0 24 24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class:disabled><g fill="none" stroke-miterlimit="16.0535" stroke-width="1.6054">
	{#if inlineActive}
		<path class="st1" d="M1.5,15l5.6,5.8C7.1,20.8,22,6,22.3,5.7"/>
	{:else}
		<path d="m22.3 7.7c.3-.3.8-2.3-1.2-4.3s-3.9-1.6-4.3-1.2-15.2 15.2-15.2 15.2c-.1.1-.1.2-.1.4l.6 3.8c.1.3.4.6.7.7l3.9.6c.2 0 .3 0 .4-.1 0 0 14.9-14.8 15.2-15.1z"/><path d="m1.6 17.4s1.7-.2 3.7 1.8 1.8 3.7 1.8 3.7"/>
	{/if}		
			
		</g></svg>
</span>