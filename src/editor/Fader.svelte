<script lang="ts">
	import { type BranchControl } from "../ts/types_patch";

	import InnerControl from "./InnerControl.svelte";

	let data: BranchControl | null = null;
</script>

<div class="fader-overall">
	<div class="fader-track">
		<div class="track"></div>
	</div>
	<div class="thumb-container">
		<div class="thumb">
			{#if data}<InnerControl />{/if}
		</div>
		<div class="thumb-shadow"></div>
	</div>
</div>

<style>
	div.fader-overall {
		margin: calc(0.01 * var(--size-value));
		width: calc(0.155 * var(--size-value));
		height: calc(0.155 * 2 * var(--size-value));
		display: flex;
		position: relative;
	}

	.track {
		height: 100%;
		width: 0.5em;
		background-color: silver;
		box-shadow: 0.1em 0.1em 0.2em black inset;
	}

	.fader-track {
		display: flex;
		position: relative;
		width: 100%;
		align-items: center;
		justify-content: center;
	}

	.thumb-container {
		position: absolute;
		top: 0;
		left: 15%;
		width: 70%;
		height: calc(0.06 * var(--size-value));
	}

	.thumb-shadow,
	.thumb {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
	}

	.thumb-shadow {
		background-color: transparent;
		border-radius: 0.6em;
		box-shadow:
			rgba(0, 0, 0, 0.01) 1px 1px,
			rgba(0, 0, 0, 0.01) 2px 2px,
			rgba(0, 0, 0, 0.01) 3px 3px,
			rgba(0, 0, 0, 0.01) 4px 4px,
			rgba(0, 0, 0, 0.01) 5px 5px,
			rgba(0, 0, 0, 0.01) 6px 6px,
			rgba(0, 0, 0, 0.01) 7px 7px,
			rgba(0, 0, 0, 0.01) 8px 8px,
			rgba(0, 0, 0, 0.01) 9px 9px,
			rgba(0, 0, 0, 0.01) 10px 10px,
			rgba(0, 0, 0, 0.01) 11px 11px,
			rgba(0, 0, 0, 0.01) 12px 12px,
			rgba(0, 0, 0, 0.01) 13px 13px,
			rgba(0, 0, 0, 0.01) 14px 14px,
			rgba(0, 0, 0, 0.01) 15px 15px,
			rgba(0, 0, 0, 0.01) 16px 16px,
			rgba(0, 0, 0, 0.01) 17px 17px,
			rgba(0, 0, 0, 0.01) 18px 18px,
			rgba(0, 0, 0, 0.01) 19px 19px,
			rgba(0, 0, 0, 0.01) 20px 20px,
			rgba(0, 0, 0, 0.01) 21px 21px,
			rgba(0, 0, 0, 0.01) 22px 22px,
			rgba(0, 0, 0, 0.01) 23px 23px,
			rgba(0, 0, 0, 0.01) 24px 24px,
			rgba(0, 0, 0, 0.01) 25px 25px,
			rgba(0, 0, 0, 0.01) 26px 26px,
			rgba(0, 0, 0, 0.01) 27px 27px,
			rgba(0, 0, 0, 0.01) 28px 28px,
			rgba(0, 0, 0, 0.01) 29px 29px,
			rgba(0, 0, 0, 0.01) 30px 30px,
			rgba(0, 0, 0, 0.01) 31px 31px,
			rgba(0, 0, 0, 0.01) 32px 32px,
			rgba(0, 0, 0, 0.01) 33px 33px,
			rgba(0, 0, 0, 0.01) 34px 34px,
			rgba(0, 0, 0, 0.01) 35px 35px,
			rgba(0, 0, 0, 0.01) 36px 36px,
			rgba(0, 0, 0, 0.01) 37px 37px,
			rgba(0, 0, 0, 0.01) 38px 38px,
			rgba(0, 0, 0, 0.01) 39px 39px,
			rgba(0, 0, 0, 0.01) 40px 40px,
			rgba(0, 0, 0, 0.01) 41px 41px;
	}

	.thumb {
		border-radius: 0.3em;
		border: 0.1em solid;
		border-top: 0.5em solid rgba(255, 255, 255, 0.1);
		border-left: 0.15em solid rgba(255, 255, 255, 0.1);
		border-right: 0.15em solid rgba(0, 0, 0, 0.2);
		border-bottom: 0.5em solid rgba(0, 0, 0, 0.2);
		background-color: rgb(30, 30, 30);
		z-index: 120;
		color: var(--somewhat-yellow);
		stroke: var(--somewhat-yellow);
		font-size: calc(0.03 * var(--size-value));
	}
</style>
