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
	static #timeout;
	static #isBlocked: number = 0;
	static #unlockWith = null;
	
	static init()
	{
		m_el = document.getElementById("blocker");
	}
	
	static error(err = null)
	{
		WaitingBlock.unblockWith = null; // иначе не разблокируется кнопка ОКАУ
		
		let text;
		
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
			default:
				text = "An unknown error has occured. Please try again."; break;
		}
		
		dialog.error(text);
	}
	
	static timeout()
	{
		WaitingBlock.error(SysExStatus.TIMEOUT);
	}
	
	static block(unblockWith = null)
	{
		WaitingBlock.unblockWith = unblockWith;
		WaitingBlock.isBlocked = true;
		dialog.block();
	}
	
	static unblockOrError(cmd,status)
	{
		if (
			cmd == SysExCommand.STATUS ||
			WaitingBlock.isBlocked == false ||
			WaitingBlock.unblockWith == null ||
			cmd != WaitingBlock.unblockWith
		) return; // ???? хз
		
		if (status == SysExStatus.OK)
			WaitingBlock.unblock(cmd);
		else
			WaitingBlock.error(status);
	}
	
	static unblock(unblock = null)
	{
		if (
			WaitingBlock.isBlocked == false ||
			(unblock && unblock != WaitingBlock.unblockWith)
			) return;
		
		dialog.unblock();
		WaitingBlock.unblockWith = null;
		WaitingBlock.isBlocked = false;
	}
}