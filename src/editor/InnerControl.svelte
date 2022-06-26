<script lang="ts">

	import { EncoderBehaviour } from "../types"
	import type { BranchControl } from "../types_patch";

	import CC from '../widgets/CC.svelte'	
	import { noteMidiToHuman, ccToHuman, fakeNoteOff, fakeNoteUseScale } from '../midi_utils';
	import { keycodeToHuman } from '../keyboard';
	
	const encBehaviourHuman: string[] = ['Key','Oct','Ofs','Scl','Tmp'];
	
	export let data: BranchControl = {};
	export let isKeyOfScale = false;
	export let scaleNote = null;
	
	let noteName: string = "";
	let noteIsFromScale: boolean = false;
	let isRelative: boolean = false;
	let isAuxModeEncoder: boolean = false;
	let isRealCC: boolean = false;
	
	let comboLowFull = "";
	let comboHighFull = "";
	let comboLow = "";
	let comboHigh = "";
	
	$:
	{
		isRealCC = data?.midi?.cc < 0x80;
		if (data?.encmode)
		{
			isRelative =       data?.encmode && data.encmode >= EncoderBehaviour.Endless64Zero && data.encmode <= EncoderBehaviour.EndlessSigned;
			isAuxModeEncoder = data?.encmode && data.encmode >= EncoderBehaviour.ScaleKey && data.encmode <= EncoderBehaviour.InternalTempo;
		}
		
		if (data?.combo)
		{
			comboLowFull  = keycodeToHuman(data.combo & 0xffff, false);
			comboHighFull = keycodeToHuman((data.combo >> 16) & 0xffff, false);
			comboLow  = keycodeToHuman(data.combo & 0xffff, true);
			comboHigh = keycodeToHuman((data.combo >> 16) & 0xffff, true);			
		} else {
			comboLowFull = comboLowFull = comboLow = comboHigh = "";
		}
		
		if (data?.midi?.note && data?.midi?.note != fakeNoteOff)
		{
			
			if (data.midi.note == fakeNoteUseScale)
			{
				noteIsFromScale = true;
				noteName = noteMidiToHuman(scaleNote);
			} else {
				noteName = noteMidiToHuman(data.midi.note);
				noteIsFromScale = false;
			}
		} else {
			noteName = "";
			noteIsFromScale = false;
		}
	}
</script>

<div class="dobrynya-ctrl-internal">
	{#if isAuxModeEncoder}
	<div class="dobrynya-ctrl-encmode">{encBehaviourHuman[data.encmode - 4]}</div>
	{/if}
	
	{#if data.midi}
		{#if noteName}
		<div class="dobrynya-ctrl-note" class:dobrynya-ctrl-note-scale={noteIsFromScale}>{noteName}</div>
		{/if}
		
		{#if data.midi.cc}
		<div class:dobrynya-ctrl-ccfake={!isRealCC} class:dobrynya-ctrl-cc={isRealCC && !isRelative}>{#if isRealCC}<CC {isRelative} />{/if}{ccToHuman(data.midi.cc)}</div>
		{/if}
	{/if}
	
	{#if comboLow}
	<div class="dobrynya-ctrl-key" title={comboLowFull}>{comboLow}</div>
	{/if}
	
	{#if comboHigh}
	<div class="dobrynya-ctrl-key" title={comboHighFull}>{comboHigh}</div>
	{/if}

</div>