<script lang="ts">
	// import { createEventDispatcher } from 'svelte';;
	
	import Pad from './Pad.svelte';
	
	import type { ColourPaintLayer } from '../colour_utils';
	import type { Pattern } from '../types';
	import type { BranchBank, BranchControl } from '../types_patch';
	import { getNoteInCurrentScale } from '../midi_utils';
	import { numberOfPads } from '../data_utils';
	
	export let pattern: Pattern;
	export let bank: BranchBank;
	export let colourPaintMode: ColourPaintLayer
	export let colourPaintShowBank: boolean;
	
	// let dispatch = createEventDispatcher();
	
	interface PadObject
	{
		object: BranchControl,
		scaleNote: number,
		isKeyOfScale: boolean
	};
	
	let pads: PadObject[];
	
	let globalColours = [];
		
	$:{
		pads = [];
		globalColours = [];
		
		console.log(bank);
		
		if (bank?.bank?.colour) globalColours = bank.bank.colour;
		
		for (let i = 0; i < numberOfPads; i++)
		{
			// let isKeyOfScaleNow = false;
			// let scaleNoteNow = null;
			let noteInfo = getNoteInCurrentScale(i, bank);
			
			pads.push({
				object: bank?.pads?.[i] ?? null,
				scaleNote: noteInfo.note,
				isKeyOfScale: noteInfo.isKeyOfScale, 
			});
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
	<Pad on:click on:paint data={pad.object} controlNo={i} {globalColours} isKeyOfScale={pad.isKeyOfScale} pattern={pattern[i]} scaleNote={pad.scaleNote} {colourPaintMode} {colourPaintShowBank} />
{/each}

</div>