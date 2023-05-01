<script lang="ts">
	import * as BSON from 'bson'
	import { onDestroy } from 'svelte'
	
	import { patchChanged, openPatternEditor } from 'event_helpers';
	import { patchAsFileFromData, getPatch, arrayToFlag, flagToArray } from 'data_utils'
	import { ExpanderSanizer } from 'data_expandsanize'
	
	import type { Model } from 'device';
	import type { Patch, BranchSettings } from 'types_patch'
	
	import Halp from './widgets/Halp.svelte';
	import PaletteCheckboxes from './widgets/PaletteCheckboxes.svelte';
	
	import type { CurrentPatchInfo } from 'patch'
			
	export let currentPatch: CurrentPatchInfo;
	export let model: Model;
	
	let burstPrev = -1;
	
	let burstFlagKind = [ false,false,false,false,false,false,false,false ];
	let burstFlagPalette = [ false,false,false,false,false,false,false,false ];
	let burstMode = -1;
	
	const patchSettingsModel: BranchSettings = 
	{
		burst: 0,
		encreset: false,
		subdbl: false,
		subhold: false,
		shhold: false,
		shdblsubbank: 3,
		desc: "",
	};
	
	let expanderSanizer = new ExpanderSanizer(
	// @ts-ignore
	{ model: patchSettingsModel			// data will be attached in reactive block
		},
		() =>
		{
			if (currentPatch.data.info.desc && currentPatch.data.info.desc.trim() == "") delete currentPatch.data.info.desc;
		} // cleanup function
	);
	
	onDestroy(()=>expanderSanizer.kill());
	
	function patchAsFile(json: boolean = false)
	{
		getPatch(currentPatch.data, model, async ()=>
		{
			let filedata: string | Buffer = json ? JSON.stringify(currentPatch.data, null, 2) : BSON.serialize(currentPatch.data);		
			patchAsFileFromData(filedata, currentPatch.name, json);
			return true;
		});
	}
	
	$:
	{
		if (expanderSanizer.check(currentPatch.data.settings))
		{
			// prevChannel = -2;
			// lightshowPrev = -1;
			// keyinfoPrev = -2;
			// console.log("Housekeeping done");
		}
		
		if (burstPrev != currentPatch.data.settings.burst) // external change... probably in the beginning
		{
			burstPrev = currentPatch.data.settings.burst;
			burstMode = burstPrev & 0xff;
			flagToArray(burstFlagKind,    ((burstPrev >> 16) & 0xff));
			flagToArray(burstFlagPalette, ((burstPrev >> 8)  & 0xff));
		} else {
			if (burstMode == 0)
			{
				currentPatch.data.settings.burst = 0;
			} else {
				if (burstPrev == 0) // has been set to zero
				{
					// check if anything has been enabled. If not, apply meaningful defaults
					if (!burstFlagPalette.includes(true)) burstFlagPalette.forEach((_,k) => burstFlagPalette[k] = true);
					if (!burstFlagKind.includes(true)) burstFlagKind[0] = true;
				}
				
				currentPatch.data.settings.burst = (
					(arrayToFlag(burstFlagKind) << 16) |
					(arrayToFlag(burstFlagPalette) << 8) |
					burstMode
				);
			}
			
			if (burstPrev != currentPatch.data.settings.burst) patchChanged();
			
			burstPrev = currentPatch.data.settings.burst;
		}
	}
</script>

<div class="drawer columnizer-in" id="dw-patchsettings">
	<div>
		<fieldset>
			<legend>Bursts
				<Halp>A “burst” is a quick fun animation triggered by a button press.</Halp>
			</legend>
			
			<div class="ce-block">
				<div class="likep">Colour mode
					<Halp>
						<p>Bursts can be of many different colours and tints. You can
							just pick a setting you like or be really precise in your 
							artistic expression (if you want something very certain for
							your performance, for instance).</p>
						<p><i>Preset colours</i> are just that: fixed bright colours. White
							is pure white, and vivid are yellow, cyan and magenta colours.</p>
						<p><i>Pad’s colour</i> will make bursts using the same colour as 
							the pad when pressed.</p>
						<p><i>Colours from palettes</i> make the bursts most varied, but can
							also be precisely controlled. You can have it as chaotic or as
							precise as you wish. The bursts will use the palettes chosen,
							including custom ones (if available).</p>
						<p>With <i>Single colour</i>, the burst will have only one colour from a selected palette
							while playing; <i>Rolling colour</i> means that the burst colour
							will evolve through the whole palette; <i>Random colour</i> is,
							well, a random colour from a palette.</p>
						<p>The starting colour in the Rolling mode can be chosen in different ways. 
							By default, it will be the first colour of the palette. The <i>random</i>
							will pick a different colour each time, and the <i>mapped to pad</i>
							will map all sixteen palette colours to the corresponding pads.</p>
						<p>The <i>random</i> and <i>mapped to pad</i> colour selection modes are
							also applicable to Single colour options.</p>
					</Halp>
				</div>
				<select bind:value={burstMode}>
					<option value={0}>None (bursts disabled)</option>
					<optgroup label="Preset colour">
						<option value={1}>Plain white</option>
						<option value={2}>Vivid colours</option>
						<option value={3}>White and vivid</option>
					</optgroup>
					<optgroup label="Pad’s colour">
						<option value={4}>Active colour</option>
						<!-- <option value="5">Burst colour</option> -->
					</optgroup>
					<optgroup label="Colour from palettes">
						<option value={6}>Single colour, mapped to pad number</option>
						<option value={7}>Single colour, random</option>
						<option value={8}>Rolling colour</option>
						<option value={9}>Rolling colour, start mapped to pad</option>
						<option value={10}>Rolling colour, random start</option>
						<option value={11}>Random colours</option>
						<option value={12}>Any of these, surprise me</option>
					</optgroup>
				</select>
			</div>
			<div class="ce-block">
				<p class:disabled={burstMode == 0}>Animations</p>
				<div class="checkboxblock">
					<label><input disabled={burstMode == 0} type="checkbox" bind:checked={burstFlagKind[0]}> <mark>Shockwave</mark></label><br />
					<label><input disabled={burstMode == 0} type="checkbox" bind:checked={burstFlagKind[1]}> <mark>Star</mark></label><br />
					<label><input disabled={burstMode == 0} type="checkbox" bind:checked={burstFlagKind[2]}> <mark>Isotope</mark></label><br />
					<label><input disabled={burstMode == 0} type="checkbox" bind:checked={burstFlagKind[3]}> <mark>Projectile</mark></label><br />
					<label><input disabled={burstMode == 0} type="checkbox" bind:checked={burstFlagKind[4]}> <mark>Billiards</mark></label><br />
					<label><input disabled={burstMode == 0} type="checkbox" bind:checked={burstFlagKind[5]}> <mark>Firecracker</mark></label><br />
				</div>
			</div>							
	
			<PaletteCheckboxes bind:flags={burstFlagPalette} disabled={burstMode < 6} />
			
			
			
		</fieldset>
		
		<fieldset id="dw-patch-patchpattern">
			<legend>Patch pattern</legend>
			<p>Patch pattern is used to uniquely identify the patch. Use
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<span class="unreal" on:click={openPatternEditor}>Colour paint</span>
				to edit it.</p>
		</fieldset>
		
		{#if model.code != "prov2" && model.code != "promv2" && model.code != "promsharp" } <!-- Pro V2 has this setting in another block -->
		<fieldset id="dw-patch-patchpattern">
			<legend>Encoder reset</legend>
			
			<div class="ce-block">
				<label>
				<input on:input={patchChanged} type="checkbox" class="appleswitch" bind:checked={currentPatch.data.settings.encreset} />
				<mark>Long press resets encoders
					<Halp>
						<p>Hold an encoder for 3 seconds to reset. Resets CCs to the minimum specified value, and Pitch bend to zero.</p>
					</Halp>
				</mark>
				</label>
				{#if currentPatch.data.settings.shdblsubbank}
				<p class="warn">Access to sub-bank 4 while holding down Shift is enabled, too. If you press any pads in 3 seconds after
					you press down Shift, the encoder will not be reset.</p>
				{:else if currentPatch.data.settings.subhold}
				<p class="warn">Access to sub-banks while holding down encoders 1, 2 and 3 is enabled. If you press any pads in 3 seconds after
					you press these encoders, the encoders will not be reset.</p>
				{:else if currentPatch.data.settings.shdblsubbank && currentPatch.data.settings.subhold}
				<p class="warn">Access to sub-banks while holding down encoders is enabled. If you press any pads in 3 seconds after
					you press encoders, the encoders will not be reset.</p>
				{/if}
			</div>
		</fieldset>
		{/if}
		
		{#if model.code != "m32" && model.code != "l32" && model.code != "m32sharp" && model.code != "prov2" && model.code != "promv2" && model.code != "promsharp" }
		<fieldset id="dw-patch-subbanks">
			<legend>Sub-banks
				<Halp>Normally, sub-banks are accessed by pressing Shift and a corresponding encoder, or, for sub-bank 4, double-pressing
				Shift itself. However, more options are available.</Halp></legend>
			
				
			<h3>Shift</h3>
			
			<div class="ce-block">
				<label><input on:input={patchChanged} type="checkbox" class="appleswitch" bind:checked={currentPatch.data.settings.shhold} />
				<mark> Hold Shift to show sub-bank 4</mark>
					<Halp>Useful for quick access to common actions, such as transport controls.</Halp>
				</label>
				{#if currentPatch.data.settings.encreset}
				<p class="warn">Resetting encoders with a long press is enabled, too.</p>
				{/if}
			</div>
			
			{#if model.code == "microv2" || model.code == "microsharp"}
			<div class="ce-block cond-dev cond-dev-microv2 cond-dev-microsharp">
				<h4>Double-pressing Shift opens
					<Halp>Sub-bank 3 is not accessible on Micro by default. You can make it accessible by binding it to
					double-pressing Shift.</Halp></h4>
				<select on:input={patchChanged} bind:value={currentPatch.data.settings.shdblsubbank}>
					<option value={3}>Sub-bank 4</option>
					<option value={2}>Sub-bank 3</option>
				</select>
			</div>
			
			{:else}
			
			<h3>Encoders 1, 2 and 3</h3>
			
			<div class="ce-block">
				<label>
				<input on:input={patchChanged} type="checkbox" class="appleswitch" bind:checked={currentPatch.data.settings.subhold} />
				<mark>Hold to show a sub-bank</mark>
				</label>
				{#if currentPatch.data.settings.encreset}
				<p class="warn">Resetting encoders with a long press is enabled, too.</p>
				{/if}
			</div>
			
			<div class="ce-block">
				<label>
				<input on:input={patchChanged} type="checkbox" class="appleswitch" bind:checked={currentPatch.data.settings.subdbl} />
				<mark>Double-press to open a sub-bank</mark>
				</label>
			</div>
			{/if}
	
		</fieldset>
		{/if} <!-- model isnt 32 -->
		
		{#if model.code == "prov2" || model.code == "promv2" || model.code == "promsharp" }
		<fieldset id="dw-patch-subbanks">
			<legend>Encoders</legend>
			
			<div class="ce-block">
				<label>
				<input on:input={patchChanged} type="checkbox" class="appleswitch" bind:checked={currentPatch.data.settings.encreset} />
				<mark>Long press resets encoders
					<Halp>
						<p>Hold an encoder for 3 seconds to reset. Resets CCs to the minimum specified value, and Pitch bend to zero.</p>
					</Halp>
				</mark>
				</label>
			</div>
			
			<div class="ce-block">
				<label>
				<input on:input={patchChanged} type="checkbox" class="appleswitch" bind:checked={currentPatch.data.settings.subhold} />
				<mark>Hold to show a sub-bank
					<Halp>Useful for quick access to common actions, such as transport controls.</Halp>
				</mark>
				</label>
				<p></p>
			</div>
			
			<p class="explain">Sub-banks are accessed by double-pressing encoders.</p>
			
			{#if currentPatch.data.settings.encreset && currentPatch.data.settings.subhold}
			<p class="warn">You may not want to enable both of these settings at the same time, as they both rely on 
				pressing and hold encoders. If you do, note that if you press any pads in 3 seconds after
				you press encoders, the encoders will not be reset.</p>
			{/if}
		
		</fieldset>
		{/if} <!-- model is prov2 -->
		
		<fieldset>
			<legend>Description
				<Halp>A short optional note to distinguish the patch, displayed in the configurator patch list.</Halp>
			</legend>
			<textarea on:input={patchChanged} id="dw-patch-desc" bind:value={currentPatch.data.info.desc}></textarea>
		</fieldset>
		
		<fieldset id="dw-patch-advanced">
			<legend>Advanced</legend>
			<h3>Get as a file
				<Halp>Save your current patch as a file to your computer. .dbrpatch is a native binary (BSON)
					format of MIDI Dobrynya, and JSON is a very common human-readable format.</Halp>
			</h3>
			<button class="adv-download" on:click="{()=>patchAsFile(false)}">.dbrpatch</button>
			<button class="adv-download" on:click="{()=>patchAsFile(true)}">JSON</button>
		</fieldset>
	</div>
</div>