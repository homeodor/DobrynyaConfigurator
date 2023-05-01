<script lang="ts">
import mergeSVG from '../i/merge.svg';
	
interface OpenSourceData
{
	name?: string, license: string, copyright: string, github?: string, url?: string, more?: string, contributed?: boolean, licenseOpen: boolean
};

const opensource: OpenSourceData[] = [
	{
		name: "Studio apartment HDRI",
		url: "https://hdrmaps.com/studio-apartment/",
		license: "CC-BY",
		more: "Used as an HDRI to light the tuning fork on the app icon :)",
		copyright: "Grzegorz Wronkowski",
		licenseOpen: false,
	},
	{
		name: "Arduino Core for SAMD21 and SAMD51 CPU",
		license: "LGPL 2.1",
		github: "adafruit/ArduinoCore-samd",
		more: "Originally by Arduino LLC, modified by Adafruit",
		copyright: "2015 Arduino LLC",
		licenseOpen: false
	},
	{
		name: "Adafruit TinyUSB Library for Arduino",
		license: "MIT",
		github: "adafruit/Adafruit_TinyUSB_Arduino",
		copyright: "2019 Ha Thach for Adafruit Industries",
		contributed: true,
		licenseOpen: false
	},
	{
		name: "UF2 Bootloader",
		more: "Adafruit fork",
		github: "adafruit/uf2-samdx1",
		license: "MIT",
		copyright: "Microsoft",
		licenseOpen: false
	},
	{
		github: "FastLED/FastLED",
		license: "MIT",
		copyright: "2013 FastLED",
		licenseOpen: false
	},
	{
		name: "Arduino MIDI Library",
		github: "FortySevenEffects/arduino_midi_library",
		license: "MIT",
		copyright: "2016 Francois Best",
		licenseOpen: false
	},
	{
		github: "adafruit/Adafruit_SPIFlash",
		license: "MIT",
		copyright: "2019 Ha Thach and Dean Miller for Adafruit Industries LLC",
		licenseOpen: false
	},
	{
		name: "SdFat — Adafruit fork",
		github: "adafruit/SdFat",
		license: "MIT",
		copyright: "2011..2017 Bill Greiman",
		licenseOpen: false
	},
	{
		name: "SAMD_TimerInterrupt Library",
		github: "khoih-prog/SAMD_TimerInterrupt",
		license: "MIT",
		copyright: "2019 Khoi Hoang",
		contributed: true,
		licenseOpen: false
	},
	{
		github: "homeodor/FastAnalogRead",
		license: "MIT",
		more: "Originally ResponsiveAnalogRead by Damien Clarke, forked by Alexander Golovanov",
		copyright: "2016, Damien Clarke (original code), (c) 2021, Alexander Golovanov (the fork)",
		contributed: true,
		licenseOpen: false
	},
	{
		name: "FixedPoints",
		github: "Pharap/FixedPointsArduino",
		license: "Apache 2.0",
		copyright: "2017-2021 Pharap",
		licenseOpen: false
	},
	{
		name: "FatFs",
		license: "FatFs",
		url: "http://elm-chan.org/fsw/ff/00index_e.html",
		copyright: "20xx, ChaN",
		licenseOpen: false
	},
	{
		github: "adafruit/Adafruit_BusIO",
		copyright: "2017 Adafruit Industries",
		license: "MIT",
		licenseOpen: false
	},
	{
		name: "Adafruit GFX Library",
		github: "adafruit/Adafruit-GFX-Library",
		copyright: "2012 Adafruit Industries",
		license: "BSD",
		contributed: true,
		licenseOpen: false
	},
	{
		github: "adafruit/Adafruit_SSD1306",
		license: "BSD",
		copyright: "2012, Adafruit Industries",
		licenseOpen: false
	},
	{
		name: "Adafruit SSD1351 Library",
		github: "adafruit/Adafruit-SSD1351-library",
		license: "BSD",
		copyright: "2012, Adafruit Industries",
		licenseOpen: false
	},
	{
		name: "Arduino MemoryFree",
		license: "MIT",
		github: "mpflaga/Arduino-MemoryFree",
		copyright: "2012 Michael P. Flaga",
		licenseOpen: false
	},
	{
		github: "sparkfun/SparkFun_MPU-9250-DMP_Arduino_Library",
		license: "MIT",
		copyright: "2016 SparkFun Electronics, Inc.",
		licenseOpen: false
	},
	{
		github: "sparkfun/SparkFun_BQ27441_Arduino_Library",
		license: "MIT",
		copyright: "2016 SparkFun Electronics, Inc.",
		licenseOpen: false
	},
	{
		github: "adafruit/Adafruit_DRV2605_Library",
		copyright: "2018 Adafruit Industries",
		license: "MIT",
		licenseOpen: false
	}	
];
</script>

<style>
	#info-freelibs { display:inline-block; max-width:40em; }
	.info-freelibs-license { white-space: pre-line }
</style>

<div id="info-freelibs">	
	<p>The developers of MIDI Dobrynya want to take a moment to express the deepest gratitude to the great people out there who developed wonderful libraries,
		especially the <a href="https://arduino.cc/">Arduino</a> community, Mark&nbsp;Kriegsman, Dan&nbsp;Garcia (R.I.P.), <a href="https://sparkfun.com/">Sparkfun</a> and, of course, <a href="https://adafruit.com/">Adafruit</a> and Lady Ada personally.</p>
		
	<p>(Yes, Dobrynya is based on Arduino, with 100% original hardware and 20k+ lines of original code.
		For all of you Arduino haters, Alexander&nbsp;Golovanov highly recommends watching <a href="https://www.youtube.com/watch?v=OLpeX4RRo28">this&nbsp;video</a>.)</p>
	
	
	
	
	{#each opensource as lib}
	
		<h2>{lib.name ?? lib.github.split("/")[1].replaceAll("_"," ")}{#if lib.contributed }<img src="{mergeSVG}" class="info-freelibs-contributed" title="Contributed back" alt="Contributed back">{/if}</h2>
		
		<p><a href="{lib.url??`https://github.com/${lib.github}`}">{#if lib.url}Website{:else}GitHub{/if}</a></p>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<p>© {lib.copyright}. Licensed under <span class="unreal" on:click="{()=>lib.licenseOpen = !lib.licenseOpen}">{lib.license}</span> license.</p>
	
		{#if lib.licenseOpen}
		{#if lib.license == "CC-BY"}
		<div id="mit-license-src" class="info-freelibs-license">The MIT License (MIT)
			You are free to:
			
				Share — copy and redistribute the material in any medium or format
				Adapt — remix, transform, and build upon the material
				for any purpose, even commercially.
			
			The licensor cannot revoke these freedoms as long as you follow the license terms.
			
			Under the following terms:
			
			Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
			
			No additional restrictions — You may not apply legal terms or technological measures that legally restrict others from doing anything the license permits.</div>
		{/if}
		{#if lib.license == "MIT"}
		<div id="mit-license-src" class="info-freelibs-license">The MIT License (MIT)
			
			Copyright (c) {lib.copyright}
			
			Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
			
			The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
			
			THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.</div>
		{/if}
		{#if lib.license == "LGPL 2.1"}	
			<div id="lgpl-license-src" class="info-freelibs-license">Copyright (c) {lib.copyright}.  All right reserved.
			
			This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 2.1 of the License, or (at your option) any later version.
			
			This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details.
			
			You should have received a copy of the GNU Lesser General Public License along with this library; if not, write to the Free Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA</div>
		{/if}
		{#if lib.license == "Apache 2.0"}
			<div id="apache-license-src" class="info-freelibs-license">Copyright {lib.copyright}
				
			Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
			
				http://www.apache.org/licenses/LICENSE-2.0
					
			Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
			See the License for the specific language governing permissions and limitations under the License.</div>
		{/if}
		{#if lib.license == "BSD"}
			<div id="bsd-license-src" class="info-freelibs-license">Software License Agreement (BSD License)
				
			Copyright (c) {lib.copyright}
			All rights reserved.
				
			Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
			1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
			2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
			3. Neither the name of the copyright holders nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
				
			THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS ''AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.</div>
		{/if}
		{#if lib.license == "FatFs"}	
			<div id="fatfs-license-src" class="info-freelibs-license">Copyright (C) 20xx, ChaN, all right reserved.
			
			FatFs module is an open source software. Redistribution and use of FatFs in source and binary forms, with or without modification, are permitted provided that the following condition is met:
			
			1. Redistributions of source code must retain the above copyright notice, this condition and the following disclaimer.
			
			This software is provided by the copyright holder and contributors "AS IS" and any warranties related to this software are DISCLAIMED.
			The copyright owner or contributors be NOT LIABLE for any damages caused by use of this software.</div>					
		{/if}
		{/if}
	{/each}
</div>
