export const keyboardJSToHIDCatchable =
{
  "KeyA": 4,
  "KeyB": 5,
  "KeyC": 6,
  "KeyD": 7,
  "KeyE": 8,
  "KeyF": 9,
  "KeyG": 10,
  "KeyH": 11,
  "KeyI": 12,
  "KeyJ": 13,
  "KeyK": 14,
  "KeyL": 15,
  "KeyM": 16,
  "KeyN": 17,
  "KeyO": 18,
  "KeyP": 19,
  "KeyQ": 20,
  "KeyR": 21,
  "KeyS": 22,
  "KeyT": 23,
  "KeyU": 24,
  "KeyV": 25,
  "KeyW": 26,
  "KeyX": 27,
  "KeyY": 28,
  "KeyZ": 29,
  
  "Digit1": 30,
  "Digit2": 31,
  "Digit3": 32,
  "Digit4": 33,
  "Digit5": 34,
  "Digit6": 35,
  "Digit7": 36,
  "Digit8": 37,
  "Digit9": 38,
  "Digit0": 39,
  "Enter": 40,
  "Escape": 41,
  "Backspace": 42,
  "Tab": 43,
  "Space": 44,
  "Minus": 45,
  "Equal": 46,
  "BracketLeft": 47,
  "BracketRight": 48,
  "BackslashUS": 49,
  "Backslash": 50,
  "Semicolon": 51,
  "Quote": 52,
  "Backquote": 53,
  "Comma": 54,
  "Period": 55,
  "Slash": 56,
  "CapsLock": 57,
  
  "F1": 58,
  "F2": 59,
  "F3": 60,
  "F4": 61,
  "F5": 62,
  "F6": 63,
  "F7": 64,
  "F8": 65,
  "F9": 66,
  "F10": 67,
  "F11": 68,
  "F12": 69,

/*
  "WEIRD3": 71,
  "WEIRD4": 72,
  "WEIRD5": 73,
*/
  "Home": 74,
  "PageUp": 75,
  "Delete": 76,
  "End": 77,
  "PageDown": 78,
  "ArrowRight": 79,
  "ArrowLeft": 80, 
  "ArrowDown": 81, 
  "ArrowUp": 82,   
  "NumLock": 83,
  "NumpadDivide": 84,   
  "NumpadMultiply": 85, 
  "NumpadSubtract": 86, 
  "NumpadAdd": 87,      
  "NumpadEnter": 88,
  "Numpad1": 89,
  "Numpad2": 90,
  "Numpad3": 91,
  "Numpad4": 92,
  "Numpad5": 93,
  "Numpad6": 94,
  "Numpad7": 95,
  "Numpad8": 96,
  "Numpad9": 97,
  "Numpad0": 98,
  "NumpadDecimal": 99,
  "IntlBackslash": 100,
  "ContextMenu": 101,
//  "WEIRD6": 102,
  "NumpadEqual": 103,
/*
	
	...
	*/
  "ControlLeft": 224,
  "ShiftLeft":   225,
  "AltLeft":     226,
  "MetaLeft":    227,
  "ControlRight":228,
  "ShiftRight":  229,
  "AltRight":    230,
  "MetaRight":   232,
};

export const keyboardProperNames =
{
	45: "–",
	46: "=",
	47: "[",
	48: "]",
	49: "\\",
	50: "\\",
	51: ":",
	52: "'",
	53: "`",
	54: ",",
	55: ".",
	56: "/",
	57: "Caps Lock",
	75: "Page Up",
	78: "Page Down",
 	79: "→",
 	80: "←",
 	81: "↓",
 	82: "↑",	
	84: "Numpad ÷",
	85: "Numpad ×",
	86: "Numpad –",
	87: "Numpad +",
	88: "Numpad Enter",
	83: "Num Lock",
	99: "Numpad .",
	100: "\\",
	101: "Context Menu",
	103: "Numpad =",
 	224: "Control",
 	225: "Shift",
 	226: "Alt",
 	227: "Command",
 	228: "Control",
 	229: "Shift",
 	230: "Alt",
 	232: "Command"
};

export const keyboardJStoHID =
{	
	"SysRq": 0x46, // Keyboard Print Screen
	"Scroll Lock": 0x47, // Keyboard Scroll Lock
	"Pause":  0x48, // Keyboard Pause
	"Insert": 0x49, // Keyboard Insert

/*
	"F13": 0x68], // Keyboard F13
	"F14": 0x69], // Keyboard F14
	"F15": 0x6a], // Keyboard F15
	"F16": 0x6b], // Keyboard F16
	"F17": 0x6c], // Keyboard F17
	"F18": 0x6d], // Keyboard F18
	"F19": 0x6e], // Keyboard F19
	"F20": 0x6f], // Keyboard F20
	"F21": 0x70], // Keyboard F21
	"F22": 0x71], // Keyboard F22
	"F23": 0x72], // Keyboard F23
	"F24": 0x73], // Keyboard F24
*/
	
/*
	"RO": 0x87], // Keyboard International1
	"KATAKANAHIRAGANA": 0x88], // Keyboard International2
	"YEN": 0x89], // Keyboard International3
	"HENKAN": 0x8a], // Keyboard International4
	"MUHENKAN": 0x8b], // Keyboard International5
	"NumpadJPCOMMA": 0x8c], // Keyboard International6
	
	"HANGEUL": 0x90], // Keyboard LANG1
	"HANJA": 0x91], // Keyboard LANG2
	"KATAKANA": 0x92], // Keyboard LANG3
	"HIRAGANA": 0x93], // Keyboard LANG4
	"ZENKAKUHANKAKU": 0x94], // Keyboard LANG5
*/
};

export const keyboardCombinations =
{
	"Mac"			: "notacombo",
	
	"⌃Space"		: 0x100 | keyboardJSToHIDCatchable['Space'],
	"⌘Space"		: 0x800 | keyboardJSToHIDCatchable['Space'],
					
	"⌘Tab"	 		: 0x800 | keyboardJSToHIDCatchable['Tab'],
	"⌘⇧Tab"		: 0xA00 | keyboardJSToHIDCatchable['Tab'],
	"⌘`"			: 0x800 | keyboardJSToHIDCatchable['Backquote'],
	"⌘⇧`"  		: 0xA00 | keyboardJSToHIDCatchable['Backquote'],
	"⌃Tab"			: 0x100 | keyboardJSToHIDCatchable['Tab'],
	"⌃⇧Tab"			: 0x300 | keyboardJSToHIDCatchable['Tab'],
	
/*
	"⌘N"      		: 0x800 | keyboardJSToHIDCatchable['KeyN'],
	"⌘⇧N"      	: 0xA00 | keyboardJSToHIDCatchable['KeyN'],					
	"⌘T"      		: 0x800 | keyboardJSToHIDCatchable['KeyT'],
	"⌘⇧T"      	: 0xA00 | keyboardJSToHIDCatchable['KeyT'],
	"⌘W"      		: 0x800 | keyboardJSToHIDCatchable['KeyW'],	
	"⌘⇧W"      	: 0xA00 | keyboardJSToHIDCatchable['KeyW'],	
	"⌘Q"      		: 0x800 | keyboardJSToHIDCatchable['KeyQ'],
*/
					
	"Windows"		: "notacombo",
	
	"Ctrl+Alt+Del" 	: 0x500 | keyboardJSToHIDCatchable['Delete'],
	"Ctrl+Shift+Esc": 0x300 | keyboardJSToHIDCatchable['Escape'],
	
	"Alt+Tab"		: 0x400 | keyboardJSToHIDCatchable['Tab'],
	"Alt+Shift+Tab"	: 0x600 | keyboardJSToHIDCatchable['Tab'],
	
	"Ctrl+Tab"		: 0x100 | keyboardJSToHIDCatchable['Tab'],
	"Ctrl+Shift+Tab": 0x300 | keyboardJSToHIDCatchable['Tab'],
	
	"Alt+F4"     	: 0x400 | keyboardJSToHIDCatchable['F4'],	
	"Ctrl+F4"     	: 0x100 | keyboardJSToHIDCatchable['F4'],	
	
/*
	"Ctrl+N"      	: 0x100 | keyboardJSToHIDCatchable['KeyN'],
	"Ctrl+Shift+N"  : 0x300 | keyboardJSToHIDCatchable['KeyN'],					
	"Ctrl+T"      	: 0x100 | keyboardJSToHIDCatchable['KeyT'],
	"Ctrl+Shift+T"  : 0x300 | keyboardJSToHIDCatchable['KeyT'],
	"Ctrl+W"      	: 0x100 | keyboardJSToHIDCatchable['KeyW'],	
	"Ctrl+Shift+W"  : 0x300 | keyboardJSToHIDCatchable['KeyW'],	
*/
	
	"Win key"		: 		  keyboardJSToHIDCatchable['OSLeft'], 		//opens the Start Menu
    "Win+D"			: 0x800 | keyboardJSToHIDCatchable['KeyD'], 	   // shows the desktop (hiding even non-minimizable windows), or restores hidden windows when pressed a second time.
    "Win+E"			: 0x800 | keyboardJSToHIDCatchable['KeyE'], 	   // opens Windows Explorer with folder pane on left side of window.
    "Win+L"			: 0x800 | keyboardJSToHIDCatchable['KeyL'], 	   // locks the screen
    "Win+F"			: 0x800 | keyboardJSToHIDCatchable['KeyF'], 	   // opens Find files and folders.
    "Win+M"			: 0x800 | keyboardJSToHIDCatchable['KeyM'], 	   // minimizes all windows.
    "Win+Shift+M"	: 0xA00 | keyboardJSToHIDCatchable['KeyM'],		   //restores windows that were minimized with ⊞ Win+M.
    "Win+R"			: 0x800 | keyboardJSToHIDCatchable['KeyR'], 	   //opens the "Run Program Or File" Window.
    "Win+U"			: 0x800 | keyboardJSToHIDCatchable['KeyU'], 	   //runs Utility Manager.
    "Win+Pause"		: 0x800 | keyboardJStoHID		  ['Pause'], 	// or ⊞ Win+Break opens properties of My Computer.
    "Win+F1"		: 0x800 | keyboardJSToHIDCatchable['F1'], 	   // opens Windows Help.
    "Win+Ctrl+F"	: 0x900 | keyboardJSToHIDCatchable['F'], 	//opens Find computers.
    "Win+Tab"		: 0x800 | keyboardJSToHIDCatchable['Tab'],	 	// cycles through taskbar buttons. This key combination is reassigned in Windows Vista.
    
    "Odd keys"	: "notacombo"
};


export const keyboardShortNames =
{
	42: "Bksp",
	57: "Caps",
	75: "Pg Up",
	76: "Del",
	78: "Pg Dn",
	84: "NP ÷",
	85: "NP ×",
	86: "NP –",
	87: "NP +",
	88: "NP Ent",
	83: "Num Lk",
	99: "NP .",
	101: "Menu",
	103: "NP =",
 	224: "Ctrl",
 	227: "Cmd",
 	228: "Ctrl",
 	232: "Cmd"
};

export const keyboardMedia =
{
	
	// Power Control
	"Power"                  : 0x0030,
	"Reset"                  : 0x0031,
	"Sleep"                  : 0x0032,
	
	// Screen Brightness
	"Brightness +"           : 0x006F,
	"Brightness –"           : 0x0070,
/*
	"Key Brightness +"       : 0x0079,
	"Key Brightness –"       : 0x007A,
*/
	
	"Snapshot"				 : 0x0065,
	
	// Media Control
	"Play"                   : 0x00B0,
	"Stop"                   : 0x00B7,
	"Eject"                  : 0x00B8,
	"Play / Pause"           : 0x00CD,
	"Fast Forward"			 : 0x00B3,
	"Rewind"				 : 0x00B4,
	"Next Track"             : 0x00B5,
	"Prev Track"             : 0x00B6,
//	"Volume"                 : 0x00E0,
	"Mute"                   : 0x00E2,
/*
	BASS                              : 0x00E3,
	TREBLE                            : 0x00E4,
	BASS_BOOST                        : 0x00E5,
*/
	"Volume +"               : 0x00E9,
	"Volume –"               : 0x00EA,
/*
	BASS_INCREMENT                    : 0x0152,
	BASS_DECREMENT                    : 0x0153,
	TREBLE_INCREMENT                  : 0x0154,
	TREBLE_DECREMENT                  : 0x0155,
*/
	
	// Application Launcher
//	AL_CONSUMER_CONTROL_CONFIGURATION : 0x0183,
	"Email"                 : 0x018A,
	"Calculator"            : 0x0192,
	"Browser"               : 0x0194,
	"Audio Player"          : 0x01C7,
	
	// Browser/Explorer Specific
	"Browser Search"      	: 0x0221,
	"Browser Home"          : 0x0223,
	"Browser Back"          : 0x0224,
	"Browser Forward"       : 0x0225,
	"Browser Stop Loading"  : 0x0226,
	"Browser Refresh"       : 0x0227,
	"Browser Bookmarks"     : 0x022A,
};

export const keyboardMediaShort =
{

	
	// Screen Brightness
	"Bright+"   : 0x006F,
	"Bright–"   : 0x0070,
	"Key Br.+"  : 0x0079,
	"Key Br.–"  : 0x007A,
	
	// Media Control
	"FF"		: 0x00B3,
	"Rew"		: 0x00B4,
	"Pause"     : 0x00CD,
	"⏭️︎"      	: 0x00B5,
	"Prev"      : 0x00B6,

	"Vol+"      : 0x00E9,
	"Vol–"      : 0x00EA,

	"Calc"      : 0x0192,
	"Player"    : 0x01C7,
	
	"Search"    : 0x0221,
	"Home"      : 0x0223,
	"Back"      : 0x0224,
	"Forward"   : 0x0225,
	"Stop Load" : 0x0226,
	"Refresh"   : 0x0227,
	"Bookmarks" : 0x022A,
}

import { get } from 'svelte/store';
import { isMacLike } from './stores.js';

let isMacLikeLocal = get(isMacLike); // set once

function getKeyByValue(object: any, value: any)
{
	return Object.keys(object).find(key => object[key] === value);
}

export function ctrlCmd(ev)
{
	return (isMacLike && ev.metaKey) || (!isMacLike && ev.ctrlKey);
}

export function keycodeToHuman(kc: number, returnShort: boolean = false): any
{
	if (!kc) return "";
	
	let isMedia: boolean = kc & 0xC000;
	
	if (isMedia)
	{
		kc &= 0x3FFF;
		
		let val: string = getKeyByValue(keyboardMedia,kc);
		if (!val) return `M ${kc}`;
		let shrt: string = getKeyByValue(keyboardMediaShort,kc);
		return (shrt && returnShort) ? shrt : val;
	} else {
		let modifiers: number = kc >> 8;
		kc &= 0xff;
		
		let properName: string | boolean =
			(returnShort && keyboardShortNames[kc] != undefined) ?
				keyboardShortNames[kc] :
					(
					(keyboardProperNames[kc] != undefined) ?
						keyboardProperNames[kc] :
						false
					);
		
		let val: any = properName ? properName : getKeyByValue(keyboardJSToHIDCatchable, kc);
		
		if (!val) val = getKeyByValue(keyboardJStoHID,kc);
		
		if (!val) val = kc ? ("K" + kc) : "";
		
		val = val.replace("Numpad", "Numpad ").replace("Digit","").replace("Key","");
		
		// console.log("IS IT MAC LIKE? ", isMacLikeLocal);
		
		if (modifiers & 0x8) val =  (isMacLikeLocal ? "⌘" : (returnShort ? "⊞" : "Win+")) + val;
		if (modifiers & 0x2) val = ((isMacLikeLocal || returnShort) ? "⇧" : "Shift+") + val;
		if (modifiers & 0x4) val =  (isMacLikeLocal ? "⌥" : (returnShort ? "⎇" : "Alt+")) + val;
		if (modifiers & 0x1) val = ((isMacLikeLocal || returnShort) ? "⌃" : "Ctrl+") + val;
		
		return val; // TBD
	}
}
