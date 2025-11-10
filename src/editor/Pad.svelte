<script lang="ts">
	import {
		hexToCSS,
		gracefulGetColour,
		ColourPaintLayer,
		colourOff,
	} from "../ts/colour_utils.svelte";
	import type { BranchControl } from "../ts/types_patch";
	import { Control } from "../ts/types";
	import type { ColourArray, HexColour } from "../ts/types";
	import { filterInvoke } from "../ts/event_helpers";
	import type { InvokeControlData } from "../ts/event_helpers";
	import InnerControl from "./InnerControl.svelte";

	import { deviceDefinition } from "../ts/device";

	let {
		openEditor,
		onPaint,
		colourPaintShowBank,
		colourPaintMode,
		controlNo,
		data,
		pattern,
		globalColours,
		isKeyOfScale = false,
		scaleNote = 0,
	}: {
		openEditor: (element: HTMLElement, kind: Control, i: number) => void;
		onPaint: (data: InvokeControlData) => void;
		colourPaintShowBank: boolean;
		colourPaintMode: ColourPaintLayer;
		controlNo: number;
		data: BranchControl | null;
		pattern: number;
		globalColours: number[];
		isKeyOfScale: boolean;
		scaleNote: number;
	} = $props();

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
		if (!theDiv) {
			throw new Error("Pad's div has not been defined");
		}

		if (colourPaintMode != ColourPaintLayer.Off) {
			// colour paint
			if (evType != "click" && evButtons & 0x1) {
				let dispatchData: InvokeControlData = {
					controlKind: Control.Pad,
					target: theDiv,
					controlNo: controlNo,
					hex: hex,
					ultimateHex: ultimateHex,
					altKey: evAltKey,
					shiftKey: evShiftKey,
				};
				onPaint(dispatchData);
			}
		} else {
			if (evType != "click") {
				return; // mouseover?
			}
			openEditor(theDiv, Control.Pad, controlNo);
			return;
		}
	}

	function invokeControl(ev: CustomEvent<InvokeControlData>) {
		filterInvoke(ev, Control.Pad, controlNo, () => sendEvent("click"));
	}

	let colourpaint = $derived<boolean>(
		colourPaintMode != ColourPaintLayer.Off
	);
	let padColours = $derived<ColourArray>(data?.colour ?? []);
	let activeColour = $derived<string>(
		hexToCSS(
			gracefulGetColour(1, padColours, globalColours, isKeyOfScale).hex
		)
	);
	let normalColour = $derived<string>(
		hexToCSS(
			gracefulGetColour(0, padColours, globalColours, isKeyOfScale).hex
		)
	);

	let cherry = $derived(
		$deviceDefinition.model.code!.includes("pocket") ||
			$deviceDefinition.model.code!.includes("aurora")
	);
	let sharp = $derived($deviceDefinition.model.code!.includes("sharp"));

	let hex = $derived.by<HexColour>(() => {
		if (colourpaint) {
			if (colourPaintMode != ColourPaintLayer.Pattern) {
				return padColours[colourPaintMode] ?? colourOff;
			} else {
				return pattern;
			}
		}

		return colourOff;
	});

	let theDiv = $state<HTMLDivElement>();

	interface Derivision {
		ultimateHex: number;
		nocolour: boolean;
		backgroundColour: string;
		colourpaintColour: string;
	}

	let { ultimateHex, nocolour, backgroundColour, colourpaintColour } =
		$derived.by<Derivision>(() => {
			if (!colourpaint) {
				return {
					ultimateHex: 0,
					nocolour: false,
					backgroundColour: "",
					colourpaintColour: "transparent",
				};
			}

			let backgroundHex: HexColour;
			let backgroundColour: string;
			let colourpaintColour: string;
			let ultimateHex: HexColour;
			let nocolour: boolean;

			if (colourPaintMode != ColourPaintLayer.Pattern) {
				const result = gracefulGetColour(
					colourPaintMode,
					padColours,
					colourPaintShowBank ? globalColours : [],
					isKeyOfScale,
					false
				);
				backgroundHex = ultimateHex = result.hex;
				nocolour = result.noColour;
			} else {
				backgroundHex = ultimateHex = pattern;
				nocolour = backgroundHex == colourOff;
			}

			if ((ultimateHex & 0xf) == 0) ultimateHex = 0;

			colourpaintColour = hexToCSS(
				backgroundHex == colourOff ? 0 : backgroundHex
			);
			backgroundColour = `background-color: ${colourpaintColour}`;

			return {
				ultimateHex,
				nocolour,
				backgroundColour,
				colourpaintColour,
			};
		});
</script>

<svelte:body oninvoke={invokeControl} />

<!-- svelte-ignore a11y_mouse_events_have_key_events --><!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	role="button"
	tabindex="0"
	bind:this={theDiv}
	onclick={customClick}
	onmouseover={customClick}
	onmousedown={customClick}
	class:nocolour
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

	.dobrynya-pad:not(.colourpaint) {
		background: linear-gradient(145deg, #292c34, #22252c);
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
