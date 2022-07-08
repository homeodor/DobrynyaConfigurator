<script type="ts">
	import Halp from './widgets/Halp.svelte';
	import { Control } from './types';

	export let controlKind: Control;
	export let value: number = 0;
	
	let isDouble = controlKind == Control.EncRotate;
	
	let lowValue = 0;
	let highValue = 0;
	let prevValue = -1;
	
	let ed1: KeyboardEditor;
	let ed2: KeyboardEditor;
	
	export function update()
	{
		ed1?.update();
		ed2.update();
	}
	
	$:
	{
		if (prevValue != value)
		{
			lowValue = value & 0xffff;
			highValue = (value >> 16) & 0xffff;
			prevValue = value;
		} else {
			prevValue = value = isDouble ? (lowValue | (highValue << 16)) : lowValue;
		}
	}
	
	import KeyboardEditor from './KeyboardEditor.svelte'
</script>

<fieldset id="ce-keyboard">
	<legend>Keyboard
		<Halp>
			<p>Dobrynya can work as a normal (a.k.a “HID”) computer
				keyboard and even send combos!</p>
			<p>Press your combination in the box below or,
				for more exotic and system keys and combos,
				pick one from the dropdown.</p>
			<p>Note that your browser won’t allow entering
				most combinations from File menu, use
				a single key and press “Add modifier” manually.</p>
			<p>Though it makes absolutely no difference for 99% use cases,
				it should be noted that Dobrynya cannot emulate right-side
				modifier keys and always sends combos as if pressed with
				the left-side ones.</p>
		</Halp>
		
	</legend>
		<div class="ce-block controlparammode" id="cbm-keyboardedtor">
			{#if (isDouble)}
			<KeyboardEditor on:input header="Rotate +" bind:value={highValue} bind:this={ed1} />
			{/if}
			<KeyboardEditor on:input header={controlKind == Control.Pad ? "" : "Rotate –"} bind:value={lowValue} bind:this={ed2} />
		</div>
</fieldset>
