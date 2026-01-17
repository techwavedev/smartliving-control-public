const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  shell,
} = require("electron");
const path = require("path");
const Store = require("electron-store");
const SmartThingsService = require("../services/smartthings");

// Initialize settings store
const store = new Store({
  defaults: {
    smartthingsToken: "",
    showOnStartup: false,
    favoriteDevices: [],
  },
});

// Initialize SmartThings service
let smartThingsService = new SmartThingsService(store.get("smartthingsToken"));

let mainWindow = null;
let tray = null;

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 500,
    show: false,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    transparent: true,
    vibrancy: "menu",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));

  // Hide window when it loses focus
  mainWindow.on("blur", () => {
    mainWindow.hide();
  });

  mainWindow.on("close", (event) => {
    event.preventDefault();
    mainWindow.hide();
  });
}

function createTray() {
  // Use template image for macOS menu bar
  const iconPath = path.join(__dirname, "../../assets/trayTemplate.png");
  const icon = nativeImage.createFromPath(iconPath);
  icon.setTemplateImage(true);

  tray = new Tray(icon);
  tray.setToolTip("SmartLiving Control");

  // Toggle window on click
  tray.on("click", (event, bounds) => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      // Position window below tray icon
      const { x, y } = bounds;
      const { width, height } = mainWindow.getBounds();
      mainWindow.setPosition(Math.round(x - width / 2), Math.round(y + 4));
      mainWindow.show();
    }
  });

  // Right-click context menu
  tray.on("right-click", () => {
    const contextMenu = Menu.buildFromTemplate([
      { label: "Open SmartLiving", click: () => mainWindow.show() },
      { type: "separator" },
      { label: "Preferences...", click: () => openPreferences() },
      { type: "separator" },
      { label: "Quit", click: () => app.exit() },
    ]);
    tray.popUpContextMenu(contextMenu);
  });
}

function openPreferences() {
  mainWindow.webContents.send("navigate", "settings");
  mainWindow.show();
}

// IPC Handlers
ipcMain.handle("get-settings", () => store.store);
ipcMain.handle("set-setting", (event, key, value) => {
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

ipcMain.handle("get-token", () => store.get("smartthingsToken"));
ipcMain.handle("set-token", (event, token) => {
  store.set("smartthingsToken", token);
  smartThingsService.setToken(token);
  return true;
});

// IPC Handler - External Links
ipcMain.handle("open-external", (event, url) => {
  const allowedHosts = ["account.smartthings.com", "smartthings.com"];
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

// SmartThings API IPC Handlers
ipcMain.handle("smartthings:get-devices", async () => {
  return smartThingsService.getDevices();
});

ipcMain.handle("smartthings:get-status", async (event, deviceId) => {
  return smartThingsService.getDeviceStatus(deviceId);
});

ipcMain.handle("smartthings:execute-command", async (event, deviceId, capability, command, args) => {
  return smartThingsService.executeCommand(deviceId, capability, command, args);
});

ipcMain.handle("smartthings:get-scenes", async () => {
  return smartThingsService.getScenes();
});

ipcMain.handle("smartthings:execute-scene", async (event, sceneId) => {
  return smartThingsService.executeScene(sceneId);
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();

  // Hide dock icon on macOS (menu bar app)
  if (process.platform === "darwin") {
    app.dock.hide();
  }
});

app.on("window-all-closed", () => {
  // Keep app running in tray
});

app.on("before-quit", () => {
  mainWindow.destroy();
});
