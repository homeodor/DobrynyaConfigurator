<script lang="ts">
	let {
		channelDefault = -1,
		channelDefaultName = "",
		value = $bindable(-1),
		disabled = false,
		channelDefaultValue = -1,
		optionAll = false,
		oninput = () => {},
		onchange = () => {},
	}: {
		channelDefault?: number;
		channelDefaultName?: string;
		value?: number;
		disabled?: boolean;
		channelDefaultValue?: number;
		optionAll?: boolean;
		oninput?: () => void;
		onchange?: () => void;
	} = $props();

	let channelsForList = $state<number[]>([]);

	for (let i = 0; i < 16; i++) {
		channelsForList.push(i);
	}
</script>

<select
	{disabled}
	size="1"
	id="cbm-channel"
	class="channel-selector"
	{oninput}
	{onchange}
	bind:value
>
	{#if channelDefaultName}
		<option value={channelDefaultValue}
			>{channelDefaultName}{#if channelDefault != -1}&nbsp;({channelDefault +
					1}){/if}</option
		>
	{/if}
	{#each channelsForList as ch}
		<option value={ch}>Channel {ch + 1}</option>
	{/each}
	{#if optionAll}
		<option value={16}>All channels</option>
	{/if}
</select>
