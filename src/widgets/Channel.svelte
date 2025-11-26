<script lang="ts">
	export let channelDefault: number = -1;
	export let channelDefaultName: string = "";
	export let value: number = -1;
	export let disabled: boolean = false;
	export let channelDefaultValue: number = -1;
	export let optionAll: boolean = false;
	
	let channelsForList = [];
	
	for (let i=0; i<16; i++) channelsForList.push(i);
</script>

<select {disabled} size="1" id="cbm-channel" class="channel-selector" on:input on:change bind:value>
	{#if channelDefaultName}
	<option value={channelDefaultValue}>{channelDefaultName}{#if channelDefault != -1}&nbsp;({channelDefault+1}){/if}</option>
	{/if}
	{#each channelsForList as ch}
	<option value={ch}>Channel {ch+1}</option>
	{/each}
	{#if optionAll}
	<option value={16}>All channels</option>
	{/if}
</select>