<script lang="ts">	
	import { build, version } from 'version';
	
	import type { StatusResult, NoPatchesObject } from 'types'
	import { NewPatchDecision } from 'types'
	import { defaultStatusResult, isMinimumVersion, FirmwareState } from 'device'
	import { sysExAndDo, sysExFilenameAndDo, sysExDiskMode, flipConnected, sysExLockPatchSwitching, sysExBootloader } from 'midi_core'
	import { SysExStatus } from 'midi_utils';
	import { fixSettings, getSettingsFromDevice, getFactorySettings } from 'settings_utils'
	import { WaitingBlock } from 'waitingblock'
	import { isAlt } from 'stores';
	import { loadPatchInfo, fillPatchList, patchList } from 'patch';
	
	import GotIt from './widgets/GotIt.svelte';
	import NoPatches from './widgets/NoPatches.svelte';
		
	import SectionEditor from './SectionEditor.svelte'
	import SectionPatches from './SectionPatches.svelte'
	import SectionSettings from './SectionSettings.svelte'
	import SectionDevice from './SectionDevice.svelte'
	import SectionFirmware from './SectionFirmware.svelte'
	
	
	
	
	const sections: string[] = ['editor','patches','settings','firmware','device'];
	
	let device: StatusResult = defaultStatusResult(true);
	let isOnline: boolean = false;
	let isConnected: boolean = true;
	let isBootloader: boolean = false;
		
	let openSection = "";
	let sectionSwitchingAllowed = false;
	
	let patchesInfoHasBeenLoaded = false;
	
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
	
// 	async function loadPatchInfo()
// 	{
// 
// 		patchesInfoHasBeenLoaded = false;
// 		
// 		let recoverFromError = false;
// 		
// 		do
// 		{
// 			recoverFromError = false;
// 			
// 			for (let patch of patchesInfo)
// 			{
// 				try
// 				{
// 					if (patch.name == "__tmpupl.dbrpatch" || patch.name == "__tmpcpy.dbrpatch")
// 					{
// 						console.warn(`Cleaning up the mess: deleting ${patch.name}`);
// 						await sysExFilenameAndDo(SysExCommand.DELETEPATCH, patch.name, ()=>{});
// 						patchesInfo = patchesInfo.filter(v=>{return v.name != patch.name});
// 						recoverFromError = true;
// 						break;
// 					} else
// 						await sysExFilenameAndDo(SysExCommand.GETPATCHINFO, patch.name, (pinfo: BranchInfo /*, pname: string*/)=>patch.info = pinfo, 700);
// 				} catch(e) {
// 					if (e.status == SysExStatus.NO_ENTITY)
// 					{
// 						console.error(`File ${patch.name} failed miserably with unreachable data. Will try to recover...`);
// 						patchesInfo = patchesInfo.filter(v=>{return v.name != patch.name});
// 						recoverFromError = true;
// 						break;					
// 					} else throw e;
// 				}
// 			}
// 		} while (recoverFromError)
// 			
// 		patchesInfoHasBeenLoaded = true;
// 	}
	
	import type { VersionData } from 'device'
	import { getLatestVersion, versionCompare } from 'device'
	
	let versionInfo: VersionData;
	let hasNewFirmware = FirmwareState.Unknown;
	
	async function updateVersionInfo()
	{
		if (hasNewFirmware == FirmwareState.Obsolete) return; // do not set anything, it’s already clear it’s old as balls
		hasNewFirmware = FirmwareState.Checking;
		try {
			versionInfo = await getLatestVersion(device.model);
			hasNewFirmware = versionCompare(device.version, versionInfo) ? FirmwareState.Outdated : FirmwareState.UpToDate;
		} catch(e) {
			hasNewFirmware = FirmwareState.Unknown;
		}
	}
	
	let stuffHasBeenLoaded = false;
	
	async function dobrynyaIsHere(ev: CustomEvent)
	{
		isOnline = true;
		
		let previousSerial = device.serial;
			
		if ((ev as CustomEvent).detail) device = (ev as CustomEvent).detail;
			// there’s nothing bad in updating the details each time, because there might’ve been a firmware update or something
		
		if (!isMinimumVersion(device.version))
		{
			hasNewFirmware = FirmwareState.Obsolete;
			console.warn("Version is outdated!");
			openSection = "firmware";
			return;
		}
		
		fixSettings(device.model.settingsLength); // if settings need fixing, this will be done NOW
		
		if (previousSerial === device.serial && stuffHasBeenLoaded)
			return; // same device, no need to reload everything, assume no changes happened
		
		updateVersionInfo();
		getFactorySettings(); // yup
		sysExLockPatchSwitching(false); // the device might have locked patch switching, so unlock it
		
		await getSettingsFromDevice();
		
		while(true)
		{
			try
			{
				await fillPatchList();
				break;
			} catch(e) {
				if (e.status != SysExStatus.NO_FILE) throw(e);
				WaitingBlock.unblock();
				
				let noPatchesObject: NoPatchesObject = await alertNoPatches.confirm();
				
				if (noPatchesObject.decision == NewPatchDecision.DiskMode || noPatchesObject.decision == NewPatchDecision.Cancel) // cancel === "Disk mode" in this case 
				{
					if (noPatchesObject.decision == NewPatchDecision.DiskMode) sysExDiskMode();
					throw("No patches on this device");
				}
				
				await editor.createNew(
					noPatchesObject.decision,
					noPatchesObject.template
				);
				
				// export async function newPatch(
				// 	cleanSlate: boolean, 									// use an empty template for patch, or the current data?
				// 	patternFunction: Function | null,							// generate random pattern (or just shift hues)
				// 	uploadPatchName: string, 								// the filename
				// 	loadPatchAfter: boolean = true,							// load the patch afterwards?
				// 	uiSuccessHandler: Function = defaultNewPatchHandler,	// function that gives the user feedback on success
				// 	patchData: Patch | null = null							// the patch data. Null will make it clone the currentPatch
				// )
				
				// let filedata = BSON.serialize(await getDefaultPatch(device.model)); // Uint8Array
				// let maxDetalCode = device.model.name.replaceAll(" ","").replaceAll("#","Sharp");
				// await sysExFileAndDo(SysExCommand.WRITEPATCH, `MaxDetal${maxDetalCode}.dbrpatch`, filedata, ()=>{});				
				continue;
			}
		}
		
		stuffHasBeenLoaded = true;
		
		if (!sectionSwitchingAllowed)
		{
			sectionSwitchingAllowed = true;
			openSection = "editor";
		}
				
		editor.loadCurrentPatch();
		
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
		console.log("Dobrynya is gone");
	}
	
	function section(ev: CustomEvent | string)
	{
		if (!sectionSwitchingAllowed && !(typeof ev === "string" && ev === "firmware")) return;
		openSection = (typeof ev === "string") ? ev : ev.detail.section;
	}
	
	//@ts-ignore
	//	window.ms = markSaved;
		//@ts-ignore
		document.body.addEventListener("keydown", (ev)=>{if (ev.key === "Alt") isAlt.set(true); })
		document.body.addEventListener("keyup", (ev)=>{if (ev.key === "Alt") isAlt.set(false); })
	
	console.log({data: openSection});
	
</script>

<style>
	.newfirmware:not(.sel) { border-bottom:2px solid green }
</style>

<svelte:body on:dobrynyahere={dobrynyaIsHere} on:dobrynyagone={dobrynyaGone} on:section={section}></svelte:body>

<div id="is-online" class:online={isOnline} class:disconnect={!isConnected} class:bootloader={isBootloader} on:click={flipDisconnectNow}>{device.model.name}</div>

<div id="maintabs" class:switching-allowed={sectionSwitchingAllowed}>
	{#each sections as sect}
	<div on:click="{()=>section(sect)}" class:sel={openSection==sect} class:newfirmware={hasNewFirmware==FirmwareState.Outdated && sect=='firmware'} class:disabled={!sectionSwitchingAllowed && sect != 'firmware'} id="show-{sect}">{sect[0].toUpperCase() + sect.substring(1)}</div>
	{/each}
</div>

<GotIt cookieName="consent">This app uses cookies to store its state. It doesn’t track you or do anything otherwise shady. By using this app, you agree with that. And yes, we hate the cookie prompts too.</GotIt>
<GotIt cookieName="beta">This is a beta version of both the Configutator and the device firmware. It may still have some rough edges! Your feedback is much appreciated, too, so if you have anything to say, please contact us. ❤️</GotIt>
	
<main>
	{#if openSection=="" && device.isCorrect}
	<section id="tab-nodevice">
		<h1>Please connect a (single) MIDI Dobrynya.</h1>
	</section>
	{/if}
	
	{#if !(device.isCorrect)}
	<section>
		<h1>This device has wrong factory settings. Please contact the <a href="https://mididobrynya.com/">support</a>.</h1>
	</section>
	{/if}

	<!-- {#if openSection=="editor"} -->
	{#if $patchList != undefined}
	
	<!-- NB settingsRawData[32] is a rather ugly solution to a necessity of sending device-level channel downward. If more settings will be needed to be acknowledged in the editor,
		I may do something else here, i.e. decode settings in Main, but for now I think there are more cons to this -->
	<SectionEditor bind:this={editor} on:section={section} isOnline={isOnline&&isConnected} deviceLevelVelocity={window.settings?.midi.vel.value ?? 0x7f} deviceLevelChannel={window.settings?.midi.channel.value ?? 0} {device} on:section="{(ev)=>{console.log(ev.detail.section);openSection = ev.detail.section}}" {openSection} />
	{/if}
	<!-- {/if} -->
	{#if openSection=="patches"}
	<SectionPatches changeSection={section} {editor} {device} on:section={section} patchesInfo={$patchList} {patchesInfoHasBeenLoaded} isOnline={isOnline&&isConnected} />
	{/if}
	{#if openSection=="settings"}
	<SectionSettings on:section={section} isOnline={isOnline&&isConnected} {device} />
	{/if}
	{#if openSection=="device"}
	<SectionDevice on:section={section} {device} />
	{/if}
	{#if openSection=="firmware"}
	<SectionFirmware {device} {isOnline} {isConnected} {flipDisconnectNow} {hasNewFirmware} {updateVersionInfo} bind:isBootloader />
	{/if}
</main>

<NoPatches bind:this={alertNoPatches} device={device} />

	<p>
<!-- {#if device.model.code}
<p><a href="https://config.mididobrynya.com/firmware/{getFullModelCode(device.model)}/latest/">Get the latest firmware</a>
</p>
{/if} -->
<div class="copyright" style="color:rgb(69 86 106);"><a style="color:inherit; border-color:rgba(69 86 106)" href="https://github.com/homeodor/DobrynyaConfigurator/">MIDI Dobrynya configurator</a> {version} build {build}. © Alexander Golovanov, MMXXI—{romanize(new Date().getFullYear())}.<br /><br />
<a href="https://www.mididobrynya.com/">mididobrynya.com</a>
</div>
