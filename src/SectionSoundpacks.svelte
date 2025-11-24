<script lang="ts">
	import { extraContent } from "./ts/stores";
	import { ExtraContentState, getDownloadLink } from "./ts/download";
	import Spinner from "./widgets/Spinner.svelte";
	import SpinnerDead from "./widgets/SpinnerDead.svelte";

	export let loadExtraContent: () => void;

	async function downloadNow(file: string) {
		const url = await getDownloadLink(file);

		const a = document.createElement("a");
		a.href = url;
		a.click();
		a.remove();
	}
</script>

<div>
	{#if $extraContent.state === ExtraContentState.Available}
		<h2>Sound packs</h2>
		{#each $extraContent.packs as pack}
			<a
				href="#packs"
				class="getpacks"
				on:click|preventDefault={() => downloadNow(pack.name)}
				>{pack.name}</a
			>
		{/each}
		<h2>Tutorials</h2>
		{#each $extraContent.videos as video}
			<div class="tutorial-video">
				<iframe
					title={video.name}
					src={`${video.url}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`}
					frameborder="0"
					allowfullscreen
				></iframe>
			</div>
		{/each}
	{:else if $extraContent.state === ExtraContentState.Unknown}
		<h2>Loading extra content...</h2>
		<p><Spinner /></p>
	{:else}
		<h2>Extra content not available</h2>
		<p><SpinnerDead /></p>
		{#if $extraContent.state === ExtraContentState.BackendError}
			<p>
				Downloading of the extra content has not been allowed by the
				server.
			</p>
		{:else if $extraContent.state === ExtraContentState.NetworkError}
			<p>
				Downloading of the extra content failed. Check your network
				connection.
			</p>
			<p>This issue may also occur when connected via a VPN service.</p>
		{/if}
		<p><button on:click={loadExtraContent}>Try again?</button></p>
	{/if}
</div>

<style>
	h2:not(:first-child) {
		margin-top: 2em;
	}

	.getpacks {
		font-size: 1.5rem;
	}

	.tutorial-video iframe {
		max-width: 50em;
		width: 80vw;
		aspect-ratio: 16/9;
	}
</style>
