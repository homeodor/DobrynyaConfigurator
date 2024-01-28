export const k_palettesUsedFromMode = 6;

export function burstToKindFlags(burst: number) {
	return (burst >> 16) & 0xff;
}

export function burstToMode(burst: number) {
	return burst & 0xff;
}

export function burstToPaletteFlags(burst: number) {
	return (burst >> 8) & 0xff;
}

export function parametersToBurst(mode: number, kindFlags: number, paletteFlags: number) {
	return (kindFlags << 16) |
		(paletteFlags << 8) |
		mode
}

export function burstIsOn(burst: number) {
	const burstMode = burstToMode(burst);

	if (burstToKindFlags(burst) == 0 || burstMode == 0) {
		return false;
	}

	if (burstMode >= k_palettesUsedFromMode && burstToPaletteFlags(burst) == 0) {
		return false;
	}

	return true;
}