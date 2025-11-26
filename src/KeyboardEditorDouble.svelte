<script type="ts">
	import Halp from "./widgets/Halp.svelte";
	import KeyboardEditor from "./KeyboardEditor.svelte";
	import {
		KeyboardAvailable,
		type ControlDefinition,
	} from "./ts/control_defs";
	import { settings } from "./ts/settings_utils";

	export let theControl: ControlDefinition;
	export let value: number = 0;

	let lowValue = 0;
	let highValue = 0;
	let prevValue = -1;

	let ed1: KeyboardEditor;
	let ed2: KeyboardEditor;

	export function update() {
		ed1?.update();
		ed2?.update();
	}

	$: {
		if (prevValue != value) {
			lowValue = value & 0xffff;
			highValue = (value >> 16) & 0xffff;
			prevValue = value;
		} else {
			prevValue = value =
				theControl.keyboard == KeyboardAvailable.double
					? lowValue | (highValue << 16)
					: lowValue;
		}
	}
</script>

{#if theControl.keyboard != KeyboardAvailable.no}
	<fieldset id="ce-keyboard">
		<legend
			>Keyboard
			<Halp>
				<p>
					Dobrynya can work as a normal (a.k.a “HID”) computer
					keyboard and even send combos!
				</p>
				<p>
					Press your combination in the box below or, for more exotic
					and system keys and combos, pick one from the dropdown.
				</p>
				<p>
					Note that your browser won’t allow entering most
					combinations from File menu, use a single key and press “Add
					modifier” manually.
				</p>
				<p>
					Though it makes absolutely no difference for 99% use cases,
					it should be noted that Dobrynya cannot emulate right-side
					modifier keys and always sends combos as if pressed with the
					left-side ones.
				</p>
			</Halp>
		</legend>
		<!-- TODO: fix all the fucking type error -->
		{#if $settings.input.flags.flag[0]}
			<p class="explain">
				Keyboard has been disabled in settings. This will have no
				effect.
			</p>
		{/if}
		<div class="ce-block controlparammode" id="cbm-keyboardedtor">
			{#if theControl.keyboard == KeyboardAvailable.double}
				<KeyboardEditor
					on:input
					header="Rotate +"
					bind:value={highValue}
					bind:this={ed1}
				/>
			{/if}
			<KeyboardEditor
				on:input
				header={theControl.keyboard != KeyboardAvailable.double
					? ""
					: "Rotate –"}
				bind:value={lowValue}
				bind:this={ed2}
			/>
		</div>
	</fieldset>
{/if}
