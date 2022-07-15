<svelte:options accessors/>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	import { deepClone } from '../basic';
	import type { BranchBank } from "../types_patch";
	import { colourOff, ColourPaintLayer, invH, dimV, dimS, maxV, maxS } from '../colour_utils'
	
	import { ctStart, ctFinish, ctExit, assembleLayerFromHexes, getLayerFromHexes  } from './common';
	import type { CTData, HexArrays } from './common'
	
	import OkCancel from '../widgets/OkCancel.svelte'
	// import Halp from '../widgets/Halp.svelte'
	import Preview from './Preview.svelte'

	export let ctData: CTData;
	export const isOpen = function() { return dialog.open; }
	
	// export let bank: BranchBank, pattern: number[], ctData.layer: ColourPaintLayer;
	
	let dialog: HTMLDialogElement;
	
	let dispatchEvent = createEventDispatcher();
	
	export function start() { ctData = ctStart(dialog, ctData); } // self-assignments keep Svelte happier
	function finish() { ctData = ctFinish(dialog,copyLayers,params,ctData); dispatchEvent("input"); }
	
	enum ParamSatVal { Keep, Dim, Max };
	
	interface CTCopyParams
	{
		from: ColourPaintLayer, 
		to: ColourPaintLayer, 
		includeExplicit: boolean, 
		includeBank: boolean, 
		keepexisting: boolean, 
		inverthue: boolean, 
		saturation: ParamSatVal, 
		brightness: ParamSatVal
	};
	
	let params: CTCopyParams = 
	{
		from: ColourPaintLayer.Idle, 
		to: ColourPaintLayer.Active, 
		includeExplicit: true, 
		includeBank: false, 
		keepexisting: false, 
		inverthue: false, 
		saturation: ParamSatVal.Keep, 
		brightness: ParamSatVal.Keep
	};
	
	let before = null;
	let after = null;
	
	let isSameLayer = false;
	let okEnabled = true;
	let enableTargetPreview = false;
	
	let layerPrev: ColourPaintLayer = ColourPaintLayer.Off;
	
	$:{
		enableTargetPreview = dialog?.open;
		
		if (layerPrev != ctData.layer)
		{
			params.from = (ctData.layer == ColourPaintLayer.Pattern) ? 0 : ctData.layer; // change source layer accordingly if changed in the main UI
			params.to   = (ctData.layer == ColourPaintLayer.Pattern) ?					// change target layer to pattern if main UI’s layer is pattern
								ColourPaintLayer.Pattern :
								((params.from == ColourPaintLayer.Idle) ? ColourPaintLayer.Active : ColourPaintLayer.Idle); // otherwise change to the opposite of the source
																															// i know this may not make much sense, but atm
																															// pattern cannot be the source
			
			layerPrev = ctData.layer;
		}
		
		isSameLayer = (params.from === params.to);
		okEnabled = params.includeExplicit || (ctData.layer != ColourPaintLayer.Pattern && params.includeBank); // check if there is actual stuff to copy
		
		if (ctData.hexStorage)
		{
			let tempHex = copyLayers(params, deepClone(ctData.hexStorage));
			before = tempHex.before;
			after = tempHex.after;
		}
	}
	
	function copyLayers(params: CTCopyParams, currentHex: HexArrays)
	{
		let toPattern = (params.to == ColourPaintLayer.Pattern);
		
		currentHex.before = assembleLayerFromHexes(currentHex, params.from);
		
		let doAllTransforms = function(col: number, toPattern: boolean = false)
		{
			if (col == colourOff) return toPattern ? 0 : col;
			
			if (params.inverthue)           col = invH(col);
			if (params.saturation == ParamSatVal.Dim) col = dimS(col);
			if (params.saturation == ParamSatVal.Max) col = maxS(col);
			if (params.brightness == ParamSatVal.Dim) col = dimV(col);
			if (params.brightness == ParamSatVal.Max) col = maxV(col);
			
			return col;
		}
		
		if (params.includeBank && !toPattern && (!params.keepexisting || currentHex.bank[params.to] == colourOff))
			currentHex.bank[params.to] = doAllTransforms(currentHex.bank[params.from]);
		
		if (params.includeExplicit && params.from < 2 && params.to < 2)
		{
			let arrFrom = getLayerFromHexes(currentHex, params.from);
			let arrTo = getLayerFromHexes(currentHex, params.to);
		
			for (let i in arrFrom)
			{
			   if (
				  params.keepexisting && (
					 (!toPattern && arrTo[i] != colourOff) ||
					 (toPattern  && ((arrTo[i] & 0xf) == 0))
				  )
				  ) continue; // keep existing colours is ticked
			   
			   let srcColour = arrFrom[i];
			   
				if (srcColour == colourOff && toPattern)
				{
					if (params.includeBank && currentHex.bank[params.from] != colourOff)
						srcColour = currentHex.bank[params.from];
					else
						srcColour = 0;
				}
			   
			   arrTo[i] = doAllTransforms(srcColour, toPattern);
			}
			
			if (toPattern) currentHex.pattern = [...arrTo]; else currentHex.pads[params.to] = [...arrTo];
		}
		
		currentHex.after = assembleLayerFromHexes(currentHex, params.to);
			
		return currentHex;
	}
</script>

<dialog class="dw-colour-toolmodal modal" bind:this={dialog}>
	<h2>Copy layers & complementary colours</h2>
	<p>You can copy one layer to another, while making some changes to the colours.</p>
	
	<Preview {before} {after} {enableTargetPreview} />
	
	<fieldset>
		<legend>Copy from</legend>
		<div class="checkboxblock">
				<label>
					<input type="radio" bind:group={params.from} value={ColourPaintLayer.Idle} />
					Idle colour
				</label><br /> 
				<label>
					<input type="radio" bind:group={params.from} value={ColourPaintLayer.Active} />
					Active colour
				</label>
		</div>
	</fieldset>
	
	<fieldset>
		<legend>Copy to</legend>
		<div class="checkboxblock">
				<label>
					<input type="radio" bind:group={params.to} value={ColourPaintLayer.Idle} />
					Idle colour
				</label><br /> 
				<label>
					<input type="radio" bind:group={params.to} value={ColourPaintLayer.Active} />
					Active colour
				</label><br />
				<label>
					<input type="radio" bind:group={params.to} value={ColourPaintLayer.Pattern} />
					Patch pattern
				</label>
		</div>
	</fieldset>
	
	<fieldset>
		<legend>Options</legend>
		<div class="checkboxblock">
				<label>
					<input type="checkbox" bind:checked={params.includeExplicit} />
					Include explicitly set colours
				</label><br />
				<label>
					<input disabled={ctData.layer == ColourPaintLayer.Pattern} type="checkbox" bind:checked={params.includeBank} />
					Include bank colour
				</label><br /> 
				<label>
					<input type="checkbox" bind:checked={params.keepexisting} />
					Keep target colours that have already been set
				</label>
		</div>
	</fieldset>
	
	<!-- <fieldset>
		<legend>Change colours</legend> -->
	<fieldset>
		<legend>Hue</legend>
		<label>
			<input type="checkbox" bind:checked={params.inverthue} />
			Invert hue</label><br />
	</fieldset>
	
	<fieldset>
		<legend>Saturation</legend>
		<div class="checkboxblock">
			<label>
				<input type="radio" bind:group={params.saturation} value={ParamSatVal.Keep} />
				Do not change</label>
			<br />
			<label>
				<input type="radio" bind:group={params.saturation} value={ParamSatVal.Dim} />
				Dim</label>
			<br />
			<label>
				<input type="radio" bind:group={params.saturation} value={ParamSatVal.Max} />
				Max out</label>
		</div>
	</fieldset>
	
	<fieldset>
		<legend>Brightness</legend>
		<div class="checkboxblock">
			<label>
				<input type="radio" bind:group={params.brightness} value={ParamSatVal.Keep} />
				Do not change</label>
			<br />
			<label>
				<input type="radio" bind:group={params.brightness} value={ParamSatVal.Dim} />
				Dim</label>
			<br />
			<label>
				<input type="radio" bind:group={params.brightness} value={ParamSatVal.Max} />
				Max out</label>
		</div>
	</fieldset>
	<!-- </fieldset> -->
	
	{#if isSameLayer}
	<div class="modal-warning">
		You have selected the same layer as the source and the destination.
	</div>
	{/if}
	
	<OkCancel okDisabled={!okEnabled} okText="Copy" theDialog={dialog} on:ok={finish} on:cancel="{()=>ctExit(dialog,ctData)}" on:cancel />
</dialog>