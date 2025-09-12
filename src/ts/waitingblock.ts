import { Status, Command } from "./configurator";
import WaitingBlockDialog from "../WaitingBlock.svelte";
import { mount } from "svelte";

const waitingBlockHolder = document.getElementById("waitingblockholder");

if (!waitingBlockHolder) {
	throw new Error(
		"Waiting block holder element (#waitingblockholder) has not been found"
	);
}

let dialog = mount(WaitingBlockDialog, {
	target: waitingBlockHolder,
});

// There is A LOT of bullshit in this file
// A LOT of errors and typos!
// BUT
// It works.
// So maybe I’ll look at it later and clean it up. For now be warned

export class WaitingBlock {
	//	static #timeout;
	static #isBlocked: boolean = false;
	static #unlockWith: Command | null = null;

	static init() {
		//		m_el = document.getElementById("blocker");
	}

	static error(err: Status | null = null) {
		let text: string;
		let commandText: string = "";

		switch (WaitingBlock.#unlockWith) {
			case Command.STATUS:
				commandText = "Get status";
				break;
			case Command.FREESPACE:
				commandText = "Get free space";
				break;
			case Command.PATCHLIST:
				commandText = "Get patch list";
				break;
			case Command.READPATCH:
				commandText = "Read the patch";
				break;
			case Command.WRITEPATCH:
				commandText = "Write the patch";
				break;
			case Command.OVERWRITEPATCH:
				commandText = "Overwrite the patch";
				break;
			case Command.DELETEPATCH:
				commandText = "Delete the patch";
				break;
			case Command.READPATCHTHROUGH:
				commandText = "Read patch through";
				break;
			case Command.GETPATCHINFO:
				commandText = "Get patch info";
				break;
			case Command.LOADPATCH:
				commandText = "Load patch";
				break;
			case Command.RENAMEPATCH:
				commandText = "Rename patch";
				break;
			case Command.COPYPATCH:
				commandText = "Copy patch";
				break; // 0xC

			case Command.GETSETTINGS:
				commandText = "Get settings";
				break;
			case Command.SAVESETTINGS:
				commandText = "Save settings";
				break;
			case Command.GETCHIPID:
				commandText = "Get chip ID";
				break;
			case Command.GETSERIAL:
				commandText = "Get serial number";
				break;
			case Command.GETFIRMWAREMODEL:
				commandText = "Get firmware model";
				break;
			case Command.GETFACTORYSETTINGS:
				commandText = "Get factory settings";
				break;
			case Command.GETVERSION:
				commandText = "Get firmware version";
				break;
			case Command.GETPRESENTDEVICES:
				commandText = "Get devices present";
				break; // 0x17

			case Command.INVOKECONTROL:
				commandText = "Invoke control";
				break;
			case Command.LOCKPATCHSWITCHING:
				commandText = "Lock patch switching";
				break;
			case Command.WAKE:
				commandText = "Wakeup";
				break;
			case Command.LOADBANK:
				commandText = "Load bank";
				break; // 0x23

			case Command.LIGHTUP:
				commandText = "Light up";
				break;
			case Command.BURST:
				commandText = "Burst";
				break;
			case Command.PALETTE:
				commandText = "Get palettes";
				break; // 0x42

			case Command.REBOOT:
				commandText = "Reboot";
				break;
			case Command.REBOOT_MSC:
				commandText = "Reboot to disk";
				break;
			case Command.REBOOT_BOOT:
				commandText = "Reboot to bootloader";
				break;
			case Command.REBOOT_BOOTMSC:
				commandText = "Reboot to bootloader with virtual drive";
				break;
			default:
				break;
		}

		WaitingBlock.#unlockWith = null; // иначе не разблокируется кнопка ОКАУ

		console.log(WaitingBlock.#unlockWith);

		switch (err) {
			case Status.TIMEOUT:
				text =
					"The operation timed out. Please check that the device is connected and working.";
				break;
			case Status.GENERICERROR:
				text = "Some generic error happened. Please try again.";
				break;
			case Status.NO_FILE:
				text = "The file requested hasn’t been found.";
				break;
			case Status.NO_FILESYSTEM:
				text =
					"The device has no filesystem, or the filesystem is damaged.";
				break;
			case Status.NO_ENTITY:
				text = "Cannot find the required information in the patch.";
				break;
			case Status.FILE_EXISTS:
				text = "The file you are trying to save already exists.";
				break;
			case Status.CANT_RENAME:
				text = "Cannot rename the patch. Please try again.";
				break;
			case Status.WRONG_CHECKSUM:
				text = "File integrity check failed. Please try again.";
				break;
			case Status.WRONG_LENGTH:
				text = "The file has wrong length.";
				break;
			case Status.WRONG_FILENAME:
				text = "The requested filename is wrong.";
				break;
			case Status.FILENAME_TOO_LONG:
				text = "The requested file has a filename that is too long.";
				break;
			case Status.WRONG_DATA:
				text = "The device has rejected the data as malformed";
				break;
			case Status.READ_ONLY_FILESYSTEM:
				text = "The filesystem of this device is read-only. Please <a href='/migratefs/'>migrate it</a> for writing access.";
				break;
			case Status.NOT_IMPLEMENTED: {
				WaitingBlock.unblock();
				return; // so what.
			}
			default:
				text = "An unknown error has occured. Please try again.";
				break;
		}

		dialog.error(commandText, text);
	}

	static timeout() {
		WaitingBlock.error(Status.TIMEOUT);
	}

	static block(unblockWith: null | Command = null) {
		console.log("Unblock with ", unblockWith);
		WaitingBlock.#unlockWith = unblockWith;
		WaitingBlock.#isBlocked = true;
		dialog.block();
	}

	static unblockOrError(cmd: Command, status: Status) {
		if (
			cmd == Command.STATUS ||
			WaitingBlock.#isBlocked == false ||
			WaitingBlock.#unlockWith == null ||
			cmd != WaitingBlock.#unlockWith
		)
			return; // ???? хз

		if (status == Status.OK) WaitingBlock.unblock(cmd);
		else WaitingBlock.error(status);
	}

	static unblock(unblock: Command | null = null) {
		if (
			WaitingBlock.#isBlocked == false ||
			(unblock && unblock != WaitingBlock.#unlockWith)
		)
			return;

		dialog.unblock();
		WaitingBlock.#unlockWith = null;
		WaitingBlock.#isBlocked = false;
	}
}
