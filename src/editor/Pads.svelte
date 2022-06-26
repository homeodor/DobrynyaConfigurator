<script lang="ts">
	// import { createEventDispatcher } from 'svelte';;
	
	import Pad from './Pad.svelte';
	
	import type { ColourPaintLayer } from '../colour_utils';
	import type { Pattern } from '../types';
	import type { BranchBank } from '../types_patch';
	import { getNoteInCurrentScale } from '../midi_utils';
	import { numberOfPads } from '../data_utils';
	
	export let pattern: Pattern;
	export let bank: BranchBank;
	export let colourPaintMode: ColourPaintLayer
	export let colourPaintShowBank: boolean;
	
	// let dispatch = createEventDispatcher();
	
	let pads = [];
	let isKeyOfScale = [];
	let scaleNotes = [];
	let globalColours = [];
		
	$:{
		pads = [];
		isKeyOfScale = [];
		scaleNotes = [];
		globalColours = [];
		
		console.log(bank);
		
		if (bank?.bank?.colour) globalColours = bank.bank.colour;
		
		for (let i = 0; i < numberOfPads; i++)
		{
			let isKeyOfScaleNow = false;
			let scaleNoteNow = null;
			
			if (bank?.bank?.keyinfo != undefined && bank?.bank?.keyinfo >= 0)
			{
				let noteInfo = getNoteInCurrentScale(i, bank);
				
				if (noteInfo)
				{
					isKeyOfScaleNow = noteInfo.isKeyOfScale;
					scaleNoteNow = noteInfo.note;
				}
			}
			
			scaleNotes.push(scaleNoteNow);
			isKeyOfScale.push(isKeyOfScaleNow);
			pads.push(bank?.pads?.[i] ?? null);
		}
	}

// 	function padClick (ev: MouseEvent, i: number)
// 	{
// 		console.log(ev.type);
// 		
// 		let eventToDispatch: string;
// 		
// 		if (colourPaintMode != ColourPaintLayer.Off) // colour paint
// 		{
// 			if (
// 				(ev.type == "click" || ev.buttons & 0x1)
// 			) eventToDispatch = "paint";
// 		} else {
// 			if (ev.type != "click") return; // mouseover?
// 			eventToDispatch = "click";
// 		}
// 
// 		dispatch(eventToDispatch, {controlKind: 'pad', target: ev.currentTarget, controlNo: i});
// 	};


</script>

<div class="dobrynya-pads" id="pads-left" data-control-name="Pad" data-control-type="pad">
{#each pads as pad, i}
	<Pad on:click on:paint data={pad} controlNo={i} {globalColours} isKeyOfScale={isKeyOfScale[i]} pattern={pattern[i]} scaleNote={scaleNotes[i]} {colourPaintMode} {colourPaintShowBank} />
{/each}

</div>