<script lang="ts">

	import { patchChanged } from 'event_helpers'
	import { MidiCtrl, paramOff, paramOffNegative } from 'midi_utils'
	
	import RangeWithInline from '../widgets/RangeWithInline.svelte';
	
	export let encoderIsTempo: boolean;
	export let encoderIsScaleOrTempo: boolean;
	
	export let cc: number;
	export let min: number;
	export let max: number;
	export let par: number;
	
	let isCC = cc < 128;
	
	$: isCC = cc < 128;
	
	export function init()
	{
		// cc
		
		if (cc > 127) // something has been set
		{
			cc = MidiCtrl.OFF;
		}
		
		// turn off min & max because they make no sense
		min = paramOffNegative;
		max = paramOff;
		par = 0; // ? I wonder if we need this...
	}
	
	function sendThisAsCC(ev: Event)
	{
		patchChanged();
		cc = (ev.target as HTMLInputElement).checked ? 1 : MidiCtrl.OFF;
	}


</script>
<div class="ce-block">
	<h4>
		<label>
			<input on:input="{sendThisAsCC}" disabled={!encoderIsScaleOrTempo} type="checkbox" checked={isCC} title="Enable sending value"> Send this as CC
		</label>
	</h4>
	<RangeWithInline disabled={!encoderIsScaleOrTempo || !isCC} on:input={patchChanged} bind:value={cc} />
	{#if encoderIsTempo}
	<p class="warn explain" style="padding:0">Tempo will be sent from 60 to 187<wbr /> as CC values 0 to 127.</p>
	{/if}
</div>