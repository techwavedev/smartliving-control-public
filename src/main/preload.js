const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('smartliving', {
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
  
  // Token
  getToken: () => ipcRenderer.invoke('get-token'),
  setToken: (token) => ipcRenderer.invoke('set-token', token),
  
  // SmartThings API calls (proxied through main process)
  getDevices: () => ipcRenderer.invoke('smartthings:get-devices'),
  getDeviceStatus: (deviceId) => ipcRenderer.invoke('smartthings:get-status', deviceId),
  executeCommand: (deviceId, capability, command, args) => 
    ipcRenderer.invoke('smartthings:execute-command', deviceId, capability, command, args),
  getScenes: () => ipcRenderer.invoke('smartthings:get-scenes'),
  executeScene: (sceneId) => ipcRenderer.invoke('smartthings:execute-scene', sceneId),
  
  // Navigation events
  onNavigate: (callback) => ipcRenderer.on('navigate', (event, page) => callback(page)),
  
  // External links
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});
