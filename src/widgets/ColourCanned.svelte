<script lang="ts">
	import { hexToCSS, isSameColour } from "../ts/colour_utils";

	let {
		className = "",
		selectedHex = $bindable(),
		hex,
	}: {
		className?: string;
		selectedHex: number;
		hex: number;
	} = $props();

	function thisHex(ev: MouseEvent) {
		if (ev.type == "click" || ev.buttons & 0x1) {
			selectedHex = hex;
		}
	}
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events --><!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class={className}
	class:thecolour={isSameColour(hex, selectedHex)}
	style="background-color: {hexToCSS(hex)}"
	onclick={thisHex}
	onmouseover={thisHex}
></div>
