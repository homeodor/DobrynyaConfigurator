export interface DefaultPatch {
	id: string;
	name: string;
	filename: string;
}

export const defaultPatches: Record<string, DefaultPatch[]> = {
	miniv2: [
		{ id: "fd", name: "Fingerdrumming", filename: "MaxDetal" },
		{ id: "scales", name: "Scales", filename: "Scales" },
	],
	microv2: [
		{ id: "fd", name: "Fingerdrumming", filename: "MaxDetalMicro" },
		{ id: "scales", name: "Scales", filename: "ScalesMicro" },
	],
	pocket: [
		{ id: "fd", name: "Fingerdrumming", filename: "MaxDetalPocket" },
		{ id: "scales", name: "Scales", filename: "ScalesPocket" },
	],
};
