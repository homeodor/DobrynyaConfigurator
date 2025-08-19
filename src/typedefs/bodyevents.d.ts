declare global {
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
	}
}

export {};
