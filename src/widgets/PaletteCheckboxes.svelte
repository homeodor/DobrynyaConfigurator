<script lang="ts">
	import { getPaletteCSS } from 'palettes'
	import Halp from './Halp.svelte';
	
	export let flags: boolean[];
	export let oninput = () => {}
	export let disabled = false;
</script>
<div class="ce-block">
	<h4 class:disabled={disabled}>Palettes <Halp>
		<p>Palettes consist of 16 colours each. They are used for waiting mode animations and bursts.</p>
		<p>Dobrynya has four built-in palettes, and four more can be added by you! Just create a 24-bit* BMP image
			in your favourite image editor with a width of 16 pixels and a height of 1, draw your colours, name it “paletteX.bmp”, where
			X is a number from 1 to 4, and put it into the root of Dobrynya’s memory by going into the Disk mode 
			(the <i>Patches</i> tab has a button to go to this mode).</p>
		<p>* If you have zero clue what “24-bit” means, don’t worry, your BMP file is probably 24 bits by default.</p>
		<p>Palettes are kind of ever repeating, so if your want your animations to be seamless, the first and the last colours should
			be of closer tints.</p>
		<p>Google “cpt-city” for a great source of gradients!</p>
	</Halp></h4>
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