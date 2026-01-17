const { ipcMain } = require('electron');
const SmartThingsService = require('../services/smartthings');
const Store = require('electron-store');

// Initialize store and service
const store = new Store();
let smartThingsService = null;

function initSmartThingsService() {
  const token = store.get('smartthingsToken');
  if (token) {
    smartThingsService = new SmartThingsService(token);
  }
  return smartThingsService;
}

function setupSmartThingsIPC() {
  // Ensure service is initialized
  if (!smartThingsService) {
    initSmartThingsService();
  }

  // Get devices
  ipcMain.handle('smartthings:get-devices', async () => {
    if (!smartThingsService) {
      smartThingsService = initSmartThingsService();
    }
    if (!smartThingsService) {
      throw new Error('SmartThings not configured');
    }
    return smartThingsService.getDevices();
  });

  // Get device status
  ipcMain.handle('smartthings:get-status', async (event, deviceId) => {
    if (!smartThingsService) {
      throw new Error('SmartThings not configured');
    }
    return smartThingsService.getDeviceStatus(deviceId);
  });

  // Execute command
  ipcMain.handle('smartthings:execute-command', async (event, deviceId, capability, command, args) => {
    if (!smartThingsService) {
      throw new Error('SmartThings not configured');
    }
    return smartThingsService.executeCommand(deviceId, capability, command, args);
  });

  // Get scenes
  ipcMain.handle('smartthings:get-scenes', async () => {
    if (!smartThingsService) {
      smartThingsService = initSmartThingsService();
    }
    if (!smartThingsService) {
      throw new Error('SmartThings not configured');
    }
    return smartThingsService.getScenes();
  });

  // Execute scene
  ipcMain.handle('smartthings:execute-scene', async (event, sceneId) => {
    if (!smartThingsService) {
      throw new Error('SmartThings not configured');
    }
    return smartThingsService.executeScene(sceneId);
  });

  // Update token
  ipcMain.on('token-updated', () => {
    initSmartThingsService();
  });
}

module.exports = {
  setupSmartThingsIPC,
  initSmartThingsService
};
