if (document.location.protocol == "http:") document.location.protocol = "https:";

import { UAParser } from 'ua-parser-js'

function checkBrowser()
{
  let uaParserObject = new UAParser();
  let uaParserEngine = uaParserObject.getEngine();
  if (
    (uaParserEngine.name != "Blink" && uaParserEngine.name != "Gecko") ||
    (uaParserEngine.name == "Gecko" && parseInt(uaParserEngine.version.split(".")[0]) < 99) ||
    (uaParserEngine.name == "Blink" && parseInt(uaParserEngine.version.split(".")[0]) < 98)
    )
    document.location.href = "incompatible.html";
}

checkBrowser();

import { init } from 'midi_core';

init();

import Main from './Main.svelte'


export const theApp = new Main({
  target: document.getElementById("app")
})
// 
// export const noteEditor = new NoteEditor({
//  target: document.getElementById("cbm-noteeditor")
// })

window.theApp = theApp;
// window.keyboardEditor = keyboardEditor;

window.expandersSanizers = new Map();

window.addEventListener("error", (event) => {
  alert(`Sorry, the app crashed. Please reload the window.\n${log.textContent}${event.type}: ${event.message}\n`);
});