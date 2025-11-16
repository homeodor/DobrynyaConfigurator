<script lang="ts">
	import pJson from "../package.json";

	import { UAParser } from "ua-parser-js";

	import type { NoPatchesObject, StatusResult } from "./ts/types";
	import { NewPatchDecision } from "./ts/types";
	import {
		isMinimumVersion,
		FirmwareState,
		setDevice,
		deviceDefinition,
		getDevice,
	} from "./ts/device";
	import {
		sysExDiskMode,
		flipConnected,
		sysExLockPatchSwitching,
		sysExBootloader,
		MidiResultException,
	} from "./ts/midi_core";
	import { Status } from "./ts/configurator";
	import {
		fixSettings,
		getSettingsFromDevice,
		getPalettesFromDevice,
		getFactorySettings,
	} from "./ts/settings_utils";
	import { WaitingBlock } from "./ts/waitingblock";
	import { extraContent, isAlt, isMacLike } from "./ts/stores";
	import {
		loadPatchInfo,
		fillPatchList,
		patchList,
		loadCurrentPatch,
		newPatch,
	} from "./ts/patch.svelte";
	import { randomPattern } from "./ts/colour_utils.svelte";

	import GotIt from "./widgets/GotIt.svelte";
	import NoPatches from "./widgets/NoPatches.svelte";
	import Alert from "./widgets/Alert.svelte";

	import SectionEditor from "./SectionEditor.svelte";
	import SectionSettings from "./SectionSettings.svelte";
	import SectionDevice from "./SectionDevice.svelte";
	import SectionFirmware from "./SectionFirmware.svelte";

	function hidAvailable() {
		return (
			navigator.hid !== undefined &&
			$deviceDefinition &&
			$deviceDefinition?.model?.canHid
		);
	}

	function signatureAvailable() {
		return false;
	}

	const sections: string[] = [
		"editor",
		"settings",
		...(hidAvailable() ? ["firmware"] : []),
		...(signatureAvailable() ? ["soundpacks"] : []),
		"content",
		"device",
	];

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

	function romanize(num: number) {
		if (isNaN(num)) {
			return NaN;
		}

		let i = 3;
		let digits = String(+num).split("");
		const key = [
			"",
			"C",
			"CC",
			"CCC",
			"CD",
			"D",
			"DC",
			"DCC",
			"DCCC",
			"CM",
			"",
			"X",
			"XX",
			"XXX",
			"XL",
			"L",
			"LX",
			"LXX",
			"LXXX",
			"XC",
			"",
			"I",
			"II",
			"III",
			"IV",
			"V",
			"VI",
			"VII",
			"VIII",
			"IX",
		];
		let roman = "";

		while (i--) roman = (key[+digits.pop()! + i * 10] || "") + roman;

		return Array(+digits.join("") + 1).join("M") + roman;
	}

	import { getLatestVersion, versionCompare } from "./ts/device";
	import CornerDevice from "./widgets/CornerDevice.svelte";
	import SectionSoundbanks from "./SectionSoundpacks.svelte";
	import {
		checkSigning,
		getContentList,
		getUpdates,
		type UpdatesInfo,
	} from "./ts/download";

	let versionInfo: UpdatesInfo;
	let hasNewFirmware = FirmwareState.Unknown;
	let latestFw: string | null = null;

	let uaParserEngine = new UAParser().getEngine();

	async function updateVersionInfo() {
		latestFw = null;

		if (hasNewFirmware == FirmwareState.Obsolete) {
			return; // do not set anything, it’s already clear it’s old as balls
		}

		hasNewFirmware = FirmwareState.Checking;
		try {
			versionInfo = await getUpdates();
			latestFw = versionInfo.latest.version;
			hasNewFirmware = versionCompare(
				$deviceDefinition.version,
				versionInfo.latest.version
			)
				? FirmwareState.Outdated
				: FirmwareState.UpToDate;
		} catch (e) {
			hasNewFirmware = FirmwareState.Unknown;
		}
	}

	let stuffHasBeenLoaded = false;

	async function dobrynyaIsHere(ev: CustomEvent<StatusResult | undefined>) {
		isOnline = true;

		let previousSerial = $deviceDefinition.serial;

		if ((ev as CustomEvent).detail)
		{
			setDevice((ev as CustomEvent).detail);
			// there’s nothing bad in updating the details each time, because there might’ve been a firmware update or something
		}

		if (!isMinimumVersion($deviceDefinition.version)) {
			hasNewFirmware = FirmwareState.Obsolete;
			console.warn("Version is outdated!");
			openSection = "firmware";
			return;
		}

		fixSettings($deviceDefinition.model.settingsLength!); // if settings need fixing, this will be done NOW

		if (previousSerial === $deviceDefinition.serial && stuffHasBeenLoaded)
			return; // same device, no need to reload everything, assume no changes happened

		await updateVersionInfo();
		await getFactorySettings(); // yup

		if ($deviceDefinition.model.testSignResult) {
			$deviceDefinition.supportsSigning = await checkSigning();
			$extraContent = await getContentList();
		}
		sysExLockPatchSwitching(false); // the device might have locked patch switching, so unlock it

		await getSettingsFromDevice();

		try {
			await getPalettesFromDevice();
		} catch (ex) {
			console.warn("Getting palettes is not implemented");
			if ((ex as MidiResultException).status != Status.NOT_IMPLEMENTED) {
				throw ex;
			}
		}

		while (true) {
			try {
				await fillPatchList();
				break;
			} catch (e) {
				console.log(e);
				if ((e as MidiResultException).status != Status.NO_FILE) {
					throw e;
				}
				WaitingBlock.unblock();

				let noPatchesObject: NoPatchesObject =
					await alertNoPatches.confirm();

				if (
					noPatchesObject.decision == NewPatchDecision.DiskMode ||
					noPatchesObject.decision == NewPatchDecision.Cancel
				) {
					// cancel === "Disk mode" in this case
					if (noPatchesObject.decision == NewPatchDecision.DiskMode)
						sysExDiskMode();
					throw "No patches on this device";
				}

				if (noPatchesObject.decision == NewPatchDecision.Template) {
					// Block?
					try {
						let patchData = await fetch(
							`defaultpatches/${$deviceDefinition.model.code}-${noPatchesObject.template}.json`
						);
						let patchJson = await patchData.json();

						await newPatch(
							false, // not a clean slate
							null, // shift hue
							noPatchesObject.filename,
							true, // load patch afterwards
							() => {}, // default handler
							patchJson
						);
					} catch (e) {
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
						() => {}
					);
				}

				continue;
			}
		}

		stuffHasBeenLoaded = true;

		if (!sectionSwitchingAllowed) {
			sectionSwitchingAllowed = true;
			openSection = "editor";
		}

		loadCurrentPatch();

		loadPatchInfo();
	}

	function flipDisconnectNow(ev: MouseEvent) {
		if (ev.altKey) sysExBootloader(!ev.shiftKey);
		isConnected = flipConnected();
	}

	function dobrynyaGone() {
		isOnline = false;
		console.debug("Dobrynya is gone");
	}

	function section(ev: CustomEvent<string> | string) {
		if (
			!sectionSwitchingAllowed &&
			!(typeof ev === "string" && ev === "firmware")
		)
			return;
		openSection = typeof ev === "string" ? ev : ev.detail;
	}

	document.body.addEventListener("keydown", ev => {
		if (ev.key === "Alt") isAlt.set(true);
	});
	document.body.addEventListener("keyup", ev => {
		if (ev.key === "Alt") isAlt.set(false);
	});
</script>

<svelte:body
	ondobrynyahere={dobrynyaIsHere}
	ondobrynyagone={dobrynyaGone}
	onsection={section}
/>

<CornerDevice {isBootloader} {isConnected} {isOnline} {flipDisconnectNow} />

<div id="maintabs" class:switching-allowed={sectionSwitchingAllowed}>
	{#each sections as sect}
		{#if (sect != "content" || $deviceDefinition.supportsSigning) && (sect != "firmware" || $deviceDefinition.model.canHid)}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div
			role="button"
			tabindex="0"
			on:click={() => section(sect)}
			class:sel={openSection == sect}
			class:newfirmware={hasNewFirmware == FirmwareState.Outdated &&
					((sect == "firmware" && $deviceDefinition.model.canHid) ||
						(sect == "device" && !$deviceDefinition.model.canHid))}
			class:disabled={!sectionSwitchingAllowed && sect != "firmware"}
			id="show-{sect}"
		>
			{sect[0].toUpperCase() + sect.substring(1)}
		</div>
		{/if}
	{/each}
</div>

<GotIt cookieName="consent"
	>This app uses cookies to store its state. It doesn’t track you or do
	anything otherwise shady. By using this app, you agree with that. And yes,
	we hate the cookie prompts too.</GotIt
>
<GotIt cookieName="beta"
	>This is a beta version of both the Configutator and the device firmware. It
	may still have some rough edges! Your feedback is much appreciated, too, so
	if you have anything to say, please contact us. ❤️</GotIt
>

<main>
	{#if openSection == "" && $deviceDefinition.isCorrect}
		<section id="tab-nodevice">
			<h1>Please connect a (single) MIDI Dobrynya.</h1>
			{#if uaParserEngine.name == "Gecko"}
				{#if $isMacLike}
					<p>You may need to restart Firefox, too.</p>
				{:else}
					<p>You may need to reload the page, too.</p>
				{/if}
			{/if}
		</section>
	{/if}

	{#if !$deviceDefinition.isCorrect}
		<section>
			<h1>
				This device has wrong factory settings. Please contact the <a
					href="https://mididobrynya.com/">support</a
				>.
			</h1>
		</section>
	{/if}

	<!-- {#if openSection=="editor"} -->
	{#if $patchList != undefined}
		<!-- NB settingsRawData[32] is a rather ugly solution to a necessity of sending device-level channel downward. If more settings will be needed to be acknowledged in the editor,
		I may do something else here, i.e. decode settings in Main, but for now I think there are more cons to this -->
		<SectionEditor
			bind:this={editor}
			onSection={section}
			isOnline={isOnline && isConnected}
			deviceLevelVelocity={window.settings?.midi.items.vel.value ?? 0x7f}
			deviceLevelChannel={window.settings?.midi.items.channel.value ?? 0}
			{openSection}
		/>
	{/if}
	<!-- {/if} -->
	<!-- {#if openSection == "patches"}

	{/if} -->
	{#if openSection == "settings"}
		<SectionSettings
			on:section={section}
			isOnline={isOnline && isConnected}
		/>
	{/if}
	{#if openSection == "device"}
		<SectionDevice on:section={section} {hasNewFirmware} {latestFw} />
	{/if}
	{#if openSection == "content" && $deviceDefinition.supportsSigning}
		<SectionSoundbanks />
	{/if}
	{#if openSection == "firmware"}
		<SectionFirmware
			{isOnline}
			{isConnected}
			{flipDisconnectNow}
			bind:hasNewFirmware
			{updateVersionInfo}
			bind:isBootloader
		/>
	{/if}
</main>

<NoPatches bind:this={alertNoPatches} />

<p>
	<!-- {#if $deviceDefinition.model.code}
<p><a href="https://dobrynyadev.kt8.ru/firmware/{getFullModelCode($deviceDefinition.model)}/latest/">Get the latest firmware</a>
</p>
{/if} -->
</p>
<div class="copyright" style="color:rgb(69 86 106);">
	<a
		style="color:inherit; border-color:rgba(69 86 106)"
		href="https://github.com/homeodor/DobrynyaConfigurator/"
		>MIDI Dobrynya configurator</a
	>
	{pJson.version.split(".")[0]}.{pJson.version.split(".")[1]} build {pJson.version.split(
		"."
	)[2]}. © Alexander Golovanov, MMXXI—{romanize(
		new Date().getFullYear()
	)}.<br /><br />
	<a href="https://www.mididobrynya.com/">mididobrynya.com</a>
</div>
<Alert bind:this={alertJsonLoadFailed}>
	<p>Failed loading template patch.</p>
</Alert>

<style>
	/* geologica-latin-wght-normal */
	@font-face {
		font-family: "Geologica Variable";
		font-style: normal;
		font-display: swap;
		font-weight: 100 900;
		src: url(/geologica.ttf) format("truetype-variations");
	}

	.newfirmware:not(.sel) {
		border-bottom: 2px solid green;
	}
</style>
