<script lang="ts">
	import { onDestroy } from 'svelte'
	
	import { colourOff } from 'colour_utils'
	import { scales, fakeNoteOff, paramOffNegative, paramOff, octaveInlineToRange, octaveRangeToInline, Notes, keyInfoToKeyObject, keyObjectToKeyInfo } from 'midi_utils'
	import { createPadsIfAbsent } from 'data_utils'
	import { isEmpty } from 'basic';
	import { fillWithTemplate } from 'editor';
	import { ExpanderSanizer } from 'data_expandsanize';
	import { patchChanged } from 'event_helpers';
	import type { KeyInfo } from 'midi_utils';
	
	import Pianoroll from './widgets/Pianoroll.svelte'
	import RangeWithInline from './widgets/RangeWithInline.svelte'
	import Channel from './widgets/Channel.svelte'
	import Overridable from './widgets/Overridable.svelte'
	import Halp from './widgets/Halp.svelte';
		
	import ColourWellsBank from './ColourWellsBank.svelte'
	

	
	const bankSettingsModel = {
		ch: -1,
		colour: [colourOff, colourOff, colourOff, colourOff],
		keyinfo: -1,
		lightshow: 0,
		vel: 127,
		midi: 
		{
			note: fakeNoteOff,
			cc: paramOff,
			min: paramOffNegative,
			max: paramOff,
			par: 0,
			rampu: 0,
			rampd: 0,
		}
	}
	
	export let currentBank: any;
	export let deviceLevelChannel: number;
			
	let lightshowPrev = -1;
	
	let lightshowMode: number = 0;
	let lightshowAgnostic: boolean = false;
	let lightshowChannel: number = 0;
	
	let keyinfoPrev = -2;
	
	let scaleEnabled = false;
	let scaleEnabledPrev = false;
	
	let scale: KeyInfo = 
	{	
		key: 0,
		scale: 0,
		octave: 0,
		offset: 0
	}
	
	let prevChannel = -2;
	let channelValue = 0;
	let channelIsGlobal = false;
	
	let expanderSanizer = new ExpanderSanizer(
	// @ts-ignore
	{ model: bankSettingsModel			// data will be attached in reactive block
		},
		() => { if (isEmpty(currentBank.bank)) delete currentBank.bank; } // cleanup function
	);
	
	onDestroy(()=>expanderSanizer.kill());
	
	let allPadsToScale = ()=>{fillWithTemplate(currentBank, 'fill', 'scale');currentBank=currentBank;patchChanged();}
	
	interface PianorollEvent extends CustomEvent { detail: { value: number, altKey: boolean } }
	
	function pianorollEvent(ev: PianorollEvent)
	{
		patchChanged();
		if (ev.detail.altKey)
		{
			if (scale.scale == 0) scale.scale = 1;
			else if (scale.scale == 1) scale.scale = 0;
		}
		
		if (ev.detail.value == -1) scaleEnabled = false;
	}
	
	$:
	{
		if (!("bank" in currentBank))
		{
			currentBank.bank = {};
		}
		
		if (expanderSanizer.check(currentBank.bank))
		{
			prevChannel = -2;
			lightshowPrev = -1;
			keyinfoPrev = -2;
		}
		
		if (keyinfoPrev != currentBank.bank.keyinfo)
		{
			keyinfoPrev = currentBank.bank.keyinfo;
			
			let getKeyInfoFrom: number =
				keyinfoPrev == -1 ?
				0x30 : 		// just set octave value to 3, which equals octave 1
				keyinfoPrev;
			
			scale = keyInfoToKeyObject(getKeyInfoFrom);
			
			scaleEnabled = scaleEnabledPrev = (keyinfoPrev != -1);
		}
		
		if (scaleEnabled != scaleEnabledPrev)
		{
			scaleEnabledPrev = scaleEnabled;
			if (scaleEnabled)
			{
				scale.octave = 3;
				if (createPadsIfAbsent(currentBank)) allPadsToScale(); // if bank was off, fill it and set all to scale automatically
				if (scale.key == -1) scale.key = 0;
			}
		}

		currentBank.bank.keyinfo = keyinfoPrev =
			(scaleEnabled && scale.key != -1) ?
				keyObjectToKeyInfo(scale) :
				-1;
		
		if (prevChannel != currentBank.bank.ch)
		{
			prevChannel = currentBank.bank.ch;
			channelValue = (prevChannel == -1) ? -1 : (prevChannel & 0xf);
			channelIsGlobal = ((prevChannel & 0x10) == 0x10 && prevChannel != -1);
		}
		
		currentBank.bank.ch = prevChannel = (
			(channelValue == -1) ?
				-1 :
				channelValue | (channelIsGlobal ? 0x10 : 0)
			);
		
		if (lightshowPrev != currentBank.bank.lightshow) // external change... probably in the beginning
		{
			lightshowPrev = currentBank.bank.lightshow;
			lightshowMode = lightshowPrev & 0x7;
			lightshowChannel = ((lightshowPrev >> 7) & 0x1f) - 1;
			lightshowAgnostic = ((lightshowPrev & 0x8) == 0x8);
		} else {
			if (lightshowMode == 0)
			{
				currentBank.bank.lightshow = 0;
			} else {
				currentBank.bank.lightshow = (
					(lightshowMode & 0x7) |
					(lightshowAgnostic ? 0x8 : 0x0) |
					((lightshowChannel + 1) << 7)
				);
			}
			
			lightshowPrev = currentBank.bank.lightshow;
		}
		// 
		// if (keyinfo)
		
		currentBank = currentBank;
	}
</script>
<div class="drawer columnizer-in" id="dw-banksettings">
	<p class="explain-caption">Global settings for this bank. Some can be overridden for individual controls.</p>
	<div>
		<fieldset id="dw-bank-colours">
			<legend>Bank colours
				<Halp>
					<p>This sets default pad colours. They can be overridden on per-pad basis.
						Any or all colours may be disabled altogether.</p>
					<p><i>Idle colour</i> is the colour that the pad has normally.</p>
					<p><i>Active colour</i> is the colour pad takes while pressed or toggled on (for toggle CCs).</p>
					<p><i>Music key colour</i> is relevant when a scale is enabled. The pads that correspond
					to the key of the scale will have this colour.</p>
					<p><i>Music key active colour</i> is like active colour, but for pads that correspond to the music key.</p>
				</Halp>
			</legend>
			<div class="colourselector">
				<ColourWellsBank on:input={patchChanged} bind:colours={currentBank.bank.colour} />
			</div>
		</fieldset>	
		<fieldset id="dw-bank-key" class="blockenablertarget">
			<legend style="display:table"> <!-- fix chrome being a jerk and putting the appleswitch in a wrong place -->
				<label>
					<input on:input={patchChanged} type="checkbox" class="appleswitch" bind:checked={scaleEnabled} />
					<mark>Scale and key
				<Halp><p>Pads will use this scale by default.</p>
					<p>Each pad can still be overridden to send other notes or send no note at all; things like CC
					are also available, of course.</p>
					<p>Encoders can be set to change scale parameters on the fly.</p>
				</Halp>
					</mark>
				</label>
			</legend>

			
			<div class="ce-block">
				<button on:click={allPadsToScale} disabled={!scaleEnabled || scale.key == -1}>Set all pads to scale
					<Halp>If scale is set, all pads will have their settings removed, and then set to obey the scale.</Halp>
				</button>
				<br />&nbsp;
			</div>
			
			<div class="ce-block">
				<Pianoroll on:input="{pianorollEvent}" disabled={!scaleEnabled} bind:musicKey={scale.key} />
			</div>
			<div class="ce-block">
				<h4 class:disabled={!scaleEnabled}>Scale type</h4>
				<select on:input={patchChanged} bind:value={scale.scale} disabled={!scaleEnabled}>
				{#each scales as scaleDef, i}
					<option value={i}>{Notes[scale.key]} {scaleDef.name}</option>
				{/each}
				</select>
			</div>
			<div class="ce-block">
					<h4 class:disabled={!scaleEnabled}>Octave</h4>
					<RangeWithInline on:input={patchChanged} max={10} defValue={4} elId={"cbv-octave"} inlineToRange={octaveInlineToRange} rangeToInline={octaveRangeToInline} bind:value={scale.octave} disabled={!scaleEnabled} />
			</div>
			<div class="ce-block">
				<h4 class:disabled={!scaleEnabled}>Offset</h4>
				<RangeWithInline on:input={patchChanged} max={11} bind:value={scale.offset} disabled={!scaleEnabled} />
			</div>
		</fieldset>
		
		<fieldset id="dw-bank-midi">
			<legend>MIDI</legend>
				<div class="ce-block">
					<h4>Velocity</h4>
					<RangeWithInline on:input={patchChanged} bind:value={currentBank.bank.vel} />
				</div>
				
			<div class="ce-block">
				<h4>Channel <Overridable /></h4>
				<Channel on:input={patchChanged} bind:value={channelValue} channelDefaultName="Device default" channelDefault={deviceLevelChannel} />
				<p>
				<label class:disabled={channelValue == -1}><input on:input={patchChanged} type="checkbox" bind:checked={channelIsGlobal} disabled={channelValue == -1} /> Global
				<Halp>
					With this option, once the bank is selected, all controls will send data on this channel, not just the pads – unless, of course,
					those controls have their own custom channel setting.
				</Halp></label></p>
			</div>
		</fieldset>

		<fieldset id="dw-bank-lightshow">
			<legend>Lightshow
				<Halp><p>Lightshows are a rather advanced technique when the host (not the Dobrynya itself)
					drives LEDs of the device for various complex effects.</p>
					<p>If you are interested, google
					“lightshow launchpad” to know more. If you just want some fun colourful effects,
					check out “Bursts” on the patch settings page.</p></Halp> 
				
			</legend>
			<div class="ce-block">
				<h4>Mode</h4>
				<select on:input={patchChanged} bind:value={lightshowMode} >
					<option value={0}>Off</option>
					<option value={1}>Simple</option>
					<option value={2}>Mix</option>
					<option value={3}>Launchpad-compatible</option>
					<option value={4}>Spectrum</option>
					<!-- <option value="5">Advanced</option> -->
				</select>
			</div>

			<br />

			<div class="ce-block">
				<label>
					<input on:input={patchChanged} disabled={lightshowMode == 0} type="checkbox" class="appleswitch" bind:checked={lightshowAgnostic} />
					<mark>Ignore mapping 
						<Halp>
							<p>By default, if Dobrynya receives a note, it will try to match it against the notes that are mapped
								to the pads. That is, if it receives D4, and pad 6 has D4 mapped to it, pad 6 will light up. This
								may be convenient if you use the notes <i>sent</i> by Dobrynya itself and route them
								back to Dobrynya in your DAW.</p>
							<p>However, because mappings can be very different and may or may not include notes, you may want to
								have consistency instead. This option provides exactly that. Incoming C1 will always correspond
								to pad 1 (lower left), C#1 to pad 2, and so on all the way to D#2 at pad 16. If you are trying
								out MIDI tracks for lightshows made by other users, this is what you want, too.</p>
						</Halp>
					</mark>
				</label>
			</div>

			<div class="ce-block">
				<h4 class:disabled={lightshowMode == 0}>Listen on</h4>
				<Channel on:input={patchChanged} disabled={lightshowMode == 0} bind:value={lightshowChannel} channelDefaultName="Any channel" />
			</div>
		</fieldset>
	</div>
</div>