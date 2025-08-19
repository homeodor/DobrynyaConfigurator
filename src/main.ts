function isCompatible() {
	const midiOk = "requestMIDIAccess" in navigator;
	const wasmOk = typeof WebAssembly === "object";
	return midiOk && wasmOk;
}

if (!isCompatible()) {
	location.href = "incompatible.html";
}

// 3) App-specific bootstrap
import { init } from "./ts/midi_core";
try {
	await init(); // or remove await if it"s sync
} catch (e) {
	console.error("Init failed:", e);
}

// 4) Mount Svelte
import Main from "./Main.svelte";
import { mount } from "svelte";

export const theApp = mount(Main, {
	target: document.getElementById("app")!,
});

// 5) Dev-only globals
if (import.meta.env.DEV) {
	// @ts-expect-error debug
	window.theApp = theApp;
}

// 6) Error notices (production only)
function crashNotice(e: ErrorEvent | PromiseRejectionEvent) {
	if (!import.meta.env.DEV) {
		alert(
			`Sorry, the app crashed. Please reload the window.
${"reason" in e ? e.reason : e.message || e.type}`
		);
	}
}
window.addEventListener("error", crashNotice);
window.addEventListener("unhandledrejection", crashNotice);

// If you really need this map globally:
if (!("expandersSanizers" in window)) {
	// @ts-expect-error debug
	window.expandersSanizers = new Map();
}
