<script lang="ts">
	import OkCancel from "./OkCancel.svelte";

	let {
		okText = "OK",
		cancelText = "Cancel",
		html = "",
		children,
	}: {
		okText?: string;
		cancelText?: string;
		html?: string;
		children: Function;
	} = $props();

	let dialog = $state<HTMLDialogElement>();
	let resolveFunction: Function;

	export function confirm(): Promise<boolean> {
		if (!dialog) {
			throw new Error("No dialog");
		}

		dialog.showModal();
		return new Promise((resolve, _) => (resolveFunction = resolve));
	}
</script>

<dialog bind:this={dialog} class="prompt-or-alert">
	<div>
		{@html html}{@render children()}
		<OkCancel
			theDialog={dialog}
			onok={() => resolveFunction(true)}
			oncancel={() => resolveFunction(false)}
			{okText}
			{cancelText}
		/>
	</div>
</dialog>
