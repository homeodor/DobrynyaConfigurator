export interface DefaultPatchDescriptor {
	id: string;
	name: string;
	filename: string;
}

export const defaultPatches: Record<string, DefaultPatchDescriptor[]> = {
	miniv2: [
		{ id: "fd", name: "Fingerdrumming", filename: "MaxDetal" },
		{ id: "scales", name: "Scales", filename: "Scales" },
	],
	microv2: [
		{ id: "fd", name: "Fingerdrumming", filename: "MaxDetalMicro" },
		{ id: "scales", name: "Scales", filename: "ScalesMicro" },
	],
	pocket: [{ id: "scales", name: "Scales", filename: "ScalesPocket" }],
};
