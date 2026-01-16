const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
} = require("electron");
const path = require("path");
const Store = require("electron-store");

// Initialize settings store
const store = new Store({
  defaults: {
    smartthingsToken: "",
    showOnStartup: false,
    favoriteDevices: [],
  },
});

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
  return true;
});

ipcMain.handle("get-token", () => store.get("smartthingsToken"));
ipcMain.handle("set-token", (event, token) => {
  store.set("smartthingsToken", token);
  return true;
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
