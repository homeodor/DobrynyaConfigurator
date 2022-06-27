<script lang="ts">
	import type { BranchInfo, PatchInfoItem } from './types_patch';
	
	import { build, version } from './version';
	
	import type { StatusResult } from './types'
	import { defaultStatusResult } from './device'
	import { sysExAndDo, sysExFilenameAndDo, flipConnected } from './midi'
	import { SysExCommand, SysExStatus } from './midi_utils';
	
	import GotIt from './widgets/GotIt.svelte';
		
	import SectionEditor from './SectionEditor.svelte'
	import SectionPatches from './SectionPatches.svelte'
	import SectionSettings from './SectionSettings.svelte'
	import SectionDevice from './SectionDevice.svelte'
	
	const sections: string[] = ['editor','patches','settings','device'];
	
	let device: StatusResult = defaultStatusResult(true);
	let isOnline: boolean = false;
	let isConnected: boolean = true;
		
	let openSection = "";
	
	let settingsRawData: Uint8Array;
	let patchesInfoHasBeenLoaded = false;
	
	let editor: SectionEditor;
	
	let patchesInfo: PatchInfoItem[];
	
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
	
	async function loadPatchInfo()
	{

		patchesInfoHasBeenLoaded = false;
		
		let recoverFromError = false;
		
		do
		{
			recoverFromError = false;
			
			for (let patch of patchesInfo)
			{
				try
				{
					if (patch.name == "__tmpupl.dbrpatch" || patch.name == "__tmpcpy.dbrpatch")
					{
						console.warn(`Cleaning up the mess: deleting ${patch.name}`);
						await sysExFilenameAndDo(SysExCommand.DELETEPATCH, patch.name, ()=>{});
						patchesInfo = patchesInfo.filter(v=>{return v.name != patch.name});
						recoverFromError = true;
						break;
					} else
						await sysExFilenameAndDo(SysExCommand.GETPATCHINFO, patch.name, (pinfo: BranchInfo /*, pname: string*/)=>patch.info = pinfo, 700);
				} catch(e) {
					if (e.status == SysExStatus.NO_ENTITY)
					{
						console.error(`File ${patch.name} failed miserably with unreachable data. Will try to recover...`);
						patchesInfo = patchesInfo.filter(v=>{return v.name != patch.name});
						recoverFromError = true;
						break;					
					} else throw e;
				}
			}
		} while (recoverFromError)
			
		patchesInfoHasBeenLoaded = true;
	}
	
	import type { VersionData } from './device'
	import { getLatestVersion, versionCompare } from './device'
	
	let versionInfo: VersionData;
	let hasNewFirmware = null;
	
	async function updateVersionInfo()
	{
		versionInfo = await getLatestVersion(device.model);
		hasNewFirmware = versionCompare(device.version, versionInfo);
	}
	
	async function dobrynyaIsHere(ev: CustomEvent)
	{
		isOnline = true;
		
		if ((ev.detail as StatusResult).serial === device.serial)
			return; // same device, no need to reload everything, assume no changes happened
		
		if ((ev as CustomEvent).detail) device = (ev as CustomEvent).detail;
		
		updateVersionInfo();
		
		await sysExAndDo(SysExCommand.GETSETTINGS, (d: Uint8Array)=>settingsRawData=d);
		await sysExAndDo(SysExCommand.PATCHLIST,   (d: PatchInfoItem[])=>patchesInfo=d);
		
		console.log("So what???");
		
		if (openSection == "") openSection = "editor";
				
		editor.loadCurrentPatch();
		
		loadPatchInfo();
	}
	
	function flipDisconnectNow()
	{
		isConnected = flipConnected();
	}
	
	function dobrynyaGone()
	{
		isOnline = false;
		console.log("Dobrynya is gone");
	}
	
	function section(ev: CustomEvent | string)
	{
		if (!openSection) return;
		openSection = (typeof ev === "string") ? ev : ev.detail.section;
	}

	
</script>

<style>

</style>

<svelte:body on:dobrynyahere={dobrynyaIsHere} on:dobrynyagone={dobrynyaGone} on:section={section}></svelte:body>

<div id="is-online" class:online={isOnline} class:disconnect={!isConnected} on:click={flipDisconnectNow}>{device.model.name}</div>

<div id="maintabs" style="">
	{#each sections as sect}
	<div on:click="{()=>section(sect)}" class:sel={openSection==sect} id="show-config">{sect[0].toUpperCase() + sect.substring(1)}</div>
	{/each}
</div>

<GotIt cookieName="consent">This app uses cookies to store its state. It doesn’t track you or do anything otherwise shady. By using this app, you agree with that. And yes, we hate the cookie prompts too.</GotIt>
	
<main>
	{#if openSection==""}
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
	{#if patchesInfo}
	<!-- NB settingsRawData[32] is a rather ugly solution to a necessity of sending device-level channel downward. If more settings will be needed to be acknowledged in the editor,
		I may do something else here, i.e. decode settings in Main, but for now I think there are more cons to this -->
	<SectionEditor bind:this={editor} on:section={section} bind:patchesInfo isOnline={isOnline&&isConnected} deviceLevelVelocity={settingsRawData?.[36]} deviceLevelChannel={settingsRawData?.[32]} {device} on:section="{(ev)=>{console.log(ev.detail.section);openSection = ev.detail.section}}" {openSection} />
	{/if}
	<!-- {/if} -->
	{#if openSection=="patches"}
	<SectionPatches changeSection={section} {editor} {device} on:section={section} bind:patchesInfo {patchesInfoHasBeenLoaded} isOnline={isOnline&&isConnected} />
	{/if}
	{#if openSection=="settings"}
	<SectionSettings on:section={section} isOnline={isOnline&&isConnected} {device} {settingsRawData} />
	{/if}
	{#if openSection=="device"}
	<SectionDevice on:section={section} {device} {hasNewFirmware} />
	{/if}	
</main>

<div class="copyright" style="color:rgba(65, 75, 87);"><a style="color:inherit; border-color:rgba(65,75,87)" href="https://github.com/homeodor/DobrynyaConfigurator/">MIDI Dobrynya configurator</a> {version} build {build}. © Alexander Golovanov, MMXXI—{romanize(new Date().getFullYear())}.<br />
</div>