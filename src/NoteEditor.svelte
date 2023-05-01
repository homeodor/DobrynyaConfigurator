<script lang="ts">
//	const jQ = window.$;
	import * as midiUtils from 'midi_utils'
	import type { DeviceOrBankValue } from 'types'
	
	import Pianoroll from './widgets/Pianoroll.svelte'
	import RangeWithInline from './widgets/RangeWithInline.svelte'
	import Inline from './widgets/DumbInline.svelte'
	import Overridable from './widgets/Overridable.svelte'
	
	import { patchChanged } from 'event_helpers'
	
	export let midiNote: number;
	export let scaleNote: number;
	
	export let velocity: number = 0;
	export let globalVelocity: DeviceOrBankValue;
	let velocityValue: number;
	
	let velocityOverride: boolean = false;
	
	let noteOff: number = midiUtils.fakeNoteOff;
	let previousMidiNote = 0;
	
	let inlineValue: string = "0";
	let octave: number = 0;
	let musicKey: number = -1;
	let theInline: any;
	

	
	$:{
		noteOff = scaleNote < 0 ? midiUtils.fakeNoteOff : midiUtils.fakeNoteUseScale;
		
		if (velocityOverride && velocity == midiUtils.paramOff)
		{
			velocityValue = globalVelocity.value;
		}
		
		velocity = velocityOverride ? velocityValue : midiUtils.paramOff;
		if (!velocityOverride) velocityValue = globalVelocity.value;
		
		
		if (midiNote != previousMidiNote)
		{
			previousMidiNote = midiNote;
			
			if (midiNote > 0x7f)
			{
				musicKey = -1;
//				octave = 2;
			} else {
				let midiResult = midiUtils.noteMidiToNoteAndOctave(midiNote);
				
				musicKey = midiResult[0];
				octave   = midiResult[1];
			}
			
			previousMidiNote = midiNote;
		}
		
		if (!theInline || !theInline.isActive())
		{
			inlineValue =  (musicKey == -1) ? (midiNote == midiUtils.fakeNoteOff ? "Off" : "Scale") : midiUtils.noteMidiToHuman(midiNote);
		}
	}
	
	function calculateNote()
	{
		patchChanged();
		
		if (musicKey == -1)
			previousMidiNote = midiNote = noteOff;
		else
		{
			if (previousMidiNote >= midiUtils.fakeNoteUseScale && octave == 0) // off or from scale...
				octave = 3;												// set octave to a reasonable value
				
			previousMidiNote = midiNote = midiUtils.noteAndOctaveToMidi(musicKey, octave);
		}
	}
	
	function fixInlineValue()
	{
		inlineValue = (musicKey == -1) ? (midiNote == midiUtils.fakeNoteOff ? "Off" : "Scale") : midiUtils.noteMidiToHuman(midiNote);
	}
	
	function updateNoteFromInlineRoutine()
	{
		inlineValue = inlineValue.trim();
		
		if (inlineValue.length == 0 || inlineValue == "-" || inlineValue.toLowerCase() == "off")
		{
			musicKey = -1;
			return;
		}
		
		if (inlineValue.length >= 4) return;
		
		let sharpFlatShifter: number = 0;
		
		if (
			inlineValue.length == 4 || 
			inlineValue.length == 3 && !(
				inlineValue[1] == "-" ||
				inlineValue[1] == "–" ||
				inlineValue[1] == "—"
			))
		{
			if (inlineValue[1] == "#" || inlineValue[1] == "♯") sharpFlatShifter = 1;
			if (inlineValue[1] == "𝄪") sharpFlatShifter = 2; // ??? lol
			if (inlineValue[1] == "b" || inlineValue[1] == "♭") sharpFlatShifter = -1;
			if (inlineValue[1] == "𝄫") sharpFlatShifter = -2;
			
			if (sharpFlatShifter == 0) return; // bullshit
			
			inlineValue = inlineValue[0] + inlineValue.substring(2); // sharps have been taken care of
		}
		
		inlineValue = inlineValue.toUpperCase().replace("–","-").replace("—","-"); // replace minus sign / M-dash with a short dash. Sigh. It’s complicated...
		
		if (inlineValue.charCodeAt(0) < 65 || inlineValue.charCodeAt(0) > 72) return;	// note letter is wrong
		if (inlineValue.length == 2 && isNaN(parseInt(inlineValue.substring(1)))) return; // octave is wrong
		
		let nowOctave: number = -1; // this is a deliberately out of range default value
		
		if (inlineValue.length >= 2) nowOctave = parseInt(inlineValue.substring(1)) + midiUtils.octaveDAWOffset;
			// if the length is 1, i.e. only the note letter has been specified, the value will stay at the default
		
		if (nowOctave > 10 || nowOctave < 0) nowOctave = octave; // if new octave is within range, apply it
		
		let noteLetter: string = inlineValue[0];
		
		if (noteLetter == "H") noteLetter = "B"; // we use B for si
		
		let noteIndex = midiUtils.Notes.indexOf(noteLetter);
		
		midiNote = midiUtils.constrainValue(midiUtils.noteAndOctaveToMidi(noteIndex, nowOctave) + sharpFlatShifter);
			// set the midi note, but also check if sharps or flats pushed it out of the range!
			
		let midiResult = midiUtils.noteMidiToNoteAndOctave(midiNote);
		
		musicKey = midiResult[0];
		octave = midiResult[1];
		
		patchChanged();
	}
	
	function updateNoteFromInline()
	{
		updateNoteFromInlineRoutine(); // even if the function returns early,
		fixInlineValue(); // we need to fix the inline editor
	}
	
</script>

<fieldset id="ce-note" class="pianorollholder capability-note conditional cond-pad blockenablertarget">
	<legend>Note: <Inline bind:this={theInline} bind:value={inlineValue} on:change={updateNoteFromInline} on:cancel={fixInlineValue} display="inline" /></legend>
	
	<input type="hidden" id="cbm-notex" name="note" bind:value={midiNote} />
	
	<div class="ce-block">
		
	</div>
	
		<Pianoroll on:input={calculateNote} octave={octave} bind:musicKey={musicKey} musicScaleKey={(midiNote == midiUtils.fakeNoteOff) ? -1 : scaleNote } />
	
	<div class="ce-block">
			<h4>Octave</h4>
			<RangeWithInline on:input={calculateNote} max={10} defValue={4} elId={"cbv-octave"} inlineToRange={midiUtils.octaveInlineToRange} rangeToInline={midiUtils.octaveRangeToInline} bind:value={octave} disabled={midiNote > 0x7f} />
	</div>
	
	<p id="ce-note-usesscaleerror" class="hh ce-note-scalerelated" class:hh={!(scaleNote == -1 && midiNote == midiUtils.fakeNoteUseScale)}>
		Note is supposed to be from the scale, but no <span class="unreal">scale</span> is set for this bank</p>
	
	<div class="ce-block">
		<button class="auxaction" on:click={()=>{patchChanged();midiNote = midiUtils.fakeNoteOff}}>Turn off</button>
		<button class="auxaction" on:click={()=>{patchChanged();midiNote = midiUtils.fakeNoteUseScale}} disabled={scaleNote == -1}>Reset to scale</button>
	</div>

	<div class="ce-block paramenablertarget">
		<h4 class=""><label>
			<input type="checkbox" on:input={patchChanged} bind:checked={velocityOverride} /> Override velocity
			<Overridable />
		</label></h4>
		
		<RangeWithInline on:input={patchChanged} bind:value={velocityValue} defValue={globalVelocity.value} disabled={!velocityOverride} />
		<!-- <input id="cbm-vel" name="vel" type="range" min="0" max="127" value="127" data-default="127"> <label></label> -->
	</div>
</fieldset>