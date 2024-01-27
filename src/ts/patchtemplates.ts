

export const patchTemplates = 
{
	"pocket": {
	  "info": {
		device: 0x11,
		desc: "",
		pattern: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
	  },
	  "settings": { },
	  "encoders": [{},{}],
	  "padbanks": [
		[{},{},{},{}]
	  ]
	},
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