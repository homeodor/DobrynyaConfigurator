<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte'
	import { lastColourPaintLayer, lastColourPaintHex } from './stores'
	
	import { sysExTestPattern } from './midi'
	import { patchChanged } from './events'
	import { getIconURL, getIconCSS } from './icons'
	import { ColourPaintLayer, colourOff, hexToCSS, randomPattern } from './colour_utils'
	import { createObjectIfAbsent, deepClone, emptyPadDataArray, numberOfPads, isSame } from './data_utils';
	import { expandSetSanize } from './data_expandsanize'
	
	import { Control } from './types';
	import type { InvokeControlEventData } from './events'
	import type { BranchBank } from "./types_patch";
	import { getCurrentHexes, assembleLayerFromHexes } from './colourtools/common'
	import type { CTData } from './colourtools/common';
	
	import Halp from './widgets/Halp.svelte';
	import GotIt from './widgets/GotIt.svelte'
	import Confirm from './widgets/Confirm.svelte'
	import ColourWell from './widgets/ColourWell.svelte';
	
	import CTFill from './colourtools/Fill.svelte'
	import CTRandom from './colourtools/Random.svelte'
	import CTFade from './colourtools/Fade.svelte'
	import CTCopy from './colourtools/Copy.svelte'
	// import CTExplicit from './colourtools/Explicit.svelte'
	
	export let paintData = null;

	export let bank: BranchBank;
	export let pattern: number[];

	export let colourPaintMode: ColourPaintLayer;
	export let colourPaintShowBank: boolean;
	
	export let colourDataModel = 
	{
		colour: [colourOff, colourOff]
	};
	
	export let colourDataModelBank = 
	{
		colour: [colourOff, colourOff, colourOff, colourOff]
	};
	
	let mainColourWell: ColourWell, buttonFill: HTMLButtonElement, buttonRandom: HTMLButtonElement, buttonMakeBank: HTMLButtonElement; // used to open with keyboard
	
	let hex: number;
	let prevHex: number = colourOff;
	let hexCSS: string;
	
	enum Tool
	{
		None,
		Paintbrush,
		Eyedropper,
		Eraser
	};
	
	let selectableTools = 
	[
		{ id: Tool.Paintbrush,	src: "", title: "Brush tool: paint your colour", alt: "Brush", svg: "brush" },
		{ id: Tool.Eyedropper,	src: "", title: "Eyedropper tool: pick your colour", alt: "Pick", svg: "eyedropper" },
		{ id: Tool.Eraser, 		src: "", title: "Eraser tool: clear colour and revert to bank colour", alt: "Erase", svg: "eraser" },
	];
	
	let tool: Tool; // = Tool.Paintbrush;
	let temporaryEraser = false;
	let releaseTool = Tool.None;
	let releaseToolUsed = false;
	
	async function updateCursor()
	{
		setCursor(selectableTools.find(v=>{return v.id==tool}).svg);
	}
	
	async function setCursor(cursorID: string)
	{
		await tick();
		document.body.style.setProperty('--colourpaint-cursor', getIconCSS(
			cursorID,
			hexCSS
		));
	}
	
//	console.log(setCursor);
	
	function setTool (t: Tool, setReleaseTool: boolean = false)
	{
		if (setReleaseTool)
		{
			releaseTool = tool;
			releaseToolUsed = false;
		}
		
		tool = t;
		updateCursor();
	}
	
	let isAlt = false;
	
	function keydownHandle(ev: KeyboardEvent)
	{
		if (ev.repeat) return false;
		
		if (ev.key == "b" && !temporaryEraser)
			setTool(Tool.Paintbrush, true);

		if (ev.key == "e")
		{
			temporaryEraser = false;
			setTool(Tool.Eraser, true);
		}

		if (ev.key == "i" && !temporaryEraser)
			setTool(Tool.Eyedropper, true);
			
		if (ev.key == "Alt" && tool == Tool.Paintbrush)
		{
			isAlt = true;
			colourPaintModeBankName = setColourPaintModeBankName();
			temporaryEraser = true;
			setTool(Tool.Eraser);
		}
		
		if (ev.key == "Shift")
		{
			if (tool === Tool.Paintbrush && hex != colourOff) setCursor('bucket');
			if (tool === Tool.Eraser     || hex == colourOff) setCursor('filldelete');
		}
	}

	function keyupHandle(ev: KeyboardEvent)
	{
		const keysToButtons =
		{
			f: buttonFill,
			m: buttonMakeBank
		}; // bind buttons to keypresses
		
		const keysToCT =
		{
			l: "copy",
			a: "fade",
			y: "explicit",
		};
		
		const toolKeys: string[] = ['b','e','i'];
		
		if (keysToButtons[ev.key]) keysToButtons[ev.key].click();
		if (keysToCT[ev.key]) ctDialogs[keysToCT[ev.key]].start();
		
		if (ev.key == "c") mainColourWell.show();
		if (ev.key == "r") if (buttonRandom.disabled) ctDialogs.random.start(); else buttonRandom.click();
		
		if (ev.key == "`") colourPaintShowBank = !colourPaintShowBank;
		
		if (ev.key == "1") colourPaintMode = ColourPaintLayer.Idle;
		if (ev.key == "2") colourPaintMode = ColourPaintLayer.Active;
		if (ev.key == "3") colourPaintMode = ColourPaintLayer.Pattern;
		
		if (ev.key == "Alt" && temporaryEraser)
		{
			isAlt = false;
			colourPaintModeBankName = setColourPaintModeBankName();
			temporaryEraser = false;
			setTool(Tool.Paintbrush);
		}
		
		if (releaseTool != Tool.None && toolKeys.includes(ev.key))
		{
			if (releaseToolUsed) setTool(releaseTool);
			releaseTool = Tool.None;
			releaseToolUsed = false;
		}
		
		updateCursor();
	}
	
	function fixHex(theHex: number)
	{
		return (
			tool == Tool.Paintbrush ? 
			(
				(
					(colourPaintMode == ColourPaintLayer.Pattern || theHex != colourOff) &&
					(theHex & 0xf) == 0
				) ?
					0 :
					theHex // if brightness == 0, make it simply black, with the exception of colourOff in non-pattern mode
			) :
			colourOff
		);
	}
	
	export function paintEvent(data: InvokeControlEventData): boolean
	{
		console.log("PAINT EVENT");
		console.log(data);
		releaseToolUsed = true;
		
		let hexFixed = fixHex(hex);
			
		if (tool == Tool.Eyedropper)
		{
			if (data.altKey && "ultimateHex" in data)
				hex = data.ultimateHex;
			else if ("hex" in data)
				hex = data.hex;
				
			updateCursor();
			console.warn("Cursor should update??");
		} else {
			switch (data.controlKind)
			{
				case Control.Pad:
				{
					let i = data.shiftKey ? 0 : data.controlNo;
					let limit = data.shiftKey ? numberOfPads : i+1;
						// if shift has been pressed, do a “global” action, iterate through all pads
						// otherwise just “iterate” through a single pad
					
					for (; i<limit; i++)
					{					
						if (colourPaintMode == ColourPaintLayer.Pattern)
							pattern[i] = hexFixed;
						else
						{
							console.log(colourPaintMode);
							createObjectIfAbsent(bank,"pads",deepClone(emptyPadDataArray));
							expandSetSanize(colourDataModel, bank.pads[i], ()=>{
								bank.pads[i].colour[colourPaintMode] = hexFixed
							});
						}
					}
					
					break;
				}
			}
			
			patchChanged();
			
			bank = bank;
			return null;
		}
	}
	
	let confirmHexOff: any;
	
	async function currentToBankColour(ev: MouseEvent)
	{
		if (hex == colourOff && !await confirmHexOff.confirm()) return;
		
		let altOffset = ev.altKey ? 2 : 0; // set music key / key active colour if alt is pressed
		
		createObjectIfAbsent(bank,"bank");
		expandSetSanize(colourDataModelBank, bank.bank, ()=>bank.bank.colour[colourPaintMode + altOffset]=hex);
	}
	
	onMount  (()=>{
		setTool(Tool.Paintbrush);
		colourPaintMode = $lastColourPaintLayer;
		hex = $lastColourPaintHex;
	});
	onDestroy(()=>{
		lastColourPaintLayer.set(colourPaintMode);
		colourPaintMode = ColourPaintLayer.Off;
		lastColourPaintHex.set(hex);
	});
	
	function updateCT() { pattern = pattern; } // this triggers the UI update
	function updateBucket(ev: CustomEvent) { console.log(ev.detail); bucketCSS = [ hexToCSS(ev.detail.hex), hexToCSS(ev.detail.hex2) ] }
	

	
	let colourPaintModeBankName = "";

	
	function setColourPaintModeBankName(): string
	{
		return colourPaintMode == ColourPaintLayer.Idle ? (isAlt ? "music key" : "idle") :
		(
			colourPaintMode == ColourPaintLayer.Active ? (isAlt ? "key active" : "active") : ""
		);
	}
	
	let previousPattern = null;
	
	export function updateDevicePreview(force: boolean = false)
	{
		if (mainColourWell) console.log(force, colourPaintMode == ColourPaintLayer.Off, mainColourWell?.isOpen(), Object.values(ctDialogs).find(v=>{return v.isOpen()}) !== undefined);
		if (
			!force && (										// if we do not force the update
			!mainColourWell ||								// if nothing is loaded
			colourPaintMode == ColourPaintLayer.Off ||		// or the mode is not set
			mainColourWell?.isOpen() ||						// or the colour well interface is open
			Object.values(ctDialogs).find(v=>{return v.isOpen()}) !== undefined // or any of the advanced tools are open
		)) return false;
		
		console.log(bank, pattern, getCurrentHexes(bank,pattern));
		
		let pattrn = assembleLayerFromHexes(getCurrentHexes(bank, pattern), colourPaintMode);
		
		if (isSame(previousPattern, pattrn) && !force) return;
		
		previousPattern = pattrn;
		
		console.log(pattrn);
//		console.log(pattrn, bank, pattern, colourPaintMode)
		sysExTestPattern(pattrn);
	}
	
	let isPattern = false;
	
	let ctData: CTData = { hexStorage: null, bank: bank, pattern: pattern, layer: colourPaintMode, hex: hex };
	
	let ctDialogs: { [index: string]: any } = { fill: null, random: null, fade: null, copy: null };
	
	let openCtModal = "notacc";
	let openCtModalPrev = "notacc";
	
	let bucketCSS = [ hexToCSS(hex), hexToCSS(hex) ];
	
	$:
	{
		if (openCtModal != openCtModalPrev && openCtModal != "notacc")
		{
			ctDialogs[openCtModal].start();
			openCtModal = "notacc";
		}
		
		if (prevHex != hex)
		{
			prevHex = ctData.hex = hex; // overwrite the ctData.hex only if the colour well changed
			bucketCSS = [ hexToCSS(hex), hexToCSS(hex) ];
		}
		
		ctData.layer = colourPaintMode;
		
		isPattern = colourPaintMode === ColourPaintLayer.Pattern;
		
		hexCSS = hexToCSS(hex);
		
		if (paintData) paintData = paintEvent(paintData);
		
		colourPaintModeBankName = setColourPaintModeBankName();
		
		console.log(colourPaintMode, bank, pattern);
		
		updateDevicePreview();
		
		selectableTools.forEach(v=>{
			v.src = getIconURL(v.svg, hexCSS);
		});
		
		selectableTools = selectableTools; // svelte!
	}
</script>

<svelte:window on:keydown={keydownHandle} on:keyup={keyupHandle} />

<Confirm bind:this={confirmHexOff}>
	<p>This will turn off the bank {colourPaintModeBankName} colour.</p>
</Confirm>

<div class="drawer" id="dw-colourpaint">
	<GotIt cookieName="colourworks">
		Dobrynya goes into colour preview mode while the “Colour paint” pane is open so that you see better what you’re doing.
		However, this is temporary, and you still have to upload the patch to apply the changes.
	</GotIt>
	<p class="explain-caption">
		Click the well to pick a colour, then apply it to the whole bank or paint each pad individually!
		A diagonal dash (<span style="display: inline-block;width: 1.5em;height: 1.5em;vertical-align: middle;background-size: 90%;" class="nocolour"></span>) means
		no explicit colour is set (the colour is “off”). Bank colours can also be set in the <span class="unreal openbanksettings">bank settings</span> tab.
	</p>
	
	<div id="dw-colour-toolbar">
		<div class="colourwellholder" style="margin-top:1em">
			<ColourWell large={true} bind:hex bind:this={mainColourWell} name="Brush colour" on:close="{()=>{updateCursor();updateDevicePreview(true);}}" resetColour={false} /><br />
			<button bind:this={buttonMakeBank} disabled={isPattern}  class="smaller" on:click={currentToBankColour} style="min-width: 16em">Make bank {colourPaintModeBankName} colour</button>
			<!-- <div class="complementarycolours">
				<div class="colourwell-comp nocolour"></div>
				<div class="colourwell-comp" style="background-color:black" data-colour="0"></div>
			</div> -->
		</div>
		<div id="dw-colour-stuff-panel">
			<div>
				{#each selectableTools as toolArr }
				<button on:click="{()=>setTool(toolArr.id)}" class="dw-colour-tools" class:sel={tool==toolArr.id} title={toolArr.title}><img alt="{toolArr.alt}" src={toolArr.src} /></button>
				{/each}
				<span>&nbsp;</span>
				<button bind:this={buttonFill} on:click="{()=>ctDialogs.fill.start()}" class="dw-colour-tools" title="Bucket tool: fill everything with this colour"><img alt="Fill" src="{getIconURL('bucket', bucketCSS[0], bucketCSS[1])}" /></button>
				<button bind:this={buttonRandom} class="dw-colour-tools" disabled={!isPattern} on:click={()=>{randomPattern(pattern);pattern=pattern}} title="Random: randomise pattern"><img alt="Random" src="{getIconURL('random')}" /></button>
			</div>

			<div class="dw-colour-stuff">
				<p>Layer:
					<span on:click="{()=>colourPaintMode = ColourPaintLayer.Idle }"    class:sel={colourPaintMode == ColourPaintLayer.Idle}    class="unreal">Idle</span>
					<span on:click="{()=>colourPaintMode = ColourPaintLayer.Active }"  class:sel={colourPaintMode == ColourPaintLayer.Active}  class="unreal">Active</span>
					<span on:click="{()=>colourPaintMode = ColourPaintLayer.Pattern }" class:sel={colourPaintMode == ColourPaintLayer.Pattern} class="unreal">Patch pattern
						<Halp dark={colourPaintMode == ColourPaintLayer.Pattern}>
							Patch pattern is used to distinguish the patch from others. Click “Randomise” to get a unique combo!
						</Halp>
					</span>
				</p>
				<p class:disabled={isPattern}>Bank colour:
					<span on:click="{()=>colourPaintShowBank = true}" class="unreal inline-selector" class:sel={colourPaintShowBank}>Show</span>
					<span on:click="{()=>colourPaintShowBank = false}" class="unreal inline-selector" class:sel={!colourPaintShowBank}>Hide</span>
				</p>
				<p><select class="notselect" bind:value={openCtModal}>
					<option value="notacc">More tools</option>
					<option value="fade">Fade and brighten...</option>
					<option value="copy">Copy layers & complementary colours...</option>
					<option value="random">Advanced randomise...</option>
					<option value="explicit">Bank colours to explicit colours...</option>
				</select></p>
			</div>
		</div>
	</div>
</div>

<CTFill on:input={updateCT}   on:cancel="{()=>updateDevicePreview(true)}" bind:ctData bind:this={ctDialogs.fill} on:hex={updateBucket} />
<CTCopy on:input={updateCT}   on:cancel="{()=>updateDevicePreview(true)}" bind:ctData bind:this={ctDialogs.copy} />
<CTFade on:input={updateCT}   on:cancel="{()=>updateDevicePreview(true)}" bind:ctData bind:this={ctDialogs.fade} />
<CTRandom on:input={updateCT} on:cancel="{()=>updateDevicePreview(true)}" bind:ctData bind:this={ctDialogs.random} />
<!--<CTExplicit bind:bank bind:pattern {colourPaintMode} bind:this={ctDialogs.explicit} /> -->