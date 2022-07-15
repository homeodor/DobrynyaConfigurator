<svelte:options accessors/>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { autoseed, seedrandom } from './seedrandom'
	
	import { getIconURL } from '../icons';
	
	import { deepClone, getRandomIntInclusive } from '../basic';
	import { numberOfPads } from '../data_utils';
	import { colourOff, ColourPaintLayer } from '../colour_utils'
	
	import { ctStart, ctFinish, ctExit, assembleLayerFromHexes, colourIsExplicitlySet } from './common';
	import type { CTData, HexArrays } from './common'
	
	import PreviewSingle from './PreviewSingle.svelte';
	import OkCancel from '../widgets/OkCancel.svelte'
	import Halp from '../widgets/Halp.svelte'
	// import Preview from './Preview.svelte'

	export let ctData: CTData;
	export const isOpen = function() { return dialog.open; }
	
	let dialog: HTMLDialogElement;
	
	let dispatchEvent = createEventDispatcher();
	
	let seed = autoseed();
	
	function reseed()
	{
		seed = autoseed();
		preview = preview;
	}
	
	export function start() { ctData = ctStart(dialog, ctData); reseed(); } // self-assignments keep Svelte happier
	function finish() { ctData = ctFinish(dialog,randomFill,params,ctData); dispatchEvent("input"); }
	
	enum ParamSatVal { Max, Reasonable, Random };
	
	interface CTRandomParams
	{
		layersIdle: boolean,
		layersActive: boolean,
		layersPattern: boolean,
		keepColours: boolean,
		hueMax: number,
		hueMin: number,
		satMax: number,
		satMin: number,
		valMax: number,
		valMin: number,
		matchHue: boolean,
		satMode: ParamSatVal,
		valMode: ParamSatVal,
	};
	
	let params: CTRandomParams = 
	{
		layersIdle: true,
		layersActive: false,
		layersPattern: false,
		keepColours: true,
		hueMax: 255,
		hueMin: 0,
		satMax: 15,
		satMin: 10,
		valMax: 15,
		valMin: 4,
		matchHue: true,
		satMode: ParamSatVal.Max,
		valMode: ParamSatVal.Max,
	};
	
	// let before: number[] | null = null;
	// let after:  number[] | null = null;
	
	// let isSameLayer = false;
	let okEnabled: boolean = true;
	let enableTargetPreview = false;
	// let layerPrev: ColourPaintLayer = ColourPaintLayer.Off;
	
	$:{
		
		console.log(enableTargetPreview, params.layersIdle);
		okEnabled = (params.layersIdle || params.layersActive || params.layersPattern);
		
		enableTargetPreview = dialog?.open;
		
		if (ctData.hexStorage)
		{
			randomFill(params, deepClone(ctData.hexStorage));
			preview = preview;
			// before = tempHex.before;
			// after  = tempHex.after;
		}
	}
	
	let preview = {idle:null,active:null,pattern:null};
	
	function randomFill(params: CTRandomParams, currentHex: HexArrays): HexArrays
	{
		let affectLayers: ColourPaintLayer[] = [];
		
		// @ts-ignore
		let generateRandom = new seedrandom(seed); // well this actually works...
		
		if (params.layersIdle)    affectLayers.push(ColourPaintLayer.Idle);
		if (params.layersActive)  affectLayers.push(ColourPaintLayer.Active);
		if (params.layersPattern) affectLayers.push(ColourPaintLayer.Pattern);
		// 
		// console.log("Affect layers", affectLayers);
		
		let hMin = params.hueMin;
		let hMax = params.hueMax;
		
		let hRandomMin = hMin;
		let hRandomMax = hMax;
		let hFixRange = 0;
		
		if (hMin > hMax) // inverted range
		{
			hRandomMin = 0;
			hRandomMax = 255 - hMin + hMax + 1;
			hFixRange = hMin - hMax - 1;
		}
		
		let sMin: number = (params.satMin < params.satMax) ? params.satMin : params.satMax;
		let sMax: number = (params.satMin < params.satMax) ? params.satMax : params.satMin;
		let vMin: number = (params.valMin < params.valMax) ? params.valMin : params.valMax;
		let vMax: number = (params.valMin < params.valMax) ? params.valMax : params.valMin;
		
		let saveHues: number[] | null = null;
		
		let isShy: boolean = params.keepColours;
		
		for (let currLayer of affectLayers)
		{
			let genH: number[] = [], genS: number[] = [], genV: number[] = [];
			
			for (let i=0; i<16; i++)
			{
				let possibleRandomHue = getRandomIntInclusive(hRandomMin, hRandomMax,generateRandom());
				let possibleRandomSat = getRandomIntInclusive(sMin,sMax,generateRandom());
				let possibleRandomVal = getRandomIntInclusive(vMin,vMax,generateRandom());
				
			   genH[i] = saveHues ? saveHues[i] : possibleRandomHue;
			   
			   if (hMin > hMax && !saveHues && genH[i] > hMax) // inverted range, we need to fix it here
				  genH[i] += hFixRange;
			   
			   if (params.satMode == ParamSatVal.Max)
				  genS[i] = sMax;
			   else if (params.satMode == ParamSatVal.Reasonable)
				  genS[i] = (currLayer == 0) ? sMin : sMax;
			   else if (params.satMode == ParamSatVal.Random)
				  genS[i] = possibleRandomSat;
			   
			   if (params.valMode == ParamSatVal.Max)
				  genV[i] = vMax;
			   else if (params.valMode == ParamSatVal.Reasonable)
				  genV[i] = (currLayer == 0) ? vMin : vMax;
			   else if (params.valMode == ParamSatVal.Random)
				  genV[i] = possibleRandomVal;
			}
			
			if (params.matchHue && !saveHues)
			{
			   saveHues = [];
			   for (let i=0; i<16; i++) saveHues[i] = genH[i];
			}
			
			// console.log(genH,genS,genV);
			
	//		if (currLayer == -1) currentHex.pattern = []; else currentHex.pads[currLayer] = [];
			
			for (let i=0; i<numberOfPads; i++)
			{
				let currValue = (currLayer == ColourPaintLayer.Pattern) ? currentHex.pattern[i] : currentHex.pads[currLayer][i];
				
				if (colourIsExplicitlySet(currValue, currLayer) && isShy) continue;
				
				let theHex = (genH[i] << 8) | (genS[i] << 4) | (genV[i]);
				
				if (theHex == colourOff)
					theHex = 0;
				
				// console.log(theHex.toString(16));
				
				if (currLayer == ColourPaintLayer.Pattern)
				{
					console.log(`Putting ${theHex} into pattern ${i}`);
					currentHex.pattern[i] = theHex;
				} else currentHex.pads[currLayer][i] = theHex;
			}
			   
	//		colourPaintToData(isShy, finalArray, currLayer);
		}
		
		preview.idle    = assembleLayerFromHexes(currentHex, ColourPaintLayer.Idle);
		preview.active  = assembleLayerFromHexes(currentHex, ColourPaintLayer.Active);
		preview.pattern = assembleLayerFromHexes(currentHex, ColourPaintLayer.Pattern);
		
		return currentHex;
	}
	
</script>

<style>
	.doublepoleholder { margin: 1em 0em }
	.doublepoleholder section { margin-top: 1em; height: 1em; }
	
	.preview-with-layers > div { width: 6em; }
	.preview-with-layers label { margin-bottom:0.8em; display:inline-block }
	.preview-with-layers .patternpreview { display:inline-block }
</style>

<dialog bind:this={dialog} class="dw-colour-toolmodal modal">
	<h3>
		Randomise colours
		</h3>
	<p>Fill pads with random colours</p>
	

	
	<fieldset><button class="dw-colour-tools" on:click={reseed} title="Reseed"><img alt="Reseed" src="{getIconURL('random')}" style="vertical-align: -0.29em;" /> Roll the dice</button></fieldset>
	
	<fieldset>
		<div id="ct-preview" class="preview-with-layers">
			<div>
				<label><input type="checkbox" bind:checked={params.layersIdle}> Idle</label><br />
				<PreviewSingle hexArray={preview.idle} inline={true} targetPreview={enableTargetPreview && params.layersIdle} />
			</div>
			<div>
				<label><input type="checkbox" bind:checked={params.layersActive}> Active</label><br />
				<PreviewSingle hexArray={preview.active} inline={true} targetPreview={enableTargetPreview && !params.layersIdle && params.layersActive } />
			</div>
			<div><label><input type="checkbox" bind:checked={params.layersPattern}> Pattern</label><br />
				<PreviewSingle hexArray={preview.pattern} inline={true} targetPreview={enableTargetPreview && !params.layersIdle && !params.layersActive && params.layersPattern} />
			</div>
		</div>
		<legend>Fill layers</legend>
		<div class="checkboxblock">

			</div>
		<br /><br />
		<label>
			<input type="checkbox" bind:checked={params.keepColours}>
			Keep colours that have already been set
		</label>
	</fieldset>
	<fieldset>
		<legend>Range</legend>
		<div class="doublepoleholder">
			Hue<br />
			<section class="range-doublepole range-doublepole-hue">
				<input min="0" max="255" bind:value={params.hueMin} type="range">
				<input class="colour-slider-h" min="0" max="255" bind:value={params.hueMax} type="range">
			</section>
		
		</div>
		<div class="doublepoleholder">
			Saturation<br />
			<section class="range-doublepole range-doublepole-sat">
				<input min="0" max="15" bind:value={params.satMin} type="range">
				<input class="colour-slider-s" min="0" max="15" bind:value={params.satMax} type="range">
			</section>
		</div>
		<div class="doublepoleholder">
			Brightness<br />
			<section class="range-doublepole range-doublepole-val">
				<input min="0" max="15" bind:value={params.valMin} type="range">
				<input class="colour-slider-v" min="0" max="15" bind:value={params.valMax} type="range">
			</section>
		</div>
	</fieldset>
	<fieldset>
		<legend>Hue</legend>
		<label>
			<input type="checkbox" bind:checked={params.matchHue} />
			Match hue across layers
				<Halp>If selected, each pad will have the same hue across all layers
					selected in the “fill” group. This is useful if for instance you want “idle”
					and “active” layers to have the same hues, but different brightness, so that
					pads just light up brighter when hit.
				</Halp>
		</label>
	</fieldset>
	<fieldset>
		<legend>Saturation
			<Halp>
				<p>Oftentimes you want to randomise hues, but keep saturation (and probably brightness) consistent.
					This setting will help you do exactly this.
				</p>
				<p><i>Just use maximum</i> will ignore the lower margin of the range altogether.
					All hues will go as saturated as you allow them to be.</p>
				<p><i>Use max for active, min for idle</i> will set minimum range value as the one
					for “idle” layer, and the maximum for “active”. This is useful if you want
					your randomised hues to “pop” more on hitting the pad.</p>
				<p><i>Random</i> will pick random saturation values within the range.</p>
			</Halp>
		</legend>
		<div class="checkboxblock">
			<label>
				<input type="radio" bind:group={params.satMode} value={ParamSatVal.Max}>
				Just use maximum</label><br />
			<label>
				<input type="radio" bind:group={params.satMode} value={ParamSatVal.Reasonable}>
				Max for active, min for idle</label><br />
			<label>
				<input type="radio" bind:group={params.satMode} value={ParamSatVal.Random}>
				Random</label>
		</div> 
	</fieldset>
	
	<fieldset>
		<legend>Brightness
			<Halp>
				<p>Oftentimes you want to randomise hues, but keep brightness (and probably saturation) consistent.
					This setting will help you do exactly this.</p>
				<p><i>Just use maximum</i> will ignore the lower margin of the range altogether.
					All hues will go as bright as you allow them to be.</p>
				<p><i>Use max for active, min for idle</i> will set minimum range value as the one
					for “idle” layer, and the maximum for “active”. This is useful if you want
					your randomised hues to “pop” more on hitting the pad.</p>
				<p><i>Random</i> will pick random brightness values within the range.</p>
			</Halp>
			
		</legend>
		<div class="checkboxblock">
			<label>
				<input type="radio" bind:group={params.valMode} checked value={ParamSatVal.Max}>
				Just use maximum</label><br />
			<label>
				<input type="radio" bind:group={params.valMode} value={ParamSatVal.Reasonable}>
				Max for active, min for idle</label><br />
			<label>
				<input type="radio" bind:group={params.valMode} value={ParamSatVal.Random}>
				Random</label>
		</div>
	</fieldset>
	
	<OkCancel okDisabled={!okEnabled} theDialog={dialog} on:ok={finish} on:cancel="{()=>ctExit(dialog,ctData)}" on:cancel />
</dialog>