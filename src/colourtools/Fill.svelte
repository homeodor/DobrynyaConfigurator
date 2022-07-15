<svelte:options accessors/>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	import { deepClone, isSame } from '../basic';
	import { colourOff } from '../colour_utils'
	import type { ColourPaintLayer } from '../colour_utils'
	
	import { fill, HueMode, FillMode } from './fill_func';
	
	import { CTAffect, ctStart, ctFinish, ctExit } from './common'
	import type { CTData } from './common'
	
	import OkCancel from '../widgets/OkCancel.svelte'
	import ColourWell from '../widgets/ColourWell.svelte'
	import Halp from '../widgets/Halp.svelte'
	import Preview from './Preview.svelte'
	
	let dispatchEvent = createEventDispatcher();
	
	//export let bank: any, pattern: number[], colourPaintMode: ColourPaintLayer;
	
	let dialog: HTMLDialogElement;	
	let warn = false;
	
	export let ctData: CTData;// = { hexStorage: null, bank: bank, pattern: pattern, layer: colourPaintMode };
	export const isOpen = function() { return dialog.open; }
	
	export function start()  { ctData = ctStart(dialog, ctData); }
		   function finish() { ctData = ctFinish(dialog,fill,params,ctData); dispatchEvent("input"); }
		
	let params = 
	{
		well1: colourOff, well2: colourOff, mode: FillMode.Solid, huemode: HueMode.Short, affect: CTAffect.All
	};
	
	let before = null
	let after = null
	let prevHex = colourOff;
	
	let prevWells = [ colourOff, colourOff ];
	
	let prevMode: FillMode = params.mode;
	let enableTargetPreview = false;
	
	let well1: ColourWell;
	let well2: ColourWell;
	let preview: Preview;
	
	function patternPreviewUpdate()
	{
		preview.updatePreview();
	}
	
	$:{
		enableTargetPreview = dialog?.open && !well1.isOpen() && !well2.isOpen();
		
		if (prevHex != ctData.hex)
		{
			params.well1 = prevHex = ctData.hex;
		}
		
		if (prevWells[0] != params.well1 || prevWells[1] != params.well2 || prevMode != params.mode)
		{
			dispatchEvent("hex", {		// return hexes to change the drop appearance
				hex: params.well1,
				hex2: (params.mode == FillMode.Solid) ?
					params.well1 : // return same colour if the mode is set to solid
					params.well2	// otherwise return something from well 2
			});
			prevMode = params.mode;
			prevWells = [params.well1, params.well2];
		}
		
		warn = (params.mode == FillMode.Solid && params.well1 == colourOff) ||
		(params.well1 == colourOff && params.well2 == colourOff);
		
		if (ctData.hexStorage)
		{
			// console.log("Writing stuff");
			let tempHex = fill(params, deepClone(ctData.hexStorage), ctData.layer);
			before = tempHex.before;
			after  = tempHex.after;
		}
	}
</script>

<dialog class="dw-colour-toolmodal modal" bind:this={dialog}>
	<h2>Fill</h2>
	<Preview {before} {after} {enableTargetPreview} bind:this={preview} />
	<fieldset>
		<legend>Colours</legend>
		<ColourWell on:close={patternPreviewUpdate} bind:this={well1} bind:hex={params.well1} resetColour={false} />
		<ColourWell on:close={patternPreviewUpdate} bind:this={well2} bind:hex={params.well2} resetColour={false} />
	</fieldset>
	
	<fieldset>
		<legend>Method</legend>
		<div class="checkboxblock">
				<label>
					<input type="radio" bind:group={params.mode} value={FillMode.Solid}>
					Solid one-colour
				</label><br /> 
				<label>
					<input type="radio" bind:group={params.mode} value={FillMode.GradientTD}>
					Gradient top-down
				</label><br /> 
				<label>
					<input type="radio" bind:group={params.mode} value={FillMode.GradientLR}>
					Gradient left-right
				</label><br /> 
				<label>
					<input type="radio" bind:group={params.mode} value={FillMode.GradientTLBR}>
					Gradient top left to bottom right
				</label><br /> 
				<label>
					<input type="radio" bind:group={params.mode} value={FillMode.GradientTRBL}>
					Gradient top right to bottom left
				</label>
		</div>
	</fieldset>
	<fieldset>
		<legend class:disabled={params.mode == FillMode.Solid}>Hue gradient<Halp>
			<p>If you’re playing with gradients, and because the spectrum is sort of a ring,
				there are two ways to deal with hues:</p>
			<p><i>Take the shortest path on the spectrum</i> will always try to make
			the fewest hops between the colours. With this, if one colour is violet and another is orange,
			it will go through purples and reds.</p>
			<p><i>Take the longest part on the spectrum</i> is the opposite. In the example above,
			it will NOT include purples and reds, but will include everything else.</p>
			<p><i>Rainbow order</i> will kinda mimic the hue slider in the colour selection
				window, as it will never allow to jump across red. Red to purple will include the whole spectrum.
				This is especially useful if you go for a rainbow effect, hence the name.</p>
		</Halp>
		</legend>
		<div class="checkboxblock">
				<label>
					<input type="radio" bind:group={params.huemode} disabled={params.mode == FillMode.Solid} value={HueMode.Short}>
					<mark>Take the shortest path on the spectrum</mark>
				</label><br /> 
				<label>
					<input type="radio" bind:group={params.huemode} disabled={params.mode == FillMode.Solid} value={HueMode.Long}>
					<mark>Take the longest path on the spectrum</mark>
				</label><br /> 
				<label>
					<input type="radio" bind:group={params.huemode} disabled={params.mode == FillMode.Solid} value={HueMode.Rainbow}>
					<mark>Rainbow order</mark>
				</label>
		</div>
	</fieldset>
	<fieldset>
		<legend>Affect</legend>
		<div class="checkboxblock">
			<label>
				<input type="radio" bind:group={params.affect} value={CTAffect.All}>
				All
			</label><br /> 
			<label>
				<input type="radio" bind:group={params.affect} value={CTAffect.Explicit}>
				Only with explicit colour
			</label><br /> 
			<label>
				<input type="radio" bind:group={params.affect} value={CTAffect.Bank}>
				Only without explicit colour
			</label>
		</div>
	</fieldset>
	{#if warn}
	{#if params.affect != "bank"}
	<div class="modal-warning">
		Because you have no colour selected,
		this will only erase all explicitly set colours (if any were set) and leave the bank colours.
	</div>
	{:else}
	<div class="modal-warning">Because you have no colour selected, this will have no effect.</div>
	{/if}
	{/if}
	
	<OkCancel okText="Fill" theDialog={dialog} on:ok={finish} on:cancel="{()=>ctExit(dialog,ctData)}" on:cancel />
</dialog>