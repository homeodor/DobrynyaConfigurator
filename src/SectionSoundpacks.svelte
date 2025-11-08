<script lang="ts">
	import { extraContent } from "./ts/stores";
	import { getDownloadLink } from "./ts/download";

	async function downloadNow(file: string) {
		const url = await getDownloadLink(file);

		const a = document.createElement("a");
		a.href = url;
		a.click();
		a.remove();
	}
</script>

<div>
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
