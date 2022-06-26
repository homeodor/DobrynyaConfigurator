import type { MidiResult } from './midi_utils'
import type { Hand } from './data_utils'

export function quickCustom(n: string, d: object = {}) { document.body.dispatchEvent(new CustomEvent(n,{detail:d})); }
function quickNormal(n: string)				  { document.body.dispatchEvent(new       Event(n)); }

export function patchChanged() { quickNormal("patchchange"); }
export function drawer(name: string) { quickCustom("drawer",{drawer: name}); }

export function deviceRefusedToChangePatches() { quickNormal("patchlock"); }
export function invokeControl(kind: number, no: number) { quickCustom("invoke", {controlKind: kind, controlNo: no}); }
export function invokeBank(hand:Hand, bankNo: number, isShift: boolean) { quickCustom("invokebank", {hand: hand, bankNo: bankNo, isShift: isShift}); }
export function pushFromSysEx(data: MidiResult) { quickCustom('sysexpush', { data: data }) }
export function selectPatch(name: string) { quickCustom('selectpatch',{name:name})};
export function section(name: string) { quickCustom('section',{section:name})};