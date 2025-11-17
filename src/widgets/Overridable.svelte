<script lang="ts">
	import overridable from "../../i/overridable.svg";
	import override from "../../i/override.svg";

	let { isGlobal = false, title = "" } = $props();

	let titleNow = $derived(
		title ??
			(isGlobal
				? "This setting can be overriden"
				: "Overrides a higher-level setting")
	);

	let src = $derived(isGlobal ? overridable : override);
</script>

<img
	alt="(Overridable)"
	{src}
	class="override override-small"
	title={titleNow}
/>
