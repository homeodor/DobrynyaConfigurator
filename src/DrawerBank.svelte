<script lang="ts">
	import { onDestroy, onMount } from "svelte";

	import { colourOff } from "./ts/colour_utils.svelte";
	import {
		scales,
		fakeNoteOff,
		paramOffNegative,
		paramOff,
		octaveInlineToRange,
		octaveRangeToInline,
		Notes,
		keyInfoToKeyObject,
		keyObjectToKeyInfo,
	} from "./ts/midi_utils";
	import {
		assertBranchParams,
		createPadsIfAbsent,
		getBranchBankSettings,
		setBranchBankSettings,
	} from "./ts/data_utils";
	import { fillWithTemplate } from "./ts/editor";
	import { patchChanged } from "./ts/event_helpers";

	import Pianoroll from "./widgets/Pianoroll.svelte";
	import RangeWithInline from "./widgets/RangeWithInline.svelte";
	import Channel from "./widgets/Channel.svelte";
	import Overridable from "./widgets/Overridable.svelte";
	import Halp from "./widgets/Halp.svelte";

	import ColourWellsBank from "./ColourWellsBank.svelte";
	import type { BranchBankSettings, Patch } from "./ts/types_patch";
	import { Hand } from "./ts/types";
	import type { CurrentEditorState } from "./ts/patch.svelte";
	import commitWatch from "./ts/commit";
	import { applyDefaults, stripDefaults } from "./ts/defaults";

	const bankSettingsModel: BranchBankSettings = {
		ch: -1,
		colour: [colourOff, colourOff, colourOff, colourOff],
		keyinfo: -1,
		lightshow: 0,
		vel: 127,
		midi: {
			note: fakeNoteOff,
			cc: paramOff,
			min: paramOffNegative,
			max: paramOff,
			par: 0,
			rampu: 0,
			rampd: 0,
		},
	};

	let {
		currentPatch,
		editorState,
		deviceLevelChannel,
	}: {
		currentPatch: Patch;
		editorState: CurrentEditorState;
		deviceLevelChannel: number;
	} = $props();

	let allPadsToScale = () => {
		if (!currentBank) {
			throw new Error("currentBank has been undefined");
		}

		assertBranchParams(editorState.hand, editorState.bank);

		fillWithTemplate(
			currentPatch.padbanks[editorState.hand][editorState.bank],
			"fill",
			"scale"
		);
		currentBank = currentBank;
		patchChanged();
	};

	function commitBranch() {
		if (currentBank) {
			setBranchBankSettings(
				currentPatch,
				stripDefaults(bankSettingsModel, currentBank),
				previousHand,
				previousBank
			);
		}
	}

	onMount(() => {
		commitWatch.attach(commitBranch);
	});

	onDestroy(() => {
		commitWatch.detach(commitBranch);
	});

	let currentBank = $state<BranchBankSettings>();

	let previousHand = Hand.NONE;
	let previousBank = -1;

	$effect(() => {
		currentPatch;

		if (currentPatch === undefined) {
			throw new Error("currentPatch has been undefined");
		}

		previousHand = editorState.hand;
		previousBank = editorState.bank;

		const bankNow = getBranchBankSettings(
			currentPatch,
			editorState.hand,
			editorState.bank
		);

		currentBank = applyDefaults(bankSettingsModel, bankNow);

		return commitBranch;
	});

	function setLightshowMode(mode: number): void {
		if (!currentBank?.lightshow) {
			throw new Error("currentBank.lightshow has been undefined");
		}
		currentBank.lightshow = mode
			? (currentBank.lightshow & 0xf8) | mode
			: 0;
	}

	function getLightshowMode(): number {
		return currentBank && currentBank.lightshow
			? currentBank.lightshow & 0x7
			: 0;
	}

	function setLightshowAgnostic(value: boolean): void {
		if (!currentBank?.lightshow) {
			throw new Error("currentBank.lightshow has been undefined");
		}

		if (value) {
			currentBank.lightshow |= 0x8;
		} else {
			currentBank.lightshow &= ~0x8;
		}
	}

	function getLightshowAgnostic(): boolean {
		return currentBank && currentBank.lightshow
			? (currentBank.lightshow & 0x8) == 0x8
			: false;
	}

	function setLightshowChannel(channel: number): void {
		if (!currentBank?.lightshow) {
			throw new Error("currentBank.lightshow has been undefined");
		}
		currentBank.lightshow = (currentBank.lightshow & 0x0f) | (channel << 4);
	}

	function getLightshowChannel(): number {
		return currentBank && currentBank.lightshow
			? (currentBank.lightshow >> 4) & 0xf
			: 0;
	}

	function getBankChannel(): number {
		if (currentBank?.ch === undefined) {
			throw new Error("currentBank.ch has been undefined");
		}
		return currentBank.ch < 0 ? -1 : currentBank.ch & 0xf;
	}

	function setBankChannel(channel: number): void {
		if (currentBank?.ch === undefined) {
			throw new Error("currentBank.ch has been undefined");
		}
		currentBank.ch = channel < 0 ? -1 : (currentBank.ch & 0x10) | channel;
	}

	function getBankChannelGlobal(): boolean {
		if (currentBank?.ch === undefined) {
			throw new Error("currentBank.ch has been undefined");
		}
		return currentBank.ch < 0 ? false : (currentBank.ch & 0x10) == 0x10;
	}

	function setBankChannelGlobal(value: boolean): void {
		if (currentBank?.ch === undefined) {
			throw new Error("currentBank.ch has been undefined");
		}

		if (currentBank.ch < 0) {
			throw new Error("currentBank.ch is < 0, yet we try to set global");
		}

		if (value) {
			currentBank.ch |= 0x10;
		} else {
			currentBank.ch &= ~0x10;
		}
	}

	function getScaleEnabled(): boolean {
		if (currentBank?.keyinfo == undefined) {
			throw new Error("currentBank.keyinfo has been undefined");
		}
		return currentBank.keyinfo > 0;
	}

	function setScaleEnabled(value: boolean): void {
		if (currentBank?.keyinfo == undefined) {
			throw new Error("currentBank.keyinfo has been undefined");
		}

		if (!value) {
			currentBank.keyinfo = -1;
			return;
		}

		const reasonableDefaults = {
			key: 0,
			mode: 0,
			octave: 3,
			offset: 0,
		};

		if (
			createPadsIfAbsent(
				currentPatch.padbanks[editorState.hand][editorState.bank]
			)
		) {
			// if the bank is new, set all pads to scale
			allPadsToScale();
		}

		currentBank.keyinfo = keyObjectToKeyInfo(reasonableDefaults);
	}

	function getScaleMode(): number {
		if (currentBank?.keyinfo == undefined) {
			throw new Error("currentBank.keyinfo has been undefined");
		}

		return getScaleEnabled()
			? keyInfoToKeyObject(currentBank.keyinfo).mode
			: 0;
	}

	function setScaleMode(mode: number): void {
		if (currentBank?.keyinfo == undefined) {
			throw new Error("currentBank.keyinfo has been undefined");
		}

		if (!getScaleEnabled()) {
			throw new Error("Scale is disabled, yet we try to set mode");
		}

		currentBank.keyinfo = keyObjectToKeyInfo({
			...keyInfoToKeyObject(currentBank.keyinfo),
			mode: mode,
		});
	}

	function getScaleKey(): number {
		if (currentBank?.keyinfo == undefined) {
			throw new Error("currentBank.keyinfo has been undefined");
		}

		return getScaleEnabled()
			? keyInfoToKeyObject(currentBank.keyinfo).key
			: -1;
	}

	function setScaleKey(key: number): void {
		if (currentBank?.keyinfo == undefined) {
			throw new Error("currentBank.keyinfo has been undefined");
		}

		if (!getScaleEnabled()) {
			throw new Error("Scale is disabled, yet we try to set key");
		}

		if (key < 0) {
			setScaleEnabled(false);
			return;
		}

		if (!getScaleEnabled()) {
			setScaleEnabled(true);
		}

		currentBank.keyinfo = keyObjectToKeyInfo({
			...keyInfoToKeyObject(currentBank.keyinfo),
			key: key,
		});
	}

	interface PianorollEvent {
		value: number;
		altKey: boolean;
	}

	function pianorollEvent(ev: PianorollEvent) {
		if (ev.altKey) {
			if (getScaleMode() == 0) {
				setScaleMode(1);
			} else if (getScaleMode() == 1) {
				setScaleMode(0);
			}
		}
	}

	function getScaleOctave(): number {
		if (currentBank?.keyinfo == undefined) {
			throw new Error("currentBank.keyinfo has been undefined");
		}

		return getScaleEnabled()
			? keyInfoToKeyObject(currentBank.keyinfo).octave
			: 0;
	}

	function setScaleOctave(octave: number): void {
		if (currentBank?.keyinfo == undefined) {
			throw new Error("currentBank.keyinfo has been undefined");
		}

		if (!getScaleEnabled()) {
			throw new Error("Scale is disabled, yet we try to set octave");
		}

		currentBank.keyinfo = keyObjectToKeyInfo({
			...keyInfoToKeyObject(currentBank.keyinfo),
			octave: octave,
		});
	}

	function getScaleOffset(): number {
		if (currentBank?.keyinfo == undefined) {
			throw new Error("currentBank.keyinfo has been undefined");
		}

		return getScaleEnabled()
			? keyInfoToKeyObject(currentBank.keyinfo).offset
			: 0;
	}

	function setScaleOffset(offset: number): void {
		if (currentBank?.keyinfo == undefined) {
			throw new Error("currentBank.keyinfo has been undefined");
		}

		if (!getScaleEnabled()) {
			throw new Error("Scale is disabled, yet we try to set offset");
		}

		currentBank.keyinfo = keyObjectToKeyInfo({
			...keyInfoToKeyObject(currentBank.keyinfo),
			offset: offset,
		});
	}
</script>

{#if currentBank}
	<div class="drawer columnizer-in" id="dw-banksettings">
		<p class="explain-caption">
			Global settings for this bank. Some can be overridden for individual
			controls.
		</p>
		<div>
			<fieldset id="dw-bank-colours">
				<legend
					>Bank colours
					<Halp>
						<p>
							This sets default pad colours. They can be
							overridden on per-pad basis. Any or all colours may
							be disabled altogether.
						</p>
						<p>
							<i>Idle colour</i> is the colour that the pad has normally.
						</p>
						<p>
							<i>Active colour</i> is the colour pad takes while pressed
							or toggled on (for toggle CCs).
						</p>
						<p>
							<i>Root note colour</i> is relevant when a scale is enabled.
							The pads that correspond to the root note of the scale
							will have this colour.
						</p>
						<p>
							<i>Root note active colour</i> is like active colour,
							but for pads that correspond to the root note.
						</p>
					</Halp>
				</legend>
				<div class="colourselector">
					<ColourWellsBank
						oninput={patchChanged}
						bind:colours={currentBank.colour!}
					/>
				</div>
			</fieldset>
			<fieldset id="dw-bank-key" class="blockenablertarget">
				<legend style="display:table">
					<!-- fix chrome being a jerk and putting the appleswitch in a wrong place -->
					<label>
						<input
							oninput={patchChanged}
							type="checkbox"
							class="appleswitch"
							bind:checked={getScaleEnabled, setScaleEnabled}
						/>
						<mark
							>Scale and key
							<Halp
								><p>Pads will use this scale by default.</p>
								<p>
									Each pad can still be overridden to send
									other notes or send no note at all; things
									like CC are also available, of course.
								</p>
								<p>
									Encoders can be set to change scale
									parameters on the fly.
								</p>
							</Halp>
						</mark>
					</label>
				</legend>

				<div class="ce-block">
					<button
						onclick={allPadsToScale}
						disabled={!getScaleEnabled()}
						>Set all pads to scale
						<Halp
							>If scale is set, all pads will have their settings
							removed, and then set to obey the scale.</Halp
						>
					</button>
					<br />&nbsp;
				</div>

				<div class="ce-block">
					<Pianoroll
						oninput={pianorollEvent}
						bind:musicKey={getScaleKey, setScaleKey}
					/>
				</div>
				<div class="ce-block">
					<h4 class:disabled={!getScaleEnabled()}>Scale mode</h4>
					<!-- Note that Select had oninput={patchChanged}, but it created a loop that broke the switching! -->
					<select
						bind:value={getScaleMode, setScaleMode}
						disabled={!getScaleEnabled()}
					>
						{#each scales as scaleDef, i}
							<option value={i}
								>{Notes[getScaleKey()]} {scaleDef.name}</option
							>
						{/each}
					</select>
				</div>
				<div class="ce-block">
					<h4 class:disabled={!getScaleEnabled()}>Octave</h4>
					<RangeWithInline
						oninput={patchChanged}
						max={10}
						defValue={4}
						elId={"cbv-octave"}
						inlineToRange={octaveInlineToRange}
						rangeToInline={octaveRangeToInline}
						bind:value={getScaleOctave, setScaleOctave}
						disabled={!getScaleEnabled()}
					/>
				</div>
				<div class="ce-block">
					<h4 class:disabled={!getScaleEnabled()}>Offset</h4>
					<RangeWithInline
						oninput={patchChanged}
						max={11}
						bind:value={getScaleOffset, setScaleOffset}
						disabled={!getScaleEnabled()}
					/>
				</div>
			</fieldset>

			<fieldset id="dw-bank-midi">
				<legend>MIDI</legend>
				<div class="ce-block">
					<h4>Velocity</h4>
					<RangeWithInline
						oninput={patchChanged}
						bind:value={currentBank.vel!}
					/>
				</div>

				<div class="ce-block">
					<h4>Channel <Overridable /></h4>
					<Channel
						oninput={patchChanged}
						bind:value={getBankChannel, setBankChannel}
						channelDefaultName="Device default"
						channelDefault={deviceLevelChannel}
					/>
					<p>
						<label class:disabled={getBankChannel() == -1}
							><input
								oninput={patchChanged}
								type="checkbox"
								bind:checked={
									getBankChannelGlobal, setBankChannelGlobal
								}
								disabled={getBankChannel() == -1}
							/>
							Global
							<Halp>
								With this option, once the bank is selected, all
								controls will send data on this channel, not
								just the pads – unless, of course, those
								controls have their own custom channel setting.
							</Halp></label
						>
					</p>
				</div>
			</fieldset>

			<fieldset id="dw-bank-lightshow">
				<legend
					>Lightshow
					<Halp
						><p>
							Lightshows are a rather advanced technique when the
							host (not the Dobrynya itself) drives LEDs of the
							device for various complex effects.
						</p>
						<p>
							If you are interested, google “lightshow launchpad”
							to know more. If you just want some fun colourful
							effects, check out “Bursts” on the patch settings
							page.
						</p></Halp
					>
				</legend>
				<div class="ce-block">
					<h4>Mode</h4>
					<select
						oninput={patchChanged}
						bind:value={getLightshowMode, setLightshowMode}
					>
						<option value={0}>Off</option>
						<option value={1}>Simple</option>
						<option value={2}>Mix</option>
						<option value={3}>Launchpad-compatible</option>
						<option value={4}>Spectrum</option>
						<!-- <option value="5">Advanced</option> -->
					</select>
				</div>

				<br />

				<div class="ce-block">
					<label>
						<input
							oninput={patchChanged}
							disabled={getLightshowMode() == 0}
							type="checkbox"
							class="appleswitch"
							bind:checked={
								getLightshowAgnostic, setLightshowAgnostic
							}
						/>
						<mark
							>Ignore mapping
							<Halp>
								<p>
									By default, if Dobrynya receives a note, it
									will try to match it against the notes that
									are mapped to the pads. That is, if it
									receives D4, and pad 6 has D4 mapped to it,
									pad 6 will light up. This may be convenient
									if you use the notes <i>sent</i> by Dobrynya
									itself and route them back to Dobrynya in your
									DAW.
								</p>
								<p>
									However, because mappings can be very
									different and may or may not include notes,
									you may want to have consistency instead.
									This option provides exactly that. Incoming
									C1 will always correspond to pad 1 (lower
									left), C#1 to pad 2, and so on all the way
									to D#2 at pad 16. If you are trying out MIDI
									tracks for lightshows made by other users,
									this is what you want, too.
								</p>
							</Halp>
						</mark>
					</label>
				</div>

				<div class="ce-block">
					<h4 class:disabled={getLightshowMode() == 0}>Listen on</h4>
					<Channel
						oninput={patchChanged}
						disabled={getLightshowMode() == 0}
						bind:value={getLightshowChannel, setLightshowChannel}
						channelDefaultName="Any channel"
					/>
				</div>
			</fieldset>
		</div>
	</div>
{/if}
