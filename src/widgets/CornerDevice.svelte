<script lang="ts">
	import { deviceDefinition } from "src/ts/device";
	import { batteryInfo } from "src/ts/stores";
	import { BatteryStatus } from "src/ts/types";
	import batteryNormal from "../../i/battery_normal.svg";
	import batteryCharged from "../../i/battery_charged.svg";
	import batteryCharging from "../../i/battery_charging.svg";

	export let isOnline: boolean;
	export let isConnected: boolean;
	export let isBootloader: boolean;
	export let flipDisconnectNow: (ev: MouseEvent) => void;
</script>

<div class="cornerdevice">
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		class="is-online"
		class:online={isOnline}
		class:disconnect={!isConnected}
		class:bootloader={isBootloader}
		on:click={flipDisconnectNow}
	>
		{$deviceDefinition.model.name}
	</div>

	{#if $batteryInfo.status !== BatteryStatus.noBattery && $batteryInfo.status !== BatteryStatus.unknown}
		<div class="battery">
			{#if $batteryInfo.status === BatteryStatus.charging}
				<img src={batteryCharging} alt="Charging" />
			{:else if $batteryInfo.status === BatteryStatus.charged}
				<img src={batteryCharged} alt="Charged" />
			{:else}
				<img src={batteryNormal} alt="Normal" />
			{/if}
			{$batteryInfo.percent}%
		</div>
	{/if}
</div>

<style>
	.cornerdevice {
		position: absolute;
		right: 1em;
		top: 1em;
		font-size: 80%;
		display: flex;
	}

    .cornerdevice > div {
        padding: 0.5em;
    }

	.bootloader {
		background-color: #a3a831;
	}

	.is-online {
		background-color: #782c2c;
		border-radius: 1em;
		cursor: pointer;
	}

	.online {
		background-color: #00c151;
	}

	.disconnect {
		background-color: #7c7c7c;
	}

	.battery img {
		height: 1.2em;
	}
</style>
