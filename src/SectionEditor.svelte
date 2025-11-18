<script lang="ts">
	import {
		faBrush,
		faGears,
		faPaintRoller,
		faSliders,
		faWandMagicSparkles,
	} from "@fortawesome/free-solid-svg-icons";

	import { openPatternEditor } from "./ts/event_helpers";
	import type { BankInvokeData, InvokeControlData } from "./ts/event_helpers";
	import { isAlt, isColourPreviewMode } from "./ts/stores";
	import { defaultPatches } from "./ts/defaultpatches";

	import {
		sysExFilenameAndDo,
		sysExLockPatchSwitching,
		sysExBank,
		sysExColourReset,
	} from "./ts/midi_core";
	import { type Result, Command } from "./ts/configurator";

	import DrawerBank from "./DrawerBank.svelte";
	import DrawerPatch from "./DrawerPatch.svelte";
	import DrawerTemplate from "./DrawerTemplate.svelte";
	import DrawerColour from "./DrawerColour.svelte";

	import ButtonUpload from "./widgets/ButtonUpload.svelte";
	import Confirm from "./widgets/Confirm.svelte";
	import Alert from "./widgets/Alert.svelte";
	import GotIt from "./widgets/GotIt.svelte";

	import SectionPatches from "./SectionPatches.svelte";

	import { NewPatchDecision } from "./ts/types";
	import {
		NameFailsBecause,
		checkIfPatchNameIsValid,
		getNewPatchName,
	} from "./ts/editor";
	import { ExpanderSanizer } from "./ts/data_expandsanize";

	import type { DeviceOrBankValue } from "./ts/types";
	import type { Patch } from "./ts/types_patch";
	import {
		ColourPaintLayer,
		randomPattern,
		hueShiftPattern,
		hexToCSS,
	} from "./ts/colour_utils.svelte";
	import { deviceDefinition } from "./ts/device";

	import { patchToDevice, patchList } from "./ts/patch.svelte";

	import { isSame } from "./ts/basic";

	let {
		deviceLevelVelocity,
		deviceLevelChannel,
		openSection,
		isOnline,
		onSection,
	}: {
		deviceLevelVelocity: number;
		deviceLevelChannel: number;
		openSection: string;
		isOnline: boolean;
		onSection: (section: string) => void;
	} = $props();

	export function getIsSaved(): boolean {
		return currentPatch.isSaved;
	}

	import {
		currentPatch,
		newPatch,
		patchAction,
		editorState,
	} from "./ts/patch.svelte";
	import Outline from "./editor/Outline.svelte";
	import BankSelector from "./editor/BankSelector.svelte";
	import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
	import commitWatch from "./ts/commit";

	const drawers = [
		{
			id: "banktemplates",
			title: "Templates",
			icon: faWandMagicSparkles,
		},
		{
			id: "banksettings",
			title: "Settings",
			icon: faSliders,
		},
		{
			id: "colourpaint",
			title: "Paint",
			icon: faBrush,
		},
		{
			id: "patchsettings",
			title: "Patch settings",
			icon: faGears,
		},
	];

	function openPatchList() {
		if (dialogPatchList?.open) {
			return;
		}

		dialogPatchList?.showModal();
	}

	function closePatchList() {
		dialogPatchList?.close();
	}

	export async function selectPatch(
		ev: Event | CustomEvent | string,
		quiet: boolean = false
	) {
		const patchNameRequested =
			typeof ev === "string"
				? ev
				: ((ev as CustomEvent).detail?.name ??
					(ev.target as HTMLSelectElement).value);
		// use the value directly if it is a string, otherwise either take the detail.name from CustomEvent or target.value from Select event

		outline?.closeEditor();
		closePatchList();

		const confirmationDialog =
			typeof ev === "string" && ev === currentPatch.name
				? confirmDiscardThis
				: confirmDiscard;

		if (!currentPatch.isSaved && !(await confirmationDialog?.confirm())) {
			if (typeof ev !== "string") ev.preventDefault();
			currentPatch.value = currentPatch.name;
			return false;
		} else {
			currentPatch.value = patchNameRequested;
		}

		if (patchSelector) patchSelector.value = patchNameRequested;

		await sysExFilenameAndDo(
			Command.READPATCH,
			patchNameRequested,
			(data: Patch, filename: string) => {
				patchAction(data, filename);
				if (!quiet) {
					onSection("editor");
				}
			}
		);
	}

	function openNewUI(force: boolean = false) {
		newPatchNameIsValid = checkIfPatchNameIsValid(newPatchName, $patchList);
		newInterfaceOpen = force ? true : !newInterfaceOpen;
	}

	function uploadOrRevert(ev: MouseEvent) {
		if (ev.altKey) {
			selectPatch(currentPatch.name);
		} else {
			uploadThePatch();
		}
	}

	async function uploadThePatch() {
		await patchToDevice(
			Command.OVERWRITEPATCH,
			currentPatch.name,
			() =>
				//(data: any, filename: string) =>
				{
					if (!uploadButton) {
						throw new Error("CUpload button not defined");
					}

					if (drawer === "colourpaint") {
						colourPaintDrawer?.updateDevicePreview(true); // force device to redraw
					}

					uploadButton.ok();
					currentPatch.isSaved = true;
				},
			currentPatch.data!
		);

		if ($isColourPreviewMode) {
			colourPaintDrawer?.updateDevicePreview();
		}
	}

	let alertJsonLoadFailed: Alert;

	const defaultNewPatchHandler = () => {
		uploadButton?.ok();
	};

	function createNewLocal() {
		createNew(useCleanSlate, useTemplate);
	}

	export async function createNew(
		useCleanSlateNow: NewPatchDecision,
		template: string,
		useHueShiftIfDuplicating: boolean = true
	) {
		if (useCleanSlateNow == NewPatchDecision.Template) {
			// Block?
			try {
				let patchData = await fetch(
					`defaultpatches/${$deviceDefinition.model.code}-${template}.json`
				);
				let patchJson = await patchData.json();

				newPatch(
					false, // not a clean slate
					useHueShiftIfDuplicating ? hueShiftPattern : null, // shift hue
					newPatchName,
					true, // load patch afterwards
					defaultNewPatchHandler, // default handler
					patchJson
				);
			} catch (e) {
				console.log(e);
				await alertJsonLoadFailed.confirm();
				return;
			}
		} else {
			newPatch(
				useCleanSlateNow == NewPatchDecision.CleanSlate,
				useCleanSlateNow == NewPatchDecision.CleanSlate
					? randomPattern
					: useHueShiftIfDuplicating
						? hueShiftPattern
						: null,
				newPatchName,
				true,
				defaultNewPatchHandler
			);
		}
	}

	function checkIfNewPatchNameIsValid(ev: any) {
		nameHasBeenChanged = true;
		newPatchNameIsValid = checkIfPatchNameIsValid(
			ev.currentTarget.value.trim(),
			$patchList
		);
	}

	async function updateNewPatchName() {
		if (nameHasBeenChanged) {
			return;
		}

		if (!$patchList.length) {
			return;
		}

		newPatchName =
			getNewPatchName(
				$patchList,
				useCleanSlate === NewPatchDecision.Duplicate
					? currentPatch.name
					: null
			) ?? "";

		nameHasBeenChanged = false;
	}

	function selectBankFromEvent(ev: CustomEvent<BankInvokeData>) {
		editorState.hand = ev.detail.hand;
		selectBank(ev.detail.bankNo + (ev.detail.isShift ? 4 : 0), false);
	}

	async function selectBank(no: number, sendSysEx: boolean = true) {
		if (editorState.bank == no) {
			return;
		}

		ExpanderSanizer.latchAll();
		commitWatch.commit();
		if (sendSysEx) {
			sysExBank(editorState.hand, no > 3, no % 4);
		}

		editorState.bank = no;
	}

	let numberOfActiveBanks = $derived<number>(
		currentPatch?.data
			? currentPatch?.data?.padbanks[editorState.hand].filter(
					v => !isSame(v, {})
				).length
			: 0
	);

	let globalChannel = $derived(
		currentPatch?.data
			? currentPatch?.data?.padbanks?.[editorState.hand][editorState.bank]
					?.bank?.ch !== undefined &&
				currentPatch?.data?.padbanks?.[editorState.hand][
					editorState.bank
				].bank!.ch! !== -1
				? {
						value: currentPatch?.data?.padbanks?.[editorState.hand][
							editorState.bank
						].bank!.ch!,
						isDeviceLevel: false,
					}
				: {
						value: deviceLevelChannel,
						isDeviceLevel: true,
					}
			: { value: 0, isDeviceLevel: true }
	);

	let globalVelocity = $derived(
		currentPatch?.data
			? currentPatch?.data?.padbanks?.[editorState.hand][editorState.bank]
					?.bank?.vel !== undefined
				? {
						value: currentPatch?.data?.padbanks?.[editorState.hand][
							editorState.bank
						].bank!.vel!,
						isDeviceLevel: false,
					}
				: {
						value: deviceLevelVelocity,
						isDeviceLevel: true,
					}
			: { value: 0, isDeviceLevel: true }
	);

	$effect(() => {
		if (
			currentPatch?.data &&
			typeof currentPatch?.data.encoders === "undefined"
		) {
			currentPatch.data.encoders = [];
			for (
				let i = 0;
				i < $deviceDefinition.model.hardware!.encoders!;
				i++
			) {
				currentPatch?.data?.encoders.push({});
			}
		}
	});

	$effect(() => {
		if ($patchList && currentPatch.data) {
			const thePatch = $patchList.find(v => {
				return v.isThePatch;
			});

			if (thePatch) {
				thePatch.info = structuredClone(
					$state.snapshot(currentPatch.data.info)
				);
			}
		}
	});

	let drawer = $state<string>("");

	let colourPaintDrawer = $state<DrawerColour>();
	let nameHasBeenChanged = $state<boolean>(false);
	let newPatchName = $state<string>("");

	let newInterfaceOpen = $state<boolean>(false);
	let newPatchNameIsValid = $state<NameFailsBecause>(NameFailsBecause.Empty);
	let useCleanSlate = $state<NewPatchDecision>(NewPatchDecision.Duplicate);
	let useTemplate = $state<string>("fd");

	let colourPaintMode = $state<ColourPaintLayer>(ColourPaintLayer.Off);
	let colourPaintShowBank = $state<boolean>(true);
	let paintData = $state<InvokeControlData>();

	let outline = $state<Outline>();
	let confirmDiscard = $state<Confirm>();
	let confirmDiscardThis = $state<Confirm>();

	let patchSelector = $state<HTMLSelectElement>();
	let uploadButton = $state<ButtonUpload>();
	let dialogPatchList = $state<HTMLDialogElement>();

	$effect(() => {
		useCleanSlate;

		if (newInterfaceOpen) {
			updateNewPatchName();
		}
	});

	$effect(() => {
		if (!newInterfaceOpen) {
			// if it is safe to update the name, because the interface is closed
			updateNewPatchName();
		}
	});

	$effect(() => {
		currentPatch.value = currentPatch.name;
	});

	let checkPatchEqualTimeout: null | number = null;

	function clearCheckPatchEqualTimeout() {
		if (!checkPatchEqualTimeout) {
			return;
		}

		clearTimeout(checkPatchEqualTimeout);
		checkPatchEqualTimeout = null;
	}

	export function markSaved() {
		currentPatch.isSaved = true;
		sysExLockPatchSwitching(false);
	}

	function markUnsaved() {
		clearCheckPatchEqualTimeout();
		checkPatchEqualTimeout = window.setTimeout(() => {
			if (isSame(currentPatch.data, currentPatch.originalState))
				markUnsaved();
			clearCheckPatchEqualTimeout();
		}, 300);

		currentPatch.isSaved = false;
		sysExLockPatchSwitching(true);
	}

	function setDrawer(d: string) {
		$isColourPreviewMode = drawer == "colourpaint";

		if (drawer == "colourpaint") {
			sysExColourReset(); // if current drawer is colourpaint, reset colour preview
		}

		drawer = d == drawer ? "" : d;

		if (drawer == "colourpaint") {
			outline?.closeEditor(); // if the selected drawer is colourpaint, close the editor
		}
	}

	function ondrawer(ev: CustomEvent<string>) {
		setDrawer(ev.detail);
	}

	let alertPatchLock: Alert;

	async function alertAboutPatchLock() {
		await alertPatchLock.confirm();
	}

	function handleSysExPush(ev: CustomEvent<Result>) {
		const midiResult: Result = ev.detail.data;

		switch (midiResult.command) {
			case Command.READPATCH:
				patchAction(midiResult.data, midiResult.filename);
				break;
		}
	}
</script>

<svelte:body
	onpatchchange={markUnsaved}
	onpatchlock={alertAboutPatchLock}
	onsysexpush={handleSysExPush}
	{ondrawer}
	oninvokebank={selectBankFromEvent}
	onopennewui={() => openNewUI(true)}
	onclosenewui={() => {
		newInterfaceOpen = false;
	}}
/>

<dialog class="modal" bind:this={dialogPatchList}>
	<SectionPatches
		{getIsSaved}
		{markSaved}
		{selectPatch}
		{closePatchList}
		bind:patchesInfo={$patchList}
		{isOnline}
	/>
</dialog>

{#if currentPatch?.data && openSection == "editor"}
	<section id="tab-config">
		<GotIt cookieName="editorworks">
			No changes to the patch apply instantly. Press “Upload to the
			device” to apply the changes and try them in action! A red dot <span
				class="reddot">●</span
			> will suggest you’ve got unsaved changes.
		</GotIt>

		<div id="toolbar-top" class="donotcloseeditor">
			<div
				class="patchlist-pattern patternpreview"
				style="display: inline-flex; width: 2.5rem; height: 2.5rem; vertical-align: middle; position: relative; top: -0.11rem;"
			>
				{#if currentPatch.data.info.pattern}
					{#each currentPatch.data.info.pattern as colour}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<span
							role="button"
							tabindex="0"
							data-colour="0"
							style="background-color: {hexToCSS(colour)}"
							onclick={openPatternEditor}
						></span>
					{/each}
				{/if}
			</div>
			<select
				bind:this={patchSelector}
				disabled={!isOnline}
				id="patchselector"
				onclick={ev => {
					openPatchList();
					ev.preventDefault();
					ev.stopPropagation();
				}}
				oninput={selectPatch}
				value={currentPatch.value}
				style="height:2.5rem"
			>
				{#each $patchList as patch}
					<option value={patch.name}
						>{patch.name.replace(".dbrpatch", "")}</option
					>
				{/each}
			</select>
			<ButtonUpload
				disabled={!isOnline}
				onclick={uploadOrRevert}
				isSaved={currentPatch.isSaved}
				bind:this={uploadButton}
				>{#if $isAlt}Revert{:else}Upload to device{/if}</ButtonUpload
			>
			<button disabled={!isOnline} onclick={() => openNewUI()}
				>New...</button
			>
		</div>
		{#if newInterfaceOpen}
			<div
				class="drawerwrapper donotcloseeditor"
				id="dw-wrapper-newpatch"
			>
				<fieldset id="new-patch" class="drawerlike">
					<legend>New patch</legend>
					<h3>Name</h3>
					<input
						type="text"
						oninput={checkIfNewPatchNameIsValid}
						bind:value={newPatchName}
						class:invalid={newPatchNameIsValid !=
							NameFailsBecause.Empty &&
							newPatchNameIsValid != NameFailsBecause.Nothing}
					/>

					{#if newPatchNameIsValid == NameFailsBecause.BadCharacters}<p
							class="explain warn"
						>
							The patch name has forbidden characters.
						</p>{/if}
					{#if newPatchNameIsValid == NameFailsBecause.TooLong}<p
							class="explain warn"
						>
							The patch name is too long.
						</p>{/if}
					{#if newPatchNameIsValid == NameFailsBecause.Dot}<p
							class="explain warn"
						>
							The patch name cannot start or end with a dot.
						</p>{/if}
					{#if newPatchNameIsValid == NameFailsBecause.Exists}<p
							class="explain warn"
						>
							A patch with the same name exists.
						</p>{/if}

					<p class="explain">
						Names may only contain English letters, numbers, symbols
						allowed in filenames, and spaces. The name may be up to
						50 characters long, and obviously shouldn’t be the same
						as existing patches.
					</p>

					<p class="checkboxblock">
						<label
							><input
								type="radio"
								bind:group={useCleanSlate}
								value={NewPatchDecision.Duplicate}
							/> Duplicate from current</label
						><br />
						<label
							><input
								type="radio"
								bind:group={useCleanSlate}
								value={NewPatchDecision.CleanSlate}
							/> Create an empty patch</label
						><br />

						{#if $deviceDefinition?.model?.code && defaultPatches[$deviceDefinition.model.code]}
							<label
								><input
									type="radio"
									bind:group={useCleanSlate}
									value={NewPatchDecision.Template}
								/>
								From template:
								<select
									disabled={useCleanSlate !=
										NewPatchDecision.Template}
									bind:value={useTemplate}
									style="width:auto"
								>
									{#each defaultPatches[$deviceDefinition.model.code] as defpatch}
										<option value={defpatch.id}
											>{defpatch.name}</option
										>
									{/each}
								</select>
							</label>
						{/if}
						<!-- //				{/if} -->
					</p>

					<p>
						<button
							onclick={createNewLocal}
							disabled={!isOnline ||
								newPatchNameIsValid != NameFailsBecause.Nothing}
							>New</button
						>
						<button
							onclick={() => {
								newInterfaceOpen = false;
							}}>Close</button
						>
					</p>
				</fieldset>
			</div>
		{/if}

		<BankSelector
			padBanks={currentPatch.data.padbanks}
			currentBank={editorState.bank}
			{selectBank}
		/>

		<div
			id="drawerholder"
			class="donotcloseeditor"
			class:banktemplates={drawer == "banktemplates"}
			class:colourpaint={drawer == "colourpaint"}
			class:banksettings={drawer == "banksettings"}
			class:patchsettings={drawer == "patchsettings"}
		>
			<div id="drawerclick">
				{#each drawers as oneDrawer}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<span
						class="unreal"
						role="tab"
						tabindex="0"
						class:sel={drawer === oneDrawer.id}
						onclick={() => setDrawer(oneDrawer.id)}
						><FontAwesomeIcon icon={oneDrawer.icon} />
						{oneDrawer.title}</span
					>
				{/each}
			</div>

			{#if drawer == "patchsettings"}
				<div class="drawerwrapper" id="dw-wrapper-patchsettings">
					<DrawerPatch
						{currentPatch}
						model={$deviceDefinition.model}
					/>
				</div>
			{/if}
			{#if drawer == "banksettings"}
				<div class="drawerwrapper" id="dw-wrapper-banksettings">
					<DrawerBank
						currentPatch={currentPatch.data!}
						{editorState}
						{deviceLevelChannel}
					/>
				</div>
			{/if}
			{#if drawer == "colourpaint"}
				<div class="drawerwrapper" id="dw-wrapper-colourpaint">
					<DrawerColour
						bind:this={colourPaintDrawer}
						bind:colourPaintMode
						bind:colourPaintShowBank
						{paintData}
						bind:bank={
							currentPatch.data.padbanks[editorState.hand][
								editorState.bank
							]
						}
						bind:pattern={currentPatch.data.info.pattern}
					/>
				</div>
			{/if}
			{#if drawer == "banktemplates"}
				<div class="drawerwrapper" id="dw-wrapper-banktemplates">
					<DrawerTemplate
						bind:currentBank={
							currentPatch.data.padbanks[editorState.hand][
								editorState.bank
							]
						}
						{numberOfActiveBanks}
					/>
				</div>
			{/if}

			<div class="drawer" id="dw-paintcolour"></div>
		</div>

		<div id="bankdescriptor">
			{#if drawer == "colourpaint"}
				<i>Device is in colour preview mode</i>
			{:else if !currentPatch?.data?.padbanks[editorState.hand][editorState.bank]?.pads?.length}Bank
				is off.{/if}
		</div>

		<Outline
			bind:this={outline}
			{currentPatch}
			onPaint={incomingData => (paintData = incomingData)}
			{colourPaintMode}
			{colourPaintShowBank}
			{editorState}
			{globalChannel}
			{globalVelocity}
		/>
	</section>
{/if}
<!-- if openSection == editor -->
<Confirm bind:this={confirmDiscard} okText="Discard">
	<p>
		You have unsaved changes. Do you want to discard them and open another
		patch?
	</p>
</Confirm>
<Confirm bind:this={confirmDiscardThis} okText="Revert">
	<p>
		You have unsaved changes. Do you want to revert to the last saved
		version?
	</p>
</Confirm>
<Alert bind:this={alertPatchLock} okText="Fine...">
	<p>
		You have unsaved changes. Patch switching is locked on the
		$deviceDefinition.
	</p>
</Alert>
<Alert bind:this={alertJsonLoadFailed}>
	<p>Failed loading template patch.</p>
</Alert>
