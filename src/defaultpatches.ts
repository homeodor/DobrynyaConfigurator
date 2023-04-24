
interface DefaultPatchDescriptor
{
	id: string;
	name: string;
};

interface DefaultPatchObject
{
	[index: string]: DefaultPatchDescriptor[]
};

export const defaultPatches: DefaultPatchObject =
{
	miniv2: [
		{ id: "fd", name: "Fingerdrumming" },
		{ id: "scales", name: "Scales" },
	],
	microv2: [
		{ id: "fd", name: "Fingerdrumming" },
		{ id: "scales", name: "Scales" },
	]
};