import type {} from "svelte/elements"; // ensure module resolution
import type { Result } from "../ts/configurator";
import type { BankInvokeData, InvokeControlData } from "../ts/event_helpers";
import type { StatusResult } from "../ts/types";

declare module "svelte/elements" {
	interface HTMLAttributes<T> {
		ondobrynyahere?: (e: CustomEvent<StatusResult>) => void;
		ondobrynyagone?: () => void;
		oninvoke?: (e: CustomEvent<InvokeControlData>) => void;
		onpatchchange?: () => void;
		onpatchlock?: () => void;
		onsysexpush?: (e: CustomEvent<Result>) => void;
		ondrawer?: (e: CustomEvent<string>) => void;
		oninvokebank?: (e: CustomEvent<BankInvokeData>) => void;
		onopennewui?: () => void;
		onclosenewui?: () => void;
		onsection?: (e: CustomEvent<string>) => void;
		oncloseeditor?: () => Promise<void>;
	}

	interface GlobalEventHandlersEventMap {
		dobrynyahere: CustomEvent<unknown>;
		dobrynyagone: CustomEvent<unknown>;
		invoke: CustomEvent<unknown>;
		section: CustomEvent<unknown>;
		patchlock: CustomEvent<unknown>;
		patchchange: CustomEvent<unknown>;
		sysexpush: CustomEvent<unknown>;
		drawer: CustomEvent<unknown>;
		invokebank: CustomEvent<unknown>;
		selectpatch: CustomEvent<unknown>;
		opennewui: CustomEvent<unknown>;
		closeeditor: CustomEvent<unknown>;
		closenewui: CustomEvent<unknown>;
		closeeditor: CustomEvent<unknown>;
	}
}

export {};
