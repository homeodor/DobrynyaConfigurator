<script lang="ts">

import { flagToArray, arrayToFlag } from "src/ts/data_utils";
import { sleep } from "src/ts/basic";
import { patchChanged } from "src/ts/event_helpers";
import * as utils from '../ts/bursts'

import Halp from "../widgets/Halp.svelte";
import PaletteCheckboxes from "../widgets/PaletteCheckboxes.svelte";

export let burst = 0;

let burstPrev = -1;
	
let burstFlagKind = [ false,false,false,false,false,false,false,false ];
let burstFlagPalette = [ false,false,false,false,false,false,false,false ];
let burstMode = -1;

async function patchChangedOverTick()
{
    await sleep(5);
    patchChanged();
}

$:
	{
		
		if (burstPrev != burst) // external change... probably in the beginning
		{
			burstPrev = burst;
			burstMode = utils.burstToMode(burst);
			flagToArray(burstFlagKind,    utils.burstToKindFlags(burst));
			flagToArray(burstFlagPalette, utils.burstToPaletteFlags(burst));
		} else {
			if (burstMode == 0)
			{
				burst = 0;
			} else {
				if (burstPrev == 0) // has been set to zero
				{
					// check if anything has been enabled. If not, apply meaningful defaults
					if (!burstFlagPalette.includes(true)) burstFlagPalette.forEach((_,k) => burstFlagPalette[k] = true);
					if (!burstFlagKind.includes(true)) burstFlagKind[0] = true;
				}
				
				burst = utils.parametersToBurst(burstMode, arrayToFlag(burstFlagKind), arrayToFlag(burstFlagPalette));
			}
			
			if (burstPrev != burst) patchChangedOverTick();
			
			burstPrev = burst;
		}
	}
</script>

<fieldset>
    <legend>Bursts
        <Halp>A “burst” is a quick fun animation triggered by a button press.</Halp>
    </legend>
    
    <div class="ce-block">
        <div class="likep">Colour mode
            <Halp>
                <p>Bursts can be of many different colours and tints. You can
                    just pick a setting you like or be really precise in your 
                    artistic expression (if you want something very certain for
                    your performance, for instance).</p>
                <p><i>Preset colours</i> are just that: fixed bright colours. White
                    is pure white, and vivid are yellow, cyan and magenta colours.</p>
                <p><i>Pad’s colour</i> will make bursts using the same colour as 
                    the pad when pressed.</p>
                <p><i>Colours from palettes</i> make the bursts most varied, but can
                    also be precisely controlled. You can have it as chaotic or as
                    precise as you wish. The bursts will use the palettes chosen,
                    including custom ones (if available).</p>
                <p>With <i>Single colour</i>, the burst will have only one colour from a selected palette
                    while playing; <i>Rolling colour</i> means that the burst colour
                    will evolve through the whole palette; <i>Random colour</i> is,
                    well, a random colour from a palette.</p>
                <p>The starting colour in the Rolling mode can be chosen in different ways. 
                    By default, it will be the first colour of the palette. The <i>random</i>
                    will pick a different colour each time, and the <i>mapped to pad</i>
                    will map all sixteen palette colours to the corresponding pads.</p>
                <p>The <i>random</i> and <i>mapped to pad</i> colour selection modes are
                    also applicable to Single colour options.</p>
            </Halp>
        </div>
        <select bind:value={burstMode}>
            <option value={0}>None (bursts disabled)</option>
            <optgroup label="Preset colour">
                <option value={1}>Plain white</option>
                <option value={2}>Vivid colours</option>
                <option value={3}>White and vivid</option>
            </optgroup>
            <optgroup label="Pad’s colour">
                <option value={4}>Active colour</option>
                <!-- <option value="5">Burst colour</option> -->
            </optgroup>
            <optgroup label="Colour from palettes">
                <option value={6}>Single colour, mapped to pad number</option>
                <option value={7}>Single colour, random</option>
                <option value={8}>Rolling colour</option>
                <option value={9}>Rolling colour, start mapped to pad</option>
                <option value={10}>Rolling colour, random start</option>
                <option value={11}>Random colours</option>
                <option value={12}>Any of these, surprise me</option>
            </optgroup>
        </select>
    </div>
    <div class="ce-block">
        <p class:disabled={burstMode == 0}>Animations</p>
        <div class="checkboxblock">
            <label><input disabled={burstMode == 0} type="checkbox" bind:checked={burstFlagKind[0]}> <mark>Shockwave</mark></label><br />
            <label><input disabled={burstMode == 0} type="checkbox" bind:checked={burstFlagKind[1]}> <mark>Star</mark></label><br />
            <label><input disabled={burstMode == 0} type="checkbox" bind:checked={burstFlagKind[2]}> <mark>Isotope</mark></label><br />
            <label><input disabled={burstMode == 0} type="checkbox" bind:checked={burstFlagKind[3]}> <mark>Projectile</mark></label><br />
            <label><input disabled={burstMode == 0} type="checkbox" bind:checked={burstFlagKind[4]}> <mark>Billiards</mark></label><br />
            <label><input disabled={burstMode == 0} type="checkbox" bind:checked={burstFlagKind[5]}> <mark>Firecracker</mark></label><br />
        </div>
    </div>

    <PaletteCheckboxes bind:flags={burstFlagPalette} disabled={burstMode < utils.k_palettesUsedFromMode} />
</fieldset>