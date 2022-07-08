 <script lang="ts">
	const realChips = 
	{
		microv2: 
		{
			'17': { name: "ATSAMD21G17", mhz: 48 },
			'18': { name: "ATSAMD21G18", mhz: 48 },
		},
		miniv2: 
		{
			'17': { name: "ATSAMD21G17", mhz: 48 },
			'18': { name: "ATSAMD21G18", mhz: 48 },
		},
		l32:   { name: "ATSAMD21J18", mhz: 48 },
		prov2: { name: "ATSAME53J20", mhz: 72 },
	};

	import { getFullModelCode } from './device';
	import miniV2 from '../i/miniv2.webp'
	import type { StatusResult } from './types'
	import Opensource from "./Opensource.svelte";
	
	export let device: StatusResult;

	// export let isOnline: boolean;
	
	let chipName = "ATSAMD";
	
	let showOpenSource = false;
	
	$: {
		if (realChips[device.model.code])
		{
			let chipObj = realChips[device.model.code][device.model.chipCode] ?? realChips[device.model.code];
			chipName = `${chipObj.name} @ ${chipObj.mhz} MHz`;
		}
		console.log(device);
	}
</script>
<style>
	#tab-info h1 { text-transform: uppercase; letter-spacing: 0.4em; font-size:2.5rem; }
	#modelimage { min-height: 400px; height: 50vh}
	#infoholder { display:inline-grid; width:60%; grid-template-columns: auto auto; font-size:1.2rem; grid-template-columns: 3.8fr 5fr; }
	#infoholder > * { margin:0.5em; padding:0em }
	#infoholder > div { text-align: left; }
	#infoholder > h4 { text-align: right; }
</style>
<svelte:head>
	<link rel="preload" href={miniV2} as="image" />
</svelte:head>
<section id="tab-info">


	<h1 id="info-modelname">Midi Dobrynya</h1>
	<img src="{miniV2}" id="modelimage" alt="Dobrynya" />
	<br />
	<div id="infoholder">
		<h4>Model</h4>
		<div>
			{#if device.model.webpage}
			<a href="{device.model.webpage}">{device.model.name}</a>
			{:else}
			{device.model.name}
			{/if}</div>
		<h4>Revision</h4>
		<div>Rev. {device.revision}</div>
		<h4>Firmware</h4>
		<div>{device.version}</div>
		<h4>Serial No.</h4>
		<div>{device.serial}</div>
		<h4>Processor</h4>
		<div>{chipName}</div>
	</div>
	

	
	{#if !showOpenSource}
	<p><span class="unreal" on:click={()=>showOpenSource=true}>Open source code used in Dobrynya’s firmware</span></p>
	{:else}
	<p><span class="unreal" on:click={()=>showOpenSource=false}>Close libraries list</span></p>
	<Opensource />
	{/if}
	
</section>