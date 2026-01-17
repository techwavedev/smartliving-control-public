const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');
const AppTray = require('./tray');
const { setupSmartThingsIPC } = require('./ipcHandlers');

// Initialize settings store
const store = new Store({
  defaults: {
    smartthingsToken: '',
    showOnStartup: false,
    favoriteDevices: []
  }
});

let mainWindow = null;
let appTray = null;

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 600,
    show: false,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    transparent: true,
    vibrancy: 'menu',
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Hide window when it loses focus
  mainWindow.on('blur', () => {
    // Keep window open if dev tools are focused
    if (!mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.hide();
    }
  });

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });
}

// IPC Handlers - Settings / Token
ipcMain.handle('get-settings', () => store.store);
ipcMain.handle('set-setting', (event, key, value) => {
  store.set(key, value);
  
  // Handle startup setting
  if (key === "showOnStartup" && process.platform === "darwin") {
    app.setLoginItemSettings({
      openAtLogin: value,
      openAsHidden: true,
    });
  }
  
  return true;
});

ipcMain.handle('get-token', () => store.get('smartthingsToken'));
ipcMain.handle('set-token', (event, token) => {
  store.set('smartthingsToken', token);
  // Trigger update in service
  ipcMain.emit('token-updated');
  return true;
});

// IPC Handler - External Links
ipcMain.handle("open-external", (event, url) => {
  const allowedHosts = ["account.smartthings.com", "smartthings.com", "github.com"];
  try {
    const urlObj = new URL(url);
    if (allowedHosts.some(host => urlObj.hostname.endsWith(host))) {
      shell.openExternal(url);
      return true;
    }
  } catch (e) {
    console.error("Invalid URL:", url);
  }
  return false;
});

// Setup SmartThings API handlers
setupSmartThingsIPC();

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  appTray = new AppTray(mainWindow);

  // Hide dock icon on macOS (menu bar app)
  if (process.platform === 'darwin') {
    app.dock.hide();
  }
});

app.on('window-all-closed', () => {
  // Keep app running in tray
});

app.on('before-quit', () => {
  if (appTray) appTray.destroy();
  mainWindow.destroy();
});
