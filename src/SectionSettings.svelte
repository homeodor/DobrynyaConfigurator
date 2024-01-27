<script lang="ts">
	import RangeWithInline from './widgets/RangeWithInline.svelte';
	import Channel from './widgets/Channel.svelte';
	import PaletteCheckboxes from './widgets/PaletteCheckboxes.svelte'
	import ButtonUpload from './widgets/ButtonUpload.svelte';
	import Overridable from './widgets/Overridable.svelte';
	import Halp from './widgets/Halp.svelte'
	
	import { settings, saveSettings, isSaved, markSettingsUnsaved } from 'settings_utils'
	
	import { deviceDefinition, BLEAvailable } from 'device';
	
	export let isOnline: boolean;
	
	const logtime: number[] =
	[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,20,25,30,35,40,45,50,55,60,70,80,90,100,110,120,135,150,165,180,195,210,225,240,255,270,285,300,330,360,390,420,450,480,510,540,570,600,660,720,780,840,900,960,1020,1080,1140,1200,1320,1440,1500,1560,1680,1800
	];
	
	let uploadButton: ButtonUpload;
	let isSavedNow: boolean = isSaved; // to make it reactive
	
	async function saveSettingsNow()
	{
		await saveSettings($deviceDefinition.model.settingsLength, uploadButton);
		isSavedNow = isSaved; // make it reactive
	}
	
	async function markSettingsUnsavedNow()
	{
		markSettingsUnsaved();
		isSavedNow = isSaved; // make it reactive
	}
	
//	parseSettingsData();
	
	function timeToValue(v:string): number | boolean
	{
		v = v.trim();
		
		if (!v) return false;
		
		if (v.toLowerCase() === "never") return 0;
		
		let minutesSplit = v.replaceAll(" ","").replaceAll(",","").replaceAll(".","").replaceAll("s","").split("m");
		if (minutesSplit.length > 2) return false;
		if (minutesSplit.length == 1) return parseInt(minutesSplit[0]);
		if (minutesSplit.length == 2) return parseInt(minutesSplit[1]) + parseInt(minutesSplit[0]) * 60;
	}
	
	function valueToTime(v: number): string
	{
		if (v === 0) return "Never";
		
		return (v >= 60 ? `${Math.floor(v / 60)} m ` : '') +
			(String(v % 60)) + "s ";
	}
	
	function msToValue(v: string): number { return parseInt(v.replace(/\D/g, "")); }
	function valueToMs(v: number): string { return String(v) + " ms"; }
	
</script>

<section id="tab-settings">
	<div style="margin:2em">
		<ButtonUpload disabled={!isOnline} isSaved={isSavedNow} bind:this={uploadButton} on:click={saveSettingsNow}>Save to device</ButtonUpload>
	</div>
	<div id="settings" class="columnizer">
		<fieldset id="se-leds">
			<legend for="se-leds">Light</legend>
			
			<h3>Play mode</h3>
			
			<div class="ce-block">
				<h4>Brightness</h4>
				<RangeWithInline on:change={markSettingsUnsavedNow} bind:value={settings.leds.brightness.value} max={255} defValue={112} />
			</div>

			{#if $deviceDefinition.model.code != "prov2" && $deviceDefinition.model.code != "promv2" && $deviceDefinition.model.code != "promsharp" }
			<h4>
					<label><input type="checkbox" class="appleswitch" on:input={markSettingsUnsavedNow} bind:checked={settings.leds.flags.flag[0]}><mark></mark> Colourful encoder feedback</label><br />

			</h4>
			{/if}			
			
			{#if $deviceDefinition.has.decolight }
			<h3>Decorative light</h3>
			
			<div class="ce-block">
				<h4>Breathe brightness</h4>
				<RangeWithInline on:change={markSettingsUnsavedNow} bind:value={settings.leds.brightnessdeco.value} max={255} defValue={128} />
			</div>
			<div class="ce-block">
				<h4>Blink brightness</h4>
				<RangeWithInline on:change={markSettingsUnsavedNow} bind:value={settings.leds.brightnessblink.value} max={255} defValue={255} />
			</div>			
			<div class="ce-block">
				<h4>Blink mode</h4>
				<select on:input={markSettingsUnsavedNow} bind:value={settings.leds.blinkmode.value}>
					<option value={0}>Off</option>
					<option value={1}>Normal</option>
					<option value={2}>Front and sides only</option>
					<option value={3}>Front only</option>
					<option value={4}>Relative to the button</option>
					<option value={5}>Relative to the button, front and sides only</option>
					<option value={6}>Relative to the button, front only</option>							
				</select>
			</div>
			{/if}
			
			
			<h3>Idle mode</h3>
			
			<div class="ce-block">
				<h4>Animations</h4>
				<div class="checkboxblock">
					<label><input type="checkbox" on:input={markSettingsUnsavedNow} bind:checked={settings.leds.chillanimations.flag[0]}> Smooth noise</label><br />
					<label><input type="checkbox" on:input={markSettingsUnsavedNow} bind:checked={settings.leds.chillanimations.flag[1]}> Noise with glitter</label><br />
					<label><input type="checkbox" on:input={markSettingsUnsavedNow} bind:checked={settings.leds.chillanimations.flag[2]}> Pulses</label><br />
				</div>
			</div>
			
			
			<div class="ce-block">
				<h4>Brightness</h4>
				<RangeWithInline on:change={markSettingsUnsavedNow} bind:value={settings.leds.brightnesschill.value} max={255} defValue={30} />
			</div>
			
			<div class="ce-block">
				<h4>Go idle after</h4>
				<RangeWithInline on:change={markSettingsUnsavedNow} width="4.7em" bind:value={settings.leds.timeoutchill.value} max={1800} list={logtime} inlineToRange={timeToValue} rangeToInline={valueToTime} />
			</div>
			
			<div class="ce-block">
				<h4>Change palettes every</h4>
				<RangeWithInline on:change={markSettingsUnsavedNow} width="4.7em" bind:value={settings.leds.timeoutpalette.value} max={1200} step={5} defValue={30} inlineToRange={timeToValue} rangeToInline={valueToTime} />
			</div>
			
			<PaletteCheckboxes bind:flags={settings.leds.palettes.flag} oninput={markSettingsUnsavedNow} />
			


<!-- 					<button>Export settings</button> -->
		</fieldset>
		
		<fieldset id="se-midi">
			<legend for="se-midi">MIDI</legend>
			
			<div class="ce-block">
				<h4>MIDI channel <Overridable isGlobal={true} title="Can be overriden on a per-bank and per-control basis" /></h4>
				<Channel on:change={markSettingsUnsavedNow} bind:value={settings.midi.channel.value} />
				<!-- <RangeWithInline on:change={markSettingsUnsavedNow} bind:value={settings.midi.channel.value} max="15" defValue={0} /> -->
			</div>
			
			<div class="ce-block">
				<h4>Velocity <Overridable isGlobal={true} title="Can be overriden on a per-bank and per-control basis" /></h4>
				<RangeWithInline on:change={markSettingsUnsavedNow} bind:value={settings.midi.vel.value} max={127} defValue={127} />
			</div>
			
			<div class="ce-block">
				<h4>Output</h4>
				<p class="explain">System Exclusive messages are always enabled and work only through USB MIDI. {#if $deviceDefinition.has.ble}Classic MIDI is required for BLE MIDI to work.{/if}</p>
				<div class="checkboxblock">
					<label><input type="checkbox" on:input={markSettingsUnsavedNow} bind:checked={settings.midi.outputs.flag[0]}> USB</label><br />
					<label><input type="checkbox" on:input={markSettingsUnsavedNow} bind:checked={settings.midi.outputs.flag[1]}> Classic MIDI</label><br />
					{#if $deviceDefinition.model.hardware.ble != BLEAvailable.None}
					<label><input type="checkbox" on:input={markSettingsUnsavedNow} disabled={$deviceDefinition.model.hardware.ble == BLEAvailable.External &&!settings.midi.outputs.flag[1]} bind:checked={settings.midi.outputs.flag[2]}> BLE</label>
					{/if}
				</div>
			</div>
			
			<div class="ce-block">
				<h4>Input</h4>
				<p class="explain">System Exclusive messages are always enabled and work only through USB MIDI.</p>
				<div class="checkboxblock">
					<label><input type="checkbox" on:input={markSettingsUnsavedNow} bind:checked={settings.midi.inputs.flag[0]}> USB</label><br />
					<label style="display:none"><input type="checkbox" on:input={markSettingsUnsavedNow} bind:checked={settings.midi.inputs[1]}> Classic MIDI - no MIDI inputs on Dobrynyas, left as a placeholder</label><!--br  /-->
					{#if $deviceDefinition.model.hardware.ble != BLEAvailable.None}
					<label><input type="checkbox" on:input={markSettingsUnsavedNow} bind:checked={settings.midi.inputs.flag[2]}> BLE</label>
					{/if}
				</div>
			</div>
			
			<div class="ce-block">
				<h4>Classic MIDI</h4>
				<p class="explain">These settings work regardless of the Input/Output settings</p>
				
				<h4>Passthru USB → MIDI</h4>
				<Channel on:change={markSettingsUnsavedNow} bind:value={settings.midi.passthruusb.value} channelDefaultName="Off" channelDefaultValue={255} optionAll={true} />
				{#if $deviceDefinition.model.hardware.ble == BLEAvailable.Internal}
				<h4>Passthru BLE → MIDI</h4>
				<Channel on:change={markSettingsUnsavedNow} bind:value={settings.midi.passthruble.value} channelDefaultName="Off" channelDefaultValue={255} optionAll={true} />
				{/if}
				<!-- <nobr> -->
				<div class="checkboxblock">
					
					<label><input type="checkbox" on:input={markSettingsUnsavedNow} bind:checked={settings.midi.hwmidi.flag[0]}> Passthru (USB → MIDI)</label><!--/nobr--><br />
					{#if $deviceDefinition.model.hardware.ble != BLEAvailable.None}
					<label><input type="checkbox" on:input={markSettingsUnsavedNow} bind:checked={settings.midi.hwmidi.flag[1]}> Passthru (BLE → MIDI)</label><!--/nobr--><br />
					{/if}
					<label><input type="checkbox" on:input={markSettingsUnsavedNow} bind:checked={settings.midi.hwmidi.flag[2]}> Send active sensing</label>
				</div>
			</div>
			
			{#if !$deviceDefinition.model.hardware.midiOut }
			<p class="explain">All MIDI Dobrynyas are capable of outputting classic MIDI, which can control older hardware such as synths or drum machines directly.
				However, because it is a rarely needed feature, there is no connector available to the user except on <nobr>MIDI Dobrynya Pro V2</nobr>
				and <nobr>Pocket</nobr>. 
				Connection points are provided on the board, to which the output connector may be soldered. Contact support to find out more!</p>
			{/if}
		</fieldset>
		
		<fieldset id="se-inputs">
			<legend for="se-inputs">Controls</legend>
			
			<div class="ce-block">
				<h4>Debounce pads
				<Halp>
					<p>All mechanical switches in all electronic devices in the world
						may register fake presses when the contacts inside bounce.
						This may result in some unwanted actions or “sticky” buttons.
						Debounce algorithm aims to fix it, but introduces a tiny delay.</p>
					<p>While it’s a rare thing to see such a setting in a device,
						we believe that it may be useful and important for pro-level finger drummers
						and beat makers who want to find their own sweet spot between
						possible bounce artefacts and responsiveness.</p>
					<p>A common setting for debounce seems to be around 10 ms for most midi controllers,
						but can reasonably go down to 2 ms for extreme responsiveness.</p>
				</Halp>
				</h4>
				<RangeWithInline on:change={markSettingsUnsavedNow} width="4em" bind:value={settings.input.debouncepad.value} min={1} max={100} defValue={5} inlineToRange={msToValue} rangeToInline={valueToMs}  />
			</div>
			
			<!-- <div class="ce-block">
				<h4>Direction</h4>
				<label><input type="checkbox" on:input={markSettingsUnsavedNow} bind:checked={settings.input.direction.flag[0]}> Reverse encoders</label><br />
			</div> -->
		</fieldset>
		
		{#if $deviceDefinition.has.haptic}
		<fieldset id="se-haptic">
			<legend for="se-haptic">Haptic</legend>
			
			<div class="ce-block">
				<h4>Events with feedback</h4>
				<div class="checkboxblock">
					<label><input type="checkbox" on:input={markSettingsUnsavedNow} bind:checked={settings.haptic.events.flag[0]}> Joystick sticks</label><br />
					<label><input type="checkbox" on:input={markSettingsUnsavedNow} bind:checked={settings.haptic.events.flag[1]}> Joystick bank change</label><br />
					<label><input type="checkbox" on:input={markSettingsUnsavedNow} bind:checked={settings.haptic.events.flag[2]}> Encoder range hit</label><br />
					<label><input type="checkbox" on:input={markSettingsUnsavedNow} bind:checked={settings.haptic.events.flag[3]}> Encoder reset</label>
				</div>
			</div>
			
			<div class="ce-block">
				<h4>Control haptic with MIDI input</h4>
				<select on:input={markSettingsUnsavedNow} bind:value={settings.haptic.channel.value} name="set-haptic-midichannel">
					<option value={255}>Off</option>
					<option value={0}>All channels</option>
					<option value={1}>Channel 1</option>							
					<option value={2}>Channel 2</option>							
					<option value={3}>Channel 3</option>							
					<option value={4}>Channel 4</option>							
					<option value={5}>Channel 5</option>							
					<option value={6}>Channel 6</option>							
					<option value={7}>Channel 7</option>							
					<option value={8}>Channel 8</option>							
					<option value={9}>Channel 9</option>							
					<option value={10}>Channel 10</option>							
					<option value={11}>Channel 11</option>							
					<option value={12}>Channel 12</option>							
					<option value={13}>Channel 13</option>							
					<option value={14}>Channel 14</option>							
					<option value={15}>Channel 15</option>							
					<option value={16}>Channel 16</option>							
				</select>
			</div>	
		</fieldset>
		{/if}
	</div>
</section>