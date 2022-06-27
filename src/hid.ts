interface BootloaderData
{
	device: any,
	flashPageSize: any,
	flashNumPages: any,
	maxMessageSize: any,
	familyID: any,
	dbrID: any,
	blVersion: any,
	fwVersion: any
}

const bootloader: BootloaderData = 
{
	device: null,
	flashPageSize: null,
	flashNumPages: null,
	maxMessageSize: null,
	familyID: null,
	dbrID: null,
	blVersion: null,
	fwVersion: null
};

// @ts-ignore
let hid = navigator.hid;

const hidFilters = 
[
	{
		vendorId: 0x04d8,
		productId: 0xe810
	},
	{
		vendorId: 0x04d8,
		productId: 0xe811
	},
	{
		vendorId: 0x04d8,
		productId: 0xe812
	},
	{
		vendorId: 0x04d8,
		productId: 0xe813
	},
	{
		vendorId: 0x16c0,
		productId: 0x05e5
	}
];

async function exitBootloader() { await requestAndWait(bootloader.device, 0x0003); }

async function requestDevice()
{
	let hids = await hid.requestDevice({filters: hidFilters});
	if (!hids.length || !hids[0]) return false;	
}

async function connectToDevice(entry)
{
	
	bootloader.device = entry;//hids[0];
	if (!bootloader.device.opened) await bootloader.device.open();
	return true;
}

async function hidFillData(entry)
{
	if (!await connectToDevice(entry)) return false;
	
	await getBasicData();
	await getBootloaderData();
	await getVersionData();
	
	return true;
}

async function getBasicData()
{
	// uint32_t mode;
	// uint32_t flash_page_size;
	// uint32_t flash_num_pages;
	// uint32_t max_message_size;
	// uint32_t family_id; // optional
	let bootloaderDataArr = await requestAndWait(bootloader.device, 0x0001);
	let dataView = new DataView(bootloaderDataArr.buffer);
	
	bootloader.flashPageSize  = dataView.getUint32(4, true);
	bootloader.flashNumPages  = dataView.getUint32(8, true);
	bootloader.maxMessageSize = dataView.getUint32(12,true);
	bootloader.familyID       = dataView.getUint32(16,true);
	
	// console.log(bootloader);
}

async function getVersionData()
{
	if (bootloader.flashNumPages == null || bootloader.flashPageSize == null) return false;
	
	let bytesizepos = bootloader.flashNumPages * bootloader.flashPageSize - 0x24; // 36 bytes
	
	let dataStuff = new ArrayBuffer(8);
	let dataView  = new DataView(dataStuff);
	
	dataView.setUint32(0,bytesizepos,true);
	dataView.setUint32(4,9,true);
	
	// console.log(new Uint8Array(dataStuff));
	
	let result = (new TextDecoder).decode(await requestAndWait(bootloader.device, 0x0008, new Uint8Array(dataStuff)));
	console.log(result, result.startsWith("VERS"));
	
	if (result.startsWith("VERS"))
	{
		bootloader.fwVersionIsReal = true;
		bootloader.fwVersion = result.substring(5).replace(/\0.*$/g,''); // remove zeroes at the end!
	} else {
		bootloader.fwVersionIsReal = false;
		bootloader.fwVersion = "1.0/23.11.2020-23:23";
	}
}

async function getBootloaderData()
{
	let bootloaderDataArr =
		(new TextDecoder)
		.decode(await requestAndWait(bootloader.device, 0x0002))
		.trim()
		.split("\r\n");
		
	let bootloaderData = {};
	
	for (let bld of bootloaderDataArr)
	{
		let [k,v] = bld.split(":");
		if (!v)
		{
			v = k;
			k = "Bootloader";
		}
		bootloaderData[k.trim()] = v.trim();
	}
	
	let deviceID = "";
	
	if ("Dbr-version" in bootloaderData) // new bootloader
	{
		bootloader.deviceID = bootloaderData["Board-ID"].split("-").slice(2).join("-")
		bootloader.blVersion = bootloaderData["Dbr-version"];
		
	} else {
		let [chip,board] = bootloaderData["Board-ID"].split("-");
		
		board = board.replace("Dobrynya_","");
		
		if (board == "MiniV2" || board == "MicroV2")
			bootloader.deviceID = `${board.toLowerCase()}-${chip.startsWith("SAMD21G17")?"17":"18"}`;
		else
			bootloader.deviceID = "32r1";
		
		bootloader.blVersion = "1.0";
		
	}
	
}

async function requestAndWait(dev, cmd, data: Uint8Array | number[])
{
	let theArray = new Uint8Array(((data as Uint8Array).byteLength ?? data.length) + 8);
	let tag = Math.floor(Math.random() * 0xffff);
	
	let dataView = new DataView(theArray.buffer);
	
	dataView.setUint32(0, cmd, true);
	dataView.setUint16(4, tag, true);
	dataView.setUint8 (6, 0);
	dataView.setUint8 (7, 0); // two reserved uint8_t
	theArray.set(data,8);
	
	let totalLength = theArray.byteLength;
	let sendArrays = [];
	
	let part63 = Math.ceil(totalLength / 63);
	let lengthLeft = totalLength;
	
	for (let i=0; i<part63; i++)
	{
		let nowLength =
				(lengthLeft <= 63) ?
					lengthLeft | 0x40 : // final
					63;
					
		let nowArray = new Uint8Array((nowLength & 0x3f) + 1);
		
		nowArray[0] = nowLength;
		nowArray.set(theArray.slice(i*63,i*63+63),1);
		
		sendArrays.push(nowArray);
		
		lengthLeft -= 63;
	}
	
	// console.log(sendArrays);
		
	let resultTotal = await new Promise((resolve, reject) => {
		
		let result = new Uint8Array(0);
		
		let dataHandler = (ev) =>
		{
			// console.log(ev);
			
			let byteLength = result.byteLength;
			
			let data = ev.data;
			let length = ev.data.getUint8(0) & 0x3f;
			let isFinal = ev.data.getUint8(0) & 0x40;
			let isFirst = byteLength == 0;
			let offset = isFirst ? 5 : 1;
			
			if (isFirst)
			{
				let receiveTag = ev.data.getUint16(1, true);
				if (receiveTag != tag || ev.data.getUint8(3))
					reject();
			}
			
			let tempResult = result;
			result = new Uint8Array(byteLength + length + 1 - offset);
			result.set(tempResult);
			result.set(new Uint8Array(ev.data.buffer).slice(offset, length + 1), byteLength)
			
			if (isFinal)
			{
				dev.removeEventListener("inputreport", dataHandler);
				resolve(result);
			}
		}
		
		dev.addEventListener("inputreport", dataHandler);
		
		for (let arr of sendArrays)
			dev.sendReport(0,arr);
	});
	

	// console.log(resultTotal);
	
	return resultTotal;
	
}