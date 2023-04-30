<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import RangeWithInline from "../widgets/RangeWithInline.svelte";
	
	let dispatchEvent = createEventDispatcher();
	
	const rampData = 
	[
		{ value: 1536, noteCode: "U8" , 	noteValue: "64/4" },
		{ value: 1152, noteCode: "U4-F", 	noteValue: "48/4" },
		{ value: 768,  noteCode: "U4" , 	noteValue: "32/4" },
		{ value: 576,  noteCode: "U2-F", 	noteValue: "24/4" },
		{ value: 384,  noteCode: "U2" , 	noteValue: "16/4" },
		{ value: 288,  noteCode: "U1-F" , 	noteValue: "12/4" },
		{ value: 192,  noteCode: "U1" , 	noteValue: "8/4" },
		{ value: 168,  noteCode: "1-F-Q",	noteValue: "7/4" },
		{ value: 144,  noteCode: "1-F" , 	noteValue: "6/4" },
		{ value: 120,  noteCode: "1-Q" , 	noteValue: "5/4" },
		{ value: 96,   noteCode: "1"  , 	noteValue: "4/4" },
		{ value: 72,   noteCode: "2-D" , 	noteValue: "3/4" },
		{ value: 48,   noteCode: "2"  , 	noteValue: "2/4" },
		{ value: 36,   noteCode: "4-D" , 	noteValue: "3/8" },
		{ value: 24,   noteCode: "4"  , 	noteValue: "1/4" },
		{ value: 18,   noteCode: "8-D" , 	noteValue: "3/16" },
		{ value: 12,   noteCode: "8"  , 	noteValue: "1/8" },
		{ value: 8,    noteCode: "8-T" , 	noteValue: "1/8T" },
		{ value: 6,    noteCode: "16" , 	noteValue: "1/16" },
		{ value: 4,    noteCode: "16-T", 	noteValue: "1/16T" },
		{ value: 3,    noteCode: "32" , 	noteValue: "1/32" },
		{ value: 2,    noteCode: "32-T", 	noteValue: "1/32T" }, 
	];

	export let value: number;
	export let rampID: string;
	
//	console.log("RAMP value", rampID, value, (value == true));
	
	let tickSource = value & 0xe000;
	let lengthValue = value & 0xfff;
	let enabled: boolean = (lengthValue > 0);
	let wasEnabled: boolean = enabled;
	let theSVG: SVGElement;
	
	function showEach(v:any) { v.style.display="block"; }
	
	$:
	{
		if (enabled != wasEnabled)
		{
			value = 0x2000 | 96;
			tickSource = value & 0xe000;
			lengthValue = value & 0xfff;
			wasEnabled = enabled;
		} else {	
			value = enabled ? (tickSource | lengthValue) : 0;
		}
		
		let noteCode = value ? rampData.find(v=>v.value === lengthValue).noteCode.split("-") : "";
		
		if (theSVG)
		{
			Array.from(theSVG.children).forEach((v: any)=>v.style.display="none");
			
			for (let symbol of noteCode)
			{
				// theSVG.querySelectorAll(`.supernote-${noteCodePart}`)?.forEach();
				
				if (!isNaN(parseInt(symbol)) && symbol != "1") // numeric...
				{
					let symbolNumeric = parseInt(symbol);
					
					while (symbolNumeric >= 2)
					{
						theSVG.querySelectorAll(`.supernote-N${symbolNumeric}`).forEach(showEach);
						symbolNumeric /= 2;
					}
				} else if (symbol == "1" || symbol[0] == "U")
				{	
					theSVG.querySelectorAll(".supernote-N1").forEach(showEach);
				} else {
					theSVG.querySelectorAll(`.supernote-${symbol}`).forEach(showEach);
				}
				
				if (symbol[0] == "U")
				{
					theSVG.querySelectorAll(".supernote-U").forEach(showEach);
					
					let multi = parseInt(symbol[1]);
					if (multi > 1)
					{
						theSVG.querySelectorAll(".supernote-XX").forEach(showEach);
						theSVG.querySelectorAll(`.supernote-X${multi}`).forEach(showEach);
					}
				}
				
				if (symbol == "Q")
				{
					theSVG.querySelectorAll(".supernote-L").forEach(showEach);
				}
			}
		}
	}
	
	function triggerOnInput() { dispatchEvent("input"); }
	
	
	// for (let i in n)
	// {
	// 	let symbol = n[i];
	// 	

	// }
</script>


	<fieldset id="modal-{rampID}p">
		<legend><label><input on:input={triggerOnInput} class="appleswitch" type="checkbox" bind:checked={enabled}><mark></mark> <slot></slot></label></legend>
		
		<div class="ce-block">
			<div>
				<h4>Use clock</h4>
				<p><label class:disabled={!enabled}><input on:input={triggerOnInput} disabled={!enabled} type="radio" bind:group={tickSource} value={0x2000} /> External (from the host)</label></p>
				<!-- <p><label><input type="radio" bind:group={tickSource} value={0x2000} /> Internal</label></p>
				<p><label><input type="radio" bind:group={tickSource} value={0x2000} /> Simple (seconds)</label></p> -->
			</div>
		</div>
		
		<div class="supernote-holder">
			<select on:input={triggerOnInput} disabled={!enabled} class="ramp-value" bind:value={lengthValue}>
			{#each rampData as rd}
				<option value={rd.value}>{rd.noteValue}</option>
			{/each}
			</select>	
			
			<svg class:disabled={!enabled} version="1.1" id="supernote-up" class="supernote" x="0px" y="0px" viewBox="0 0 27.61 29.78" bind:this={theSVG}>
				<path class="supernote-N64" d="M6.56,5.48V4.82v-0.4c1.3,1.37,2.99,3.29,2.99,5.16c0,0.56-0.09,0.8-0.25,1.28
					c-0.16,0.47,0.39,1.23,0.39,1.23l0.45-0.9c0.24-0.62,0.27-0.84,0.27-1.61c0-3.51-3.85-5.88-3.85-9.38c0-0.11-0.09-0.2-0.2-0.2H6.11
					C6,0,5.91,0.09,5.91,0.2v5.27L6.56,5.48z"/>
				<path class="supernote-N32" d="M6.56,10.03V9.37v-0.4c1.3,1.37,2.99,3.29,2.99,5.16c0,0.56-0.09,0.8-0.25,1.28
					c-0.16,0.47,0.39,1.23,0.39,1.23l0.45-0.9c0.24-0.62,0.27-0.84,0.27-1.61c0-3.51-3.85-5.88-3.85-9.38c0-0.11-0.09-0.2-0.2-0.2H6.11
					c-0.11,0-0.2,0.09-0.2,0.2v5.27L6.56,10.03z"/>
				<path class="supernote-N8" d="M6.56,14.58v-0.66v-0.4c1.3,1.37,2.99,3.29,2.99,5.16c0,0.56-0.09,0.8-0.25,1.28
					c-0.16,0.47,0.39,1.23,0.39,1.23l0.45-0.9c0.24-0.62,0.27-0.84,0.27-1.61c0-3.51-3.85-5.88-3.85-9.38c0-0.11-0.09-0.2-0.2-0.2H6.11
					c-0.11,0-0.2,0.09-0.2,0.2v5.27L6.56,14.58z"/>
				<path class="supernote-N16" d="M6.56,19.14v-0.66v-0.4c1.3,1.37,2.99,3.29,2.99,5.16c0,0.56-0.09,0.8-0.25,1.28
					c-0.16,0.47,0.39,1.23,0.39,1.23l0.45-0.9c0.24-0.62,0.27-0.84,0.27-1.61c0-3.51-3.85-5.88-3.85-9.38c0-0.11-0.09-0.2-0.2-0.2H6.11
					c-0.11,0-0.2,0.09-0.2,0.2v5.27L6.56,19.14z"/>
				<path class="supernote-N2" d="M6.56,9.3c0-0.11-0.09-0.2-0.2-0.2H6.11c-0.11,0-0.2,0.09-0.2,0.2v13.15
					c0,0.26-0.26,0.41-0.49,0.32c-0.31-0.12-0.67-0.19-1.03-0.19c-0.82,0-1.61,0.3-2.33,0.72C1.12,23.86,0,24.84,0,26.27
					c0,1.24,1.06,1.81,2.17,1.81c0.82,0,1.61-0.3,2.33-0.72c0.94-0.56,2.05-1.63,2.05-3.17L6.56,9.3L6.56,9.3z M5.25,25.45L2.39,27.1
					c-0.47,0.27-1.09,0.11-1.36-0.36l-0.09-0.15c-0.27-0.47-0.11-1.09,0.36-1.36l2.85-1.65c0.47-0.27,1.09-0.11,1.36,0.36l0.09,0.15
					C5.88,24.56,5.72,25.18,5.25,25.45z"/>
				<path class="supernote-N4" d="M5.74,23.53c0.38,0.5,0.7,1.87-1.64,3.2s-2.92,0.69-3.29,0.14
					c-0.36-0.55-0.58-1.59,1.55-2.78S5.24,22.85,5.74,23.53z"/>
				<path class="supernote-D" d="M10.36,25.05c0-0.62,0.5-1.12,1.12-1.12s1.12,0.5,1.12,1.12
					s-0.5,1.12-1.12,1.12C10.85,26.17,10.36,25.67,10.36,25.05z"/>
				<path class="supernote-F" d="M14.75,16.2c0-0.62,0.5-1.12,1.12-1.12s1.12,0.5,1.12,1.12
					s-0.5,1.12-1.12,1.12S14.75,16.82,14.75,16.2z"/>
				<path class="supernote-N1" d="M6.28,14.22c-1,0-1.37,0.86-1.37,1.75c0,1.53,1.14,2.71,2.67,2.71
					c1,0,1.37-0.86,1.37-1.75C8.95,15.4,7.82,14.22,6.28,14.22z M11.86,16.45c0,0.86-0.7,1.51-1.45,1.93c-1.06,0.6-2.25,0.82-3.47,0.82
					s-2.43-0.22-3.49-0.82C2.7,17.97,2,17.31,2,16.45s0.7-1.51,1.45-1.93c1.06-0.6,2.27-0.82,3.49-0.82s2.41,0.22,3.47,0.82
					C11.17,14.94,11.86,15.6,11.86,16.45z"/>
				<path class="supernote-Q" d="M24.48,0.25h-0.25c-0.11,0-0.2,0.09-0.2,0.2V13.6c0,0.26-0.26,0.41-0.49,0.32
					c-0.31-0.12-0.67-0.19-1.03-0.19c-0.82,0-1.61,0.3-2.33,0.72c-0.94,0.56-2.05,1.53-2.05,2.97c0,1.24,1.06,1.81,2.17,1.81
					c0.82,0,1.61-0.3,2.33-0.72c0.94-0.56,2.05-1.63,2.05-3.17V0.45C24.68,0.34,24.59,0.25,24.48,0.25z"/>
				<g class="supernote-U">
					<rect x="11.86" y="13.7" width="0.7" height="5.5"/>
					<rect x="13.11" y="13.7" width="0.7" height="5.5"/>
					<rect x="0.06" y="13.7" width="0.7" height="5.5"/>
					<rect x="1.3" y="13.7" width="0.7" height="5.5"/>
				</g>
				<path class="supernote-T" d="M4.7,15.14l-1.48,1.44c0.36,0.06,0.64,0.21,0.83,0.43s0.3,0.49,0.3,0.82c0,0.33-0.09,0.62-0.27,0.87
					c-0.18,0.25-0.43,0.45-0.77,0.6s-0.71,0.22-1.13,0.22c-0.36,0-0.71-0.05-1.01-0.15s-0.56-0.24-0.75-0.43l0.45-0.7
					c0.15,0.15,0.34,0.27,0.58,0.36c0.24,0.09,0.5,0.14,0.78,0.14c0.38,0,0.67-0.07,0.89-0.22c0.21-0.14,0.32-0.35,0.32-0.62
					c0-0.43-0.32-0.63-0.95-0.63H2.03l0.13-0.62l1.37-1.33H1.32l0.15-0.77h3.34L4.7,15.14z"/>
				<g class="supernote-L">
					<path  d="M8.71,18.67c0.75,0.52,1.67,0.8,2.56,1c0.91,0.18,1.84,0.27,2.78,0.26c0.94,0.01,1.87-0.08,2.78-0.25
						c0.9-0.19,1.82-0.47,2.57-0.99l0.23,0.2c-0.67,0.82-1.61,1.29-2.58,1.6s-1.99,0.43-2.99,0.44c-1,0-2.02-0.12-2.99-0.43
						s-1.91-0.78-2.59-1.6L8.71,18.67z"/>
				</g>
				<path class="supernote-X2" d="M23.93,18.07h2.52l-0.18,0.86h-4.03l0.13-0.68l2.58-2.04c0.33-0.27,0.56-0.49,0.69-0.68
					c0.13-0.19,0.19-0.38,0.19-0.59c0-0.22-0.08-0.39-0.24-0.51s-0.39-0.18-0.7-0.18c-0.25,0-0.48,0.05-0.7,0.15
					c-0.22,0.1-0.42,0.25-0.59,0.43l-0.69-0.55c0.23-0.28,0.53-0.5,0.91-0.66s0.78-0.25,1.22-0.25c0.38,0,0.7,0.06,0.98,0.18
					s0.49,0.29,0.63,0.5c0.15,0.22,0.22,0.46,0.22,0.74c0,0.33-0.09,0.65-0.27,0.95c-0.18,0.3-0.5,0.63-0.96,0.99L23.93,18.07z"/>
				<path class="supernote-X4" d="M27.44,17.68h-0.97l-0.25,1.24h-0.99l0.26-1.24h-3l0.13-0.7l3.36-3.53h1.13l-3.17,3.37h1.75
					l0.23-1.1h0.95l-0.22,1.1h0.97L27.44,17.68z"/>
				<path class="supernote-XX" d="M20.59,16.21l0.86,1l-0.59,0.55L20,16.75l-1.13,1.01l-0.49-0.59l1.12-1l-0.86-1l0.59-0.55
					l0.87,1.01l1.13-1.01l0.49,0.59L20.59,16.21z"/>
				<path class="supernote-X8" d="M26.89,16.6c0.11,0.19,0.17,0.4,0.17,0.64c0,0.36-0.1,0.67-0.29,0.93
					c-0.2,0.27-0.47,0.47-0.82,0.61c-0.35,0.14-0.76,0.21-1.22,0.21c-0.43,0-0.81-0.06-1.13-0.18s-0.57-0.3-0.75-0.53
					s-0.26-0.5-0.26-0.81c0-0.37,0.1-0.69,0.31-0.95s0.5-0.45,0.88-0.58c-0.33-0.23-0.49-0.55-0.49-0.95c0-0.33,0.09-0.62,0.27-0.87
					s0.43-0.43,0.75-0.57c0.32-0.13,0.69-0.2,1.1-0.2c0.39,0,0.73,0.06,1.03,0.17c0.29,0.12,0.52,0.28,0.69,0.49
					c0.16,0.21,0.25,0.46,0.25,0.74c0,0.32-0.08,0.59-0.24,0.83c-0.16,0.23-0.39,0.41-0.7,0.53C26.62,16.26,26.78,16.42,26.89,16.6z
					 M25.69,17.95c0.23-0.17,0.34-0.4,0.34-0.7c0-0.25-0.1-0.45-0.31-0.59c-0.2-0.14-0.48-0.21-0.84-0.21c-0.39,0-0.7,0.09-0.93,0.26
					s-0.34,0.4-0.34,0.7c0,0.25,0.1,0.45,0.31,0.59c0.2,0.14,0.48,0.22,0.84,0.22C25.14,18.21,25.46,18.12,25.69,17.95z M24.57,14.39
					c-0.2,0.15-0.29,0.36-0.29,0.62c0,0.21,0.09,0.38,0.26,0.51c0.17,0.13,0.41,0.19,0.72,0.19c0.33,0,0.6-0.07,0.8-0.22
					c0.2-0.15,0.3-0.35,0.3-0.61c0-0.22-0.09-0.39-0.27-0.52c-0.18-0.13-0.42-0.19-0.72-0.19C25.03,14.17,24.77,14.24,24.57,14.39z"/>
				</svg>							
		</div>
		
		{#if tickSource == 0x8000}
		<div class="ce-block hh">
			<h4>Seconds</h4>
			<RangeWithInline on:input={triggerOnInput} min={12} max={480} value={1000} step={12} />
		</div>
		{/if}
		
	</fieldset>
