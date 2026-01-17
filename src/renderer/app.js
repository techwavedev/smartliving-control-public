/**
 * SmartLiving Control - Frontend Application
 * Handles UI interactions and SmartThings API communication via IPC
 */

// ========== State ==========
const state = {
  devices: [],
  scenes: [],
  currentScreen: 'devices',
  loading: false
};

// ========== DOM Elements ==========
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const elements = {
  // Screens
  setupScreen: $('#setup-screen'),
  devicesScreen: $('#devices-screen'),
  settingsScreen: $('#settings-screen'),
  
  // Tabs
  devicesTab: $('#devices-tab'),
  scenesTab: $('#scenes-tab'),
  tabs: $$('.tab'),
  
  // Lists
  devicesList: $('#devices-list'),
  scenesList: $('#scenes-list'),
  devicesLoading: $('#devices-loading'),
  devicesEmpty: $('#devices-empty'),
  
  // Settings
  tokenInput: $('#token-input'),
  saveTokenBtn: $('#save-token'),
  startupCheckbox: $('#startup-checkbox'),
  refreshDevicesBtn: $('#refresh-devices'),
  settingsBtn: $('#settings-btn'),
  settingsBack: $('#settings-back'),
  tokenLink: $('#token-link'),
  
  // Setup
  setupBtn: $('#setup-btn')
};

// ========== Initialization ==========
async function init() {
  // Check for token
  const token = await window.smartliving.getToken();
  
  if (!token) {
    showScreen('setup');
  } else {
    showScreen('devices');
    loadDevices();
  }
  
  // Set up event listeners
  setupEventListeners();
  
  // Listen for navigation from main process
  window.smartliving.onNavigate((page) => {
    if (page === 'settings') {
      showScreen('settings');
    }
  });
}

// ========== Event Listeners ==========
function setupEventListeners() {
  // Settings button
  elements.settingsBtn.addEventListener('click', () => showScreen('settings'));
  elements.settingsBack.addEventListener('click', () => showScreen('devices'));
  
  // Setup button
  elements.setupBtn.addEventListener('click', () => showScreen('settings'));
  
  // Tab switching
  elements.tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
  
  // Save token
  elements.saveTokenBtn.addEventListener('click', saveToken);
  elements.tokenInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveToken();
  });
  
  // Refresh devices
  elements.refreshDevicesBtn.addEventListener('click', loadDevices);
  
  // Token link - open external using preload API
  elements.tokenLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.smartliving.openExternal('https://account.smartthings.com/tokens');
  });
  
  // Load existing settings
  loadSettings();
}

// ========== Screen Navigation ==========
function showScreen(screen) {
  state.currentScreen = screen;
  
  // Hide all screens
  elements.setupScreen.classList.add('hidden');
  elements.devicesScreen.classList.add('hidden');
  elements.settingsScreen.classList.add('hidden');
  
  // Show target screen
  switch (screen) {
    case 'setup':
      elements.setupScreen.classList.remove('hidden');
      break;
    case 'devices':
      elements.devicesScreen.classList.remove('hidden');
      break;
    case 'settings':
      elements.settingsScreen.classList.remove('hidden');
      break;
  }
}

function switchTab(tab) {
  // Update active tab
  elements.tabs.forEach(t => {
    t.classList.toggle('tab--active', t.dataset.tab === tab);
  });
  
  // Show/hide content
  elements.devicesTab.classList.toggle('hidden', tab !== 'devices');
  elements.scenesTab.classList.toggle('hidden', tab !== 'scenes');
  
  // Load scenes if needed
  if (tab === 'scenes' && state.scenes.length === 0) {
    loadScenes();
  }
}

// ========== Settings ==========
async function loadSettings() {
  const settings = await window.smartliving.getSettings();
  elements.tokenInput.value = settings.smartthingsToken || '';
  elements.startupCheckbox.checked = settings.showOnStartup || false;
  
  // Startup checkbox handler
  elements.startupCheckbox.addEventListener('change', (e) => {
    window.smartliving.setSetting('showOnStartup', e.target.checked);
  });
}

async function saveToken() {
  const token = elements.tokenInput.value.trim();
  if (!token) {
    showToast('Please enter a token', 'error');
    return;
  }
  
  await window.smartliving.setToken(token);
  showToast('Token saved!', 'success');
  showScreen('devices');
  loadDevices();
}

// ========== Devices ==========
async function loadDevices() {
  elements.devicesLoading.classList.remove('hidden');
  elements.devicesList.innerHTML = '';
  elements.devicesEmpty.classList.add('hidden');
  
  try {
    const devices = await window.smartliving.getDevices();
    state.devices = devices;
    
    elements.devicesLoading.classList.add('hidden');
    
    if (devices.length === 0) {
      elements.devicesEmpty.classList.remove('hidden');
      return;
    }
    
    // Render devices
    for (const device of devices) {
      const status = await window.smartliving.getDeviceStatus(device.deviceId);
      renderDevice(device, status);
    }
  } catch (error) {
    elements.devicesLoading.classList.add('hidden');
    console.error('Failed to load devices:', error);
    showToast('Failed to load devices', 'error');
  }
}

function renderDevice(device, status) {
  const deviceType = getDeviceType(device);
  const deviceStatus = deviceType.getStatus(status);
  
  const card = document.createElement('div');
  card.className = 'device-card';
  card.dataset.deviceId = device.deviceId;
  
  let controlsHTML = '';
  
  // Add toggle control for switches
  if (deviceType.controls.includes('toggle')) {
    const isOn = deviceStatus.isOn || deviceStatus.isLocked;
    controlsHTML += `
      <button class="toggle ${isOn ? 'toggle--on' : ''}" 
              data-device-id="${device.deviceId}"
              data-capability="${deviceType.controls.includes('lock') ? 'lock' : 'switch'}"
              aria-label="Toggle"></button>
    `;
  }
  
  card.innerHTML = `
    <div class="device-card__icon">${deviceType.icon}</div>
    <div class="device-card__info">
      <div class="device-card__name">${device.label || device.name}</div>
      <div class="device-card__status">${formatDeviceStatus(deviceType, deviceStatus)}</div>
    </div>
    <div class="device-card__controls">${controlsHTML}</div>
  `;
  
  // Add brightness slider for dimmers/lights
  if (deviceType.controls.includes('brightness') && deviceStatus.isOn) {
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';
    sliderContainer.innerHTML = `
      <span class="slider-container__icon">🔅</span>
      <input type="range" class="slider" min="0" max="100" value="${deviceStatus.level || 0}"
             data-device-id="${device.deviceId}">
      <span class="slider__value">${deviceStatus.level || 0}%</span>
      <span class="slider-container__icon">🔆</span>
    `;
    card.appendChild(sliderContainer);
  }
  
  elements.devicesList.appendChild(card);
  
  // Add event listeners
  const toggle = card.querySelector('.toggle');
  if (toggle) {
    toggle.addEventListener('click', () => toggleDevice(device.deviceId, toggle));
  }
  
  const slider = card.querySelector('.slider');
  if (slider) {
    slider.addEventListener('input', (e) => {
      e.target.nextElementSibling.textContent = `${e.target.value}%`;
    });
    slider.addEventListener('change', (e) => {
      setDeviceLevel(device.deviceId, parseInt(e.target.value));
    });
  }
}

function formatDeviceStatus(deviceType, status) {
  if (status.temperature !== undefined) {
    return `${status.temperature}°${status.unit || 'C'}`;
  }
  if (status.humidity !== undefined) {
    return `${status.humidity}% humidity`;
  }
  if (status.motion !== undefined) {
    return status.motion ? 'Motion detected' : 'No motion';
  }
  if (status.isOpen !== undefined) {
    return status.isOpen ? 'Open' : 'Closed';
  }
  if (status.isLocked !== undefined) {
    return status.isLocked ? 'Locked' : 'Unlocked';
  }
  if (status.level !== undefined && status.isOn) {
    return `${status.level}% brightness`;
  }
  if (status.isOn !== undefined) {
    return status.isOn ? 'On' : 'Off';
  }
  return deviceType.label;
}

function getDeviceType(device) {
  const capabilities = device.components?.flatMap(c => c.capabilities?.map(cap => cap.id)) || [];
  
  // Determine device type based on capabilities
  if (capabilities.includes('colorControl')) {
    return DEVICE_TYPES.light;
  }
  if (capabilities.includes('switchLevel') && capabilities.includes('switch')) {
    return DEVICE_TYPES.dimmer;
  }
  if (capabilities.includes('thermostatMode')) {
    return DEVICE_TYPES.thermostat;
  }
  if (capabilities.includes('lock')) {
    return DEVICE_TYPES.lock;
  }
  if (capabilities.includes('motionSensor')) {
    return DEVICE_TYPES.motionSensor;
  }
  if (capabilities.includes('contactSensor')) {
    return DEVICE_TYPES.contactSensor;
  }
  if (capabilities.includes('relativeHumidityMeasurement')) {
    return DEVICE_TYPES.humiditySensor;
  }
  if (capabilities.includes('temperatureMeasurement')) {
    return DEVICE_TYPES.temperatureSensor;
  }
  if (capabilities.includes('switch')) {
    return DEVICE_TYPES.switch;
  }
  
  // Default fallback
  return {
    icon: '📱',
    label: 'Device',
    capabilities: [],
    controls: [],
    getStatus: () => ({})
  };
}

// Device type definitions (mirrored from backend for client-side use)
const DEVICE_TYPES = {
  switch: {
    icon: '💡',
    label: 'Switch',
    controls: ['toggle'],
    getStatus: (status) => ({
      isOn: status?.components?.main?.switch?.switch?.value === 'on'
    })
  },
  light: {
    icon: '💡',
    label: 'Light',
    controls: ['toggle', 'brightness', 'color'],
    getStatus: (status) => ({
      isOn: status?.components?.main?.switch?.switch?.value === 'on',
      level: status?.components?.main?.switchLevel?.level?.value || 0
    })
  },
  dimmer: {
    icon: '🔆',
    label: 'Dimmer',
    controls: ['toggle', 'brightness'],
    getStatus: (status) => ({
      isOn: status?.components?.main?.switch?.switch?.value === 'on',
      level: status?.components?.main?.switchLevel?.level?.value || 0
    })
  },
  thermostat: {
    icon: '🌡️',
    label: 'Thermostat',
    controls: ['mode', 'temperature'],
    getStatus: (status) => ({
      temperature: status?.components?.main?.temperatureMeasurement?.temperature?.value
    })
  },
  lock: {
    icon: '🔒',
    label: 'Lock',
    controls: ['toggle'],
    getStatus: (status) => ({
      isLocked: status?.components?.main?.lock?.lock?.value === 'locked'
    })
  },
  motionSensor: {
    icon: '👁️',
    label: 'Motion Sensor',
    controls: [],
    getStatus: (status) => ({
      motion: status?.components?.main?.motionSensor?.motion?.value === 'active'
    })
  },
  contactSensor: {
    icon: '🚪',
    label: 'Contact Sensor',
    controls: [],
    getStatus: (status) => ({
      isOpen: status?.components?.main?.contactSensor?.contact?.value === 'open'
    })
  },
  temperatureSensor: {
    icon: '🌡️',
    label: 'Temperature Sensor',
    controls: [],
    getStatus: (status) => ({
      temperature: status?.components?.main?.temperatureMeasurement?.temperature?.value,
      unit: status?.components?.main?.temperatureMeasurement?.temperature?.unit || 'C'
    })
  },
  humiditySensor: {
    icon: '💧',
    label: 'Humidity Sensor',
    controls: [],
    getStatus: (status) => ({
      humidity: status?.components?.main?.relativeHumidityMeasurement?.humidity?.value
    })
  }
};

// ========== Device Commands ==========
async function toggleDevice(deviceId, toggleElement) {
  const isOn = toggleElement.classList.contains('toggle--on');
  const capability = toggleElement.dataset.capability;
  
  try {
    if (capability === 'lock') {
      await window.smartliving.executeCommand(deviceId, 'lock', isOn ? 'unlock' : 'lock');
    } else {
      await window.smartliving.executeCommand(deviceId, 'switch', isOn ? 'off' : 'on');
    }
    
    toggleElement.classList.toggle('toggle--on');
    
    // Update status text
    const card = toggleElement.closest('.device-card');
    const statusEl = card.querySelector('.device-card__status');
    if (capability === 'lock') {
      statusEl.textContent = isOn ? 'Unlocked' : 'Locked';
    } else {
      statusEl.textContent = isOn ? 'Off' : 'On';
    }
  } catch (error) {
    console.error('Failed to toggle device:', error);
    showToast('Failed to control device', 'error');
  }
}

async function setDeviceLevel(deviceId, level) {
  try {
    await window.smartliving.executeCommand(deviceId, 'switchLevel', 'setLevel', [level]);
  } catch (error) {
    console.error('Failed to set device level:', error);
    showToast('Failed to set brightness', 'error');
  }
}

// ========== Scenes ==========
async function loadScenes() {
  elements.scenesList.innerHTML = '<div class="loading"><div class="loading__spinner"></div><p>Loading scenes...</p></div>';
  
  try {
    const scenes = await window.smartliving.getScenes();
    state.scenes = scenes;
    
    elements.scenesList.innerHTML = '';
    
    if (scenes.length === 0) {
      elements.scenesList.innerHTML = '<div class="empty"><p>No scenes found</p></div>';
      return;
    }
    
    scenes.forEach(scene => {
      const card = document.createElement('div');
      card.className = 'scene-card';
      card.dataset.sceneId = scene.sceneId;
      card.innerHTML = `
        <div class="scene-card__icon">🎬</div>
        <div class="scene-card__name">${scene.sceneName}</div>
        <div class="scene-card__arrow">▶</div>
      `;
      
      card.addEventListener('click', () => executeScene(scene.sceneId, card));
      elements.scenesList.appendChild(card);
    });
  } catch (error) {
    console.error('Failed to load scenes:', error);
    elements.scenesList.innerHTML = '<div class="empty"><p>Failed to load scenes</p></div>';
  }
}

async function executeScene(sceneId, cardElement) {
  cardElement.classList.add('scene-card--executing');
  
  try {
    await window.smartliving.executeScene(sceneId);
    showToast('Scene activated!', 'success');
  } catch (error) {
    console.error('Failed to execute scene:', error);
    showToast('Failed to activate scene', 'error');
  } finally {
    cardElement.classList.remove('scene-card--executing');
  }
}

// ========== Toast Notifications ==========
function showToast(message, type = 'info') {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('toast--visible');
  });
  
  // Auto-hide after 3s
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ========== Start Application ==========
document.addEventListener('DOMContentLoaded', init);
