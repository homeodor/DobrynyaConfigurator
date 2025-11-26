<script lang="ts">
	export let checked: boolean;
</script>

<label
	><input type="checkbox" class="appleswitch" on:input bind:checked /><mark
	></mark>
	<slot></slot></label
>
