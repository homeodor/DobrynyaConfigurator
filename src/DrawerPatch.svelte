<script lang="ts">
	import * as BSON from 'bson'
	import { sleep } from 'basic';
	import { onDestroy } from 'svelte'
	
	import { patchChanged, openPatternEditor } from 'event_helpers';
	import { patchAsFileFromData, getPatch, arrayToFlag, flagToArray } from 'data_utils'
	import { ExpanderSanizer } from 'data_expandsanize'
	
	import type { Model } from 'device';
	import type { BranchSettings } from 'types_patch'
	
	import Halp from './widgets/Halp.svelte';
	import Bursts from './editor/Bursts.svelte'
	
	import type { CurrentPatchInfo } from 'patch'
			
	export let currentPatch: CurrentPatchInfo;
	export let model: Model;
	
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

	async function patchChangedOverTick()
	{
		await sleep(5);
		patchChanged();
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
	}
</script>

<div class="drawer columnizer-in" id="dw-patchsettings">
	<div>
		<Bursts bind:burst={currentPatch.data.settings.burst} />
		
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
				<input on:input={patchChangedOverTick} type="checkbox" class="appleswitch" bind:checked={currentPatch.data.settings.encreset} />
				<mark>Long press resets encoders
					<Halp>
						<p>Hold an encoder for 3 seconds to reset. Resets CCs to the minimum specified value, and Pitch bend to zero.</p>
					</Halp>
				</mark>
				</label>
				{#if currentPatch.data.settings.encreset}
				{#if currentPatch.data.settings.shhold && currentPatch.data.settings.subhold}
				<p class="warn">Access to sub-banks while holding down encoders is enabled. If you press any pads in 3 seconds after
					you press encoders, the encoders will not be reset.</p>
				{:else if currentPatch.data.settings.shhold}
				<p class="warn">Access to sub-bank 4 while holding down Shift is enabled, too. If you press any pads in 3 seconds after
					you press down Shift, the encoder will not be reset.</p>
				{:else if currentPatch.data.settings.encreset && currentPatch.data.settings.subhold}
				<p class="warn">Access to sub-banks while holding down encoders 1, 2 and 3 is enabled. If you press any pads in 3 seconds after
					you press these encoders, the encoders will not be reset.</p>
				{/if}
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
				<label><input on:input={patchChangedOverTick} type="checkbox" class="appleswitch" bind:checked={currentPatch.data.settings.shhold} />
				<mark> Hold Shift to show sub-bank 4</mark>
					<Halp>Useful for quick access to common actions, such as transport controls.</Halp>
				</label>
			</div>
			
			{#if model.code == "microv2" || model.code == "microsharp"}
			<div class="ce-block cond-dev cond-dev-microv2 cond-dev-microsharp">
				<h4>Double-pressing Shift opens
					<Halp>Sub-bank 3 is not accessible on Micro by default. You can make it accessible by binding it to
					double-pressing Shift.</Halp></h4>
				<select on:input={patchChangedOverTick} bind:value={currentPatch.data.settings.shdblsubbank}>
					<option value={3}>Sub-bank 4</option>
					<option value={2}>Sub-bank 3</option>
				</select>
			</div>
			
			{:else}
			
			<h3>Encoders 1, 2 and 3</h3>
			
			<div class="ce-block">
				<label>
				<input on:input={patchChangedOverTick} type="checkbox" class="appleswitch" bind:checked={currentPatch.data.settings.subhold} />
				<mark>Hold to show a sub-bank</mark>
				</label>
			</div>
			
			<div class="ce-block">
				<label>
				<input on:input={patchChangedOverTick} type="checkbox" class="appleswitch" bind:checked={currentPatch.data.settings.subdbl} />
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
				<input on:input={patchChangedOverTick} type="checkbox" class="appleswitch" bind:checked={currentPatch.data.settings.encreset} />
				<mark>Long press resets encoders
					<Halp>
						<p>Hold an encoder for 3 seconds to reset. Resets CCs to the minimum specified value, and Pitch bend to zero.</p>
					</Halp>
				</mark>
				</label>
			</div>
			
			<div class="ce-block">
				<label>
				<input on:input={patchChangedOverTick} type="checkbox" class="appleswitch" bind:checked={currentPatch.data.settings.subhold} />
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
			<textarea on:input={patchChangedOverTick} id="dw-patch-desc" bind:value={currentPatch.data.info.desc}></textarea>
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