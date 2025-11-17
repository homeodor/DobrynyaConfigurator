<script lang="ts">
	export interface NudgeDispatch {
		value: number;
	}

	export interface ValueDispatch {
		value: string;
		prevValue?: string;
		inline?: HTMLSpanElement;
	}

	export interface ScrubDispatch {
		distance: number;
	}

	let {
		value = $bindable(),
		disabled = false,
		width = "auto",
		verticalalign = "auto",
		display = "inline-block",
		requireEnter = false,
		scrubbable = false,
		nudgeMagnitude = 1,
		validatorFunction = () => true,
		onchange = () => {},
		oncancel = () => {},
		oninput = () => {},
		onnudge = () => {},
		onscrubbegin = () => {},
		onscrubend = () => {},
		onscrubcancel = () => {},
		onscrub = () => {},
	}: {
		value: string;
		disabled?: boolean;
		width?: string;
		verticalalign?: string;
		display?: string;
		requireEnter?: boolean;
		scrubbable?: boolean;
		nudgeMagnitude?: number;
		validatorFunction?: (v: any) => boolean;
		onchange?: () => void;
		oncancel?: (v: ValueDispatch) => void;
		oninput?: (v: ValueDispatch) => void;
		onnudge?: (v: NudgeDispatch) => void;
		onscrubbegin?: () => void;
		onscrubend?: () => void;
		onscrubcancel?: () => void;
		onscrub?: (v: ScrubDispatch) => void;
	} = $props();

	let prevValue = $state(value);
	let laskKey: string | null = null;

	let theInline: HTMLSpanElement | null = null;
	let doNotSend: boolean = false;

	export function isActive(): boolean {
		return document.activeElement == theInline;
	}

	function keypress(ev: KeyboardEvent) {
		if (ev.key == "Enter" || ev.key == "Escape") {
			if (ev.key == "Escape") {
				doNotSend = true;
				value = prevValue;
			}

			laskKey = ev.key;

			theInline?.blur(); // onblur fires → maybeDispatch
			ev.stopPropagation();
			onchange();
		}
		if (ev.key == "ArrowDown" || ev.key == "ArrowUp") {
			onnudge({
				value: ev.key == "ArrowUp" ? nudgeMagnitude : -nudgeMagnitude,
			});

			ev.stopPropagation();
			ev.preventDefault;
		}
	}

	function maybeDispatch() {
		if (!theInline) {
			throw new Error("Inline element has not been defined");
		}

		if (doNotSend) {
			doNotSend = false;
			oncancel({
				value: value,
				prevValue: prevValue,
				inline: theInline,
			});
		} else {
			oninput({
				value: value,
				prevValue: prevValue,
				inline: theInline,
			});
		}
	}

	function blur() {
		if ((requireEnter && laskKey != "Enter") || !isValid) {
			doNotSend = true;
			value = prevValue;
		}

		maybeDispatch();

		isValid = true;
	}

	const valueChangeSafeMargin = 5;
	const scrubCoeff = 3;

	let valueChangeEnaged = false;
	let valueChangeAllowed = false;
	let pixelDistance = 0;
	let originX = 0;
	let originY = 0;

	function pyfagorus(w: number, h: number) {
		let plusMinus = 1;

		if (
			(w < 0 && Math.abs(w) > Math.abs(h)) ||
			(h > 0 && Math.abs(h) > Math.abs(w))
		) {
			plusMinus = -1;
		}

		return plusMinus * Math.round(Math.sqrt(w ** 2 + h ** 2));
	}

	function mouseDown(ev: MouseEvent) {
		ev.preventDefault();
		ev.stopPropagation();

		if (!scrubbable) {
			return;
		}

		valueChangeEnaged = true;
		valueChangeAllowed = false;

		document.addEventListener("mousemove", maybeChangeValue);
		document.addEventListener("mouseup", releaseValueChange);
		document.addEventListener("keydown", cancelScrub);

		pixelDistance = 0;
		originX = ev.pageX;
		originY = ev.pageY;
	}

	function cancelScrub(ev: KeyboardEvent) {
		if (ev.key == "Escape" && valueChangeAllowed) {
			onscrubcancel();
			releaseValueChange();
		}
	}

	function maybeChangeValue(ev: MouseEvent) {
		if (!valueChangeEnaged) {
			return;
		}

		pixelDistance = pyfagorus(ev.pageX - originX, ev.pageY - originY);
		if (pixelDistance > valueChangeSafeMargin) {
			document.body.classList.add("scrubber");
			valueChangeAllowed = true;
			onscrubbegin();
		}

		if (!valueChangeAllowed) {
			return;
		}

		console.log("Scrub", pixelDistance);

		onscrub({ distance: Math.round(pixelDistance / scrubCoeff) });
	}

	function releaseValueChange() {
		valueChangeEnaged = false;
		document.body.classList.remove("scrubber");
		document.removeEventListener("mousemove", maybeChangeValue);
		document.removeEventListener("mouseup", releaseValueChange);
		document.removeEventListener("keydown", cancelScrub);
		onscrubend();
	}

	function click() {
		if (!theInline) {
			throw new Error("Inline element has not been defined");
		}

		theInline.focus();
		releaseValueChange();
	}

	function focus(ev: FocusEvent) {
		if (!theInline) {
			throw new Error("Inline element has not been defined");
		}

		laskKey = null;

		if (disabled) {
			doNotSend = true;
			ev.preventDefault();
			ev.stopPropagation();
			theInline.blur();
			return false;
		}

		prevValue = theInline.textContent!;

		const range = document.createRange();
		const sel = window.getSelection();

		range.selectNodeContents(theInline);
		sel?.removeAllRanges();
		sel?.addRange(range);

		ev.stopPropagation();
	}

	let isValid = $derived(theInline ? validatorFunction(value) : true);
</script>

<!-- <svelte:document on:mouseover={maybeChangeValue} on:mouseup={releaseValueChange}></svelte:body> -->

<span
	style="width:{width}; display:{display}; vertical-align:{verticalalign}"
	role="textbox"
	contenteditable
	class:invalid={!isValid && prevValue != value}
	class:disabled
	tabindex="0"
	class="inline-editable-new"
	bind:this={theInline}
	bind:textContent={value}
	onkeydown={keypress}
	onfocus={focus}
	onblur={blur}
	onclick={click}
	onmousedown={mouseDown}
></span>

<style>
	.inline-editable-new:not(:focus) {
		line-height: 1.4em;
		cursor: pointer;
		color: #00eaff;
		border: 2px transparent;
		border-bottom-style: dotted;
		border-bottom-width: 1px;
		border-bottom-color: rgba(0, 234, 255, 0.7);
		text-decoration: none;
		background-color: transparent;
	}
	.inline-editable-new:focus {
		background: white;
		border: 1px solid silver;
		color: black;
		padding: 0em 0.2em;
	}
	.inline-editable-new.disabled {
		color: #999;
		border-bottom-color: #999;
	}
	.inline-editable-new.invalid {
		background-color: rgb(255, 238, 160);
		box-shadow:
			rgb(228, 218, 83) 3px 3px 5px,
			rgb(228, 218, 83) -3px -3px 5px,
			rgb(228, 218, 83) -3px 3px 5px,
			rgb(228, 218, 83) 3px -3px 5px;
	}
</style>
