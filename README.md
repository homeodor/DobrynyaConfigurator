

# Dobrynya Configurator

This is a repo containing the code of MIDI Dobrynya configurator. It has been written by [Alexander Golovanov](https://shurik.uk) and is provided under MIT license (see a note at the end).

It has been first written in a rather, erm, legacy flavour of JS, and then completely rewritten over a course of month in [Svelte](https://svelte.dev/)/[TypeScript](https://www.typescriptlang.org/). Eventually I’ve decided to make this repo public.

For MIDI Dobrynya users, the configurator is available at [config.mididobrynya.com](https://config.mididobrynya.com/).

## MIDI Dobrynya

MIDI Dobrynya is a series of hand-built, highly configurable USB-MIDI controllers. This configurator is designed to work with Mini V2 and Micro V2 models (some upcoming models may eventually be supported as well). You can learn more about the project and buy yourself a great MIDI controller at [mididobrynya.com](https://www.mididobrynya.com/).

## Disclaimer

This project, as well as the Dobrynya itself, is more of a hobby for me than a full-time job. That’s why this code is provided as-is and with little comment. You will have to find out how it works mostly on your own. I tried my best to keep it kinda self-documented, but this is a far cry from proper good open source stuff people put on GitHub.

Absolutely no training wheels are provided. You’ll have to know how to install Node and other scary things. This project requires some familiarity with modern JS, Svelte et cetera. Learn your stuff, DYOR, RTFM, examine [Svelte.dev](https://svelte.dev), watch [YouTube](https://www.youtube.com/watch?v=rv3Yq-B8qp4), read [StackOverflow](https://stackoverflow.com/questions/9751207/how-can-i-use-goto-in-javascript) – this is what I did, and here we are. If everything fails, [contact me](https://shurik.uk)!

Also, I don’t consider myself a pro JavaScript/TypeScript/Svelte/CSS programmer. This means that though I am trying hard to make the code as good as possible, some things may have been done in an outrageously stupid and/or outdated manner, and numerous quirks may exist. I’ve started learning Svelte and TS in early June 2022, and in late June 2022 I’m writing this Readme with the configurator mostly done. Have mercy!

The CSS also needs a cleanup (and probably a transition to SCSS).

## The why

This repo is available for people who want to

 - **Develop a Web MIDI project.** This configurator uses an elaborate system of System Exclusive (SysEx) MIDI messages to communicate with the device, and the request-respond is designed to be an asynchronous routine, kinda similar to how AJAX is handled these days, *async/await* and all. It’s not like there are tons of good code on the web!
- **Learn how Dobrynya communication works.** All of the configurable MIDI controllers/instruments I know of use SysEx to talk to their host. Ever wanted to build your own MIDI device with complex SysEx? Maybe this code could be of help!
- **Do really custom stuff with your Dobrynya.** You can totally examine the code, find some dirty secrets of the communication with Dobrynya and possibly use it to create your own custom apps and setups, such as in Cycling74’s Max. Care to automatically change your banks/patches on a certain event? It is totally possible.
- **Check out Web HID, specifically a HF2 protocol.** There are barely ANY examples of the Microsoft’s [HF2](https://github.com/microsoft/uf2/blob/master/hf2.md) firmware upload protocol. Now there are.

## Electron app

There is a basic support for the standalone [Electron-based](https://electronjs.org) app, but this is not a priority at the moment. From what I see, it works apart from the firmware update. However, the code may be ugly and/or unsafe.

## buildversion.mjs

There is a script that runs when the project builds. It just increments the build number. It rewrites ```version.ts``` in the project ```src/``` and also changes the version number in package.json (i.e. sets the version to ```1.0.33``` for build 33).

# How Dobrynya works

Here are some details that will help you understand the underpinnings of the Configurator and the device.

## Device class, model and serial

Each device’s serial number consists of model string and, well, an actual serial number.

It goes like this:

```
CMVVRR-xxxx
```

```C``` is the class (think of it as the size of the device), ```M``` is the model number; together they make up the model ID. ```VV``` is the variant and ```RR``` is the revision of that model. ```xxxx``` is the actual serial number which increments separately for each model ID, but not for revisions or variants. 

The Configurator supports these devices:

|Model ID|Class|Name|
|-|-|-|
|21|XS|Micro V2|
|31|S|Mini V2|

The serial number is important information for the Configurator: it is used to distinguish models as well as individual devices.

## Patches

All Dobrynya patches are actually encoded as BSON. Not only BSON can be easily converted to JSON, the Configurator actually allows for direct JSON download. One day I will fully document the JSON structure, but for definitely not now.

Basically, the paradigm of the patch files is simple: if a value is set to default, the parameter is omitted altogether; if a branch contains nothing useful, it is removed. This is true for most of the branches except for some root ones. This makes patches more concise and saves space and memory.

## Colour

RGB isn’t that useful for humans. The colour values of Dobrynya are mostly encoded as a 16-bit HSV number (hue, saturation, value). The encoding is as follows:

```
HHSV, i.e.
HH - 8 bits or 256 values of hue
S - 4 bits, or 16 values of saturation
V - 4 bits, or 16 values of, erm, value (brightness, that is)
```

Which gives 65k colours, a plenty for a MIDI controller and saves tons of memory. Internally all LEDs are fully 24 bit RGB though.

### Colour off

Actually, all colours that have a value of 0 will be black, no matter the hue.

There is a magic value ```0xff00``` that means “colour off”.

## SysEx

Here’s a brief overview of how Dobrynya’s SysExes work.

Each one consists of the following bytes:

```
0xF0 - start of SysEx, as is per MIDI standard
0x00 0x39 0x40 - normally here comes a Manufacturer SysEx ID. Dobrynya doesn’t have one assigned (yet), so this header is as good as any
CC - device class number (the Configurator sends 0x77 here)
MM - device model number (the Configurator sends 0x76 here)
RR - device revision (the Configurator sends 0x00)
Vm - firmware/configurator version minor (the Configurator currently sends 0x00)
VM - firmware/configurator version major (the Configurator currently sends 0x00)
0x00 - reserved
CM - the command
ST - the status
C1 C2 C3 C4 L1 L2 L3 L4 - optional, 28 bit checksum/length (if status’ bit 7 is set, see below)
... optional, some data
0xF7 - SysEx ends, as is per the standard
```

### Raw data

MIDI cannot handle 8-bit data. Sigh.

Often 8-bit data is encoded down to 7-bit, like so:

```
Source:
aaaaaaaa bbbbbbbb cccccccc dddddddd eeeeeeee ffffffff gggggggg

Result:
0aaaaaaa 0abbbbbb 0bbccccc 0cccdddd 0ddddeee 0eeeeeff 0ffffffg 0ggggggg
```

This needs to be done (and then reversed) each time Dobrynya and Configurator exchange common data, such as blobs. You may think it is a huge pain in the butt. And it is.

Integers, such as checksums and lengths, are stored as a 28-bit value (4×7 bits).

### Filename encoding

Currently the filename is assumed to contain only the characters from the basic ASCII table. This means that no special encoding is required, as it is already [a 7-bit table](https://www.asciitable.com/). Dobrynya cannot handle UTF-encoded filenames at the moment anyway.

The filenames are zero-terminated.

The maximum length of a filename, the extension (```.dbrpatch```) and the last null character included, is 84 bytes. This leaves 74 bytes for characters. This is 74 basic ASCII characters and less for UTF.

In the future UTF-8 encoding will be implemented in a rather peculiar way. A DC2 (0x12) symbol marks the beginning of bytes that have 8th bit (Unicode bytes), and DC4 (0x14) marks the end of such section, and the 8th bit is then truncated on all bytes.

#### Patch list

Filenames in patch lists are stored in the same manner, except one of these may have a DLE (0x10) character in the very beginning. This marks the patch that has been active on the device.

### File operations

The data for file operations commonly goes like so:

```
FILENAME - bytes containing the filename
00 ... - one or more zeroes to terminate the filename
... 8-bit → 7-bit encoded blob (if required)
```

The filename is padded with zeroes such as the total length of the SysEx message is a multiple of 3. This has to do with the fact that MIDI-USB uses a 3-byte data in its packet.

### Renaming / duplicating

Currently the Configurator only uses ```RENAMEPATCH``` command. For duplicating patches, it actually downloads the patch from the device and re-uploads it after checking (though direct duplication with ```COPYPATCH``` probably works, too).

The data very similar to general file operations, except of course there are two filenames and no blob is required:

```
FILENAME - bytes containing the filename
00 ... - one or more zeroes to terminate the filename
FILENAME2 - bytes containing the second filename (renaming/duplicating only)
00 ... - one or more zeroes to terminate the second filename, if present
```


### Colour encoding

If colour values in HHSV format (see before) are sent over SysEx, they are split into three bytes as follows:

```
8-bit, two bytes
HHHHHHHH SSSSVVVV
abcdefgh ijklmnop

7-bit, three bytes
0bcdefgh 0jklmnop 000000ai
```

### Status

Status byte either shows the intent of the message, or contains an error code.

|Hexadecimal | Mnemonic | Meaning |
|-|-|-|
|```0x1```|```OK```              | Well, it’s OK.
|```0x2```|```REQUEST```         | A request (mostly from the host to the device)
|```0x3```|```RESET```           | Reset something set by the previous request
|```0x4```|```COMPLETE```        | Reserved
|```0x5```|```PUSH```            | Dobrynya sends this code if it pushes non-requested data
|```0x10```|```GENERICERROR```   | Oops.
|```0x11```|```NO_FILE```        | File doesn’t exist
|```0x12```|```NO_FILESYSTEM```  | Filesystem is probably corrupt
|```0x13```|```NO_ENTITY```      | The file doesn’t contain the data requested
|```0x14```|```FILE_EXISTS```    | The file already exists (can’t overwrite)
|```0x15```|```CANT_RENAME```    | Rename failed
|```0x16```|```WRONG_CHECKSUM``` | Checksum failed
|```0x17```|```WRONG_LENGTH```   | The length of data is not what was expected
|```0x18```|```WRONG_FILENAME``` | The filename turned out to be bad in some way (probably forbidden characters such as * and ?)
|```0x19```|```FILENAME_TOO_LONG```   | The filename length exceeded 84 bytes

Also, if bit 7 is set, this means that the message will contain the checksum.


### Commands

|Hexadecimal |Mnemonic | Request |Data|
|---|---|---|---|
|```0x1```|```STATUS```           | Requests status data and general device information                                       | Responds with an encoded blob of device data: serial, features, fw version
|```0x2```|```FREESPACE```        | Requests free space available on the device’s flash                                       | Responds with an encoded blob of SOMETHING. I don’t quite remember, will revisit later
|```0x3```|```PATCHLIST```        | Requests the list of patches                                                              | Responds with a list of zero-terminated file strings (see Filenames section)
|```0x4```|```READPATCH```        | Streams the whole patch                                                                   | Responds with file data
|```0x5```|```WRITEPATCH```       | Writes the patch from streamed data (but fails if file exists)                            | Requests with file data, responds with nothing
|```0x6```|```OVERWRITEPATCH```   | Same, but overwrites it                                                                   | Ditto
|```0x7```|```DELETEPATCH```      | Delete the patch                                                                          | 
|```0x8```|```READPATCHTHROUGH``` | Same as READPATCH, but different code for different configurator behaviour (now not really needed) | Same as READPATCH
|```0x9```|```GETPATCHINFO```     | Reads only the info part of the patch (for patch list)                                        | Same as READPATCH
|```0xA```|```LOADPATCH```        | Tells the device to load the patch                                                            |
|```0xB```|```RENAMEPATCH```      | Renames the patch                                                                             |
|```0xC```|```COPYPATCH```        | Duplicates the patch (not used)                                                           |
|```0x10```|```GETSETTINGS```       | Streams the settings blob                                                                   | Encoded settings blob
|```0x11```|```SAVESETTINGS```      | Writes the settings blob                                                                    | Ditto
|```0x12```|```GETCHIPID```         | Gets the unique microcontroller ID (not used)                                               | Encoded chip ID sequence
|```0x13```|```GETSERIAL```         | Gets the device serial number (not used, as this data is contained in STATUS reply)         | Encoded data
|```0x14```|```GETFIRMWAREMODEL```  | Gets the device model from the firmware (not used)                                          | Encoded model code
|```0x15```|```GETFACTORYSETTINGS```| Gets the factory settings blob (not used)                                                   | Encoded factory settings blob
|```0x16```|```GETVERSION```        | Gets the firmware version (not used, as this data is contained in STATUS reply)             | Encoded firmware version
|```0x17```|```GETPRESENTDEVICES``` |                                                                                             | Encoded feature presence flags
|```0x20```|```INVOKECONTROL```      | Invoke a control (opens the editor in the Configurator) | TT NN, where TT is control type and NN is its number
|```0x21```|```LOCKPATCHSWITCHING``` | Locks patch switching on Dobrynya if patch is unsaved in the configurator | 
|```0x22```|```WAKE```               | Does nothing |
|```0x23```|```LOADBANK```           | Switches banks on the device. | SH BB, where S is if it is a sub-bank, H is hand (commonly 0), BB is bunk number
|```0x40```|```LIGHTUP```            | Makes the device light up with colours | Three reserved bytes (now all set to 0x0), then 1 or 16 encoded 16-bit HSV values (see before)
|```0x41```|```BURST```              | Reserved |
|```0x42```|```PALETTE```            | Reserved |
|```0x60```|```REBOOT```             | Just reboots the device |
|```0x61```|```REBOOT_MSC```         | Reboots the device into disk moe |
|```0x62```|```REBOOT_BOOT```        | Reboots the device into bootloader |
|```0x63```|```WRITEFIRMWARE```      | Reserved |
|```0x64```|```FORMATDISK```         | Formats the internal drive. Needs to be sent three times to work. |
|```0x65```|```ERASEFLASH```         | Erases flash memory altogether. Needs to be sent three times to work. You don’t want to do this, trust me. |
|```0x66```|```REBOOT_ESP32```       | Reserved |

### Use MIDI Monitor

Now, with this knowledge, you may open a [MIDI Monitor](https://www.snoize.com/midimonitor/) and be able to see through the bits and bytes, just as if it were the Matrix code.

## Settings map

System settings map can be deducted from a ```settings_utils.ts``` file. Maybe I will provide a proper list one day, but today I feel lazy.

## HID, UF2 bootloaders and HF2 protocol

The firmware update process is generally designed around the [UF2 standard](https://github.com/microsoft/uf2) by Microsoft. The bootloader (which is a close fork of Microsoft’s bootloader) implements Mass storage and HID protocols to upload the firmware.

There is a whole part of this Configurator that communicates with the bootloader via the [HF2 protocol](https://github.com/microsoft/uf2/blob/master/hf2.md). This requires a Web HID implementation (which works only in Blink-based browsers). Most of the magic happens in hid.ts and flasher.ts, and you can read it along with the specs of the HF2 protocol. It’s not quite rocket science, but there were no examples of such code on the web at the moment of me writing it, so it might be helpful.

## License

The code is provided under MIT license, however this license **does not** cover the images in the i/ and electron-resources/ folder. Those are covered by a separate CC BY-NC-SA license. If you want to use the images in a commercial project or otherwise, [contact me](https://shurik.uk).

## In place of a conclusion

Wow. It was a hell lot of work to write all this. I mean, the README. The Configurator and the firmware was the easy part...
