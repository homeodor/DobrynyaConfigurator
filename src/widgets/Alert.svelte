<script lang="ts">
	import Ok from "./Ok.svelte";

	let {
		children,
		okText = "OK",
	}: {
		children: Function;
		okText?: string;
	} = $props();

	let dialog = $state<HTMLDialogElement>();
	let resolveFunction: Function;

	export function confirm() {
		if (!dialog) {
			throw new Error("No dialog in Alert.svelte");
		}

		dialog.showModal();
		return new Promise((resolve, _) => (resolveFunction = resolve));
	}
</script>

<dialog bind:this={dialog} class="prompt-or-alert">
	<div>
		{@render children?.()}
		<Ok theDialog={dialog} onok={() => resolveFunction(true)} {okText} />
	</div>
</dialog>
