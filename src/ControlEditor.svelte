<svelte:options accessors={true} />

<script lang="ts">
	import { tick, onDestroy } from "svelte";
	import { controls } from "./ts/control_defs";
	import type { ControlDefinition } from "./ts/control_defs";
	import {
		fakeNoteOff,
		fakeNoteUseScale,
		paramOff,
		paramOffNegative,
		getNoteInCurrentScale,
		MidiCtrl,
	} from "./ts/midi_utils";
	import { colourOff } from "./ts/colour_utils";
	import { Hand, Control, EncoderBehaviour } from "./ts/types";
	import type { DeviceOrBankValue, HexColour } from "./ts/types";
	import type { Patch, BranchControl } from "./ts/types_patch";
	import { createPadsIfAbsent } from "./ts/data_utils";
	import {
		ExpanderSanizer,
		expandData,
		sanizeData,
	} from "./ts/data_expandsanize";
	import { dispatchEditorClose } from "./ts/event_helpers";
	import { patchChanged } from "./ts/event_helpers";
	import type { CurrentEditorState } from "./ts/patch";
	import NoteEditor from "./NoteEditor.svelte";
	import MidiControl from "./editor/MidiControl.svelte";
	import ColourWellsEditor from "./ColourWellsEditor.svelte";
	import KeyboardEditor from "./KeyboardEditorDouble.svelte";
	import Halp from "./widgets/Halp.svelte";
	import Channel from "./widgets/Channel.svelte";
	import Overridable from "./widgets/Overridable.svelte";
	import Tick from "./widgets/Tick.svelte";
	import { burstIsOn } from "./ts/bursts";
	import BurstsDialog from "./editor/BurstsDialog.svelte";
	import EncoderParameters from "./editor/EncoderParameters.svelte";
	import { sysExCalibrateAccel } from "./ts/midi_core";
	import { assertDefined } from "./ts/basic";

	//	export let hand: Hand = Hand.None; // !!!!!!! Hand should be an enum, too

	let {
		currentPatch,
		controlKind,
		controlNumber,
		editorState,
		globalChannel,
		globalColours,
		globalVelocity,
		scaleIsOn,
	}: {
		currentPatch: Patch;
		controlKind: Control;
		controlNumber: number;
		editorState: CurrentEditorState;
		globalChannel: DeviceOrBankValue;
		globalColours: HexColour[];
		globalVelocity: DeviceOrBankValue;
		scaleIsOn: boolean;
	} = $props();

	let patchCanChange = $state(false);

	// let prevControlKind: Control = Control.Generic;
	// let prevControlNumber: number = -1;
	// let prevHand: Hand = Hand.NONE;
	// let prevBank: number = -1;

	let theControl = $derived.by<ControlDefinition>(() => {
		const kind = controlKind;

		const result = controls.find(v => {
			return v.control == kind;
		});

		if (result === undefined) {
			throw new Error(`Control definition ${kind} could not be found`);
		}

		return result;
	});

	let encoderIsScaleOrTempo = false;

	let isKeyOfScale = $state<boolean>(false);
	let scaleNote = $state<number>(-1);

	let encModePrev = -1;

	let midiControlEditor = $state<MidiControl>();
	let keyboardEditor = $state<KeyboardEditor>();

	let burstIsOpen = $state<boolean>(false);

	function openBurstEditor(ev: MouseEvent | KeyboardEvent) {
		ev.preventDefault();
		ev.stopPropagation();
		burstIsOpen = true;
	}

	const fullDataTreeModel: BranchControl = {
		encmode: 0,
		colour: [colourOff, colourOff],
		combo: 0,
		burst: 0,
		filter: 0,
		midi: {
			ch: -1,
			note: fakeNoteOff,
			vel: paramOff,
			cc: MidiCtrl.OFF,
			min: paramOffNegative,
			max: paramOff,
			par: 0,
			rampu: 0,
			rampd: 0,
		},
	};

	let editorData = $state<BranchControl>();
	let editorDataPrev = $state<BranchControl>();

	let encoderIsRelative = $derived<boolean>(
		editorData !== undefined &&
			editorData.encmode !== undefined &&
			editorData.encmode >= EncoderBehaviour.Relative64Zero &&
			editorData.encmode <= EncoderBehaviour.RelativeSigned
	);

	export function sanizeNow() {
		sanizeData(fullDataTreeModel, editorData);
	}
	export function expandNow() {
		expandData(fullDataTreeModel, editorData);
	}

	let disableResetToBankColours = $derived(
		editorData &&
			editorData.colour![0] == colourOff &&
			editorData.colour![1] == colourOff
	);

	let expanderSanizer = new ExpanderSanizer(
		// @ts-ignore
		{
			model: fullDataTreeModel, // data will be attached in reactive block
		},
		() => {} // cleanup function
	);

	onDestroy(() => expanderSanizer.kill());

	function setCorrectEditorData() {
		if (currentPatch === undefined) {
			throw new Error("currentPatch has been undefined");
		}

		switch (controlKind) {
			case Control.AccelX:
				editorData = assertDefined(
					currentPatch.accel,
					"Accel branch must be defined"
				)[0];
				break;
			case Control.AccelY:
				editorData = assertDefined(
					currentPatch.accel,
					"Accel branch must be defined"
				)[1];
				break;
			case Control.EncRotate:
				editorData = currentPatch.encoders[controlNumber];
				break;
			case Control.Pad: {
				createPadsIfAbsent(
					currentPatch.padbanks[editorState.hand][editorState.bank]
				);
				editorData = assertDefined(
					currentPatch.padbanks[editorState.hand][editorState.bank]
						.pads,
					"Pads must be defined"
				)[controlNumber];
				break;
			}
		}

		editorDataPrev = structuredClone(editorData);
	}

	function resetAll() {
		let setTo =
			currentPatch.padbanks[editorState.hand][editorState.bank].bank
				?.keyinfo !== undefined
				? { midi: { note: fakeNoteUseScale } } // if scale is set, reset to scale
				: {};

		switch (controlKind) {
			case Control.AccelX:
				assertDefined(
					currentPatch.accel,
					"Accel branch must be defined"
				)[0] = {};
				break;
			case Control.AccelY:
				assertDefined(
					currentPatch.accel,
					"Accel branch must be defined"
				)[1] = {};
				break;
			case Control.EncRotate:
				currentPatch.encoders[controlNumber] = {};
				break;
			case Control.Pad:
				assertDefined(
					currentPatch.padbanks[editorState.hand][editorState.bank]
						.pads,
					"Pads must be defined"
				)[controlNumber] = setTo;
				break;
		}

		patchMaybeChanged();
		dispatchEditorClose();
	}

	function revert() {
		editorData = structuredClone(
			assertDefined(editorDataPrev, "editorDataPrev is undefined")
		);

		switch (controlKind) {
			case Control.AccelX:
				assertDefined(currentPatch.accel)[0] = editorData;
				break;
			case Control.AccelY:
				assertDefined(currentPatch.accel)[1] = editorData;
				break;
			case Control.EncRotate:
				currentPatch.encoders[controlNumber] = editorData;
				break;
			case Control.Pad:
				assertDefined(
					currentPatch.padbanks[editorState.hand][editorState.bank]
						.pads,
					"Pads must be defined"
				)[controlNumber] = editorData;
				break;
		}
	}

	async function initEditorAfterTick() {
		midiControlEditor?.lock();
		await tick();

		// midiControlEditor FAILS for scale-changing options of the encoder
		// TODO: fix it! Remove the ? in the next lines to see the effect

		midiControlEditor?.init();
		keyboardEditor?.update();
		midiControlEditor?.unlock();
		patchCanChange = true;
	}

	function maybeCloseTheEditor(ev: KeyboardEvent) {
		if (ev.key != "Enter" && ev.key != "Escape") return;
		if (ev.key == "Escape") revert();
		dispatchEditorClose();
	}

	function patchMaybeChanged() {
		if (patchCanChange) patchChanged();
	}

	$effect(() => {
		const hand = editorState.hand;
		const bank = editorState.bank;
		const kind = controlKind;
		const number = controlNumber;

		patchCanChange = false;

		if (kind == Control.Pad) {
			let noteData = getNoteInCurrentScale(
				number,
				currentPatch.padbanks[hand][bank]
			);
			isKeyOfScale = noteData.isKeyOfScale; // will return false if no scale set
			scaleNote = noteData.key; // will return -1 if no scale is set
		} else {
			isKeyOfScale = false;
			scaleNote = -1;
		}

		expanderSanizer.sanize();
		setCorrectEditorData();
		expanderSanizer.expand(editorData);
		encModePrev = -1;
		editorData = editorData; // svelte
		initEditorAfterTick();
	});

	$effect(() => {
		const editorDataNow = editorData;
		expanderSanizer.expand(editorData);
	});

	$effect(() => {
		if (encoderIsRelative) {
			if (editorData!.midi!.cc! > 127) {
				editorData!.midi!.cc! = 1;
			}
		}
	});
</script>

<svelte:body on:keydown={maybeCloseTheEditor} />

<header>
	<h2>
		{theControl.friendlyName}{#if !theControl.nameIsUnique}
			&nbsp;{controlNumber + 1}{/if}
	</h2>
	<div class="cancelerholder" style="text-align: right; font-weight: bold">
		<button class="unbutton revert" onclick={revert}>↺</button>
		<button
			class="unbutton close"
			onclick={dispatchEditorClose}
			tabindex="0"><Tick /></button
		>
	</div>
</header>

<main id="ce-main" class="columnizer">
	{#if theControl.notes && editorData?.midi}
		<NoteEditor
			bind:midiNote={editorData.midi.note!}
			bind:velocity={editorData.midi.vel!}
			{globalVelocity}
			{scaleNote}
		/>
	{/if}
	{#if theControl.colours && editorData?.colour && editorData?.burst}
		<fieldset
			id="ce-colours"
			class="capability-colour conditional cond-pad cond-joystick"
		>
			<legend>Colours <Overridable /> </legend>
			<ColourWellsEditor
				on:input={patchMaybeChanged}
				bind:colours={editorData.colour}
				{globalColours}
				{isKeyOfScale}
			/>
			<button
				disabled={disableResetToBankColours}
				onclick={() => {
					patchMaybeChanged();
					editorData!.colour![0] = editorData!.colour![1] = colourOff;
				}}
				class="auxaction">Reset to bank colours</button
			>
			<div class="checkboxholder">
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<label onclick={openBurstEditor} onkeypress={openBurstEditor}>
					<input
						checked={burstIsOn(editorData.burst)}
						class="appleswitch"
						type="checkbox"
					/> <mark></mark><span class="unreal"
						>Custom burst...
						<Halp>
							Bursts can be enabled for the whole patch, but also
							each pad can have a unique burst if, say, you want
							extra consistency!
						</Halp>
					</span></label
				>
				{#if burstIsOpen}
					<BurstsDialog
						on:input={patchChanged}
						bind:burst={editorData.burst}
						on:close={() => (burstIsOpen = false)}
					/>
				{/if}
			</div>
		</fieldset>
	{/if}

	{#if editorData?.midi}
		{#if controlKind == Control.EncRotate && editorData?.encmode !== undefined}
			<EncoderParameters
				on:input={patchMaybeChanged}
				{scaleIsOn}
				bind:encmode={editorData.encmode}
				bind:cc={editorData.midi.cc!}
				bind:min={editorData.midi.min!}
				bind:max={editorData.midi.max!}
				bind:par={editorData.midi.par!}
			/>
		{/if}

		<fieldset id="ce-midisettings">
			<legend>Settings</legend>
			<div class="">
				<h4>Channel <Overridable /></h4>
				<Channel
					on:input={patchMaybeChanged}
					bind:value={editorData.midi.ch}
					channelDefault={globalChannel.value & 0xf}
					channelDefaultName={globalChannel.isDeviceLevel
						? "Device default"
						: "Bank default"}
				/>
			</div>
		</fieldset>
		{#if !encoderIsScaleOrTempo && editorData.encmode !== undefined}
			<MidiControl
				bind:cc={editorData.midi.cc!}
				bind:min={editorData.midi.min!}
				bind:max={editorData.midi.max!}
				bind:par={editorData.midi.par!}
				bind:rampu={editorData.midi.rampu!}
				bind:rampd={editorData.midi.rampd!}
				{theControl}
				{encoderIsRelative}
				encmode={editorData.encmode}
				bind:this={midiControlEditor}
			/>
		{/if}
	{/if}
	<!-- if not encoderScaleOrTempo -->

	{#if editorData?.combo != undefined}
		<KeyboardEditor
			on:input={patchMaybeChanged}
			{theControl}
			bind:value={editorData.combo}
			bind:this={keyboardEditor}
		/>
	{/if}

	{#if controlKind == Control.AccelX || controlKind == Control.AccelY || controlKind == Control.AccelZ}
		<fieldset id="ce-reset">
			<legend>Calibrate</legend>
			<div class="ce-block">
				<button onclick={sysExCalibrateAccel}>Calibrate</button>
			</div>
			<div class="explain">
				Lay your device flat and press the button to calibrate the
				accelerometer. It will calibrate both X and Y axes.
			</div>
		</fieldset>
	{/if}
	<fieldset id="ce-reset">
		<legend>Reset</legend>
		<div class="ce-block">
			<button class="dangerous" onclick={resetAll}>Reset all</button>
		</div>
		<div class="explain">
			This removes any settings and closes the editor.
			{#if controlKind == Control.Pad}If a scale and key is set, the pad
				will obey it, otherwise it won't do anything.{:else}The control
				will essentially be off.{/if}
		</div>
	</fieldset>
</main>
