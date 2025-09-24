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

<!-- svelte-ignore a11y_mouse_events_have_key_events --><!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	role="button"
	tabindex="0"
	class={className}
	class:thecolour={isSameColour(hex, selectedHex)}
	style="background-color: {hexToCSS(hex)}"
	onclick={thisHex}
	onmouseover={thisHex}
></div>
