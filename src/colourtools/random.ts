export enum ParamSatVal {
	Max,
	Reasonable,
	Random,
}

export interface CTRandomParams {
	layersIdle: boolean;
	layersActive: boolean;
	layersPattern: boolean;
	keepColours: boolean;
	hueMax: number;
	hueMin: number;
	satMax: number;
	satMin: number;
	valMax: number;
	valMin: number;
	matchHue: boolean;
	satMode: ParamSatVal;
	valMode: ParamSatVal;
}
