import { Control } from 'types'

export enum KeyboardAvailable
{
	no,
	yes,
	double
}

export enum NoteAvailable
{
	no,
	yes,
	withScales
}

export interface ControlDefinition
{
	control: Control,
	friendlyName: string,
	discrete: boolean,
	keyboard: KeyboardAvailable,
	colours: boolean,
	notes: NoteAvailable
}

// interface ControlDefinitionArray
// {
// 	readonly [index: Control]: ControlDefinition
// }

export const controls: ControlDefinition[] = 
[
	{ control: Control.Generic,  friendlyName: "",		  discrete: false, keyboard: KeyboardAvailable.no,     colours: false, notes: NoteAvailable.no },
	{ control: Control.Pad,      friendlyName: "Pad",     discrete: true,  keyboard: KeyboardAvailable.yes,    colours: true,  notes: NoteAvailable.yes },
	{ control: Control.Button,   friendlyName: "",		  discrete: false, keyboard: KeyboardAvailable.yes,    colours: false, notes: NoteAvailable.no },
	{ control: Control.Touch,    friendlyName: "",		  discrete: false, keyboard: KeyboardAvailable.yes,    colours: false, notes: NoteAvailable.no },
	{ control: Control.EncRotate,friendlyName: "Encoder", discrete: false, keyboard: KeyboardAvailable.double, colours: false, notes: NoteAvailable.no  }	
];