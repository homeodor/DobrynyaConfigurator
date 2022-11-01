export function getRandomIntInclusive(min: number, max: number, random: number = Math.random()) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(random * (max - min + 1)) + min; //Максимум и минимум включаются
}

export function map(x: number, in_min: number, in_max: number, out_min: number, out_max: number): number
{
	let divisor: number = (in_max - in_min);
//	if (divisor: number == 0) return -1;
	return Math.floor(Math.floor((x - in_min) * (out_max - out_min)) / divisor + out_min);
}

export function deepClone(data: any) { return JSON.parse(JSON.stringify(data)); }
export function isSame(data1: any, data2: any) { return JSON.stringify(data1) === JSON.stringify(data2); }
export function isEmpty(a: any) { return Object.keys(a).length === 0; }