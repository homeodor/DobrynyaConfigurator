<script lang="ts">
	import overridable from '../../i/overridable.svg'
	import override from '../../i/override.svg'

	export let isGlobal: boolean = false;
	export let title: string = isGlobal ? "This setting can be overriden" : "Overrides a higher-level setting";
	
	let src = isGlobal ? overridable : override;
</script>
<img alt="(Overridable)" {src} class="override override-small" {title} />