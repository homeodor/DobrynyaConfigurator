import type { ColourArray, Palette, EncoderBehaviour, Pattern } from "./types";

export interface BranchMidi {
	ch?: number;
	note?: number;
	vel?: number;
	cc?: number;
	min?: number;
	max?: number;
	par?: number;
	rampu?: number;
	rampd?: number;
}

export interface BranchControl {
	encmode?: EncoderBehaviour;
	colour?: ColourArray;
	combo?: number;
	burst?: number;
	filter?: number;
	midi?: BranchMidi;
}

interface PadOrButton {
	colour?: ColourArray;
	combo?: number;
	midi?: BranchMidi;
}

export interface BranchBank {
	bank?: {
		keyinfo?: number;
		colour?: ColourArray;
		ch?: number;
		vel?: number;
		midi?: BranchMidi;
		lightshow?: number;
		desc?: string;
	};
	pads?: PadOrButton[];
}

export interface BranchInfo {
	device: number;
	pattern: Pattern;
	desc: string;
	palettes?: Palette[];
}

export interface BranchSettings {
	burst?: number;
	encreset?: boolean;
	subdbl?: boolean;
	subhold?: boolean;
	shhold?: boolean;
	infinite?: boolean;
	shdblsubbank?: number;
	desc?: string;
}

export interface BranchSettingsLegacy extends BranchSettings {
	secbankdbl?: boolean;
	secbankhold?: boolean;
}

export interface BranchJoystickBank {
	colour?: ColourArray;
	midi?: BranchMidi;
	directions: BranchControl[];
}

export interface Patch {
	info: BranchInfo;
	settings: BranchSettings;
	encoders: BranchControl[];
	padbanks: BranchBank[][];
	faders?: BranchControl[];
	pots?: BranchControl[];
	proximity?: BranchControl;
	joystick?: BranchJoystickBank[];
	auxbuttons?: PadOrButton[];
	accel?: BranchControl[];
}

export interface PatchLegacy extends Patch {
	settings: BranchSettingsLegacy;
}

export interface PatchInfoItem {
	name: string;
	isThePatch: boolean;
	info: BranchInfo;
}
