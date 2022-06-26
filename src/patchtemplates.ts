

export const patchTemplates = 
{
	"miniv2": {
		  "info": {
			device: 0x31,
			desc: "",
			pattern: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
		  },
		  "settings": { "shhold": true },
		  "encoders": [{},{},{},{}],
		  "padbanks": [
			[{},{},{},{},{},{},{},{}]
		  ]
		},
	"microv2": {
		  "info": {
			device: 0x21,
			desc: "",
			pattern: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
		  },
		  "settings": { "shhold": true },
		  "encoders": [{},{},{}],
		  "padbanks": [
			[{},{},{},{},{},{},{},{}]
		  ]
		},
	"microsharp": {
		  "info": {
			device: 0x22,
			desc: "",
			pattern: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
		  },
		  "settings": { "shhold": true },
		  "encoders": [{},{},{}],
		  "padbanks": [
			[{},{},{},{},{},{},{},{}]
		  ]
		}	
};