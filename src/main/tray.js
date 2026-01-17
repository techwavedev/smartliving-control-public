const { Tray, Menu, nativeImage, app, shell } = require('electron');
const path = require('path');

class AppTray {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.tray = null;
    this.init();
  }

  init() {
    // Use template image for macOS menu bar
    const iconPath = path.join(__dirname, '../../assets/trayTemplate.png');
    // Ensure the icon exists, otherwise it might throw or show blank
    try {
      const icon = nativeImage.createFromPath(iconPath);
      icon.setTemplateImage(true); // Mac-specific: adapts to dark/light mode

      this.tray = new Tray(icon);
      this.tray.setToolTip('SmartLiving Control');
      
      this.setupListeners();
      this.updateContextMenu();
    } catch (error) {
      console.error('Failed to create tray icon:', error);
    }
  }

  setupListeners() {
    this.tray.on('click', (event, bounds) => {
      this.toggleWindow(bounds);
    });

    this.tray.on('right-click', () => {
      this.tray.popUpContextMenu(this.buildContextMenu());
    });
    
    // Support drag-and-drop actions in the future?
    this.tray.on('drop-files', (event, files) => {
      // Future feature
    });
  }

  toggleWindow(bounds) {
    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      const { x, y } = bounds;
      const { width, height } = this.mainWindow.getBounds();
      // Center window below the tray icon
      const posX = Math.round(x - width / 2);
      const posY = Math.round(y + 4); // Small padding
      
      this.mainWindow.setPosition(posX, posY, false);
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  buildContextMenu(devices = []) {
    // Basic menu
    const template = [
      { label: 'SmartLiving Control', enabled: false },
      { type: 'separator' },
      { label: 'Show App', click: () => this.mainWindow.show() },
      { label: 'Preferences...', click: () => this.openPreferences() },
      { type: 'separator' }
    ];

    // Dynamic Device Quick Actions (Example: Favorites)
    if (devices && devices.length > 0) {
      template.push({ label: 'Quick Actions', enabled: false });
      devices.forEach(device => {
        template.push({
          label: device.label || device.name,
          sublabel: device.status || 'Unknown',
          click: () => this.mainWindow.webContents.send('quick-action', device.deviceId)
        });
      });
      template.push({ type: 'separator' });
    }

    template.push(
      { label: 'About', click: () => shell.openExternal('https://github.com/techwavedev/smartliving-control') },
      { label: 'Quit', click: () => app.exit() }
    );

    return Menu.buildFromTemplate(template);
  }

  updateContextMenu(devices = []) {
    this.tray.setContextMenu(this.buildContextMenu(devices));
  }

  openPreferences() {
    this.mainWindow.webContents.send('navigate', 'settings');
    this.mainWindow.show();
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
    }
  }
}

module.exports = AppTray;
