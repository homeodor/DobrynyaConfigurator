import { deepClone } from "./basic";

export function expandData(model: any, data: any)
{
	for (let property in model)
	{
		if (typeof model[property] == "object")
		{
			if (property in data)
				expandData(model[property], data[property]);
			else
				data[property] = deepClone(model[property]);
		} else {
			if (!(property in data)) data[property] = model[property];
		}
	}
}

export function sanizeData(model: any, data: any, safe: any = false): boolean // removes default values. Assumes that data has all the keys of model
{
	if (Array.isArray(data))
	{
		if (data.length != model.length) { console.log(data,model);
			throw "Sanize failed: model array has a different length from data array";
		}

		for (let i = data.length - 1; i >= 0; i--) // reverse walk the array...
		{
			if (typeof data[i] == "object")
			{
				if (sanizeData(model[i], data[i])) delete data[i];
			} else {
				if (model[i] == data[i])
					data.pop(); // it is always the last element of array!
				else
					return false;
					// we ran into non-default value in the array,
					// so we keep it and all the values before it intact, even if some were “default”
			}
		}
		
		return true; // the whole array has been default, so we can delete it altogether
	} else {
		let hadNonDefaultData = false;
		
		for (let property in data)
		{
			if (!(property in model)) {
				if (!safe)
				{
					delete data[property];
					console.log(data,model);
					console.warn(`Sanize warning: property ${property} is not in model`);
				}
				continue;
			}

			if (typeof data[property] == "object")
			{
				if (sanizeData(model[property], data[property])) delete data[property];
			} else {
				if (model[property] == data[property]) delete data[property]; else hadNonDefaultData = true;
			}
		}
		
		return !hadNonDefaultData;
	}
	
//	return false; - unreachable anyway
}

export function expandSetSanize(model: any, data: any, set: Function, safe = true)
{
	expandData(model, data);
	set();
	sanizeData(model, data, safe);
}

export interface ExpanderSanizerData
{
	model: any, data: any
}

export class ExpanderSanizer
{
	static mapID = 0;
	static theMap = new Map();
	static latchAll()
	{
		for (let expsan of ExpanderSanizer.theMap.values()) expsan.latch();
	}
	
	#dataStorage: ExpanderSanizerData;
	#reExpand: boolean = true;
	#theMapID: number;
	#cleanup: Function;
	
	constructor(v: ExpanderSanizerData, cleanup: Function = null)
	{
		this.#cleanup = cleanup;
		this.#dataStorage = v;
		Object.freeze(this.#dataStorage.model);
		this.#theMapID = (ExpanderSanizer.mapID++);
		ExpanderSanizer.theMap.set(this.#theMapID, this);
	}
	
	sanize()
	{
		if(this.#dataStorage.data)
			sanizeData(this.#dataStorage.model, this.#dataStorage.data);
		
		if (this.#cleanup) this.#cleanup();
	}
	
	expand(v: any = null)
	{
		if (v) this.#dataStorage.data = v;
		
		if(this.#dataStorage.data)
			expandData(this.#dataStorage.model, this.#dataStorage.data);
	}
	
	disableReExpand() { this.#reExpand = false; }
	
	kill()
	{
		ExpanderSanizer.theMap.delete(this.#theMapID);
		this.sanize();
	}
	
	latch() 
	{
		this.#reExpand = true;
		this.sanize();
	}
	
	check(v: any): boolean
	{
		if (!this.#reExpand) return false;
		if (v) this.#dataStorage.data = v;
		this.expand();
		this.#reExpand = false;
		return true;
	}
}

export function latchAll()
{
// @ts-ignore	
	for (let expsan of window.expandersSanizers.values()) expsan.latch();

}