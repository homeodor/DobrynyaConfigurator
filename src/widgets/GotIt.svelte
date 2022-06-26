<script>
	import Cookies from 'js-cookie';
	
	export let cookieName;
	
	let value;
	
	function set()
	{
		Cookies.set(cookieName, true);
		value = Cookies.get(cookieName);
		console.log(Cookies.get(), value);
	}
	
	$:{
		value = Cookies.get(cookieName);
		console.log("COOKIE", Cookies.get());
	}
</script>
<style>
	div.up, div.up > div { display:flex; }
	div.up > div { gap:1em; max-width: 70vh; margin:1em; padding:1em; border-radius:0.4rem; border: 1px solid var(--accent-colour); line-height: 1.7em; align-items: center; }
	button { white-space:nowrap }
	div.up { justify-content: center; width:100%;  }
	div.up > div > :first-child { flex-grow: 1; }
</style>
{#if !value}
<div class="up">
	<div>
		<div><slot></slot></div>
		<div><button on:click={set}>Got it</button></div>
	</div>
</div>
{/if}