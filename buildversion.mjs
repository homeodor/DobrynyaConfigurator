import { readFileSync, writeFileSync } from 'fs';

let file = readFileSync('./src/version.ts', 'utf8');

let buildNumber = parseInt(file.split(";")[0].split(" ")[4]) + 1;

writeFileSync('./src/version.ts', `export const build = ${buildNumber};
export const version = "1.0beta"`);

let packageJSON = JSON.parse(readFileSync('./package.json'));

packageJSON.version = `1.0.${buildNumber}`;

writeFileSync('./package.json', JSON.stringify(packageJSON, null, "\t"));

console.log(`Updating current build version to ${buildNumber}`);