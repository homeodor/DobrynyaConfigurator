<script lang="ts">
	import { deviceDefinition } from "device";

	const realChips = {
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

	import { importantFactorySettings } from "settings_utils";
	import imageMiniV2 from "../i/devices/miniv2.webp";
	import imageMicroV2Dark from "../i/devices/microv2_dark.webp";
	import imageMicroV2Light from "../i/devices/microv2_light.webp";
	import type { StatusResult } from "types";
	import Opensource from "./Opensource.svelte";
	import { CaseColour } from "device";

	let imageURL = imageMiniV2;

	// export let isOnline: boolean;

	let chipName = "";

	let showOpenSource = false;

	$: {
		if (realChips[$deviceDefinition.model.code]) {
			let chipObj =
				realChips[$deviceDefinition.model.code][
					$deviceDefinition.model.chip.code
				] ?? realChips[$deviceDefinition.model.code];
			chipName = `${chipObj.name} @ ${chipObj.mhz} MHz`;
		}

		let isDark =
			$importantFactorySettings.caseColour === CaseColour.Dark ||
			$importantFactorySettings.caseColour === CaseColour.Gray;

		if ($deviceDefinition) {
			switch ($deviceDefinition?.model?.code) {
				case "miniv2":
					imageURL = imageMiniV2;
					break;
				case "microv2":
					imageURL = isDark ? imageMicroV2Dark : imageMicroV2Light;
					break;
			}
		}
	}
</script>

<svelte:head>
	<link rel="preload" href={imageMiniV2} as="image" />
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
		<div>{$deviceDefinition.version}</div>
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

	{#if !showOpenSource}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<p>
			<span class="unreal" on:click={() => (showOpenSource = true)}
				>Open source code and assets used in Dobrynya’s codebase</span
			>
		</p>
	{:else}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<p>
			<span class="unreal" on:click={() => (showOpenSource = false)}
				>Close libraries list</span
			>
		</p>
		<Opensource />
	{/if}
</section>

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
