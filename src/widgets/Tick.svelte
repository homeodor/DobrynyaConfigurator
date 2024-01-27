<script lang="ts">
	export let animated = false;
	
	let tick: SVGElement;
	
	export function reAnimate()
	{
		if (!tick) return; // may happen when invoked out of editor
		
		if (!animated)
		{
			tick.setAttribute('class', "");
			return;
		}
		
		tick.setAttribute("class", "animated");
		
		setTimeout(()=>tick?.setAttribute("class", ""), 3000);
	}
</script>
<style type="text/css">
	

</style>
<svg bind:this={tick} version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve">

<g>
	<path d="M156.5,351.1l-85.8-86.5l58.1-60.9l87.2,87.9l169.9-170.6l58.1,60.9L275.5,351.1L216,410.6L156.5,351.1z"/>
</g>
</svg>
