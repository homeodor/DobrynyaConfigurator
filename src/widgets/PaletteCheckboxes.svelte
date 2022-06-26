<script lang="ts">
	import { getPaletteCSS } from '../palettes'

	export let flags;
	export let oninput = () => {}
	export let disabled = false;
</script>
<div class="ce-block">
	<h4 class:disabled={disabled}>Palettes</h4>
	<div class="checkboxblock" style="display:inline-flex; align-items: left; flex-direction: column;">
		<label style="background-image: {getPaletteCSS(0)}" class="palettecheckbox"><input {disabled} type="checkbox" on:input={oninput} bind:checked={flags[0]}> <mark>Heat map</mark></label>
		<label style="background-image: {getPaletteCSS(1)}" class="palettecheckbox"><input {disabled} type="checkbox" on:input={oninput} bind:checked={flags[1]}> <mark>Forest</mark></label>
		<label style="background-image: {getPaletteCSS(2)}" class="palettecheckbox"><input {disabled} type="checkbox" on:input={oninput} bind:checked={flags[2]}> <mark>Ocean</mark></label>
		<label style="background-image: {getPaletteCSS(3)}" class="palettecheckbox"><input {disabled} type="checkbox" on:input={oninput} bind:checked={flags[3]}> <mark>Party</mark></label>
		<label style="background-image: {getPaletteCSS(4)}" class="palettecheckbox"><input {disabled} type="checkbox" on:input={oninput} bind:checked={flags[4]}> <mark>Custom 1</mark></label>
		<label style="background-image: {getPaletteCSS(5)}" class="palettecheckbox"><input {disabled} type="checkbox" on:input={oninput} bind:checked={flags[5]}> <mark>Custom 2</mark></label>
		<label style="background-image: {getPaletteCSS(6)}" class="palettecheckbox"><input {disabled} type="checkbox" on:input={oninput} bind:checked={flags[6]}> <mark>Custom 3</mark></label>
		<label style="background-image: {getPaletteCSS(7)}" class="palettecheckbox"><input {disabled} type="checkbox" on:input={oninput} bind:checked={flags[7]}> <mark>Custom 4</mark></label>
	</div>
</div>