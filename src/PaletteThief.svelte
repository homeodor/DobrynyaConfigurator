<script lang="ts">
	import ColorThief from 'colorthief';
	import { isMacLike } from './ts/stores';
	import { onMount } from 'svelte'
	import OkCancel from './widgets/OkCancel.svelte'
	
	let okEnabled = true;
		
	const colorThief = new ColorThief();	
	
	enum ThiefMode
	{
		Smart,
		Precise
	};
	
	let dialog: HTMLDialogElement;
	let previewImg: HTMLImageElement;
	let thiefMode: ThiefMode = ThiefMode.Smart;
	let thiefModePrev: ThiefMode = ThiefMode.Smart;
	let dragOverClass: boolean;
	let isSeamless: boolean = false;
	let isSeamlessPrev: boolean = false;
	
	export function start() { dialog.showModal(); }
	export const isOpen = function() { return dialog.open; }
	
	export let value: string[];

	let palette: string[] = 
	[
		"#00000033","#00000033","#00000033","#00000033",
		"#00000033","#00000033","#00000033","#00000033",
		"#00000033","#00000033","#00000033","#00000033",
		"#00000033","#00000033","#00000033","#00000033",
	]
	
	onMount(() => {
		dialog.focus();
	});
	
	async function uploadImage(ev: DragEvent | ClipboardEvent)
	{
		if (!isOpen()) return;
		ev.preventDefault();
		console.log(ev);
//		return;

		let theFile: File = null;
		
		if (ev.type == "paste")
		{
			for (let item of (ev as ClipboardEvent).clipboardData.items)
			{
				if (item.kind != "file") continue;
				
				let file = item.getAsFile();
				
				if (!file.type.startsWith("image/")) continue;
				
				theFile = file;
				break;

			}
		} else {
			
			for (let file of (ev as DragEvent).dataTransfer.files)
			{
				if (!file.type.startsWith("image/")) continue;
				
				theFile = file;
				break;
			}
		}
		
		if (theFile === null) return false; // no acceptable files
		
		console.log(theFile);
		
		let reader = new FileReader();
		
		reader.onload = (ev: ProgressEvent<FileReader>) => 
		{
			previewImg.src = (ev.target.result as string);
		}
		
		reader.readAsDataURL(theFile);
	}
	
	function componentToHex24(c)
	{
		let hex = c.toString(16);
	    return hex.length == 1 ? "0" + hex : hex;
	}
	
	function rgbToHex24(r, g, b) {
	  return "#" + componentToHex24(r) + componentToHex24(g) + componentToHex24(b);
	}
	
	// function hex24ToRgb(hex)
	// {
	// 	let bigint = parseInt(hex, 16);
	// 	let r = (bigint >> 16) & 255;
	// 	let g = (bigint >> 8) & 255;
	// 	let b = bigint & 255;
	// 
	// 	return r + "," + g + "," + b;
	// }
	
	async function parseImage()
	{
		const countPixels = isSeamless ? 14 : 16;
		
		let paletteNow: any = [];
		
		if (thiefMode == ThiefMode.Smart)
		{
			paletteNow = await colorThief.getPalette(previewImg, countPixels);
		} else {
			let canvas = document.createElement('canvas');
			let ctx = canvas.getContext('2d');
			ctx.imageSmoothingQuality = "high";
			ctx.drawImage(previewImg, 0, 0, countPixels, 1);
			for (let x=0; x<countPixels; x++)
			{
				paletteNow[x] = ctx.getImageData(x, 0, 1, 1).data;
			}
			canvas.remove();
		}
		
		if (isSeamless)
		{
			paletteNow[14] = [0,0,0];
			paletteNow[15] = [0,0,0];
			
			for (let c=0; c<3; c++) // rgb. c++ lol
			{
				let rDiff = Math.round((paletteNow[13][c] - paletteNow[0][c]) / 3);
				paletteNow[14][c] = paletteNow[0][c] + rDiff * 2;
				paletteNow[15][c] = paletteNow[0][c] + rDiff;
			}
		}
		
		for (let x=0; x<16; x++)
		{
			palette[x] = rgbToHex24(paletteNow[x][0],paletteNow[x][1],paletteNow[x][2]);
		}

		palette = palette; // Svelte
	}
	
	function finish()
	{

		if (paletteCreated) value = palette;
		dialog.close();
	}
	
	function refocus()
	{
		console.log("Blured?");
		if (dialog.open) dialog.focus();
	}
	
	let paletteCreated = false;
	
	$:{
		if (thiefMode != thiefModePrev || isSeamlessPrev != isSeamless)
		{
			parseImage();
			thiefModePrev = thiefMode;
			isSeamlessPrev = isSeamless;
		}
		
		paletteCreated = (palette[0] != "#00000033");
	};
	
</script>
<style>
	.preview { width: 100%; height: 7em; background-color:#00000022; border-radius: 0.3em;}
	.preview img { max-width:20em; max-height:7em; }
	.paletteresult div { display:inline-block; width:2em; height: 2em;}
	.flexer { display:flex; justify-content: center; align-items: center;}
	
</style>
<svelte:body on:paste={uploadImage} />
<dialog class="palettethiefholder modal" bind:this={dialog} on:blur={refocus} class:over={dragOverClass} on:drop="{(ev)=>{dragOverClass=false;uploadImage(ev)}}" on:dragover|stopPropagation|preventDefault="{()=>{}}" on:dragenter="{_=>dragOverClass=true}" on:dragleave="{_=>dragOverClass=false}">
	
	<h3>Palette thief</h3>
	
	<p>Drag and drop or paste ({#if isMacLike}⌘{:else}Ctrl{/if}-V) an image to steal colours from it!</p>
	
	<div class="preview flexer">
		<img on:load={parseImage} bind:this={previewImg} />
	</div>
	
	<div class="flexer" style="padding-top:1em;">
	<div class="checkboxblock">
		<label>
			<input type="checkbox" bind:checked={isSeamless} /> Make seamless
		</label>
	</div>
	</div>

	<div class="flexer" style="padding:1em;">
	<div class="checkboxblock">
		
		<label>
			<input type="radio" bind:group={thiefMode} value={ThiefMode.Smart}> Smart
		</label><br />
		<label>
			<input type="radio" bind:group={thiefMode} value={ThiefMode.Precise}> Precise
		</label>
		
	</div>

</div>
	<p class="explain">Smart mode is great for general photos and images.<br />Precise mode is the best choice if you have
	an actual gradient, for instance, from <a href="http://soliton.vm.bytemark.co.uk/pub/cpt-city/" rel="noreferrer" target="_blank">cpt-city</a>.
</p>
	
	<div class="paletteresult">
		{#each palette as plt}
		<div class="palettesquare" style="background-color:{plt}"></div>
		{/each}
	</div>
	
	<OkCancel okDisabled={!paletteCreated} okText="Steal" theDialog={dialog} on:ok={finish} on:cancel="{()=>dialog.close()}" on:cancel />
	
</dialog>