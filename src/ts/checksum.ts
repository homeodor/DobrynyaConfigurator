import { getDevice } from "./device";

export enum WhichChecksum {
	NONE,
	LEGACY,
	CRC16,
}

export interface LengthChecksum {
	next: (byte: number) => void;
	checksum: number;
	length: number;
}

class NoChecksum implements LengthChecksum {
	public next(byte: number) {}
	public get checksum() {
		return 0;
	}
	public get length() {
		return 0;
	}
}

class LegacyChecksum implements LengthChecksum {
	private _checksum = 0;
	private _length = 0;

	public next(byte: number) {
		this._checksum += byte;
		this._length++;
	}

	public get checksum() {
		return this._checksum;
	}

	public get length() {
		return this._length;
	}
}

class Crc16 implements LengthChecksum {
	private _checksum = 0xffff;
	private _length = 0;

	public next(byte: number) {
		let crc = ((this._checksum ^ (byte << 8)) & 0xffff) >>> 0;
		for (let i = 0; i < 8; i++) {
			crc =
				crc & 0x8000
					? ((crc << 1) ^ 0x1021) & 0xffff
					: (crc << 1) & 0xffff;
		}
		this._checksum = crc >>> 0;
		this._length++;
	}

	public get checksum() {
		return this._checksum;
	}

	public get length() {
		return this._length;
	}
}

export function getChecksumCalculator(which: WhichChecksum): LengthChecksum {
	if (which === WhichChecksum.NONE) {
		return new NoChecksum();
	}

	if (which === WhichChecksum.LEGACY) {
		return new LegacyChecksum();
	}

	if (which === WhichChecksum.CRC16) {
		return new Crc16();
	}

	throw new Error(`Unknown checksum mode: ${WhichChecksum[which]}`);
}

export function selectChecksum() {
	return getDevice().legacyChecksum
		? WhichChecksum.LEGACY
		: WhichChecksum.CRC16;
}
