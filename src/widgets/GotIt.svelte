<script lang="ts">
	import Cookies from "js-cookie";
	import { onMount } from "svelte";

	const isElectron =
		navigator.userAgent.toLowerCase().indexOf(" electron/") > -1;
	const storage = window.localStorage;

	let { cookieName, children }: { cookieName: string; children: Function } =
		$props();

	let value = $state("");

	function set() {
		if (isElectron) {
			storage.setItem(cookieName, "true");
			value = storage.getItem(cookieName) ?? "";
			console.log(value);
		} else {
			Cookies.set(cookieName, "ok", { expires: 3650 });
			value = Cookies.get(cookieName) ?? "";
		}
	}

	onMount(() => {
		if (isElectron) {
			value = storage.getItem(cookieName) ?? "";
		} else {
			value = Cookies.get(cookieName) ?? "";
		}
	});
</script>

{#if value !== "ok"}
	<div class="up">
		<div>
			<div>{@render children?.()}</div>
			<div><button onclick={set}>Got it</button></div>
		</div>
	</div>
{/if}

<style>
	div.up,
	div.up > div {
		display: flex;
	}
	div.up > div {
		gap: 1em;
		max-width: 70vh;
		margin: 1em;
		padding: 1em;
		border-radius: 0.4rem;
		border: 1px solid var(--accent-colour);
		line-height: 1.7em;
		align-items: center;
	}
	button {
		white-space: nowrap;
	}
	div.up {
		justify-content: center;
		width: 100%;
	}
	div.up > div > :first-child {
		flex-grow: 1;
	}
</style>
