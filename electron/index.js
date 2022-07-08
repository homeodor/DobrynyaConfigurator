// This file is the entry point for the Electron application.

const { app, BrowserWindow } = require('electron')
const path = require('node:path');

const Store = require('electron-store');

Store.initRenderer();

function createWindow()
{
	const win = new BrowserWindow({
		titleBarStyle: 'hiddenInset',
		width: 1200,
		height: 800,
		webPreferences: {
			preload: path.resolve("electron/bootstrap.js"),
		}
	});

	if (process.env.NODE_ENV !== 'development') {
		// Load production build
		win.loadFile(`${__dirname}/dist/index.html`)
	} else {
		// Load vite dev server page 
		console.log('Development mode')
		win.loadURL('https://localhost:3000/')
	}
  
	win.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
  	if (permission === 'hid' || permission === "midiSysex") return true;
	return false
	});
}



/**
 * Prevent multiple instances
 */
const isSingleInstance = app.requestSingleInstanceLock();
if (!isSingleInstance) {
  app.quit();
  process.exit(0);
}



/**
 * Disable Hardware Acceleration for more power-save
 */
app.disableHardwareAcceleration();

app.whenReady()
  .then(() => {
	createWindow()

	app.on('activate', function () {
	  if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
  })

app.on('window-all-closed', () => {
	app.quit()
  })