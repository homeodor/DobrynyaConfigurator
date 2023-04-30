<script lang="ts">
	import OkCancel from './widgets/OkCancel.svelte'
	import ColourCanned from './widgets/ColourCanned.svelte'
	import { sysExTestFill } from 'midi_core'
	import { onMount, onDestroy, createEventDispatcher } from 'svelte'
	import { colourOff, hexToObj, hsvToHex, hexToCSS, invH, dimV, dimS } from 'colour_utils'
	import { isSame, deepClone } from 'basic';
	import type { HexObject } from 'types'

	export let hex: number = colourOff;
	export let startHex: number = colourOff;
	export let auxHex: number = colourOff;
	export let name: string = "";

	let hexOriginal: number = colourOff;
	let hexWhite: number = 0xf;
	let hexBlack: number = 0x0;
	
	let theDialog: HTMLDialogElement;
	
	let range: HexObject = { h:0, s:0, v:0 };
	let rangeWas: HexObject = deepClone(range);
		
	let dispatchEvent = createEventDispatcher();
	
	let colourGen: number[] = [];
	
	let gradS1: string;
	let gradS2: string;
	let gradV: string;
	
	const vLevels = [
		[ 15, 8, 5, 3 ],
		[ 15, 8, 5, 3 ],
		[ 13, 7, 5, 3 ],
		[ 11, 6, 4, 3 ]
	];
	
	let vj = 0;
	
	for (let sg: number = 15; sg >= 3; sg-=4, vj++) {		
	for (let vi: number = 0;  vi <  4; vi++)  { // from vLevels array
	for (let hg: number = 0; hg < 256; hg+=8) {
		colourGen.push(hsvToHex(hg,sg, vLevels[vj][vi]));
	}}};
	
	onMount(() => {
		hexOriginal = hex;
		if (startHex != colourOff) hex = startHex;
		theDialog.showModal();
	});
	
	onDestroy(() => theDialog.close());
	
	// async function dispatchAndClose(isOK: boolean)
	// {
	// 	if (!isOK) hex = hexOriginal;
	// 	await tick();
	// 	theDialog.close();
	// 	dispatchEvent("close");
	// }
	
	function ComplimentaryColourStorage(nowHex: number)
	{
		this.inv    = colourOff;
		this.dim    = colourOff;
		this.dimInv = colourOff;
		this.wsh    = colourOff;
		this.wshInv = colourOff;
		
		this.update = function(nowHex: number)
		{
			this.inv    = invH(nowHex);
			this.dim    = dimV(nowHex);
			this.dimInv = invH(this.dim);
			this.wsh    = dimS(nowHex);
			this.wshInv = invH(this.wsh);
			
			return this;		
		}
		
		this.update(nowHex);
	}

	let mainComplimentaries = new ComplimentaryColourStorage(hex);
	let auxComplimentaries  = new ComplimentaryColourStorage(auxHex);
	
	$:
	{
		mainComplimentaries = mainComplimentaries.update(hex);
		auxComplimentaries = auxComplimentaries.update(auxHex);
		
		let hexObject: HexObject = hexToObj(hex);
		
		if (!isSame(range,rangeWas))
			hex = hsvToHex(range.h, range.s, range.v);
		else
			range = deepClone(hexObject);
		
		rangeWas = deepClone(range);

		gradS1 = hexToCSS(hsvToHex(hexObject.h, 0, hexObject.v));
		gradS2 = hexToCSS(hsvToHex(hexObject.h, 15,  hexObject.v));
		gradV  = hexToCSS(hsvToHex(hexObject.h, hexObject.s, 15));
		
		sysExTestFill(hex);
	}

</script>

<style>
		.colourwellholder { display:inline-block; padding: 0 1em 1em 1em }
		.colourwell { display:inline-block; width:5em; height:5em; box-shadow: inset 0.2em 0.2em 0.4em rgba(0,0,0,0.3), inset -0.2em -0.2em 0.4em rgba(255,255,255,0.1); border-radius:0.5em }
</style>

<dialog class="coloureditorholder" bind:this={theDialog}>
		
	<div class="colourselector">
		<div class="colourwellholder">
			<h3 id="modal-colour-name" class="colour-name">{name}</h3>
			<div class="colourwell" class:nocolour={hex == colourOff} style="background-color: {hexToCSS(hex)}"></div>
		</div>
	</div>
	
	<div class="complementarycolours">
		
		<div>
			<ColourCanned className="colourwell-comp nocolour" bind:selectedHex={hex} hex={colourOff} />
			<ColourCanned className="colourwell-comp" bind:selectedHex={hex} hex={hexBlack} />
			<ColourCanned className="colourwell-comp" bind:selectedHex={hex} hex={hexWhite} />
			<ColourCanned className="colourwell-comp" bind:selectedHex={hex} hex={hexOriginal} />
		</div>
		<br/>
		<div>
			<ColourCanned hex={mainComplimentaries.wsh} bind:selectedHex={hex} className="colourwell-comp" />
			<ColourCanned hex={mainComplimentaries.dim} bind:selectedHex={hex} className="colourwell-comp" />
			<ColourCanned hex={mainComplimentaries.inv} bind:selectedHex={hex} className="colourwell-comp" />
			<ColourCanned hex={mainComplimentaries.wshInv} bind:selectedHex={hex} className="colourwell-comp" />
			<ColourCanned hex={mainComplimentaries.dimInv} bind:selectedHex={hex} className="colourwell-comp" />
			{#if auxHex != colourOff}
			<ColourCanned hex={auxComplimentaries.wsh} bind:selectedHex={hex} className="colourwell-comp" />
			<ColourCanned hex={auxComplimentaries.dim} bind:selectedHex={hex} className="colourwell-comp" />
			<ColourCanned hex={auxComplimentaries.inv} bind:selectedHex={hex} className="colourwell-comp" />
			<ColourCanned hex={auxComplimentaries.wshInv} bind:selectedHex={hex} className="colourwell-comp" />
			<ColourCanned hex={auxComplimentaries.dimInv} bind:selectedHex={hex} className="colourwell-comp" />
			{/if}
		</div>
	</div>
	
	<div id="modal-colour-sliders">
		<input type="range" class="colour-slider colour-slider-h" min=0 max=254 step=1 bind:value={range.h}>
		<input type="range" class="colour-slider colour-slider-s" style="--grads1:{gradS1};--grads2:{gradS2}" min=0 max =15 step=1 bind:value={range.s}>
		<input type="range" class="colour-slider colour-slider-v" style="--gradv:{gradV}" min=0 max =15 step=1 bind:value={range.v}>
	</div>
	
	<div class="colourgenholder">
		<div class="colourgen">
			
			{#each colourGen as colourGenHex}
				<ColourCanned hex={colourGenHex} bind:selectedHex={hex} />
			{/each}
			
			
		</div>
	</div>
	
	<OkCancel {theDialog} {dispatchEvent} resetAction="{()=>hex = hexOriginal}" />
</dialog>