<style>
	.pianoroll { position:relative; display:inline-block }
	.pianorollwhite { position:relative; display:flex; z-index: 1; }
	.pianorollblack { position:absolute; left:0; top:0; display: flex; z-index: 2 }
	.whitekey { width:calc(0.04 * var(--size-value)); height:calc(0.13 * var(--size-value)); border:1px solid #e6e6e6; background:var(--white-gradient); }
	.whitekey:first-child { border-radius:0.5em 0 0 0.5em }
	.whitekey:last-child, .whitekey.roundedkey, .octave10 .keyG  { border-radius:0 0.5em 0.5em 0 }
	.blackkey { margin-left: calc(0.019 * var(--size-value)); width:calc(0.024 * var(--size-value)); height:calc(0.074 * var(--size-value)); background-color:rgb(63, 63, 63); border-radius:0 0 0.2em 0.2em }
	.blackkey.csharp { margin-left: calc(0.026 * var(--size-value));  }
	.blackkey.fsharp { margin-left: calc(0.052 * var(--size-value)) }
	.pianorollkey { cursor:pointer }
	.pianoroll:not(.disabled) .thekey { background: var(--accent-gradient); border:none }
	.pianoroll:not(.disabled) .thescalekey { background: var(--striped-gradient), var(--white-gradient); border:none }
	.octave10 .notonoctave10 { visibility:hidden; }
</style>

<script lang="ts">
//	const jQ = window.$;
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
	
	const whiteKeys: number[] = [0,2,4,5,7,9,11];
	const whiteKeyLetter: string[] = ['C','D','E','F','G','A','B'];
	const whiteKeyClasses: string[] = ['','','','','keyG','keyA notonoctave10', 'notonoctave10'];
	const blackKeys: number[] = [1,3,6,8,10];
	const blackKeyLetter: string[] = ['C♯','D♯','F♯','G♯','A♯'];
	const blackKeyClasses: string[] = ['csharp','','fsharp','notonoctave10','notonoctave10'];

	export let octave: number = 0;
	export let disabled: boolean = false;
	export let musicKey: number = -1;
	export let musicScaleKey: number = -1;
	
	function setAndDispatch(v: number, altKey: boolean = false)
	{
		musicKey = v;
		dispatch("input", {value:musicKey, altKey: altKey})
	}
	
	$: {
		if (octave >= 10 && musicKey > 7) setAndDispatch(7);
	}
	
	function setMusicKey(el: HTMLDivElement, altKey: boolean)
	{
		setAndDispatch(
			(parseInt(el.dataset.key) == musicKey && !altKey) ? -1 : parseInt(el.dataset.key),
			altKey
		);
	}
</script>

<div class="pianoroll" class:disabled class:octave10={octave == 10}>
	<div class="pianorollwhite">
	{#each whiteKeys as theKey, k}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div on:click="{(ev) => setMusicKey(ev.currentTarget, ev.altKey)}" class:hh="{k > 7 && octave >= 10}" class:thescalekey="{musicScaleKey === theKey && musicKey < 0}" class:thekey="{musicKey === theKey}" class="pianorollkey whitekey {whiteKeyClasses[k]}" data-key={theKey} title={whiteKeyLetter[k]}></div>
	{/each}	
	</div>
	<div class="pianorollblack">
	{#each blackKeys as theKey, k}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div on:click="{(ev) => setMusicKey(ev.currentTarget, ev.altKey)}" class:hh="{k > 7 && octave >= 10}" class:thescalekey="{musicScaleKey === theKey && musicKey < 0}" class:thekey="{musicKey === theKey}" class="pianorollkey blackkey {blackKeyClasses[k]}" data-key={theKey} title={blackKeyLetter[k]}></div>
	{/each}	
	</div>
</div>