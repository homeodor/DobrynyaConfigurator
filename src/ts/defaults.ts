export type DeepPartial<T> = T extends (infer U)[]
	? DeepPartial<U>[]
	: T extends object
	? { [K in keyof T]?: DeepPartial<T[K]> }
	: T;

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function applyDefaults<T>(model: T, partial?: DeepPartial<T> | null): T {
	// No data at all → clone model
	if (partial == null) {
		return structuredClone(model);
	}

	// Arrays
	if (Array.isArray(model)) {
		const src = Array.isArray(partial) ? partial : [];
		const len = Math.max(model.length, src.length);

		const result = [];
		for (let i = 0; i < len; i++) {
			const m = model[i];
			const d = src[i];

			if (m === undefined && d === undefined) {
				continue;
			}

			if (m !== undefined && (isObject(m) || Array.isArray(m))) {
				result[i] = applyDefaults(m, d as any);
			} else if (d !== undefined) {
				result[i] = structuredClone(d);
			} else if (m !== undefined) {
				result[i] = structuredClone(m);
			}
		}

		return result as T;
	}

	// Objects
	if (isObject(model)) {
		const result: Record<string, unknown> = {};

		for (const key of Object.keys(model)) {
			const m = (model as any)[key];
			const d = (partial as any)[key];

			if (isObject(m) || Array.isArray(m)) {
				result[key] = applyDefaults(m, d as any);
			} else if (d !== undefined) {
				result[key] = structuredClone(d);
			} else {
				result[key] = structuredClone(m);
			}
		}

		// Optional: keep unknown keys from partial in a “safe” mode
		for (const key of Object.keys(partial as any)) {
			if (!(key in model))
				result[key] = structuredClone((partial as any)[key]);
		}

		return result as T;
	}

	// Primitive
	return (partial as T) ?? structuredClone(model);
}

export function stripDefaults<T>(
	model: T,
	value: T
): DeepPartial<T> | undefined {
	// Arrays
	if (Array.isArray(model) && Array.isArray(value)) {
		const len = value.length;
		const result: unknown[] = new Array(len);
		let hasDiff = false;

		for (let i = 0; i < len; i++) {
			const m = model[i];
			const v = value[i];

			if (m === undefined) {
				// Extra element beyond model → keep as-is
				result[i] = structuredClone(v);
				hasDiff = true;
				continue;
			}

			if (isObject(m) || Array.isArray(m)) {
				const diff = stripDefaults(m, v as any);
				if (diff !== undefined) {
					result[i] = diff;
					hasDiff = true;
				} else {
					result[i] = undefined; // default
				}
			} else {
				if (Object.is(m, v)) {
					result[i] = undefined;
				} else {
					result[i] = structuredClone(v);
					hasDiff = true;
				}
			}
		}

		if (!hasDiff) {
			return undefined;
		}

		// Optionally trim trailing undefineds like your current code
		let end = result.length;
		while (end > 0 && result[end - 1] === undefined) {
			end--;
		}
		return result.slice(0, end) as any;
	}

	// Objects
	if (isObject(model) && isObject(value)) {
		const result: Record<string, unknown> = {};
		let hasDiff = false;

		for (const key of Object.keys(value)) {
			const m = model[key];
			const v = value[key];

			if (!(key in model)) {
				// Unknown property: keep, or drop if you want "safe" strictness
				result[key] = structuredClone(v);
				hasDiff = true;
				continue;
			}

			if (isObject(m) || Array.isArray(m)) {
				const diff = stripDefaults(m, v);
				if (diff !== undefined) {
					result[key] = diff;
					hasDiff = true;
				}
			} else {
				if (!Object.is(m, v)) {
					result[key] = structuredClone(v);
					hasDiff = true;
				}
			}
		}

		return hasDiff ? (result as any) : undefined;
	}

	// Primitive
	return Object.is(model, value) ? undefined : (value as any);
}

export interface DefaultsData<T> {
	model: T;
	diff: DeepPartial<T> | null; // minimal form
}

export class DefaultsManager<T> {
	static mapID = 0;
	static theMap = new Map<number, DefaultsManager<any>>();

	static latchAll() {
		for (let expsan of DefaultsManager.theMap.values()) {
			expsan.latch();
		}
	}

	#dataStorage: DefaultsData<T>;
	#reExpand = true;
	#theMapID: number;
	#cleanup: (() => void) | null;

	constructor(v: DefaultsData<T>, cleanup: (() => void) | null = null) {
		this.#cleanup = cleanup;
		this.#dataStorage = v;

		Object.freeze(this.#dataStorage.model);

		this.#theMapID = DefaultsManager.mapID++;
		DefaultsManager.theMap.set(this.#theMapID, this);
	}

    strip() {
        return stripDefaults(this.#dataStorage.model, this.#dataStorage.diff);
    }

	apply(): T {
		return applyDefaults(this.#dataStorage.model, this.#dataStorage.diff);
	}

	updateFromExpanded(full: T) {
		const stripped = stripDefaults(this.#dataStorage.model, full);
		this.#dataStorage.diff = stripped ?? null;

		if (this.#cleanup) {
			this.#cleanup();
		}
	}

	disableReExpand() {
		this.#reExpand = false;
	}

	attach(object: DeepPartial<T>) {
		this.#dataStorage.diff = object;
	}

	kill() {
		DefaultsManager.theMap.delete(this.#theMapID);
		this.#dataStorage.diff = null;
		if (this.#cleanup) {
			this.#cleanup();
		}
	}

	latch() {
		this.#reExpand = true;
	}

	check(v?: DeepPartial<T> | null): boolean {
		if (!this.#reExpand) return false;

		if (v !== undefined) {
			this.#dataStorage.diff = v ?? null;
		}

		this.#reExpand = false;
		return true;
	}

	get diff(): DeepPartial<T> | null {
		return this.#dataStorage.diff;
	}
}
