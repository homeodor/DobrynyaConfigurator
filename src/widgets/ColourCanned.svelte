<script lang="ts">
	import { HexColour } from "src/ts/hexcolour";

	export let className: string = "";
	export let selectedHex = HexColour.off();
	export let fixedHex = HexColour.off();

	function thisHex(ev: MouseEvent) {
		if (ev.type == "click" || ev.buttons & 0x1)
			selectedHex = new HexColour(fixedHex);
	}
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events --><!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class={className}
	class:thecolour={fixedHex.isSame(selectedHex)}
	style="background-color: {fixedHex.toCSS()}"
	on:click={thisHex}
	on:mouseover={thisHex}
></div>
