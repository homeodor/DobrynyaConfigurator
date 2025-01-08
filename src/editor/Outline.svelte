<script lang="ts">
	import Pads from "./Pads.svelte";
	import Encoder from "./Encoder.svelte";
	import { Control, type DeviceOrBankValue } from "src/ts/types";
	import type { CurrentEditorState, CurrentPatchInfo } from "src/ts/patch";
	import { CaseColour, deviceDefinition } from "src/ts/device";
	import type { InvokeControlEventData } from "src/ts/event_helpers";
	import { ColourPaintLayer } from "src/ts/colour_utils";
	import PanePads from "./PanePads.svelte";
	import PaneJopa from "./PaneJopa.svelte";
	import { importantFactorySettings } from "settings_utils";
	import ControlEditor from "../ControlEditor.svelte";
	import { onMount, tick } from "svelte";
	import { currentKeyInfoToKey } from "src/ts/midi_utils";

	export let currentPatch: CurrentPatchInfo;
	export let paintData: InvokeControlEventData;
	export let colourPaintMode: ColourPaintLayer;
	export let colourPaintShowBank: boolean;
	export let editorState: CurrentEditorState;

	export let globalChannel: DeviceOrBankValue;
	export let globalVelocity: DeviceOrBankValue;

	let editorAlive = false;
	let editorData = null;
	let editorControlKind: Control = Control.Generic;
	let editorControlNumber: number = -1;
	let theOutline: HTMLDivElement;
	let editorBigRadius = 0;

	let pocket = false;
	let multitab = true;

	let tabs: HTMLMenuElement;
	let panes: HTMLUListElement;

	onMount(() => {
		// @ts-ignore
		window.controlEditor = controlEditor;
	});

	let controlEditor: ControlEditor;

	async function openEditor(element: HTMLElement, kind: Control, i: number) {
		controlEditor?.sanizeNow();

		editorData = true; // = true;
		editorControlKind = kind;
		editorControlNumber = i;

		await tick(); // wait for the editor...

		const editorEl = document.getElementById("controleditor");

		const outlineRect = theOutline.getBoundingClientRect();
		const targetRect = element.getBoundingClientRect();

		const relY: number = targetRect.top - outlineRect.top;
		const relX: number = targetRect.left - outlineRect.left;
		const relR: number = Math.round(targetRect.width / 2);

		const circleX: number = Math.round(relX + relR);
		const circleY: number = Math.round(relY + relR);

		let bigR =
			Math.max.apply(null, [
				Math.round(Math.sqrt(circleX ** 2 + circleY ** 2)),
				Math.round(
					Math.sqrt((outlineRect.width - circleX) ** 2 + circleY ** 2)
				),
				Math.round(
					Math.sqrt(
						circleX ** 2 + (outlineRect.height - circleY) ** 2
					)
				),
				Math.round(
					Math.sqrt(
						(outlineRect.width - circleX) ** 2 +
							(outlineRect.height - circleY) ** 2
					)
				),
			]) + 500; // finding the longest distance from the center of the circle to the edge of the outline...

		//		if (bigR + relX > bigR + relY) bigR += relX; else bigR += relY;

		//		bigR = Math.ceil(bigR) + 500;

		editorAlive = true;
		editorBigRadius = bigR;

		editorEl.style.clipPath = `circle(1px at ${circleX}px ${circleY}px`;
		setTimeout(() => {
			editorEl.style.clipPath = `circle(${bigR}px at ${circleX}px ${circleY}px`;
		}, 5);
	}

	export async function closeEditor() {
		const editorEl = document.getElementById("controleditor");

		if (!editorEl) return; // no editor === no problem

		editorEl.style.clipPath = editorEl.style.clipPath.replace(
			`${editorBigRadius}px`,
			`1px`
		);
		setTimeout(() => {
			currentPatch.data = currentPatch.data; // uh, svelte
			editorAlive = false;
			editorBigRadius = 0;
			editorData = null;
		}, 350);
	}

	function bodyClick(ev: Event) {
		if (
			!editorData ||
			document.querySelector("dialog[open]") ||
			(ev.target as HTMLElement).closest(
				".dobrynya-outline, .donotcloseeditor"
			)
		)
			return true;

		closeEditor();
	}

	let visibleCard = null;

	function setTab(index: number) {
		if (index < 0) {
			throw new Error(`Tab not found`);
		}

		const theTabs = Array.from(tabs.children);

		if (theTabs.length === 0)
		{
			return;
		}

		theTabs.forEach((el: HTMLDivElement) =>
			el.classList.remove("selected")
		);
		theTabs[index].classList.add("selected");
	}

	function retab(ev: MouseEvent) {
		if (panes.children.length !== tabs.children.length) {
			throw new Error("Panes and tabs don't match");
		}

		const theTabs = Array.from(tabs.children);
		const theTarget = ev.currentTarget as HTMLElement;
		const index = theTabs.indexOf(theTarget);

		setTab(index);

		panes.children[index]?.scrollIntoView({
			behavior: "smooth",
			block: "nearest",
			inline: "start",
		});
	}

	function onIntersection(entries) {
		for (const entry of entries) {
			if (entry.isIntersecting) {
				visibleCard = entry.target;
				const thePanes = Array.from(panes.children);
				setTab(thePanes.indexOf(visibleCard));
				return;
			}
		}
	}

	onMount(() => {
		const observer = new IntersectionObserver(onIntersection, {
			root: document.querySelector(".dobrynya-outline"),
			threshold: 0.6,
		});

		const thePanes = Array.from(panes.children);
		thePanes.forEach(card => observer.observe(card));

		// thePanes[1]?.scrollIntoView({
		// 	behavior: "instant",
		// 	block: "nearest",
		// 	inline: "start",
		// });

		// setTab(1);

		return () => observer.disconnect(); // Cleanup observer
	});

	$: {
		pocket =
			$deviceDefinition.model.code.includes("pocket") ||
			$deviceDefinition.model.code.includes("aurora");
	}
</script>

<svelte:body on:click={bodyClick} on:closeeditor={closeEditor} />

<div
	class="dobrynya-outline"
	class:dark={$importantFactorySettings.caseColour == CaseColour.Dark}
	class:gray={$importantFactorySettings.caseColour == CaseColour.Gray}
	class:colourpaint={colourPaintMode != ColourPaintLayer.Off}
	class:multitab
	id="dobrynya-outline-miniv2"
	bind:this={theOutline}
	class:pocket
>
	<menu bind:this={tabs}>
		<!-- note that at lease one tab must have a selected class to work-->
		<!-- <button class="tab selected" on:click={retab}>Faders & Joystick</button> -->
		<!-- <button class="tab" on:click={retab}>Encoders & Pads</button> -->
	</menu>

	<ul bind:this={panes}>
		<!-- <li data-card="jopa"><PaneJopa /></li> -->
		<li data-card="pads">
			<PanePads
				{openEditor}
				{paintData}
				{currentPatch}
				{colourPaintMode}
				{colourPaintShowBank}
				{editorState}
			/>
		</li>
	</ul>

	{#if editorData}
		<div id="controleditor" class="controleditor" class:dead={!editorAlive}>
			<ControlEditor
				on:closeeditor
				currentPatch={currentPatch.data}
				{editorState}
				controlKind={editorControlKind}
				controlNumber={editorControlNumber}
				bind:this={controlEditor}
				{globalVelocity}
				{globalChannel}
				globalColours={currentPatch?.data?.padbanks?.[editorState.hand][
					editorState.bank
				].bank?.colour}
				scaleIsOn={currentKeyInfoToKey(
					currentPatch?.data?.padbanks?.[editorState.hand][
						editorState.bank
					]
				) !== false}
			/>
		</div>
	{/if}
</div>

<style>
	.dobrynya-outline {
		--tab-height: 2.4em;
		--tab-padding: calc(var(--tab-height) / 5);
		--size-value: 100vh;
		--outline-border-radius: calc(0.053 * var(--size-value));

		display: inline-block;
		position: relative;

		border-radius: var(--outline-border-radius);

		width: calc(0.8 * var(--size-value));
		height: calc(0.9 * var(--size-value));
		margin-bottom: calc(0.1 * var(--size-value));

		box-shadow:
			rgb(38, 46, 55) 1px 1px,
			rgb(38, 46, 55) 2px 2px,
			rgb(38, 46, 55) 3px 3px,
			rgb(38, 46, 55) 4px 4px,
			rgb(38, 46, 55) 5px 5px,
			rgb(38, 46, 55) 6px 6px,
			rgb(38, 46, 55) 7px 7px,
			rgb(38, 46, 55) 8px 8px,
			rgb(38, 46, 55) 9px 9px,
			rgb(38, 46, 55) 10px 10px,
			rgb(38, 46, 55) 11px 11px,
			rgb(38, 46, 55) 12px 12px,
			rgb(38, 46, 55) 13px 13px,
			rgb(38, 46, 55) 14px 14px,
			rgb(38, 46, 55) 15px 15px,
			rgb(38, 46, 55) 16px 16px,
			rgb(38, 46, 55) 17px 17px,
			rgb(38, 46, 55) 18px 18px,
			rgb(38, 46, 55) 19px 19px,
			rgb(38, 46, 55) 20px 20px,
			rgb(38, 46, 55) 21px 21px,
			rgb(38, 46, 55) 22px 22px,
			rgb(38, 46, 55) 23px 23px,
			rgb(38, 46, 55) 24px 24px,
			rgb(38, 46, 55) 25px 25px,
			rgb(38, 46, 55) 26px 26px,
			rgb(38, 46, 55) 27px 27px,
			rgb(38, 47, 56) 28px 28px,
			rgb(39, 47, 57) 29px 29px,
			rgb(39, 48, 57) 30px 30px,
			rgb(40, 49, 58) 31px 31px,
			rgb(40, 49, 59) 32px 32px,
			rgb(41, 50, 60) 33px 33px,
			rgb(41, 50, 60) 34px 34px,
			rgb(42, 51, 61) 35px 35px,
			rgb(42, 52, 62) 36px 36px,
			rgb(43, 52, 63) 37px 37px,
			rgb(43, 53, 63) 38px 38px,
			rgb(44, 53, 64) 39px 39px,
			rgb(44, 54, 65) 40px 40px,
			rgb(45, 55, 66) 41px 41px;
	}

	.dobrynya-outline.pocket {
		--outline-border-radius: calc(0.02 * var(--size-value));
	}

	ul,
	li {
		display: block;
		margin: 0;
		padding: 0;
		position: relative;
		width: 100%;
		height: 100%;
		list-style: none;
	}

	ul {
		display: flex;
		scroll-snap-type: x mandatory;
		overflow: auto;
		z-index: 102; /* higher than tabs */

		background: linear-gradient(
			145deg,
			var(--outline-gradient1),
			var(--outline-gradient2)
		);

		border-radius: var(--outline-border-radius);
	}

	ul::-webkit-scrollbar {
		display: none;
	}

	li {
		scroll-snap-align: center;
		flex: 0 0 auto;
	}

	.dobrynya-outline:not(.multitab) menu {
		display: none;
	}

	.dobrynya-outline:not(.multitab) {
		margin-top: 0;
	}

	.dobrynya-outline.multitab {
		margin-top: var(--tab-height);
	}

	menu {
		position: absolute;
		margin: 0;
		top: calc(var(--tab-height) * -1 + var(--tab-padding));
		left: var(--outline-border-radius);
		display: flex;
		gap: 2em;
	}

	menu :nth-child(0) {
		z-index: 100;
	}

	menu :nth-child(1) {
		z-index: 99;
	}

	menu :nth-child(2) {
		z-index: 98;
	}

	menu :nth-child(3) {
		z-index: 97;
	}

	menu :nth-child(4) {
		z-index: 96;
	}

	menu .tab.selected {
		background-color: var(--outline-gradient1) !important;
		z-index: 101;
	}

	menu button {
		color: var(--outline-text-colour);
	}

	.tab {
		--tab-border-radius: 0.5em;
		--tab-border-colour: rgba(255, 255, 255, 0.1);

		cursor: pointer;

		background-color: hsl(
			from var(--outline-gradient1) h s calc(l / 1.3)
		) !important;

		position: relative;
		border-top: 1px solid var(--tab-border-colour);
		border-left: 1px solid var(--tab-border-colour);
		border-right: 1px solid var(--tab-border-colour);
		border-bottom: 1px transparent;
		border-radius: var(--tab-border-radius) var(--tab-border-radius) 0 0; /* Rounded top corners */
		font-size: 14px;
		text-align: center;
		height: var(--tab-height);
		padding: var(--tab-padding) 0;
		z-index: 6;
		box-sizing: border-box;
	}

	.tab::before,
	.tab::after {
		content: "";
		position: absolute;
		width: calc(
			var(--tab-height) + 0.5em
		); /* Adjust to match the angle size */
		height: var(--tab-height);
		background: inherit; /* Match tab background */
		z-index: -1;
		box-sizing: border-box;
		bottom: 0px;
		border-top: 1px solid var(--tab-border-colour); /* Subtle border */
	}

	.tab::before {
		border-left: 1px solid var(--tab-border-colour); /* Subtle border */
		left: calc(var(--tab-height) / -2 - 0.3em);
		border-radius: var(--tab-border-radius) 0 0 0; /* Rounded bottom left */
		transform: skewX(-45deg); /* Creates the angled sides */
	}

	.tab::after {
		right: calc(var(--tab-height) / -2 - 0.3em);
		transform: skewX(45deg); /* Creates the angled sides */
		border-radius: 0 var(--tab-border-radius) 0 0; /* Rounded bottom right */
	}

	#patternpreview,
	.patternpreview,
	.dobrynya-outline {
		--outline-gradient1: #fffff5;
		--outline-gradient2: var(--somewhat-yellow);
		--outline-text-colour: #3d3328;
	}
	.dobrynya-outline.dark {
		--outline-gradient1: #403a32;
		--outline-gradient2: #3d3328;
		--outline-text-colour: #d8c5b2;
	}
	.dobrynya-outline.gray {
		--outline-gradient1: #383838;
		--outline-gradient2: #313131;
		--outline-text-colour: #8e8e8e;
	}

	:global(.dobrynya-outline.colourpaint .colourablecontrol) {
		cursor: var(--colourpaint-cursor), pointer;
	}
</style>
