<style>
	.inline-editable-new:not(:focus) { line-height: 1.4em; cursor:pointer; color: #00eaff; border: 2px transparent; border-bottom-style:dotted; border-bottom-width:1px; border-bottom-color: rgba(0, 234, 255, 0.7); text-decoration: none; background-color:transparent;  }
	.inline-editable-new:focus { background:white; border:1px solid silver; color:black; padding:0em 0.2em }
	.inline-editable-new.disabled { color:#999; border-bottom-color:#999 }
	.inline-editable-new.invalid { background-color: rgb(255, 238, 160); box-shadow: rgb(228, 218, 83) 3px 3px 5px, rgb(228, 218, 83) -3px -3px 5px, rgb(228, 218, 83) -3px 3px 5px, rgb(228, 218, 83) 3px -3px 5px; }
</style>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
	
	export let value: string;
	export let width: string = "auto";
	export let disabled: boolean = false;
	export let display: string = "inline-block";
	export let requireEnter: boolean = false;
	export let validatorFunction: Function = (v) => { return true };
	export let scrubbable: boolean = false;
	
	let prevValue;
	let laskKey: string | null = null;
	
	let theInline: Element;
	let doNotSend: boolean = false;
	
	let isValid = true;

	// onMount(updateInline);
	// 
	export function isActive(): boolean { return document.activeElement == theInline; }
	
	function checkIfEnabled(ev: Event)
	{

	}
	
	function input(ev)
	{
		
	}
	
	function keypress(ev)
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
	
	function maybeDispatch()
	{
		if (doNotSend)
		{
			doNotSend = false;
			dispatch("cancel",{value: value,prevValue: prevValue,inline: theInline});	
		}
		else
			dispatch("input",{value: value,prevValue: prevValue,inline: theInline});
	}
	
	function blur(ev)
	{
		if ((requireEnter && laskKey != "Enter") || !isValid)
		{
			doNotSend = true;
			value = prevValue;
		}
		
		maybeDispatch();
		
		isValid = true;
	}
	
	const valueChangeSafeMargin = 5;
	const scrubCoeff = 3;
	
	let valueChangeEnaged = false;
	let valueChangeAllowed = false;
	let pixelDistance = 0;
	let originX = 0;
	let originY = 0;
	
	function pyfagorus (w: number, h: number) {
		let plusMinus = 1;
		
		if (
			(w < 0 && Math.abs(w) > Math.abs(h)) ||
			(h > 0 && Math.abs(h) > Math.abs(w))
		)
		plusMinus = -1;
		
		return plusMinus * Math.round(Math.sqrt(w ** 2 + h ** 2));
	}
	
	function mouseDown(ev)
	{
		ev.preventDefault();
		ev.stopPropagation();
		
		if (!scrubbable) return false;
		
		valueChangeEnaged = true;
		valueChangeAllowed = false;
		
		document.addEventListener("mousemove", maybeChangeValue);
		document.addEventListener("mouseup", releaseValueChange);
		document.addEventListener("keydown", cancelScrub);
		
		pixelDistance = 0;
		originX = ev.pageX;
		originY = ev.pageY;
	}
	
	function cancelScrub(ev)
	{
		if (ev.key == "Escape" && valueChangeAllowed)
		{
			dispatch("scrubcancel");
			releaseValueChange();
		}
	}
	
	function maybeChangeValue(ev)
	{
		if (!valueChangeEnaged) return;
		
		pixelDistance = pyfagorus(ev.pageX - originX, ev.pageY - originY);
		if (pixelDistance > valueChangeSafeMargin)
		{
			document.body.classList.add("scrubber");
			valueChangeAllowed = true;
			dispatch("scrubbegin");
		}
			
		if (!valueChangeAllowed) return;
		
		console.log("Scrub", pixelDistance);
			
		dispatch("scrub", { distance: Math.round(pixelDistance / scrubCoeff) });
	}
	
	function releaseValueChange()
	{
		valueChangeEnaged = false;
		document.body.classList.remove("scrubber");
		document.removeEventListener("mousemove", maybeChangeValue);
		document.removeEventListener("mouseup", releaseValueChange);
		document.removeEventListener("keydown", cancelScrub);
		dispatch("scrubend");
	}
	
	function click(ev)
	{
		//@ts-ignore
		theInline.focus();
		releaseValueChange();
	}
	
	function focus(ev): boolean
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
		if (theInline) isValid = (validatorFunction(value)); else isValid = true;
	}
	
</script>
<!-- <svelte:document on:mouseover={maybeChangeValue} on:mouseup={releaseValueChange}></svelte:body> -->

<span style="width:{width}; display:{display}" role="textbox" contenteditable class:invalid={!isValid && prevValue != value} class:disabled={disabled} type="text" class="inline-editable-new" bind:this={theInline} bind:textContent={value} on:keydown="{keypress}" on:focus={focus} on:blur={blur} on:click={click} on:mousedown={mouseDown}></span>