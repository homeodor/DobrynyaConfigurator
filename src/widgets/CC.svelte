<script lang="ts">
	export let isRelative: boolean = false;
</script>
<svg version="1.1" class="ccicon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 64 64" style="enable-background:new 0 0 64 64;" xml:space="preserve">
{#if isRelative }
	<line class="st0" x1="38.1" y1="24.8" x2="25.9" y2="24.8"/>
	<line class="st0" x1="38.1" y1="43.3" x2="25.9" y2="43.3"/>
	<line class="st0" x1="32" y1="18.7" x2="32" y2="30.9"/>
{:else}
	<line class="st0" x1="34.8" y1="27.3" x2="40.4" y2="17.9"/>
{/if}
	<circle class="st0" cx="32" cy="32" r="27.8"/>
</svg>