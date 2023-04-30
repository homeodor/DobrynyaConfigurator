import type { Capabilities, Model } from "device";

export type HexColour = number;
export interface HexObject { h: number, s: number, v: number };

export type ColourArray = HexColour[];
export type Pattern = HexColour[];
export type Palette = number[];

export enum Hand
{
	NONE = -1,
	LEFT = 0,
	RIGHT = 1,
}

export enum Control
{
	Generic,

	Pad,

	Button,
	Touch,

	EncRotate,
	EncPush,

	JoyAnalog,
	JoyX,
	JoyY,
	JoyPush,

	Fader,
	Pot,
	PotPush,

	Proximity,
	Breath,

	GyroX,
	GyroY,
	GyroZ,

	AccelX,
	AccelY,
	AccelZ,

	Velpad=19,//FixThis!!!!!!!
	PolyAftertouch,

	Total,

	None=0xff
};

export enum EncoderBehaviour
{
	Absolute,
	Relative64Zero,
	Relative2Comp,
	RelativeSigned,
	ScaleKey,
	ScaleOctave,
	ScaleOffset,
	ScaleKind,
	InternalTempo,
	Off = 0xff,
};

export enum NewPatchDecision 
{
	CleanSlate,
	Duplicate,
	Template,
	DiskMode,
	Cancel,
	Invalid,
};

export interface NoPatchesObject
{
	decision: NewPatchDecision;
	template: string | null;
	filename: string;
};

export interface DeviceOrBankValue { value: number, isDeviceLevel: boolean};

export interface StatusResult
{
	isCorrect: boolean,
	class: number,
	modelNumber: number,
	modelID: number,
	variant: number,
	revision: number,
	serialID: number,
	deviceID: string,
	serial: string,
	version: string,
	model: Model,
	has: Capabilities
}