<script lang="ts">
	import { WaitingBlock } from './waitingblock'
	import type { StatusResult } from './types'
	import { sysExAndDo } from './midi';	
	import { eightToSeven, SysExCommand } from './midi_utils';
	
	import { getPaletteCSS } from './palettes'
	
	import RangeWithInline from './widgets/RangeWithInline.svelte';
	import Channel from './widgets/Channel.svelte';
	import PaletteCheckboxes from './widgets/PaletteCheckboxes.svelte'
	import ButtonUpload from './widgets/ButtonUpload.svelte';
	import Overridable from './widgets/Overridable.svelte';
	import Halp from './widgets/Halp.svelte'
		
	export let device: StatusResult;
	export let settingsRawData: Uint8Array;
	export let isOnline: boolean;
	
	const logtime: number[] =
	[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,20,25,30,35,40,45,50,55,60,70,80,90,100,110,120,135,150,165,180,195,210,225,240,255,270,285,300,330,360,390,420,450,480,510,540,570,600,660,720,780,840,900,960,1020,1080,1140,1200,1320,1440,1500,1560,1680,1800
	];
	
	console.log("Settings raw data", settingsRawData);
	
	function fixValueToZero(v: number): number { return (v == 0xff) ? 0    : v; }
	function fixValueTo7F  (v: number): number { return (v >  0x7f) ? 0x7f : v; }
	
	interface SettingsObjectItem
	{
		length?: number,
		reserved?: boolean,
		isFlag?: boolean,
		fixFunc?: Function,
		value?: number,
		flag?: boolean[],
		fixfunc?: Function,
	}
	
	interface SettingsObject
	{
		[index: string]: {
			[index: string]: SettingsObjectItem
		}	
	};
	
	let settings: SettingsObject =
	{
		control: 
		{
			control:
			{
				length: 4
			}
		},
	
		screen: 
		{
			brightness:
			{
				reserved: true
			},
			contrast:
			{},
			timeout:
			{
				length: 2
			},
			reserved1:
			{
				reserved: true,
				length: 8
			}
		},
	
		leds:
		{
			brightness: {},    
			brightnesschill: {},    
			brightnessdeco: {},        
			brightnessblink: {},
			timeoutchill:
			{
				length: 2
			},
			timeoutoff:
			{
				reserved: true,
				length: 2
			},
			timeoutpalette:
			{},
			palettes:
			{
				isFlag: true
			},
			flags:
			{
				isFlag:true,
				reserved:true
			},
			blinkmode:
			{},
			chillanimations:
			{
				isFlag:true
			},
			reserved2:
			{
				reserved:true,
				length:3
			}
		},
	
		midi:
		{
			channel: {},
			outputs:
			{
				isFlag:true
			},
			inputs:
			{
				isFlag:true
			},
			hwmidi:
			{
				fixfunc: fixValueToZero,
				isFlag:true
			},
			vel:
			{
				fixfunc: fixValueTo7F,
			},
			reserved1:
			{
				reserved:true,
				length:11
			}
		},
	
		input:
		{
			debouncepad: {},
			debounceother: {},
			smoothfader:
			{
				reserved:true
			},
			smoothjoystick:
			{
				reserved:true
			},
			encoderkinetics:
			{
				reserved:true,
				length:4
			},
			direction:
			{
				isFlag:true
			},
			reserved1:
			{
				reserved:true,
				length:7
			}
		},
		
		lowpower:
		{
			reserved1:
			{
				reserved:true,
				length:16
			}
		},
		
		ble:
		{
			reserved1:
			{
				reserved:true,
				length:16
			}
		},
		
		haptic:
		{
			events:
			{
				length:2,
				isFlag:true
			},
			channel: {}
		}
	};
	
	function parseSettingsData()
	{
		let arp = 0;
		
		for (let i in settings)
		{
			if (i == "fakeparam") continue;
			
			for (let j in settings[i])
			{
				let param = settings[i][j];
				
				if (typeof param.length == "undefined") param.length = 1;
				
				if (param.reserved) 
				{
					arp += param.length;
					continue;
				} 
				
				param.value = 0;
				
				for (let byteshift = 0; byteshift < param.length; byteshift++)
				{
					param.value |= (settingsRawData[arp++] << (byteshift * 8));
				}
				
//				if ("fixif" in param && "fixto" in param && param.fixif == param.value) param.value = param.fixto;
				if (typeof param.fixfunc == "function") param.value = param.fixfunc(param.value);
				
				if (param.isFlag)
				{
					param.flag = [];
					
					for (let bitshift = 0; bitshift < 8; bitshift++)
					{
						param.flag[bitshift] = (((param.value >> bitshift) & 1) == 1 ? true : false);
					}
				}
			}
		}
		
		console.log(settings);
	}
	
	let uploadButton: ButtonUpload;
	
	function saveSettings()
	{
		let b8 = [];
		
		for (let i in settings)
		{
			for (let j in settings[i])
			{
				let param: SettingsObjectItem = settings[i][j];

				let l = param.length;
				
				let reserved = (typeof param.reserved == "boolean" && param.reserved);				
				
				if (!reserved && typeof param.isFlag == "boolean" && param.isFlag)
				{
					console.log(param);
					param.value = 0;
					for (let bf = 0; bf < 8; bf++)
						param.value |= (param.flag[bf] ? (1 << bf) : 0);
				}
				
				let byteshift = 0;
				
				while (l--)
				{
					let theByte =
						reserved ?
							0xff : // пишем просто 0xff если это резерв
							(param.value >> byteshift) & 0xff;	// иначе бьём на байты value					
					
					b8.push(theByte);
					
					byteshift += 8;
				}
			}
		}
		
		while (b8.length > device.model.settingsLength) b8.pop();
		while (b8.length < device.model.settingsLength) b8.push(0xff);
		
		WaitingBlock.block(SysExCommand.SAVESETTINGS);
		sysExAndDo(SysExCommand.SAVESETTINGS, ()=>{
			uploadButton.ok();
			isSaved=true
		}, 1000, eightToSeven(b8), true);
	}
	
	parseSettingsData();
	
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
	
	let isSaved = true;
	
	function markSettingsUnsaved() { isSaved = false; }

</script>

<section id="tab-settings">
	<div style="margin:2em">
		<ButtonUpload disabled={!isOnline} {isSaved} bind:this={uploadButton} on:click={saveSettings}>Save to the device</ButtonUpload>
	</div>
	<div id="settings" class="columnizer">
		<fieldset id="se-leds">
			<legend for="se-leds">Light</legend>
			
			<div class="ce-block">
				<h4>Normal mode brightness</h4>
				<RangeWithInline on:change={markSettingsUnsaved} bind:value={settings.leds.brightness.value} max={255} defValue={112} />
			</div>
			
			{#if device.has.decolight }
			<h3>Decorative light</h3>
			
			<div class="ce-block">
				<h4>Breathe brightness</h4>
				<RangeWithInline on:change={markSettingsUnsaved} bind:value={settings.leds.brightnessdeco.value} max={255} defValue={128} />
			</div>
			<div class="ce-block">
				<h4>Blink brightness</h4>
				<RangeWithInline on:change={markSettingsUnsaved} bind:value={settings.leds.brightnessblink.value} max={255} defValue={255} />
			</div>			
			<div class="ce-block">
				<h4>Blink mode</h4>
				<select on:input={markSettingsUnsaved} bind:value={settings.leds.blinkmode.value}>
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
			
			
			<h3>Waiting mode</h3>
			
			<div class="ce-block">
				<h4>Animations</h4>
				<div class="checkboxblock">
					<label><input type="checkbox" on:input={markSettingsUnsaved} bind:checked={settings.leds.chillanimations.flag[0]}> Smooth noise</label><br />
					<label><input type="checkbox" on:input={markSettingsUnsaved} bind:checked={settings.leds.chillanimations.flag[1]}> Noise with glitter</label><br />
					<label><input type="checkbox" on:input={markSettingsUnsaved} bind:checked={settings.leds.chillanimations.flag[2]}> Pulses</label><br />
				</div>
			</div>
			
			
			<div class="ce-block">
				<h4>Brightness</h4>
				<RangeWithInline on:change={markSettingsUnsaved} bind:value={settings.leds.brightnesschill.value} max={255} defValue={30} />
			</div>
			
			<div class="ce-block">
				<h4>Go to waiting mode after</h4>
				<RangeWithInline on:change={markSettingsUnsaved} width="4.5em" bind:value={settings.leds.timeoutchill.value} max={1800} list={logtime} inlineToRange={timeToValue} rangeToInline={valueToTime} />
			</div>
			
			<div class="ce-block">
				<h4>Change palettes every</h4>
				<RangeWithInline on:change={markSettingsUnsaved} width="4.5em" bind:value={settings.leds.timeoutpalette.value} max={1200} step={5} defValue={30} inlineToRange={timeToValue} rangeToInline={valueToTime} />
			</div>
			
			<PaletteCheckboxes bind:flags={settings.leds.palettes.flag} oninput={markSettingsUnsaved} />
			


<!-- 					<button>Export settings</button> -->
		</fieldset>
		
		<fieldset id="se-midi">
			<legend for="se-midi">MIDI</legend>
			
			<div class="ce-block">
				<h4>MIDI channel <Overridable isGlobal={true} title="Can be overriden on a per-bank and per-control basis" /></h4>
				<Channel on:change={markSettingsUnsaved} bind:value={settings.midi.channel.value} />
				<!-- <RangeWithInline on:change={markSettingsUnsaved} bind:value={settings.midi.channel.value} max="15" defValue={0} /> -->
			</div>
			
			<div class="ce-block">
				<h4>Velocity <Overridable isGlobal={true} title="Can be overriden on a per-bank and per-control basis" /></h4>
				<RangeWithInline on:change={markSettingsUnsaved} bind:value={settings.midi.vel.value} max={127} defValue={127} />
			</div>
			
			<div class="ce-block">
				<h4>Output</h4>
				<p class="explain">System Exclusive messages are always enabled and work only through USB MIDI.</p>
				<div class="checkboxblock">
					<label><input type="checkbox" on:input={markSettingsUnsaved} bind:checked={settings.midi.outputs.flag[0]}> USB</label><br />
					<label><input type="checkbox" on:input={markSettingsUnsaved} bind:checked={settings.midi.outputs.flag[1]}> Classic MIDI</label><br />
					{#if device.has.ble}
					<label><input type="checkbox" on:input={markSettingsUnsaved} disabled={!settings.midi.outputs.flag[1]} bind:checked={settings.midi.outputs.flag[2]}> BLE</label>
					{/if}
				</div>
			</div>
			
			<div class="ce-block">
				<h4>Input</h4>
				<p class="explain">System Exclusive messages are always enabled and work only through USB MIDI.</p>
				<div class="checkboxblock">
					<label><input type="checkbox" on:input={markSettingsUnsaved} bind:checked={settings.midi.inputs.flag[0]}> USB</label><br />
					<label style="display:none"><input type="checkbox" on:input={markSettingsUnsaved} bind:checked={settings.midi.inputs[1]}> Classic MIDI - no MIDI inputs on Dobrynyas, left as a placeholder</label><!--br  /-->
					{#if device.has.ble}
					<label><input type="checkbox" on:input={markSettingsUnsaved} bind:checked={settings.midi.inputs.flag[2]}> BLE</label>
					{/if}
				</div>
			</div>
			
			<div class="ce-block">
				<h4>Classic MIDI</h4>
				<p class="explain">These settings work regardless of the Input/Output settings</p>
				<!-- <nobr> -->
				<div class="checkboxblock">
					<label><input type="checkbox" on:input={markSettingsUnsaved} bind:checked={settings.midi.hwmidi.flag[0]}> Passthru (USB → MIDI{#if device.has.ble} and BLE{/if})</label><!--/nobr--><br />
					<label><input type="checkbox" on:input={markSettingsUnsaved} bind:checked={settings.midi.hwmidi.flag[1]}> Send active sensing</label>
				</div>
			</div>
			
			{#if device.model.code != "prov2" }
			<p class="explain">All MIDI Dobrynyas are capable of outputting classic MIDI, which can control older hardware such as synths or drum machines directly.
				However, because it is a rarely needed feature, there is no connector available to the user except on <nobr>MIDI Dobrynya Pro V2</nobr>. 
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
				<RangeWithInline on:change={markSettingsUnsaved} width="4em" bind:value={settings.input.debouncepad.value} max={100} defValue={5} inlineToRange={msToValue} rangeToInline={valueToMs}  />
			</div>
			
			<!-- <div class="ce-block">
				<h4>Direction</h4>
				<label><input type="checkbox" on:input={markSettingsUnsaved} bind:checked={settings.input.direction.flag[0]}> Reverse encoders</label><br />
			</div> -->
		</fieldset>
		
		<fieldset id="se-inputs" class="hh cond-has has-haptic">
			<legend for="se-inputs">Haptic</legend>
			
			<div class="ce-block">
				<h4>Events with feedback</h4>
				<div class="checkboxblock">
					<label><input type="checkbox" on:input={markSettingsUnsaved} bind:checked={settings.haptic.events.flag[0]}> Joystick sticky</label><br />
					<label><input type="checkbox" on:input={markSettingsUnsaved} bind:checked={settings.haptic.events.flag[1]}> Joystick bank change</label><br />
					<label><input type="checkbox" on:input={markSettingsUnsaved} bind:checked={settings.haptic.events.flag[2]}> Encoder range hit</label><br />
					<label><input type="checkbox" on:input={markSettingsUnsaved} bind:checked={settings.haptic.events.flag[3]}> Encoder reset</label>
				</div>
			</div>
			
			<div class="ce-block">
				<h4>Control haptic with MIDI input</h4>
				<select on:input={markSettingsUnsaved} bind:value={settings.haptic.channel.value} name="set-haptic-midichannel">
					<option value="255">Off</option>
					<option value="0">All channels</option>
					<option value="1">Channel 1</option>							
					<option value="2">Channel 2</option>							
					<option value="3">Channel 3</option>							
					<option value="4">Channel 4</option>							
					<option value="5">Channel 5</option>							
					<option value="6">Channel 6</option>							
					<option value="7">Channel 7</option>							
					<option value="8">Channel 8</option>							
					<option value="9">Channel 9</option>							
					<option value="10">Channel 10</option>							
					<option value="11">Channel 11</option>							
					<option value="12">Channel 12</option>							
					<option value="13">Channel 13</option>							
					<option value="14">Channel 14</option>							
					<option value="15">Channel 15</option>							
					<option value="16">Channel 16</option>							
				</select>
			</div>	
		</fieldset>	
	</div>
</section>