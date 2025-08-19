export enum ParamSatVal {
	Keep,
	Dim,
	Max,
}

export interface CTCopyParams {
	from: ColourPaintLayer;
	to: ColourPaintLayer;
	includeExplicit: boolean;
	includeBank: boolean;
	keepexisting: boolean;
	inverthue: boolean;
	saturation: ParamSatVal;
	brightness: ParamSatVal;
}
