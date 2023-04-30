<svelte:options accessors/>

<script lang="ts">
	import OkCancel from './OkCancel.svelte';
	import type { StatusResult, NoPatchesObject } from 'types';
	import { NewPatchDecision } from 'types';
	import { defaultPatches } from 'defaultpatches';
		
	export let device: StatusResult;

	let okText = "OK";
	let cancelText = "Cancel";
	
	let dialog: HTMLDialogElement;
	let resolveFunction: (value: NoPatchesObject) => void;
	let useCleanSlate: NewPatchDecision;
	let useTemplate: string;
	
	let cancelFunction = ()=>resolveFunction({ decision: NewPatchDecision.Cancel, template: "" });
	let okayFunction = () => {
		
		resolveFunction(
		{
			decision: useCleanSlate,
			template: useTemplate
		});
	}
	
	export function confirm(): Promise<NoPatchesObject>
	{
		console.warn("OPENED DIALOG");
		dialog.showModal();
		return new Promise((resolve,_)=>resolveFunction = resolve);
	};
	
</script>
<dialog bind:this={dialog} class="prompt-or-alert">
	<div>
	<p>This device has no patches. To use this configurator, you must have at least one patch. Which one do you want to upload?</p>
	
	<div class="checkboxblock">
	{#if device?.model?.code && defaultPatches[device.model.code] }
	<p>
		<label><input type="radio" bind:group={useCleanSlate} value={NewPatchDecision.Template} /> Default patch:<br />
		<select disabled="{useCleanSlate != NewPatchDecision.Template}" bind:value={useTemplate} style="width:auto">
		{#each defaultPatches[device.model.code] as defpatch }
			<option value="{defpatch.id}">{defpatch.name}</option>
		{/each}
		</select>
		</label>
	</p>
	{/if}
		<p><label><input type="radio" bind:group={useCleanSlate} value={NewPatchDecision.CleanSlate} /> Create an empty patch</label></p>
		<p><label><input type="radio" bind:group={useCleanSlate} value={NewPatchDecision.DiskMode} /> Go to Disk mode</label></p>
	<!-- //				{/if} -->
	</div>
	<OkCancel theDialog={dialog} on:ok={okayFunction} on:cancel={cancelFunction} {okText} {cancelText} />

	</div>
</dialog>