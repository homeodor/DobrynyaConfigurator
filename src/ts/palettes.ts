import { getCSSfromURL, getURLfromSVG } from 'icons';

	let svgStorage = 
	[
		null, null, null, null, null, null, null, null,
	];

	export const predefinedPalettes =
	[
		[
			0xdbffc6,
			0xe2ff9d, 0xf7ff83, 0xffeb6c, 0xffc857, 0xffa144,
			0xff7631, 0xff4419, 0xff140d, 0xff0760, 0xff0cdc,
			0xc30aff, 0x4e04ff, 0x0925ff, 0x068cff, 0x0cedf3,
		],
		[
			0x006400, 0x006400, 0x556B2F, 0x006400, 
			0x008000, 0x228B22, 0x6B8E23, 0x008000, 
			0x2E8B57, 0x66CDAA, 0x32CD32, 0x9ACD32, 
			0x90EE90, 0x7CFC00, 0x66CDAA, 0x228B22,
		],
		[
			0x191970, 0x00008B, 0x191970, 0x000080, 
			0x00008B, 0x0000CD, 0x2E8B57, 0x008080, 
			0x5F9EA0, 0x0000FF, 0x008B8B, 0x6495ED, 
			0x7FFFD4, 0x2E8B57, 0x00FFFF, 0x87CEFA,
		],
		[
			0x5500AB, 0x84007C, 0xB5004B, 0xE5001B,
			0xE81700, 0xB84700, 0xAB7700, 0xABAB00,
			0xAB5500, 0xDD2200, 0xF2000E, 0xC2003E,
			0x8F0071, 0x5F00A1, 0x2F00D0, 0x0007F9
		],
	];
	
	let customPalettes =
	[
		[
			"transparent", "transparent", "transparent", "transparent",
			"transparent", "transparent", "transparent", "transparent",
			"transparent", "transparent", "transparent", "transparent",
			"transparent", "transparent", "transparent", "transparent",
		],
		[
			"transparent", "transparent", "transparent", "transparent", 
			"transparent", "transparent", "transparent", "transparent", 
			"transparent", "transparent", "transparent", "transparent", 
			"transparent", "transparent", "transparent", "transparent",
		],
		[
			"transparent", "transparent", "transparent", "transparent", 
			"transparent", "transparent", "transparent", "transparent", 
			"transparent", "transparent", "transparent", "transparent", 
			"transparent", "transparent", "transparent", "transparent",
		],
		[
			"transparent", "transparent", "transparent", "transparent",
			"transparent", "transparent", "transparent", "transparent",
			"transparent", "transparent", "transparent", "transparent",
			"transparent", "transparent", "transparent", "transparent",
		],
	];
  
  
	function colourFromNumber(v: number)
	{
		return "#" + v.toString(16).padStart(6, '0');
	}

	export function getPaletteCSS(i: number)
	{
		if (!svgStorage[i])
		{
			let palette = 
				i >= 4 ?
					customPalettes[i % 4] :
					predefinedPalettes[i];
			
			svgStorage[i] = getURLfromSVG(getPaletteSVG(palette));
		}
				
		return getCSSfromURL(svgStorage[i]);
	}

	export function getPaletteSVG(palette: number[] | string[]): string
	{
		let svg = `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
			 viewBox="0 0 16 1" style="enable-background:new 0 0 16 1;" xml:space="preserve">
		`;
		
		for (let i=0; i<16; i++)
		{
			let theColour = typeof palette[i] === "string" ? palette[i] : colourFromNumber(palette[i]);
			svg += `<rect x="${i}" fill='${theColour}' width="1.5" height="1"/>`;
		}
				
		svg += "</svg>";
		
		return svg;
	}