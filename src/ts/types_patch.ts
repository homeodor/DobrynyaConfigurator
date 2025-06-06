import type { Palette, EncoderBehaviour } from "types";

export type PatchColourArray = number[];

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

export interface Colourable {
	colour?: PatchColourArray;
}

export interface BranchControl extends Colourable {
	encmode?: EncoderBehaviour;
	combo?: number;
	burst?: number;
	filter?: number;
	midi?: BranchMidi;
}

export interface PadOrButton extends Colourable {
	combo?: number;
	midi?: BranchMidi;
}

export interface BranchBankBank extends Colourable {
	keyinfo?: number;
	ch?: number;
	vel?: number;
	midi?: BranchMidi;
	lightshow?: number;
	desc?: string;
}

export interface BranchBank {
	bank?: BranchBankBank;
	pads?: PadOrButton[];
}

export interface BranchInfo {
	device: number;
	pattern: number[];
	desc: string;
	palettes: Palette[];
}

export interface BranchSettings {
	burst: number;
	encreset: boolean;
	subdbl: boolean;
	subhold: boolean;
	shhold: boolean;
	infinite: boolean;
	shdblsubbank: number;
	desc: string;
}

export interface BranchSettingsLegacy extends BranchSettings {
	secbankdbl?: boolean;
	secbankhold?: boolean;
}

export interface BranchJoystickBank {
	midi?: BranchMidi;
	directions: BranchControl[];
}

export interface Patch {
	info: BranchInfo;
	settings: BranchSettings;
	encoders: BranchControl[];
	padbanks: BranchBank[][];
	faders: BranchControl[];
	pots: BranchControl[];
	proximity: BranchControl;
	joystick: BranchJoystickBank[];
	auxbuttons: PadOrButton[];
	accel: BranchControl[];
}

export interface PatchLegacy extends Patch {
	settings: BranchSettingsLegacy;
}

export interface PatchInfoItem {
	name: string;
	isThePatch: boolean;
	info: BranchInfo;
}
