/**
 * SmartLiving Control - Renderer App
 * Main application logic for the UI
 */

class SmartLivingApp {
  constructor() {
    this.devices = [];
    this.scenes = [];
    this.currentScreen = 'devices';
    
    this.init();
  }

  async init() {
    this.bindElements();
    this.bindEvents();
    this.setupNavigation();
    
    // Check if token exists
    const token = await window.smartliving.getToken();
    if (token) {
      this.showScreen('devices');
      this.loadDevices();
      this.loadScenes();
    } else {
      this.showScreen('setup');
    }
  }

  bindElements() {
    // Screens
    this.setupScreen = document.getElementById('setup-screen');
    this.devicesScreen = document.getElementById('devices-screen');
    this.settingsScreen = document.getElementById('settings-screen');
    
    // Buttons
    this.settingsBtn = document.getElementById('settings-btn');
    this.setupBtn = document.getElementById('setup-btn');
    this.settingsBack = document.getElementById('settings-back');
    this.saveTokenBtn = document.getElementById('save-token');
    this.refreshBtn = document.getElementById('refresh-devices');
    
    // Inputs
    this.tokenInput = document.getElementById('token-input');
    this.startupCheckbox = document.getElementById('startup-checkbox');
    
    // Lists
    this.devicesList = document.getElementById('devices-list');
    this.scenesList = document.getElementById('scenes-list');
    this.devicesLoading = document.getElementById('devices-loading');
    this.devicesEmpty = document.getElementById('devices-empty');
    
    // Tabs
    this.tabs = document.querySelectorAll('.tab');
    this.devicesTab = document.getElementById('devices-tab');
    this.scenesTab = document.getElementById('scenes-tab');
    
    // Link
    this.tokenLink = document.getElementById('token-link');
  }

  bindEvents() {
    // Navigation
    this.settingsBtn.addEventListener('click', () => this.showScreen('settings'));
    this.settingsBack.addEventListener('click', () => this.showScreen('devices'));
    this.setupBtn.addEventListener('click', () => this.showScreen('settings'));
    
    // Token
    this.saveTokenBtn.addEventListener('click', () => this.saveToken());
    this.tokenInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.saveToken();
    });
    
    // Settings
    this.startupCheckbox.addEventListener('change', (e) => {
      window.smartliving.setSetting('showOnStartup', e.target.checked);
    });
    
    // Refresh
    this.refreshBtn.addEventListener('click', () => {
      this.loadDevices();
      this.loadScenes();
    });
    
    // Tabs
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
    
    // External link
    this.tokenLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.smartliving.openExternal('https://account.smartthings.com/tokens');
    });
  }

  setupNavigation() {
    // Listen for navigation events from main process
    window.smartliving.onNavigate((page) => {
      this.showScreen(page);
    });
    
    // Listen for quick actions from tray
    window.smartliving.onQuickAction((deviceId) => {
      // Find device and toggle it
      const device = this.devices.find(d => d.deviceId === deviceId);
      if (device) {
        const isOn = device.status?.components?.main?.switch?.switch?.value === 'on';
        this.toggleDevice(deviceId, !isOn);
      }
    });
  }

  showScreen(screen) {
    this.currentScreen = screen;
    
    // Hide all screens
    this.setupScreen.classList.add('hidden');
    this.devicesScreen.classList.add('hidden');
    this.settingsScreen.classList.add('hidden');
    
    // Show requested screen
    switch (screen) {
      case 'setup':
        this.setupScreen.classList.remove('hidden');
        break;
      case 'devices':
        this.devicesScreen.classList.remove('hidden');
        break;
      case 'settings':
        this.settingsScreen.classList.remove('hidden');
        this.loadSettings();
        break;
    }
  }

  switchTab(tab) {
    this.tabs.forEach(t => t.classList.remove('tab--active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('tab--active');
    
    this.devicesTab.classList.add('hidden');
    this.scenesTab.classList.add('hidden');
    
    if (tab === 'devices') {
      this.devicesTab.classList.remove('hidden');
    } else {
      this.scenesTab.classList.remove('hidden');
    }
  }

  async loadSettings() {
    const token = await window.smartliving.getToken();
    this.tokenInput.value = token || '';
    
    const settings = await window.smartliving.getSettings();
    this.startupCheckbox.checked = settings.showOnStartup || false;
  }

  async saveToken() {
    const token = this.tokenInput.value.trim();
    if (!token) {
      this.showError('Please enter a valid token');
      return;
    }
    
    await window.smartliving.setToken(token);
    this.showScreen('devices');
    this.loadDevices();
    this.loadScenes();
  }

  async loadDevices() {
    try {
      this.devicesList.innerHTML = '';
      this.devicesLoading.classList.remove('hidden');
      this.devicesEmpty.classList.add('hidden');
      
      this.devices = await window.smartliving.getDevices();
      
      this.devicesLoading.classList.add('hidden');
      
      if (this.devices.length === 0) {
        this.devicesEmpty.classList.remove('hidden');
        return;
      }
      
      // Get status for each device
      for (const device of this.devices) {
        try {
          device.status = await window.smartliving.getDeviceStatus(device.deviceId);
        } catch (e) {
          device.status = null;
        }
      }
      
      this.renderDevices();
    } catch (error) {
      console.error('Failed to load devices:', error);
      this.devicesLoading.classList.add('hidden');
      this.showError('Failed to load devices. Check your token.');
    }
  }

  renderDevices() {
    this.devicesList.innerHTML = '';
    
    for (const device of this.devices) {
      const card = this.createDeviceCard(device);
      this.devicesList.appendChild(card);
    }
  }

  createDeviceCard(device) {
    const card = document.createElement('div');
    card.className = 'device-card';
    card.dataset.deviceId = device.deviceId;
    
    // Determine device state
    const isOn = device.status?.components?.main?.switch?.switch?.value === 'on';
    const level = device.status?.components?.main?.switchLevel?.level?.value;
    const hasSwitch = device.components?.some(c => 
      c.capabilities?.some(cap => cap.id === 'switch')
    );
    
    // Get device icon based on type
    const icon = this.getDeviceIcon(device);
    
    card.innerHTML = `
      <div class="device-card__icon">${icon}</div>
      <div class="device-card__info">
        <div class="device-card__name">${device.label || device.name}</div>
        <div class="device-card__status ${isOn ? 'device-card__status--on' : ''}">
          ${this.getStatusText(device)}
        </div>
      </div>
      ${hasSwitch ? `
        <div class="toggle ${isOn ? 'toggle--on' : ''}" data-device-id="${device.deviceId}">
          <div class="toggle__knob"></div>
        </div>
      ` : ''}
    `;
    
    // Add brightness slider for dimmable lights
    if (level !== undefined) {
      const slider = document.createElement('div');
      slider.className = 'brightness-slider';
      slider.innerHTML = `<div class="brightness-slider__fill" style="width: ${level}%"></div>`;
      card.querySelector('.device-card__info').appendChild(slider);
    }
    
    // Toggle event
    const toggle = card.querySelector('.toggle');
    if (toggle) {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDevice(device.deviceId, !isOn);
      });
    }
    
    return card;
  }

  getDeviceIcon(device) {
    const capabilities = device.components?.flatMap(c => 
      c.capabilities?.map(cap => cap.id)
    ) || [];
    
    if (capabilities.includes('colorControl')) return '💡';
    if (capabilities.includes('switchLevel')) return '🔆';
    if (capabilities.includes('thermostatMode')) return '🌡️';
    if (capabilities.includes('lock')) return '🔒';
    if (capabilities.includes('motionSensor')) return '👁️';
    if (capabilities.includes('contactSensor')) return '🚪';
    if (capabilities.includes('switch')) return '⚡';
    return '📱';
  }

  getStatusText(device) {
    const isOn = device.status?.components?.main?.switch?.switch?.value === 'on';
    const level = device.status?.components?.main?.switchLevel?.level?.value;
    const temp = device.status?.components?.main?.temperatureMeasurement?.temperature?.value;
    
    if (temp !== undefined) return `${temp}°`;
    if (level !== undefined) return isOn ? `${level}%` : 'Off';
    if (isOn !== undefined) return isOn ? 'On' : 'Off';
    return 'Unknown';
  }

  async toggleDevice(deviceId, state) {
    try {
      await window.smartliving.executeCommand(
        deviceId,
        'switch',
        state ? 'on' : 'off',
        []
      );
      
      // Update UI immediately
      const toggle = document.querySelector(`[data-device-id="${deviceId}"].toggle`);
      if (toggle) {
        toggle.classList.toggle('toggle--on', state);
      }
      
      // Update status text
      const card = document.querySelector(`.device-card[data-device-id="${deviceId}"]`);
      if (card) {
        const status = card.querySelector('.device-card__status');
        status.classList.toggle('device-card__status--on', state);
        status.textContent = state ? 'On' : 'Off';
      }
    } catch (error) {
      console.error('Failed to toggle device:', error);
      this.showError('Failed to control device');
    }
  }

  async loadScenes() {
    try {
      this.scenes = await window.smartliving.getScenes();
      this.renderScenes();
    } catch (error) {
      console.error('Failed to load scenes:', error);
    }
  }

  renderScenes() {
    this.scenesList.innerHTML = '';
    
    for (const scene of this.scenes) {
      const btn = document.createElement('button');
      btn.className = 'scene-btn';
      btn.innerHTML = `
        <span class="scene-btn__icon">🎬</span>
        <span>${scene.sceneName}</span>
      `;
      
      btn.addEventListener('click', () => this.executeScene(scene.sceneId));
      this.scenesList.appendChild(btn);
    }
  }

  async executeScene(sceneId) {
    try {
      await window.smartliving.executeScene(sceneId);
      // Refresh devices to show new states
      setTimeout(() => this.loadDevices(), 1000);
    } catch (error) {
      console.error('Failed to execute scene:', error);
      this.showError('Failed to run scene');
    }
  }

  showError(message) {
    // Simple error display (could be improved with toast notifications)
    console.error(message);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new SmartLivingApp();
});
