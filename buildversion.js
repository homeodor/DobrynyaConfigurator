import { readFileSync, writeFileSync } from 'fs';

let file = readFileSync('./src/version.ts', 'utf8');

let buildNumber = parseInt(file.split(";")[0].split(" ")[4]) + 1;

writeFileSync('./src/version.ts', `export const build = ${buildNumber};
export const version = "1.0beta"`);