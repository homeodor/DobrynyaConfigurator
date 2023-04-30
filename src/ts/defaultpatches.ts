
interface DefaultPatchDescriptor
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
		{ id: "fd", name: "Fingerdrumming", filename: "MaxDetal.dbrpatch" },
		{ id: "scales", name: "Scales", filename: "Scales.dbrpatch" },
	],
	microv2: [
		{ id: "fd", name: "Fingerdrumming", filename: "MaxDetalMicro.dbrpatch" },
		{ id: "scales", name: "Scales", filename: "ScalesMicro.dbrpatch" },
	]
};