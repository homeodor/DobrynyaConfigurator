
export interface DefaultPatchDescriptor
{
	id: string;
	name: string;
	filename: string;
};

interface DefaultPatchObject
{
	[index: string]: DefaultPatchDescriptor[]
};

export const defaultPatches: DefaultPatchObject =
{
	miniv2: [
		{ id: "fd", name: "Fingerdrumming", filename: "MaxDetal" },
		{ id: "scales", name: "Scales", filename: "Scales" },
	],
	microv2: [
		{ id: "fd", name: "Fingerdrumming", filename: "MaxDetalMicro" },
		{ id: "scales", name: "Scales", filename: "ScalesMicro" },
	]
};