<script lang="ts">	
	import pJson from '../package.json';
	
	import { UAParser } from 'ua-parser-js'
	
	import type { NoPatchesObject } from 'types'
	import { NewPatchDecision } from 'types'
	import { isMinimumVersion, FirmwareState, setDevice, deviceDefinition } from 'device'
	import { sysExDiskMode, flipConnected, sysExLockPatchSwitching, sysExBootloader } from 'midi_core'
	import { SysExStatus } from 'midi_utils';
	import { fixSettings, getSettingsFromDevice, getPalettesFromDevice, getFactorySettings } from 'settings_utils'
	import { WaitingBlock } from 'waitingblock'
	import { isAlt, isMacLike } from 'stores';
	import { loadPatchInfo, fillPatchList, patchList, loadCurrentPatch, newPatch } from 'patch';
	import { randomPattern } from 'colour_utils';
	
	import GotIt from './widgets/GotIt.svelte';
	import NoPatches from './widgets/NoPatches.svelte';
	import Alert from './widgets/Alert.svelte';
			
	import SectionEditor from './SectionEditor.svelte'
	import SectionPatches from './SectionPatches.svelte'
	import SectionSettings from './SectionSettings.svelte'
	import SectionDevice from './SectionDevice.svelte'
	import SectionFirmware from './SectionFirmware.svelte'
	
	const sections: string[] = ['editor','patches','settings','firmware','device'];
	
	let isOnline: boolean = false;
	let isConnected: boolean = true;
	let isBootloader: boolean = false;
		
	let openSection = "";
	let sectionSwitchingAllowed = false;
	
//	let patchesInfoHasBeenLoaded = false;
	
	let alertJsonLoadFailed: Alert;
	
	let editor: SectionEditor;
	
//	let patchesInfo: PatchInfoItem[];
	
	let alertNoPatches: NoPatches;
	
	function romanize (num: number)
	{
		if (isNaN(num)) return NaN;
		
		let i = 3;
		let digits = String(+num).split("");
		const key = [
						"","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
						"","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
						"","I","II","III","IV","V","VI","VII","VIII","IX"
					];
		let roman = "";
		
		while (i--) roman = (key[+digits.pop() + (i * 10)] || "") + roman;
		
		return Array(+digits.join("") + 1).join("M") + roman;
	}

	
	import type { VersionData } from 'device'
	import { getLatestVersion, versionCompare } from 'device'
	
	let versionInfo: VersionData;
	let hasNewFirmware = FirmwareState.Unknown;
	
	let uaParserEngine = (new UAParser()).getEngine();
	
	async function updateVersionInfo()
	{
		if (hasNewFirmware == FirmwareState.Obsolete) return; // do not set anything, it’s already clear it’s old as balls
		hasNewFirmware = FirmwareState.Checking;
		try {
			versionInfo = await getLatestVersion($deviceDefinition.model);
			hasNewFirmware = versionCompare($deviceDefinition.version, versionInfo) ? FirmwareState.Outdated : FirmwareState.UpToDate;
		} catch(e) {
			hasNewFirmware = FirmwareState.Unknown;
		}
	}
	
	let stuffHasBeenLoaded = false;
	
	async function dobrynyaIsHere(ev: CustomEvent)
	{
		isOnline = true;
		
		let previousSerial = $deviceDefinition.serial;
			
		if ((ev as CustomEvent).detail) setDevice((ev as CustomEvent).detail);
			// there’s nothing bad in updating the details each time, because there might’ve been a firmware update or something
		
		if (!isMinimumVersion($deviceDefinition.version))
		{
			hasNewFirmware = FirmwareState.Obsolete;
			console.warn("Version is outdated!");
			openSection = "firmware";
			return;
		}
		
		fixSettings($deviceDefinition.model.settingsLength); // if settings need fixing, this will be done NOW
		
		if (previousSerial === $deviceDefinition.serial && stuffHasBeenLoaded)
			return; // same device, no need to reload everything, assume no changes happened
		
		updateVersionInfo();
		getFactorySettings(); // yup
		sysExLockPatchSwitching(false); // the device might have locked patch switching, so unlock it
		
		await getSettingsFromDevice();
		
		try {
			await getPalettesFromDevice();
		} catch(ex) {
			console.warn("Getting palettes is not implemented");
			if (ex.status != SysExStatus.NOT_IMPLEMENTED) { 
				throw(ex);
			}
		}
		
		while(true)
		{
			try
			{
				await fillPatchList();
				break;
			} catch(e) {
				console.log(e);
				if (e.status != SysExStatus.NO_FILE) { 
					throw(e);
				}
				WaitingBlock.unblock();
				
				
				let noPatchesObject: NoPatchesObject = await alertNoPatches.confirm();
				
				if (noPatchesObject.decision == NewPatchDecision.DiskMode || noPatchesObject.decision == NewPatchDecision.Cancel) // cancel === "Disk mode" in this case 
				{
					if (noPatchesObject.decision == NewPatchDecision.DiskMode) sysExDiskMode();
					throw("No patches on this device");
				}
						
				if (noPatchesObject.decision == NewPatchDecision.Template)
				{
					// Block?
					try
					{
						let patchData = await fetch(`defaultpatches/${$deviceDefinition.model.code}-${noPatchesObject.template}.json`);
						let patchJson = await patchData.json();
						
						await newPatch(
							false, // not a clean slate
							null, // shift hue
							noPatchesObject.filename,
							true, // load patch afterwards
							()=>{}, // default handler
							patchJson
						);
						
					} catch(e) {
						console.log(e);
						await alertJsonLoadFailed.confirm();
						return;
					}
					
				} else {
					await newPatch(
						true,
						randomPattern,
						"New 1",
						true,
						()=>{},
					);
				}
						
				continue;
			}
		}
		
		stuffHasBeenLoaded = true;
		
		if (!sectionSwitchingAllowed)
		{
			sectionSwitchingAllowed = true;
			openSection = "editor";
		}
				
		loadCurrentPatch();
		
		loadPatchInfo();
	}
	
	function flipDisconnectNow(ev: MouseEvent)
	{
		if (ev.altKey) sysExBootloader(!ev.shiftKey);
		isConnected = flipConnected();
	}
	
	function dobrynyaGone()
	{
		isOnline = false;
		console.debug("Dobrynya is gone");
	}
	
	function section(ev: CustomEvent | string)
	{
		if (!sectionSwitchingAllowed && !(typeof ev === "string" && ev === "firmware")) return;
		openSection = (typeof ev === "string") ? ev : ev.detail.section;
	}
	
		document.body.addEventListener("keydown", (ev)=>{if (ev.key === "Alt") isAlt.set(true); })
		document.body.addEventListener("keyup", (ev)=>{if (ev.key === "Alt") isAlt.set(false); })
	
</script>

<style>
	.newfirmware:not(.sel) { border-bottom:2px solid green }
</style>

<svelte:body on:dobrynyahere={dobrynyaIsHere} on:dobrynyagone={dobrynyaGone} on:section={section}></svelte:body>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div id="is-online" class:online={isOnline} class:disconnect={!isConnected} class:bootloader={isBootloader} on:click={flipDisconnectNow}>{$deviceDefinition.model.name}</div>

<div id="maintabs" class:switching-allowed={sectionSwitchingAllowed}>
	{#each sections as sect}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div on:click="{()=>section(sect)}" class:sel={openSection==sect} class:newfirmware={hasNewFirmware==FirmwareState.Outdated && sect=='firmware'} class:disabled={!sectionSwitchingAllowed && sect != 'firmware'} id="show-{sect}">{sect[0].toUpperCase() + sect.substring(1)}</div>
	{/each}
</div>

<GotIt cookieName="consent">This app uses cookies to store its state. It doesn’t track you or do anything otherwise shady. By using this app, you agree with that. And yes, we hate the cookie prompts too.</GotIt>
<GotIt cookieName="beta">This is a beta version of both the Configutator and the device firmware. It may still have some rough edges! Your feedback is much appreciated, too, so if you have anything to say, please contact us. ❤️</GotIt>
	
<main>
	{#if openSection=="" && $deviceDefinition.isCorrect}
	<section id="tab-nodevice">
		<h1>Please connect a (single) MIDI Dobrynya.</h1>
		{#if (uaParserEngine.name == "Gecko")}
		{#if ($isMacLike)}
		<p>You may need to restart Firefox, too.</p>
		{:else}
		<p>You may need to reload the page, too.</p>
		{/if}
		{/if}
	</section>
	{/if}
	
	{#if !($deviceDefinition.isCorrect)}
	<section>
		<h1>This device has wrong factory settings. Please contact the <a href="https://mididobrynya.com/">support</a>.</h1>
	</section>
	{/if}

	<!-- {#if openSection=="editor"} -->
	{#if $patchList != undefined}
	
	<!-- NB settingsRawData[32] is a rather ugly solution to a necessity of sending device-level channel downward. If more settings will be needed to be acknowledged in the editor,
		I may do something else here, i.e. decode settings in Main, but for now I think there are more cons to this -->
	<SectionEditor bind:this={editor} on:section={section} isOnline={isOnline&&isConnected} deviceLevelVelocity={window.settings?.midi.vel.value ?? 0x7f} deviceLevelChannel={window.settings?.midi.channel.value ?? 0} on:section="{(ev)=>{console.log(ev.detail.section);openSection = ev.detail.section}}" {openSection} />
	{/if}
	<!-- {/if} -->
	{#if openSection=="patches"}
	<SectionPatches changeSection={section} {editor} on:section={section} patchesInfo={$patchList} isOnline={isOnline&&isConnected} />
	{/if}
	{#if openSection=="settings"}
	<SectionSettings on:section={section} isOnline={isOnline&&isConnected} />
	{/if}
	{#if openSection=="device"}
	<SectionDevice on:section={section} />
	{/if}
	{#if openSection=="firmware"}
	<SectionFirmware {isOnline} {isConnected} {flipDisconnectNow} bind:hasNewFirmware {updateVersionInfo} bind:isBootloader />
	{/if}
</main>

<NoPatches bind:this={alertNoPatches} />

	<p>
<!-- {#if $deviceDefinition.model.code}
<p><a href="https://config.mididobrynya.com/firmware/{getFullModelCode($deviceDefinition.model)}/latest/">Get the latest firmware</a>
</p>
{/if} -->
<div class="copyright" style="color:rgb(69 86 106);"><a style="color:inherit; border-color:rgba(69 86 106)" href="https://github.com/homeodor/DobrynyaConfigurator/">MIDI Dobrynya configurator</a> {pJson.version.split(".")[0]}.{pJson.version.split(".")[1]} build {pJson.version.split(".")[2]}. © Alexander Golovanov, MMXXI—{romanize(new Date().getFullYear())}.<br /><br />
<a href="https://www.mididobrynya.com/">mididobrynya.com</a>
</div>
<Alert bind:this={alertJsonLoadFailed}>
	<p>Failed loading template patch.</p>
</Alert>