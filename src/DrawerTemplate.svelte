<script lang="ts">
	import RangeWithInline from './widgets/RangeWithInline.svelte'
	import Halp from './widgets/Halp.svelte'
	import Confirm from './widgets/Confirm.svelte'
	
	import { patchChanged, drawer } from 'event_helpers';
	import type { BranchBank } from 'types_patch';		
	import { numberOfPads } from 'data_utils'
	import { fillWithTemplate } from 'editor';
	import { fakeNoteUseScale, getNoteInCurrentScale, fakeNoteOff, getCurrentScaleName } from 'midi_utils'

	export let currentBank: BranchBank;
	export let numberOfActiveBanks: number;
	
	const titleFill = "Clears whatever is present in the bank first";
	const titleAppend = "Adds to whatever is present in the bank, replacing conficting settings";
	
	let purgeConfirm: Confirm;
	
	let drumRackStart = 36;
	
	let ccStart = 1;
	let ccHow = 'm';
	
	let scaleIsSet: boolean;
	let scaleName = "scale";
	
	function drumRackTemplate(mode: string)
	{
		fillWithTemplate(currentBank, mode, 'note', drumRackStart);
		currentBank = currentBank;
		patchChanged();
	}
	
	function ccTemplate(mode: string)
	{
		fillWithTemplate(currentBank, mode, {key: 'cc', toggle: ccHow == 't', trigger: ccHow == 'g'}, ccStart);
		currentBank = currentBank;
		patchChanged();
	}

	function scaleToNotes()
	{
		if (!("pads" in currentBank)) return;
		
		for (let i = 0; i < numberOfPads; i++)
		{
			let thePad = currentBank.pads[i];
			
			if (!("midi" in thePad) || !("note" in thePad.midi) || thePad.midi.note != fakeNoteUseScale) continue;
			
			let noteResult = getNoteInCurrentScale(i, currentBank);
			
			if (noteResult.note === fakeNoteOff) continue;
			
			thePad.midi.note = noteResult.note;
			
			if (thePad.midi.note > 127) thePad.midi.note = fakeNoteOff;
		}
		
		// mark unsaved
		currentBank = currentBank; 
		patchChanged();
	}
	
	async function purgeTheBank()
	{
		if (!await purgeConfirm.confirm()) return;
		
		delete currentBank.pads;
		delete currentBank.bank;
		currentBank = currentBank; // Svelte
		patchChanged();
	}
	
	$: {
		scaleIsSet = currentBank?.bank?.keyinfo != undefined && currentBank.bank.keyinfo != -1;
		scaleName = scaleIsSet ? getCurrentScaleName(currentBank) : "scale";
	}
</script>
<div class="drawer columnizer-in" id="dw-banktemplates">
	<p class="explain-caption">Set things off by filling your bank with a preset template!</p>
	<div>
		<fieldset id="dw-bankt-reset">
			<legend>Drum rack
				<Halp><p>Fills the bank with notes typical for a pad group in a drum rack in Ableton Live and other DAWs.</p>
					<p>Typically, Dobrynya has groups 1–4 on banks 1–4, groups –3 and –1 on sub-banks 1 and 2, and group 5 on sub-bank 3.</p>
				</Halp>
				
			</legend>
			
			<!-- <h3>Drum rack</h3> -->
			
			<div class="ce-block">
				<h4>Choose group and starting note</h4>
				<select bind:value={drumRackStart} data-default="36">
					<option value={0}>Group –3 (C–2)</option>
					<option value={4}>Group –2 (E–2)</option>
					<option value={20}>Group –1 (G#–1)</option>
					<option value={36} selected>Group 1 (C1)</option>
					<option value={52}>Group 2 (E2)</option>
					<option value={68}>Group 3 (G#3)</option>
					<option value={84}>Group 4 (C5)</option>
					<option value={100}>Group 5 (E6)</option>
					<option value={112}>Group 6 (E7)</option>
				</select>
			</div>
			<div class="ce-block">
				<button on:click="{()=>drumRackTemplate('fill')}" title={titleFill}>Clear and fill</button>
				<button on:click="{()=>drumRackTemplate('append')}" title={titleAppend}>Add</button>
			</div>
		</fieldset>
		
		<fieldset id="dw-bankt-reset">
			<legend>Control change
				<Halp><p>Fills the bank with progressive CCs, starting with the set number.
				All values will be set as 127 for maximum and 0 for minimum (the whole range).</p>
				<p><i>Momentary</i> sends maximum on press and minimum on release.</p>
				<p><i>Toggle</i> sends maximum on the first press and minimum on the next press.</p>
				<p><i>Trigger</i> is the same as momentary but sends maximum only.</p>
				<p><i>Clear and fill</i> will clear everything that is present in current bank pads 
				and fill the CCs, while <i>Add</i> will keep everything but the CCs (if any were set).</p></Halp>
			</legend>
			
			<div class="ce-block">
				<h4>Start with CC</h4>
				<RangeWithInline bind:value={ccStart} />
			</div>
			
			<div class="ce-block checkboxblock">
				<input type="radio" bind:group={ccHow} value='m'>
					<label for="dw-bankt-toggle">Momentary</label><br />
				<input type="radio" bind:group={ccHow} value='t'>
					<label for="dw-bankt-toggle">Toggle</label><br />
				<input type="radio" bind:group={ccHow} value='g'>
					<label for="dw-bankt-trigger">Trigger</label><br />
			</div>
			
			<div class="ce-block">
				<button on:click="{()=>ccTemplate('fill')}" title={titleFill}>Clear and fill</button>
				<button on:click="{()=>ccTemplate('append')}" title={titleAppend}>Add</button>
			</div>
		</fieldset>
		
		<fieldset>
			<legend>Scale and key</legend>
			<p>You can set scale in <span class="unreal" on:click="{()=>drawer('banksettings')}">bank settings</span>.</p>
		</fieldset>
		
		<fieldset id="dw-bankt-reset">
			<legend>Quick actions</legend>
		
			<div class="ce-block"><button disabled={!scaleIsSet} on:click="{()=>{fillWithTemplate(currentBank, 'fill', 'scale');currentBank=currentBank;}}">Reset to {scaleName}
				<Halp>If scale is set, all pads will have their settings removed, and then set to obey the scale.</Halp>
				
			</button></div>
			
			
			<div class="ce-block"><button disabled={!scaleIsSet} on:click={scaleToNotes}>Implicit scale to explicit notes
				<Halp>All pads that obey the scale will have that note set explicitly.</Halp>
			</button></div>
			
				
			<div class="ce-block"><button class="dangerous" on:click={purgeTheBank} disabled={numberOfActiveBanks <= 1}>Purge the bank
				<Halp>Clears all settings for the bank, including colours and pads. The device won’t open empty banks.</Halp>
			</button></div>

			{#if numberOfActiveBanks < 2}
			<p class="explain">The device won’t open purged banks, so it’s best to have at least one bank active in the patch
				(even if it doesn’t do anything).</p>
			{/if}
			
			<Confirm bind:this={purgeConfirm} okText="Purge">
				<p>This will purge the bank, erasing all settings, including bank parameters such as colour and scale, as well as all
					pads’ parameters.</p>
				<p>The device ignores purged banks, so this bank will essentially be off.</p> 
			</Confirm>
			
		</fieldset>
	</div>
</div>