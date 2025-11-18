<script lang="ts">
	import { deviceDefinition, FirmwareState } from "./ts/device";

	let {
		hasNewFirmware,
		latestFw,
	}: { hasNewFirmware: FirmwareState; latestFw: string | null } = $props();

	interface ChipDefinition {
		name: string;
		mhz: number;
	}

	const realChips: Record<
		string,
		Record<string, ChipDefinition> | ChipDefinition
	> = {
		microv2: {
			"17": { name: "ATSAMD21G17", mhz: 48 },
			"18": { name: "ATSAMD21G18", mhz: 48 },
		},
		miniv2: {
			"17": { name: "ATSAMD21G17", mhz: 48 },
			"18": { name: "ATSAMD21G18", mhz: 48 },
		},
		l32: { name: "ATSAMD21J18", mhz: 48 },
		prov2: { name: "ATSAME53J20", mhz: 72 },
		pocket: { name: "ESP32-S3", mhz: 240 },
	};

	import { importantFactorySettings } from "./ts/settings.svelte";
	import imageMiniV2 from "../i/devices/miniv2.webp";
	import imagePocket from "../i/devices/pocket.webp";
	import imageMicroV2Dark from "../i/devices/microv2_dark.webp";
	import imageMicroV2Light from "../i/devices/microv2_light.webp";
	import Opensource from "./Opensource.svelte";
	import { CaseColour } from "./ts/device";
	import { sysExAndDo, sysExStorageMode } from "./ts/midi_core";
	import Halp from "./widgets/Halp.svelte";
	import { getFirmwareBlob } from "./ts/download";
	import { Command } from "./ts/configurator";
	import { getChecksumCalculator, selectChecksum } from "./ts/checksum";
	import { eightToSeven } from "./ts/midi_utils";
	import { isAlt } from "./ts/stores";
	import Confirm from "./widgets/Confirm.svelte";
	import Alert from "./widgets/Alert.svelte";

	let showOpenSource = $state(false);

	let uploadConfirm = $state<Confirm>();
	let storageConfirm = $state<Confirm>();
	let alertFirmwareDownloadFailed = $state<Alert>();

	function optimizeBuildNumber(version: string) {
		const cleanVersion = version.split("/");
		const parts = cleanVersion[0].split(".");
		parts[2] =
			parts[2] === "L" || parts[2] === "Local"
				? parts[2]
				: parseInt(parts[2]).toString();
		return parts.join(".") + "/" + cleanVersion[1];
	}

	async function updateFirmwareEsp32() {
		if (!uploadConfirm) {
			throw new Error("No storage Confirm in SectionDevice.svelte");
		}

		if (!(await uploadConfirm.confirm())) {
			return;
		}

		const firmwareBlob = await getFirmwareBlob();

		if (!firmwareBlob) {
			if (alertFirmwareDownloadFailed) {
				await alertFirmwareDownloadFailed.confirm();
			}
			return;
		}

		const buffer = await firmwareBlob.arrayBuffer();
		const array = new Uint8Array(buffer);
		const checksum = getChecksumCalculator(selectChecksum());
		sysExAndDo(
			Command.UPLOADFIRMWARE,
			() => {},
			15 * 60 * 1000,
			eightToSeven(array, checksum),
			checksum
		);
	}

	async function store() {
		if (!storageConfirm) {
			throw new Error("No storage Confirm in SectionDevice.svelte");
		}

		if (!(await storageConfirm.confirm())) {
			return;
		}

		sysExStorageMode();
	}

	let chipName = $derived.by(() => {
		if (
			$deviceDefinition.model.code &&
			realChips[$deviceDefinition.model.code]
		) {
			const modelCode = $deviceDefinition.model.code;
			const chipCode = $deviceDefinition.model.chip?.code;
			let chipObj: ChipDefinition | null = null;

			if (
				chipCode &&
				(realChips[modelCode] as Record<string, ChipDefinition>)[
					chipCode.toString()
				]
			) {
				chipObj = (
					realChips[modelCode] as Record<string, ChipDefinition>
				)[chipCode.toString()];
			} else if (realChips[modelCode]) {
				chipObj = realChips[modelCode] as ChipDefinition;
			}

			return chipObj ? `${chipObj.name} @ ${chipObj.mhz} MHz` : "";
		}
	});

	let imageURL = $derived.by(() => {
		let isDark =
			$importantFactorySettings.caseColour === CaseColour.Dark ||
			$importantFactorySettings.caseColour === CaseColour.Gray;

		if ($deviceDefinition) {
			switch ($deviceDefinition?.model?.code) {
				case "miniv2":
					return imageMiniV2;
				case "microv2":
					return isDark ? imageMicroV2Dark : imageMicroV2Light;
				case "pocket":
					return imagePocket;
			}
		}
	});
</script>

<svelte:head>
	<link rel="preload" href={imageMiniV2} as="image" />
	<link rel="preload" href={imagePocket} as="image" />
	<link rel="preload" href={imageMicroV2Dark} as="image" />
	<link rel="preload" href={imageMicroV2Light} as="image" />
</svelte:head>
<section id="tab-info">
	<h1 id="info-modelname">Midi Dobrynya</h1>
	<img src={imageURL} id="modelimage" alt="Dobrynya" />
	<br />
	<div id="infoholder">
		<h4>Model</h4>
		<div>
			{#if $deviceDefinition.model.webpage}
				<a href={$deviceDefinition.model.webpage}
					>{$deviceDefinition.model.name}</a
				>
			{:else}
				{$deviceDefinition.model.name}
			{/if}
		</div>
		<h4>Revision</h4>
		<div>Rev. {$deviceDefinition.revision}</div>
		<h4>Firmware</h4>
		<div>
			{optimizeBuildNumber($deviceDefinition.version)}
			{#if latestFw == $deviceDefinition.version}
				(latest)
			{/if}
		</div>
		{#if latestFw && latestFw != $deviceDefinition.version}
			<h4>Latest firmware</h4>
			<div>{optimizeBuildNumber(latestFw)}</div>
		{/if}
		{#if (hasNewFirmware == FirmwareState.Outdated || hasNewFirmware == FirmwareState.Obsolete || $isAlt) && !$deviceDefinition.model.canHid}
			<h4 style="color: transparent">Placeholder</h4>
			<div>
				<button onclick={updateFirmwareEsp32}>
					{#if latestFw && latestFw != $deviceDefinition.version}
						Update firmware
					{:else}
						Upload firmware
					{/if}
				</button>
			</div>
		{/if}
		<h4>Serial No.</h4>
		<div>{$deviceDefinition.serial}</div>
		{#if $importantFactorySettings.boardRevision}
			<h4>Board</h4>
			<div>{$importantFactorySettings.boardRevision}</div>
		{/if}
		{#if $importantFactorySettings.batteryCapacity}
			<h4>Battery</h4>
			<div>{$importantFactorySettings.batteryCapacity} mAh</div>
		{/if}
		<h4>Processor</h4>
		<div>{chipName}</div>
	</div>

	{#if $importantFactorySettings.batteryCapacity}
		<h3>Extra</h3>
		<div>
			<button onclick={store}>Storage mode</button>
		</div>
	{/if}

	{#if !showOpenSource}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<p>
			<span
				class="unreal"
				role="link"
				tabindex="0"
				onclick={() => (showOpenSource = true)}
				>Open source code and assets used in Dobrynya’s codebase</span
			>
		</p>
	{:else}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<p>
			<span
				role="button"
				tabindex="0"
				class="unreal"
				onclick={() => (showOpenSource = false)}
				>Close libraries list</span
			>
		</p>
		<Opensource />
	{/if}
</section>

<Confirm bind:this={uploadConfirm} okText="Upload">
	<p>
		This will update Dobrynya to version {optimizeBuildNumber(latestFw!)}.
	</p>
	<p>This will take a while. Do not unplug Dobrynya.</p>
</Confirm>
<Confirm bind:this={storageConfirm} okText="Storage mode">
	<p>
		This will set the charger chip into storage mode. It is designed to
		extend its battery life when Dobrynya is stored away or shipped.
	</p>
	<p>
		Once you unplug USB, Dobrynya will power off and switch off its battery
		completely. It can then only be powered on by plugging USB again{#if $importantFactorySettings.boardRevision && $importantFactorySettings.boardRevision != "5.0"}
			or pressing Reset{/if}.
	</p>
</Confirm>
<Alert bind:this={alertFirmwareDownloadFailed}>
	<p>Cannot download the firmware.</p>
	<p>
		Please check your connection. Some VPN services are known to block
		firmware downloading.
	</p>
</Alert>

<style>
	#tab-info h1 {
		text-transform: uppercase;
		letter-spacing: 0.4em;
		font-size: 2.5rem;
	}
	#modelimage {
		min-height: 400px;
		height: 50vh;
	}
	#infoholder {
		display: inline-grid;
		width: 60%;
		grid-template-columns: auto auto;
		font-size: 1.2rem;
		grid-template-columns: 3.8fr 5fr;
	}
	#infoholder > * {
		margin: 0.5em;
		padding: 0em;
	}
	#infoholder > div {
		text-align: left;
	}
	#infoholder > h4 {
		text-align: right;
	}
</style>
