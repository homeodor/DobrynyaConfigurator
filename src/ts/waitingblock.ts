import { SysExStatus, SysExCommand } from 'midi_utils'
import WaitingBlockDialog from '../WaitingBlock.svelte'

let dialog = new WaitingBlockDialog(
	{ target: document.getElementById("waitingblockholder") }
);

// There is A LOT of bullshit in this file
// A LOT of errors and typos!
// BUT
// It works.
// So maybe I’ll look at it later and clean it up. For now be warned

export class WaitingBlock
{
//	static #timeout;
	static #isBlocked: boolean = false;
	static #unlockWith: SysExCommand = null;
	
	static init()
	{
//		m_el = document.getElementById("blocker");
	}
	
	static error(err = null)
	{
		
		let text: string;
		let commandText: string = "";
		
		switch (WaitingBlock.#unlockWith)
		{
			case SysExCommand.STATUS:
				commandText = "Get status";
				break;
			case SysExCommand.FREESPACE:
				commandText = "Get free space";
				break;
			case SysExCommand.PATCHLIST:
				commandText = "Get patch list";
				break;
			case SysExCommand.READPATCH:
				commandText = "Read the patch";
				break;
			case SysExCommand.WRITEPATCH:
				commandText = "Write the patch";
				break;
			case SysExCommand.OVERWRITEPATCH:
				commandText = "Overwrite the patch";
				break;
			case SysExCommand.DELETEPATCH:
				commandText = "Delete the patch";
				break;
			case SysExCommand.READPATCHTHROUGH:
				commandText = "Read patch through";
				break;
			case SysExCommand.GETPATCHINFO:
				commandText = "Get patch info";
				break;
			case SysExCommand.LOADPATCH:
				commandText = "Load patch";
				break;
			case SysExCommand.RENAMEPATCH:
				commandText = "Rename patch";
				break;
			case SysExCommand.COPYPATCH:
				commandText = "Copy patch";
				break;  // 0xC
			
			case SysExCommand.GETSETTINGS:
				commandText = "Get settings";
				break;
			case SysExCommand.SAVESETTINGS:
				commandText = "Save settings";
				break;
			case SysExCommand.GETCHIPID:
				commandText = "Get chip ID";
				break;
			case SysExCommand.GETSERIAL:
				commandText = "Get serial number";
				break;
			case SysExCommand.GETFIRMWAREMODEL:
				commandText = "Get firmware model";
				break;
			case SysExCommand.GETFACTORYSETTINGS:
				commandText = "Get factory settings";
				break;
			case SysExCommand.GETVERSION:
				commandText = "Get firmware version";
				break;
			case SysExCommand.GETPRESENTDEVICES:
				commandText = "Get devices present";
				break; // 0x17
			
			case SysExCommand.INVOKECONTROL:
				commandText = "Invoke control";
				break;
			case SysExCommand.LOCKPATCHSWITCHING:
				commandText = "Lock patch switching";
				break;
			case SysExCommand.WAKE:
				commandText = "Wakeup";
				break;
			case SysExCommand.LOADBANK:
				commandText = "Load bank";
				break; // 0x23
			
			case SysExCommand.LIGHTUP:
				commandText = "Light up";
				break;
			case SysExCommand.BURST:
				commandText = "Burst";
				break;
			case SysExCommand.PALETTE:
				commandText = "Get palettes";
				break; // 0x42
			
			case SysExCommand.REBOOT:
				commandText = "Reboot";
				break;
			case SysExCommand.REBOOT_MSC:
				commandText = "Reboot to disk";
				break;
			case SysExCommand.REBOOT_BOOT:
				commandText = "Reboot to bootloader";
				break;
			case SysExCommand.REBOOT_BOOTMSC:
				commandText = "Reboot to bootloader with virtual drive";
				break;
			default:
				break;
		}
		
		WaitingBlock.#unlockWith = null; // иначе не разблокируется кнопка ОКАУ
		
		console.log(WaitingBlock.#unlockWith);
		
		switch (err)
		{
			case SysExStatus.TIMEOUT:
				text = "The operation timed out. Please check that the device is connected and working."; break;
			case SysExStatus.GENERICERROR:
				text = "Some generic error happened. Please try again."; break;				
			case SysExStatus.NO_FILE:
				text = "The file requested hasn’t been found."; break;						
			case SysExStatus.NO_FILESYSTEM:
				text = "The device has no filesystem, or the filesystem is damaged."; break;
			case SysExStatus.NO_ENTITY:
				text = "Cannot find the required information in the patch."; break;
			case SysExStatus.FILE_EXISTS:
				text = "The file you are trying to save already exists."; break;
			case SysExStatus.CANT_RENAME:
				text = "Cannot rename the patch. Please try again."; break;
			case SysExStatus.WRONG_CHECKSUM:
				text = "File integrity check failed. Please try again."; break;
			case SysExStatus.WRONG_LENGTH:
				text = "The file has wrong length."; break;
			case SysExStatus.WRONG_FILENAME:
				text = "The requested filename is wrong."; break;
			case SysExStatus.FILENAME_TOO_LONG:
				text = "The requested file has a filename that is too long."; break;
			case SysExStatus.NOT_IMPLEMENTED:
			{
				WaitingBlock.unblock();
				return; // so what.
			}
			default:
				text = "An unknown error has occured. Please try again."; break;
		}
		
		dialog.error(commandText, text);
	}
	
	static timeout()
	{
		WaitingBlock.error(SysExStatus.TIMEOUT);
	}
	
	static block(unblockWith = null)
	{
		console.log("Unblock with ", unblockWith);
		WaitingBlock.#unlockWith = unblockWith;
		WaitingBlock.#isBlocked = true;
		dialog.block();
	}
	
	static unblockOrError(cmd: SysExCommand, status)
	{
		if (
			cmd == SysExCommand.STATUS ||
			WaitingBlock.#isBlocked == false ||
			WaitingBlock.#unlockWith == null ||
			cmd != WaitingBlock.#unlockWith
		) return; // ???? хз
		
		if (status == SysExStatus.OK)
			WaitingBlock.unblock(cmd);
		else
			WaitingBlock.error(status);
	}
	
	static unblock(unblock = null)
	{
		if (
			WaitingBlock.#isBlocked == false ||
			(unblock && unblock != WaitingBlock.#unlockWith)
			) return;
		
		dialog.unblock();
		WaitingBlock.#unlockWith = null;
		WaitingBlock.#isBlocked = false;
	}
}