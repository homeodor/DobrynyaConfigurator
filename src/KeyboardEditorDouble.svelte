<script lang="ts">
	import Halp from "./widgets/Halp.svelte";
	import KeyboardEditor from "./KeyboardEditor.svelte";
	import {
		KeyboardAvailable,
		type ControlDefinition,
	} from "./ts/control_defs";
	import { settings } from "./ts/settings_utils";

	let {
		theControl,
		value = $bindable<number>(),
		onValueChange,
	}: {
		theControl: ControlDefinition;
		value: number;
		onValueChange: () => void;
	} = $props();

	let ed1 = $state<KeyboardEditor>();
	let ed2 = $state<KeyboardEditor>();

	export function update() {
		ed1?.update();
		ed2?.update();
	}

	let lowValue = $state(value & 0xffff);
	let highValue = $state((value >>> 16) & 0xffff);

	$effect(() => {
		const l = value & 0xffff;
		const h = (value >>> 16) & 0xffff;

		if (l !== lowValue) {
			lowValue = l;
		}
		if (h !== highValue) {
			highValue = h;
		}
	});

	$effect(() => {
		const next =
			theControl.keyboard === KeyboardAvailable.double
				? (lowValue & 0xffff) | ((highValue & 0xffff) << 16)
				: lowValue & 0xffff;

		if (next !== value) {
			value = next;
		}
	});
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
		{#if settings.input.items.flags.flag![0]}
			<p class="explain">
				Keyboard has been disabled in settings. This will have no
				effect.
			</p>
		{/if}
		<div class="ce-block controlparammode" id="cbm-keyboardedtor">
			{#if theControl.keyboard === KeyboardAvailable.double}
				<KeyboardEditor
					{onValueChange}
					header="Rotate +"
					bind:value={highValue}
					bind:this={ed1}
				/>
			{/if}
			<KeyboardEditor
				{onValueChange}
				header={theControl.keyboard !== KeyboardAvailable.double
					? ""
					: "Rotate –"}
				bind:value={lowValue}
				bind:this={ed2}
			/>
		</div>
	</fieldset>
{/if}
