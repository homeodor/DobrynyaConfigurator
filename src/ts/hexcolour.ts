import { map } from "./basic";
import { ColourPaintLayer } from "./colour_utils";

const k_corrector = [
	0, 5, 13, 17, 24, 27, 29, 31, 33, 36, 38, 40, 42, 45, 48, 50,
];

export interface HexObject {
	h: number;
	s: number;
	v: number;
}

export class HexColour {
	public static readonly k_off = 0xff00;
	private readonly _hex: number;

	public static off(): HexColour {
		return new HexColour();
	}

	public static black(): HexColour {
		return new HexColour(0);
	}

	public get hex(): number {
		return this._hex;
	}

	public get h(): number {
		return this._hex >> 8;
	}
	public get s(): number {
		return (this._hex >> 4) & 0xf;
	}
	public get v(): number {
		return this._hex & 0xf;
	}

	constructor(hOrHex?: number | HexColour, s?: number, v?: number) {
		if (typeof hOrHex === "undefined") {
			this._hex = HexColour.k_off;
			return;
		}

		if (hOrHex instanceof HexColour) {
			this._hex = hOrHex._hex;
			return;
		}

		const colour =
			s !== undefined && v !== undefined
				? ((hOrHex & 0xff) << 8) | ((s & 0xf) << 4) | (v & 0xf)
				: hOrHex;
		if (
			colour > 0xffff ||
			colour < 0 ||
			isNaN(colour) ||
			!isFinite(colour) ||
			!Number.isInteger(colour)
		)
			throw new Error(
				`Cannot create HexColour, as ${colour.toString(16)} is out of range`
			);
		this._hex = colour;
	}

	public isOff() {
		return this._hex === HexColour.k_off;
	}

	public isOn() {
		return !this.isOff();
	}

	public isBlack() {
		return this.v === 0;
	}

	public isExplicit(layerNo: ColourPaintLayer) {
		if (layerNo == ColourPaintLayer.Off) {
			throw new Error("isExplicit called with ColourPaintLayer.Off");
		}

		return (
			(!this.isBlack() && layerNo == ColourPaintLayer.Pattern) ||
			(this.isOn() && layerNo != ColourPaintLayer.Pattern)
		);
	}

	public isSame(against: HexColour): boolean {
		if (this === against || this._hex === against._hex) {
			return true;
		}

		if (this.isOff() || against.isOff()) {
			return false;
			// one colour is off, but the other is not
		}

		if (this.isBlack() && against.isBlack()) {
			return true;
		}

		if (this.s === 0 && against.s === 0 && this.v === against.v) {
			return true;
			// shade of gray
		}

		return false;
	}

	public normalize(): HexColour {
		if (this.isOff()) {
			return this;
		}

		if (this.isBlack()) {
			return HexColour.black();
		}

		return this;
	}

	public toSysExArray() {
		let testFillArray = [this._hex >> 8, this._hex & 0xff, 0];
		if (testFillArray[0] & 0x80) {
			testFillArray[0] &= 0x7f;
			testFillArray[2] |= 0x2;
		}
		if (testFillArray[1] & 0x80) {
			testFillArray[1] &= 0x7f;
			testFillArray[2] |= 0x1;
		}

		return testFillArray;
	}

	public toObject(): HexObject {
		return { h: this.h, s: this.s, v: this.v };
	}

	public toCSS(offIsBlack: boolean = false): string {
		if (this.isOff()) {
			return offIsBlack ? "black" : "transparent";
		}

		const hsv = this.toObject();

		let correctS = map(hsv.s, 0, 15, 0, 100);
		let correctL = k_corrector[hsv.v] * ((100 - correctS) / 100 + 1);

		return (
			"hsl(" +
			map(hsv.h, 0, 255, 0, 360) +
			",  " +
			correctS +
			"%, " +
			correctL +
			"%)"
		);
	}

	private mutate(mutator: (theHex: number) => number) {
		return new HexColour(this.isOff() ? this : mutator(this._hex));
	}

	public dimV(): HexColour {
		return this.mutate(hex => (hex & 0xfff0) | 4);
	}

	public maxV(): HexColour {
		return this.mutate(hex => (hex & 0xfff0) | 0xf);
	}

	public dimS(): HexColour {
		return this.mutate(hex => (hex & 0xff0f) | 0xa0);
	}

	public maxS(): HexColour {
		return this.mutate(hex => (hex & 0xff0f) | 0xf0);
	}

	public desaturate(): HexColour {
		return this.mutate(hex => hex & 0xff0f);
	}

	public invH(): HexColour {
		return this.shiftH(128);
	}

	public shiftH(shiftHue: number): HexColour {
		if (this.isBlack()) {
			return HexColour.black();
		}

		return this.mutate(hex => {
			const hueShifted = ((hex >> 8) + shiftHue) % 256;
			return (hex & 0xff) | (hueShifted << 8);
		});
	}
}

export type ColourArray = HexColour[];
export type Pattern = ColourArray;
export type BucketEventDetail = { hex: HexColour; hex2: HexColour };
