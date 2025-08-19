<script lang="ts">
	import { EncoderBehaviour } from "../ts/types";
	import EncoderShadowCC from "./EncoderShadowCC.svelte";
	import { quickCustom } from "../ts/event_helpers";

	export let scaleIsOn: boolean;

    export let cc: number;
    export let min: number;
    export let max: number;
    export let par: number;
    export let encmode: EncoderBehaviour;

	let encoderIsScale = false;
	let encoderIsTempo = false;
	let encoderIsScaleOrTempo = false;

	function openBankSettings() {
		quickCustom("drawer", { drawer: "banksettings" });
	}

	$: {
		encoderIsScale =
			encmode >= EncoderBehaviour.ScaleKey &&
			encmode <= EncoderBehaviour.ScaleKind;
		encoderIsTempo = encmode === EncoderBehaviour.InternalTempo;
		encoderIsScaleOrTempo = encoderIsScale || encoderIsTempo;
	}
</script>

<fieldset id="ce-options">
	<legend>Behaviour</legend>
	<div>
		<select on:input bind:value={encmode}>
			<optgroup label="Control Change">
				<option value={EncoderBehaviour.Absolute}
					>Absolute (normal)</option
				>
				<option value={EncoderBehaviour.Relative64Zero}
					>Relative, 64 is zero</option
				>
				<option value={EncoderBehaviour.Relative2Comp}
					>Relative, 2’s comp</option
				>
				<option value={EncoderBehaviour.RelativeSigned}
					>Relative, signed</option
				>
			</optgroup>
			<optgroup
				label="Change scale"
				disabled={!scaleIsOn && !encoderIsScale}
			>
				<option value={EncoderBehaviour.ScaleKey}>Key</option>
				<option value={EncoderBehaviour.ScaleOctave}>Octave</option>
				<option value={EncoderBehaviour.ScaleOffset}>Offset</option>
				<option value={EncoderBehaviour.ScaleKind}>Kind</option>
			</optgroup>
			<!-- <optgroup label="Tempo">
                    <option value={EncoderBehaviour.InternalTempo}>Internal tempo</option>
                </optgroup> -->
		</select>
		{#if !scaleIsOn && encoderIsScale}
			<p class="warn explain" style="padding:0">
				This encoder is set to change scale parameters, but no scale is
				set.
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				You can change the scale in
				<span class="unreal" on:click={openBankSettings}
					>bank settings</span
				>.
			</p>
		{:else if !encoderIsScale}
			<p class="explain">
				Encoder can be used to change scale parameters on the fly. You
				can set the scale in
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<span class="unreal" on:click={openBankSettings}
					>bank settings</span
				>.
			</p>
		{/if}
	</div>
	<EncoderShadowCC
		bind:cc
		bind:min
		bind:max
		bind:par
		{encoderIsScaleOrTempo}
		encoderIsTempo={encmode === EncoderBehaviour.InternalTempo}
	/>
</fieldset>
