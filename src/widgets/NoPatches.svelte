<svelte:options accessors/>

<script lang="ts">
	import OkCancel from './OkCancel.svelte';
	import type { NoPatchesObject } from 'types';
	import { NewPatchDecision } from 'types';
	import { defaultPatches } from 'defaultpatches';
	import type { DefaultPatchDescriptor } from 'defaultpatches';
	
	import { deviceDefinition } from 'device';

	let okText = "OK";
	let cancelText = "Cancel";
	
	let dialog: HTMLDialogElement;
	let resolveFunction: (value: NoPatchesObject) => void;
	let useCleanSlate: NewPatchDecision = NewPatchDecision.Template;
	let useTemplate: DefaultPatchDescriptor;
	
	let cancelFunction = ()=>resolveFunction({ decision: NewPatchDecision.Cancel, template: "", filename: "" });
	let okayFunction = () => {
		
		resolveFunction(
		{
			decision: useCleanSlate,
			template: useTemplate.id,
			filename: useCleanSlate == NewPatchDecision.CleanSlate ? "New 1" : useTemplate.filename
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
	{#if $deviceDefinition?.model?.code && defaultPatches[$deviceDefinition.model.code] }

		<label><input type="radio" bind:group={useCleanSlate} value={NewPatchDecision.Template} /> Default patch:<br />
		<select disabled="{useCleanSlate != NewPatchDecision.Template}" bind:value={useTemplate} style="width:auto">
		{#each defaultPatches[$deviceDefinition.model.code] as defpatch }
			<option value={defpatch}>{defpatch.name}</option>
		{/each}
		</select>
		</label><br />

	{/if}
		<label><input type="radio" bind:group={useCleanSlate} value={NewPatchDecision.CleanSlate} /> Create an empty patch</label><br />
		<label><input type="radio" bind:group={useCleanSlate} value={NewPatchDecision.DiskMode} /> Go to Disk mode</label>
	<!-- //				{/if} -->
	</div>
	<OkCancel theDialog={dialog} on:ok={okayFunction} on:cancel={cancelFunction} {okText} {cancelText} />

	</div>
</dialog>