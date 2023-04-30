<script lang="ts">
	import type { StatusResult } from 'types';
	import { getLatestVersion, getFullModelCode, FirmwareState, versionCompare, deviceDefinition } from 'device'
	import { onMount, onDestroy } from 'svelte'
	import { requestDevice, hidFillData, exitBootloader, dumpFirmware } from 'hid'
	import { sysExBootloader } from 'midi_core';
	import { isAlt } from 'stores';
	import * as fl from 'flasher'
	
	import dbrswitching from '../i/dbrswitching.svg'
	import dbrbootloader from '../i/dbrbootloader.svg'
	import dbroffline from '../i/dbroffline.svg'
	import dbrnormal from '../i/dbrnormal.svg'
	
	export let isOnline: boolean;
	export let isConnected: boolean;
	export let flipDisconnectNow: Function;
	export let hasNewFirmware: FirmwareState;
	export let updateVersionInfo: Function;
	export let isBootloader: boolean;
	
	// @ts-ignore
	const hid = navigator.hid;
	
	let hidSearchTimeout = null;
	let hidList = hid?.getDevices();
	
	let probablySwitching = true;
	let doesNotShowUpTips = false;
	
	let bootloader = null;
	let remoteResponse = null;
	
	let dragOverClass = false;
	
	let uploadFWAnyway = false;
//	let newerBLAvailable = false;
	let newerFWAvailable = false;
	
	function hidAvailable()
	{
		return hid !== undefined && $deviceDefinition && $deviceDefinition?.model?.canHid;
	}
	
	async function getVersions()
	{
		console.log(bootloader, remoteResponse);
		remoteResponse = await getLatestVersion(bootloader.deviceID);
		console.log(bootloader, remoteResponse);
		if (!remoteResponse) return;
		
		uploadFWAnyway = false;
		progress = 0;
		maxProgress = 0;
//		newerBLAvailable = versionCompareRaw(bootloader.blVersion.split("."), remoteResponse.bootloader.version.split("."));
		newerFWAvailable = versionCompare(bootloader.fwVersion, remoteResponse);		
	}
	
	async function updateHidList()
	{
		hidList = await hid.getDevices();
		// console.log(hidList);
	}
	
	async function getBootloaderData()
	{
		let firstRequest = bootloader == null;
		bootloader = await hidFillData(hidList[0]);

		if (bootloader && firstRequest)
		{
			console.trace(bootloader);
			fl.getAllUF2s(bootloader.deviceID);
			// console.log(bootloader);
			await getVersions();
		}
	}
	
	let plashkagood = false;
	let plashkawarn = false;
	let plashkabad = false;
	
	let firmwareState = "";
	let bootloaderState = "";
	
	let uf2IsCustom = false;
	
	let progress = 0;
	let maxProgress = 0;
	
	function updateProgress(p: number)  { progress = p; }
	function updateMaxProgress(mp: number) { maxProgress = mp; }
	
	function updateFirmwareDataStatus()
	{
		plashkagood = fl.allDownloaded();
		plashkawarn = fl.shouldWarn();
		plashkabad = fl.anyErrors();
		
		bootloaderState = fl.textState(fl.getBootloaderDataState());
		firmwareState = fl.textState(fl.getFirmwareDataState());
		
		uf2IsCustom = fl.getFirmwareDataState() == fl.UF2State.Custom;
	}
	
	async function burnBootloaderUi()
	{
		probablySwitching = true;
		let result = await fl.burnFirmware();
		
		if (result)
			hasNewFirmware = FirmwareState.UpToDate;
	}
	
	onMount(()=>
	{
		if (hidAvailable()) setInterval(updateHidList, 500);
		probablySwitching = false;
		fl.setUiUpdate(updateFirmwareDataStatus, updateProgress, updateMaxProgress);
		
	});
	
	onDestroy(()=>clearTimeout(hidSearchTimeout));
	
	let dbrHidIsHere: boolean = false;
	
	$:{
		dbrHidIsHere = (hidAvailable() && hidList.length > 0);
		
		if (isOnline)
		{
			bootloader = null;
		}
		
		if (dbrHidIsHere && !bootloader) getBootloaderData();
		
		if (bootloader && maxProgress > 0 && progress >= maxProgress)
		{
			bootloader = null;
		}
		
		isBootloader = (bootloader !== null);
	}
</script>

<style>
	.modemanifest { width:45%; display:inline-block; line-height:1.6em }
	.modemanifest p { margin-bottom: 1.3em; }
	.dbrstate { width:4rem; height:4rem; }
	
	.fuckingtable { display:inline-table; text-align:left }
	.fuckingtable td, .fuckingtable th { padding:0.4em; text-align:left; }
	.fuckingtable td.code { font-family: monospace;}
	
	.over { background-color:var(--accent-colour) }
	
	ol { display:inline-block; }
	li { text-align:left }
	
	progress {
	  /* Reset the default appearance */
	  -webkit-appearance: none;
	   appearance: none;
	
		width:50%;
		height:0.8rem;

	}
	
	progress[value]::-webkit-progress-bar {
		background:white;
	 border-radius:0.4rem;
	 box-shadow: inset 2px 2px 2px #eee, 
	 inset -2px -2px 2px #eee;
	}
	
	progress::-webkit-progress-value
	{
		border-radius:0.4rem;
		background: var(--accent-gradient);  box-shadow: inset 0.4rem 0.4rem 0.4rem #009ca9, 
			inset -0.4rem -0.4rem 0.4rem #00d2e5;
	}
</style>



{#if !isOnline}
{#if hidAvailable()}
	{#if bootloader}
		<fieldset class="modemanifest" class:over={dragOverClass} on:drop="{(ev)=>{dragOverClass=false;fl.customUF2(ev)}}" on:dragover|stopPropagation|preventDefault="{()=>{}}" on:dragenter="{_=>dragOverClass=true}" on:dragleave="{_=>dragOverClass=false}">
			
			<p><img src="{dbrbootloader}" alt="Bootloader mode" class="dbrstate" on:click="{(e)=>dumpFirmware(e)}" /></p>
			<p>Your Dobrynya is in bootloader mode.</p>
			
			<div id="fw-updateavailable" class="plashka" class:plashkagood class:plashkawarn class:plashkabad style="min-width:80%">
				<p>Latest binaries:</p>
				<table class="fuckingtable">
					<tr>
						<td>Bootloader</td>
						<td>{@html bootloaderState}</td>
					</tr>
					<tr>
						<td>Firmware</td>
						<td>{@html firmwareState}</td>
					</tr>
				</table>

			</div>
			
			<fieldset>
				<legend>Versions</legend>
				{#if uf2IsCustom}
				<div class="plashka plashkawarn">
					<p>You have added a custom firmware file. If the file is wrong (i.e. designed for another device or variant),
						it will potentially brick your device, destroy your data, awake a malevolent ancient artificial intelligence
						and/or do other bad things.</p>
					<p><button on:click="{()=>{fl.resetUF2data();fl.getAllUF2s(bootloader.deviceID)}}">Reset to stock firmware</button></p>
				</div>
				<br />
				{:else}
					{#if remoteResponse}
						{#if newerFWAvailable}
						<p>There is a new version of firmware!</p>
						<table class="fuckingtable" style="margin-bottom:1em">
							<tr>
								<td>Your bootloader</td>
								<td>v{bootloader.blVersion}</td>
							</tr>
							<tr>
								<td>Your firmware</td>
								<td>v{bootloader.fwVersion.split("-")[0]}</td>
							</tr>
							<tr>
								<td>Latest version</td>
								<td>v{remoteResponse.fullVersion}</td>
							</tr>
						</table><br />
						{:else}
						<p>Your firmware version ({bootloader.fwVersion}) is up to date.
							<span on:click="{()=>uploadFWAnyway=!uploadFWAnyway}" class="unreal">{#if uploadFWAnyway}Okay, fine.{:else}Upload anyway{/if}</span>
						</p>
						{/if}
					{:else}
					<table class="fuckingtable" style="margin-bottom:1em">
							<tr>
								<td>Your bootloader</td>
								<td>v{bootloader.blVersion}</td>
							</tr>
							<tr>
								<td>Your firmware</td>
								<td>v{bootloader.fwVersion.split("-")[0]}</td>
							</tr>
						</table><br />
					{/if}
				{/if}
			
				{#if newerFWAvailable || uploadFWAnyway || uf2IsCustom}
				<button on:click={burnBootloaderUi} disabled={maxProgress > 0}>{#if newerFWAvailable && !uf2IsCustom}Update{:else}Upload{/if}{#if uf2IsCustom}&nbsp;custom{/if} firmware</button>
				<p class="explain" style="padding:0; margin-bottom:0">All of your other data will stay intact.</p>
				{/if}
			</fieldset>
			<!--<fieldset>
			<legend>Bootloader</legend>
				{#if remoteResponse}
					{#if newerBLAvailable}
					<p>There is a new version of bootloader. You have to update it first before updating the firmware.</p>
					<!-- <table class="fuckingtable">
						<tr>
							<td>Your version</td>
							<td>{bootloader.blVersion}</td>
						</tr>
						<tr>
							<td>Latest version</td>
							<td>{remoteResponse.bootloader.version}</td>
						</tr>
					</table>
					</table><br />
					{:else}
					<p>Your bootloader version ({bootloader.blVersion}) is up to date. 
						<span on:click="{()=>uploadBLAnyway=!uploadBLAnyway}" class="unreal">{#if uploadBLAnyway}Okay, fine.{:else}Upload anyway{/if}</span></p>
					{/if}
				{:else}
				<p>Fetching...</p>
				{/if}
			
				{#if newerBLAvailable || uploadBLAnyway}
				<button on:click="{()=>{probablySwitching = true;fl.burnBootloader()}}" disabled={maxProgress > 0}>{#if newerBLAvailable}Update{:else}Upload{/if} bootloader</button>
				<p class="explain warn" style="padding:0; margin-bottom:0">Your firmware will be erased, but you can upload it afterwards.
					All of your other data will stay intact.</p>
				{/if}
			</fieldset> -->
			{#if maxProgress}
				<p>Uploading to the device...</p>
				<progress max={maxProgress} value={progress}></progress>
			{:else}	
				<p id=""><button class="hidewhileuploading" id="exit-bootloader" on:click="{()=>{probablySwitching = true;fl.resetUF2data(); exitBootloader()}}">Exit bootloader</button></p>
			{/if}
			<!-- </div> -->
		</fieldset>
	{:else}
		<fieldset class="modemanifest">
			{#if probablySwitching}
			<p class="offline-switching"><img alt="Switching" src="{dbrswitching}" class="dbrstate" /></p>
			<p class="offline-switching">Your Dobrynya is switching modes.</p>
			{:else}
			<p class="offline-offline"><img alt="Offline" src="{dbroffline}" class="dbrstate" /></p>
			<p class="offline-offline">Your Dobrynya is offline (or switching modes).</p>
			{/if}
			<p>If the device is showing green light (and your OS has installed all the drivers), it is ready to connect.</p>
			<p>If you are connecting for the first time, you need to grant access for your browser:</p>
			<p><button on:click={requestDevice}>Get HID access</button></p>
			<p>This is needed once only. The browser will remember this next time.</p>
			<p>If Dobrynya is showing red light for more than 10 seconds or is otherwise unresponsive, or your OS is displaying an error,
				unplug and plug it again and try going into bootloader mode once more.</p>
			{#if !doesNotShowUpTips}
			<p><span class="unreal" on:click="{()=>doesNotShowUpTips=true}">Dobrynya doesn’t show up?</span></p>
			{:else}
			<div id="dobrynyafails">
				<p>If Dobrynya doesn’t boot up normally, try putting it into the bootloader mode manually.</p>
				<p><b>Mini V2</b><!-- <b>and Pro V2</b>-->: plug the cable of your device while holding down encoders 2 and 4.</p>
				<p><b>Micro V2</b>: plug the cable of your device while holding down encoders 1 and 3.</p>
				<!-- <p><b>All devices with batteries</b>: if the battery is charged, press “Reset” instead of plugging the cable.</p> -->
			</div>
			{/if}
		</fieldset>
	{/if}
{:else}
	{#if $deviceDefinition.model.code}
	<fieldset class="modemanifest " id="sect-bootloader">
		<p class="offline-switching"><img alt="Switching" src="{dbrbootloader}" class="dbrstate" /></p>
		{#if probablySwitching}
		<p class="offline-switching">Your Dobrynya has switched into bootloader mode.</p>
		{:else}

		<p class="offline-offline">Your Dobrynya is offline (or in bootloader mode).</p>
		{/if}
		<p>If the device is showing green light (and your OS has installed all the drivers), it is likely ready for firmware uploading.
			A virtual drive called DBR_BOOT should appear on your system.</p>
		<ol>
			<li><a href="https://config.mididobrynya.com/firmware/{getFullModelCode($deviceDefinition.model)}/latest/">Download the latest firmware</a></li>
			<li>Copy it to the drive called <code>DBR_BOOT</code></li>
			<li>Your OS might complain about improper disk removal. It’s okay.</li>
			<li>Your device reboots and has a new shiny firmware! Congrats!</li>
		</ol>
		
		<p>If Dobrynya is showing red light for more than 10 seconds or is otherwise unresponsive, or your OS is displaying an error,
		or no virtual drive appears, unplug and plug it again and try going into bootloader mode once more.</p>
		{#if !doesNotShowUpTips}
		<p><span class="unreal" on:click="{()=>doesNotShowUpTips=true}">Dobrynya doesn’t show up?</span></p>
		{:else}
		<div id="dobrynyafails">
		<p>
			If Dobrynya doesn’t boot up normally, try putting it into the bootloader mode manually.
			{#if $deviceDefinition?.model?.code === "miniv2" || $deviceDefinition?.model?.code === "prov2"}Replug the cable of your device while holding down encoders 2 and 4.{/if}
			{#if $deviceDefinition?.model?.code === "microv2"}Replug the cable of your device while holding down encoders 1 and 3{/if}
		</p>
		</div>
		{/if}
	</fieldset>
{:else}
	<fieldset class="modemanifest " id="sect-bootloader">
		<p class="offline-switching"><img alt="Switching" src="{dbroffline}" class="dbrstate" /></p>
		<p>Your device is not connected.</p>
		<p>If your device won’t start up normally, try re-uploading the firmware to it.</p>
		<h2>Manually put it into bootloader mode</h2>
		<p><b>Mini V2</b><!-- <b>and Pro V2</b>-->: plug the cable of your device while holding down encoders 2 and 4.</p>
		<p><b>Micro V2</b>: plug the cable of your device while holding down encoders 1 and 3.</p>
		<p>If the device is showing green light (and your OS has installed all the drivers), it is likely ready for firmware uploading.
			A virtual drive called DBR_BOOT should appear on your system.</p>			
		<p>If Dobrynya is showing red light for more than 10 seconds or is otherwise unresponsive, or your OS is displaying an error,
		or no virtual drive appears, unplug and plug it again and try going into bootloader mode once more.</p>
		<h2>Get your firmware</h2>
		<p>Go to your virtual drive and open <code>INFO_UF2.TXT</code>. Download the correct firmware for your <code>Board-ID:</code></p>
		<table style="" class="fuckingtable">
			<tr>
				<th>Board-id</th>
				<th>Model</th>
				<th>Serial no.</th>
				<th></th>
			</tr>
			
			<tr>
				<td class="code">SAMD21G17A-dbr-microv2-17</td>
				<td>Micro V2</td>
				<td>2106...</td>
				<td><a href="https://config.mididobrynya.com/firmware/microv2-17/latest/">Download</a></td>
			</tr>
			<tr>
				<td class="code">SAMD21G17A-dbr-miniv2-17</td>
				<td>Mini V2</td>
				<td>3106...</td>
				<td><a href="https://config.mididobrynya.com/firmware/miniv2-17/latest/">Download</a></td>
			</tr>
			<tr>
				<td class="code">SAMD21G18A-dbr-miniv2-18</td>
				<td>Mini V2</td>
				<td>3105...</td>
				<td><a href="https://config.mididobrynya.com/firmware/miniv2-18/latest/">Download</a></td>
			</tr>
		</table>
		<h2>Copy the firmware to the drive</h2>
		<p>Then just copy the firmware to the virtual drive. Your OS might complain about the disk being incorrectly disconnected: that’s okay.</p>
	</fieldset>
{/if}
{/if}
{/if}


{#if isOnline && isConnected}

{#if hasNewFirmware == FirmwareState.Obsolete}
<div id="fw-oldfw" class="plashka plashkabad">Your MIDI Dobrynya has an old version of firmware and cannot be used with this configurator.
	Fear not: it is easy to update!</div>
{:else}
	{#if hasNewFirmware == FirmwareState.Outdated}
	<div id="fw-updateavailable" class="plashka plashkagood">Good news! A new version of firmware is available for your device!</div>
	{:else if hasNewFirmware == FirmwareState.UpToDate}
	<div id="fw-updateavailable" class="plashka plashkagood">Your firmware is up to date.</div>
	{:else if hasNewFirmware == FirmwareState.Unknown}
	<div id="fw-noupdates" class="plashka plashkawarn">Cannot check if a new version is available. <span class="unreal" on:click="{()=>updateVersionInfo()}">Check again</span>?</div>
	{:else}
	<div id="fw-noupdates" class="plashka plashkawarn">Checking for updates...</div>
	{/if}
{/if}

<br />

<fieldset class="modemanifest">
	<p><img src="{dbrnormal}" alt="Normal operation" class="dbrstate" /></p>
	<p>Your Dobrynya is in normal mode.
		Uploading the firmware is easy: just restart in bootloader mode and follow
		the instructions!</p>
	<div id="version-local"></div>
	<div class="version-remote"></div>
	<div class="fw-oldfw plashka plashkafw plashkawarn hh">Your MIDI Dobrynya has an old version of firmware, which has to be updated
		to be used with the configurator.</div>
	<div class="fw-updateavailablecl plashka plashkafw plashkagood hh">A new version of firmware is available for your device!</div>
	<div class="fw-noupdates plashka plashkafw plashkagood hh">Your firmware is up to date!</div>
	<p><button id="restart-bootloader" on:click="{(ev)=>{probablySwitching = true; sysExBootloader(!hidAvailable() || ev.altKey);}}">
	{#if $isAlt}
		Bootloader with virual disk
	{:else}
		Restart in bootloader mode
	{/if}
	</button></p>
	{#if $deviceDefinition.model.code}
	<p class="explain">Alternatively, you can <a href="https://config.mididobrynya.com/firmware/{getFullModelCode($deviceDefinition.model)}/latest/">download the firmware file</a> manually.</p>
	{/if}
</fieldset>
{/if}

{#if !isConnected}
<fieldset class="modemanifest">
	<p><img src="{dbrnormal}" alt="" class="dbrstate" style="filter: saturate(30%)" /></p>
	<p>Your Dobrynya is disconnected.</p>
	<p id=""><button on:click={flipDisconnectNow}>Reconnect</button></p>
</fieldset>
{/if}