import { getDevice } from "./device";
import { sysExSign } from "./midi_core";
import { decode } from "js-base64";
import { SignKind } from "./types";
import { extraContent } from "./stores";

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

export async function getDownloadLink(file: string) {
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
	const base64 = toBase64(result);

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
			session: challenge.payload.session,
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
