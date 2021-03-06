export interface StackObjectProxy { data: any }

export default class UndoStack
{
	#stack: any[] = [];
	#pointer: number = -1;
	
	#theObject: StackObjectProxy = { data: null };
	#originalData: any = {};
	
	#maxUndos: number = 20;
	
	constructor(baseObject: any)
	{
		this.#originalData = UndoStack.deepClone(baseObject.data);
		this.#theObject = baseObject;
		this.push();
	}
	
	reset(): boolean { this.#stack = []; this.#pointer = -1; return true; }
	
	push(): boolean
	{
		if (JSON.stringify(this.#stack[this.#pointer]) === JSON.stringify(this.#theObject.data))
		{
			console.log("Tried pushing undo, but no change happened...", this.#theObject.data);
			return false;
		}
		
		console.log("Pushing undo: ", this.#theObject.data, "---");
		
		if (this.#pointer < this.#maxUndos)
			this.#stack[++this.#pointer] = UndoStack.deepClone(this.#theObject.data);
		else
		{
			this.#stack.shift();
			this.#stack.push(UndoStack.deepClone(this.#theObject.data))
		}
		
		return true;
	}
	
	static deepClone(v: any) { return JSON.parse(JSON.stringify(v)); }
	
	#mutate() { this.#theObject.data = UndoStack.deepClone(this.#stack[this.#pointer]); }
	
	undo(): boolean
	{
		if (this.#pointer <= 0) return false;
		--this.#pointer; this.#mutate(); return true;
	}
	
	redo(): boolean
	{
		if (typeof this.#stack[this.#pointer + 1] == "undefined") return false;
		++this.#pointer; this.#mutate(); return true;
	}
	
	revert(): boolean
	{
		this.reset();
		this.#theObject.data = UndoStack.deepClone(this.#originalData);
		return true;
	}
	
	log()
	{
		console.log(this.#stack, this.#pointer, this.#theObject, this.#originalData);
	}
}