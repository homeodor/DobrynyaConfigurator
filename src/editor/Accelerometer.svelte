<script lang="ts">
	import { type BranchControl } from "src/ts/types_patch";
	import accelArrow from "../../i/accel-arrow.svg";

	import InnerControl from "./InnerControl.svelte";
	import { createEventDispatcher } from "svelte";
	import { Control } from "src/ts/types";

	export let dataAll: BranchControl[];

	if (typeof dataAll == "undefined") {
		dataAll = [{}, {}];
	}

	const dispatch = createEventDispatcher();

	function dispatchClick(ev) {
		const element = ev.currentTarget as HTMLElement;
		const index = Array.from(
				document.querySelectorAll(".accelerometer .axis")
			).indexOf(element);
		const control = index ? Control.AccelY : Control.AccelX;

		dispatch("click", {
			accelElement: element,
			index,
			control,
		});
	}
</script>

<fieldset class="accelerometer-uber-container">
	<legend>Tilt</legend>
	<div class="accelerometer-container">
		<div class="accelerometer">
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div class="axis" on:click={dispatchClick}>
				<div>X <img src={accelArrow} alt="accelerometer" /></div>
				<div class="axis-value">
					<InnerControl showEmpty={true} data={dataAll[0]} />
				</div>
			</div>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div class="axis axis-vertical" on:click={dispatchClick}>
				<div>Y <img src={accelArrow} alt="accelerometer" /></div>
				<div class="axis-value">
					<InnerControl showEmpty={true} data={dataAll[1]} />
				</div>
			</div>
		</div>
	</div>
</fieldset>

<style>
	fieldset {
		position: relative;
		margin-left: 1em;
		padding: 0 0.8em 0.5em 0.8em;
		border-color: rgba(92, 92, 92, 0.14);
		background-color: rgba(0, 0, 0, 0.08);
		border-width: 3px;
		width: auto;
	}

	fieldset::after {
		content: "";
		position: absolute;
		right: -2.5em;
		width: 2.5em;
		top: 40%;
		height: 0;
		border-bottom: 3px groove rgba(0, 0, 0, 0.17);
		z-index: 3;
	}

	legend {
		color: var(--somewhat-yellow);
		font-size: 1em;
		opacity: 0.7;
	}

	div.accelerometer-uber-container {
		position: relative;
		padding: 2em;
	}

	div.accelerometer-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
	}

	div.accelerometer {
		position: relative;
		height: 100%;
		flex: 1 1 auto;
		/* border: 1px dotted var(--somewhat-yellow);
        background-color: rgba(255,255,255,0.1); */
	}

	div.axis {
		display: flex;
		white-space: nowrap;
		color: var(--somewhat-yellow);
		stroke: var(--somewhat-yellow);
	}

	div.axis-value {
		font-size: 1.1rem;
		min-width: 3em;
	}

	.axis {
		cursor: pointer;
		height: calc(0.014 * 2 * var(--size-value));
		align-items: center;
	}

	.axis-vertical img {
		transform: rotate(90deg);
	}

	div img {
		height: 0.8em; /* reference value */
		height: calc(0.014 * var(--size-value));
	}
</style>
