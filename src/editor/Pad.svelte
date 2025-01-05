<script lang="ts">
	import {
		hexToCSS,
		gracefulGetColour,
		ColourPaintLayer,
		colourOff,
	} from "colour_utils";
	import type { BranchControl } from "types_patch";
	import { Control } from "types";
	import type { HexColour } from "types";
	import { filterInvoke } from "event_helpers";
	import type {
		InvokeControlEvent,
		InvokeControlEventData,
	} from "event_helpers";
	import InnerControl from "./InnerControl.svelte";

	import { createEventDispatcher } from "svelte";
	import { deviceDefinition } from "src/ts/device";

	export let colourPaintShowBank: boolean;
	export let colourPaintMode: ColourPaintLayer;

	export let controlNo: number;
	export let data: BranchControl;

	export let pattern: number;
	export let globalColours: number[];
	export let isKeyOfScale: boolean = false;
	export let scaleNote: number = 0;

	let dispatch = createEventDispatcher();

	let cherry = false;
	let sharp = false;

	let padColours = [];

	let activeColour: string = "transparent";
	let normalColour: string = "transparent";
	let backgroundColour: string = "transparent";
	let colourpaintColour: string = "transparent";

	let colourpaint: boolean = colourPaintMode != ColourPaintLayer.Off;

	let moreData: { noColour: boolean } = { noColour: false };

	let hex = colourOff;
	let ultimateHex = 0;

	let theDiv: HTMLDivElement;

	function customClick(ev: MouseEvent) {
		sendEvent(ev.type, ev.buttons, ev.altKey, ev.shiftKey);
		ev.stopPropagation();
	}

	function sendEvent(
		evType: string,
		evButtons: number = 0,
		evAltKey: boolean = false,
		evShiftKey: boolean = false
	) {
		let eventToDispatch: string = "";

		if (colourPaintMode != ColourPaintLayer.Off) {
			// colour paint
			if (evType != "click" && evButtons & 0x1) eventToDispatch = "paint";
		} else {
			if (evType != "click") return; // mouseover?
			eventToDispatch = "click";
		}

		if (!eventToDispatch) return;

		let dispatchData: InvokeControlEventData = {
			controlKind: Control.Pad,
			target: theDiv,
			controlNo: controlNo,
			hex: hex,
			ultimateHex: ultimateHex,
			altKey: evAltKey,
			shiftKey: evShiftKey,
		};

		dispatch(eventToDispatch, dispatchData);
	}

	function invokeControl(ev: InvokeControlEvent) {
		filterInvoke(ev, Control.Pad, controlNo, () => sendEvent("click"));
	}

	$: {
		colourpaint = colourPaintMode != ColourPaintLayer.Off;

		padColours = [];

		if (data?.colour) padColours = data.colour;

		activeColour = hexToCSS(
			gracefulGetColour(1, padColours, globalColours, isKeyOfScale)
		);
		normalColour = hexToCSS(
			gracefulGetColour(0, padColours, globalColours, isKeyOfScale)
		);

		moreData.noColour = false;

		if (colourpaint) {
			let backgroundHex: HexColour;

			if (colourPaintMode != ColourPaintLayer.Pattern) {
				backgroundHex = ultimateHex = gracefulGetColour(
					colourPaintMode,
					padColours,
					colourPaintShowBank ? globalColours : [],
					isKeyOfScale,
					false,
					moreData
				);
				hex = padColours[colourPaintMode] ?? colourOff;
			} else {
				backgroundHex = hex = ultimateHex = pattern;
			}

			if ((ultimateHex & 0xf) == 0) ultimateHex = 0;

			colourpaintColour = hexToCSS(
				backgroundHex == colourOff ? 0 : backgroundHex
			);
			backgroundColour = `background-color: ${colourpaintColour}`;
		} else {
			hex = colourOff; // not needed in non-colourpaint
			ultimateHex = 0; // same
			backgroundColour = "";
			colourpaintColour = "transparent";
		}
		//
		// console.log(moreData.noColour);
		// console.log(activeColour, normalColour, backgroundColour, isColourPaint, colourPaintMode);

		cherry =
			$deviceDefinition.model.code.includes("pocket") ||
			$deviceDefinition.model.code.includes("aurora");
		sharp = $deviceDefinition.model.code.includes("sharp");
	}
	//
	// console.log("DATA IS ", data)
</script>

<svelte:body on:invoke={invokeControl} />

<!-- svelte-ignore a11y-mouse-events-have-key-events --><!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	bind:this={theDiv}
	on:click={customClick}
	on:mouseover={customClick}
	on:mousedown={customClick}
	class:nocolour={moreData.noColour}
	class="dobrynya-pad editablecontrol colourablecontrol"
	class:colourpaint
	class:sharp
	class:cherry
	style="{backgroundColour}; --normal-colour: {normalColour}; --active-colour: {activeColour}; --colourpaint-colour: {colourpaintColour}"
	class:ramp={data?.midi?.rampu || data?.midi?.rampd}
>
	{#if cherry}
		<div class="cherry-light"></div>
	{/if}

	{#if data && !colourpaint}
		<InnerControl {data} {scaleNote} />
	{/if}
</div>

<style>
	:global(.dobrynya-pad) {
		box-shadow:
			17px 17px 34px #bdb4a9,
			-17px -17px 34px #fffff3;
		border-width: 12px;
		border-style: solid;
		margin: calc(0.01 * var(--size-value));
		width: calc(0.155 * var(--size-value));
		height: calc(0.155 * var(--size-value));
		border-radius: calc((0.155 / 2) * var(--size-value));
		color: var(--somewhat-yellow);
		stroke: var(--somewhat-yellow);
		font-size: calc(0.03 * var(--size-value));
		transition: border-color linear 0s;
	}

	:global(.dark .dobrynya-pad) {
		box-shadow:
			17px 17px 34px #2d1f0ead,
			-17px -17px 34px #5f503fd6;
	}

	:global(.gray .dobrynya-pad) {
		box-shadow:
			17px 17px 34px #1b1b1bad,
			-17px -17px 34px #525252d6;
	}

	.dobrynya-pad.sharp {
		border-radius: calc((0.07 / 2) * var(--size-value));
	}

	.dobrynya-pad.cherry {
		position: relative;
		border-radius: calc((0.04 / 2) * var(--size-value));
		border-top-color: var(--glow-colour);
		border-left-color: var(--glow-colour);
		border-bottom-color: hsl(from var(--glow-colour) h s calc(l * 0.7));
		border-right-color: hsl(from var(--glow-colour) h s calc(l * 0.7));
		border-bottom-width: 24px;
	}

	.dobrynya-pad.cherry {
		background-color: var(--normal-colour);
	}

	.dobrynya-pad.cherry:hover {
		background-color: var(--active-colour);
	}

	:global(.dobrynya-pad.cherry.colourpaint) {
		--glow-colour: var(--colourpaint-colour);
	}

	:global(.dobrynya-pad.cherry:not(.colourpaint)) {
		--glow-colour: var(--normal-colour);
	}

	:global(.dobrynya-pad.cherry:not(.colourpaint):hover) {
		--glow-colour: var(--active-colour);
	}

	:global(.dobrynya-pad.cherry) {
		box-shadow:
			17px 17px 34px rgb(from var(--glow-colour) r g b / 0.1),
			-17px 17px 34px rgb(from var(--glow-colour) r g b / 0.1),
			17px -17px 34px rgb(from var(--glow-colour) r g b / 0.1),
			-17px -17px 34px rgb(from var(--glow-colour) r g b / 0.1);
	}

	div.colourpaint {
		border-width: 0 !important;
	}

	div:not(.cherry) {
		border-color: var(--normal-colour);
	}

	div:not(.cherry):hover {
		border-color: var(--active-colour);
	}
</style>
