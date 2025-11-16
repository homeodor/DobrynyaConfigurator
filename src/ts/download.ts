import { getDevice } from "./device";
import { sysExSign } from "./midi_core";
import { SignKind } from "./types";

const baseUrl = "https://dbr-cdn.ru/astrid";
const k_signTestString = "DobrynyaConfigurator";

export async function checkSigning() {
	try {
		const encoder = new TextEncoder();

		const result = await sysExSign(
			encoder.encode(k_signTestString),

			SignKind.Type2
		);
		const valid = toBase64(result) === getDevice().model.testSignResult;

		if (!valid) {
			console.warn(
				"The device does not sign in a valid way. Result / expected:",
				toBase64(result),
				getDevice().model.testSignResult
			);
			return false;
		}

		console.log("This device supports signing");
		return true;
	} catch (err) {
		console.warn("The device does not support signing", err);
		return false;
	}
}

function fromBase64(base64: string): Uint8Array {
	let binaryString = window.atob(base64);
	let bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return new Uint8Array(bytes.buffer);
}

function toBase64(buffer: Uint8Array): string {
	return window.btoa(String.fromCharCode.apply(null, buffer));
}

export interface ExtraPack {
	name: string;
}

export interface ExtraVideo {
	url: string;
	name: string;
}

export interface ExtraContent {
	packs: ExtraPack[];
	videos: ExtraVideo[];
}

export interface UpdatesInfo {
	latest: {
		build: number | null;
		version: string;
	};
}

export async function getUpdates(): Promise<any> {
	const downloadFetch = await fetch(`${baseUrl}/updates`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			deviceData: {
				model: getDevice().model.code,
				serial: getDevice().serial,
			},
		}),
	});

	const list = await downloadFetch.json();

	if (list.status !== "OK" || !list.payload) {
		throw new Error(list.message);
	}

	return list.payload as any;
}

export async function getContentList(): Promise<ExtraContent> {
	const downloadFetch = await fetch(`${baseUrl}/list`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			deviceData: {
				model: getDevice().model.code,
				serial: getDevice().serial,
			},
		}),
	});

	const list = await downloadFetch.json();

	if (list.status !== "OK" || !list.payload) {
		throw new Error(list.message);
	}

	return list.payload as ExtraContent;
}

async function sign() {
	if (!getDevice().supportsSigning) {
		throw new Error("Device does not support signing");
	}

	const challengeJson = await fetch(`${baseUrl}/challenge`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	});

	const challenge = await challengeJson.json();

	if (
		challenge.status !== "OK" ||
		!challenge.payload ||
		typeof challenge.payload.challenge !== "string" ||
		typeof challenge.payload.signKind !== "number"
	) {
		throw new Error(challenge.message);
	}

	const binaryString = fromBase64(challenge.payload.challenge);
	const result = await sysExSign(
		binaryString,
		challenge.payload.signKind as SignKind
	);
	return { base64: toBase64(result), session: challenge.payload.session };
}

export async function getDownloadLink(file: string) {
	const { base64, session } = await sign();

	const downloadFetch = await fetch(`${baseUrl}/download`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			deviceData: {
				model: getDevice().model.code,
				serial: getDevice().serial,
			},
			file,
			session: session,
			response: base64,
		}),
	});

	const download = await downloadFetch.json();

	if (download.status !== "OK") {
		throw new Error(challenge.message);
	}

	console.log(download);
	return download.payload.url;
}

export async function getFirmwareBlob(): Promise<Blob | null> {
	const { base64, session } = getDevice().supportsSigning
		? await sign()
		: {
				base64: "",
				session: "",
			};

	const downloadFetch = await fetch(`${baseUrl}/firmware`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			deviceData: {
				model: getDevice().model.code,
				serial: getDevice().serial,
			},
			session,
			response: base64,
		}),
	});

	try {
		const json = await downloadFetch.clone().json();
		console.log(json);
		return null;
	} catch (e) {}

	return await downloadFetch.blob();
}
