<script lang="ts">
	import { deviceDefinition } from "../ts/device";
	import type { BranchBank } from "../ts/types_patch";
	let {
		padBanks,
		currentBank,
		selectBank,
	}: {
		padBanks: BranchBank[][];
		currentBank: number;
		selectBank: Function;
	} = $props();

	const bankCount = [0, 1, 2, 3];
</script>

<div class="bankselector donotcloseeditor">
	<div class="bsw-holder">
		<!-- 					<p class="b">Banks</p> -->
		<ul class="bankswitcher" id="bsw-left">
			{#each bankCount as bank}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<li
					class:bsw-empty={!padBanks[0][bank]?.pads?.length}
					class:sel={currentBank == bank}
					on:click={() => selectBank(bank)}
				>
					{bank + 1}
				</li>
			{/each}
		</ul>
		{#if $deviceDefinition.model.code != "pocket"}
			<ul class="bankswitcher" id="bsw-shift">
				{#each bankCount as bank}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<li
						class:bsw-empty={!padBanks[0][bank + bankCount.length]
							?.pads?.length}
						class:sel={currentBank == bank + bankCount.length}
						on:click={() => selectBank(bank + bankCount.length)}
					>
						-{bank + 1}
					</li>
				{/each}
			</ul>
		{/if}
		<!-- <ul class="bankswitcher hh" id="bsw-right">
				<li>1</li>
				<li>2</li>
				<li>3</li>
				<li>4</li>
			</ul> -->
	</div>
</div>
