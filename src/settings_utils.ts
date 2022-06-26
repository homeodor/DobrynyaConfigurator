export let settings = {
	"control": 
	{
		"control":
		{
			"length": 4
		}
	},

	"screen": 
	{
		"brightness":
		{
			"reserved": true
		},
		"contrast":
		{},
		"timeout":
		{
			"length": 2
		},
		"reserved1":
		{
			"reserved": true,
			"length": 8
		}
	},

	"leds":
	{
		"brightness":
		{},    
		"brightnesschill":
		{},    
		"brightnessdeco":
		{},        
		"brightnessblink":
		{},
		"timeoutchill":
		{
			"length": 2
		},
		"timeoutoff":
		{
			"reserved": true,
			"length": 2
		},
		"timeoutpalette":
		{},
		"palettes":
		{
			"isFlag": true
		},
		"flags":
		{
			"isFlag":true,
			"reserved":true
		},
		"blinkmode":
		{},
		"chillanimations":
		{
			"isFlag":true
		},
		"reserved2":
		{
			"reserved":true,
			"length":3
		}
	},

	"midi":
	{
		"channel":
		{},
		"outputs":
		{
			"isFlag":true
		},
		inputs:
		{
			"isFlag":true
		},
		hwmidi:
		{
			"fixif":0xff,
			"fixto":0x0,
			"isFlag":true
		},
		vel:
		{
			"fixif":0xff,
			"fixto":0x7f,
		},
		"reserved1":
		{
			"reserved":true,
			"length":11
		}
	},

	"input":
	{
		"debouncepad":
		{},
		"debounceother":
		{},
		"smoothfader":
		{
			"reserved":true
		},
		"smoothjoystick":
		{
			"reserved":true
		},
		"encoderkinetics":
		{
			"reserved":true,
			"length":4
		},
		"direction":
		{
			"isFlag":true
		},
		"reserved1":
		{
			"reserved":true,
			"length":7
		}
	},
	
	"lowpower":
	{
		"reserved1":
		{
			"reserved":true,
			"length":16
		}
	},
	
	"ble":
	{
		"reserved1":
		{
			"reserved":true,
			"length":16
		}
	},
	
	"haptic":
	{
		"events":
		{
			"length":2
		},
		"channel": {}
	}
};