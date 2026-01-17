/**
 * SmartLiving Control - Renderer App
 * Main application logic for the UI
 */

/* global Chart */

class SmartLivingApp {
  constructor() {
    this.devices = [];
    this.scenes = [];
    this.currentScreen = 'devices';
    
    // Chart management
    this.activeCharts = new Map(); // Store chart instances & intervals by deviceId

    // Categorization
    this.visibleCategories = new Set(); // Stores enabled category types (strings)

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
      await this.loadSettings(); // Load settings (including categories) before devices
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
    this.settingsBack.addEventListener('click', () => {
        this.showScreen('devices')
        this.loadDevices(); // Reload to apply any visibility changes
    });
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

    // Load visible categories (default to all if not set)
    const savedCategories = settings.visibleCategories;
    if (savedCategories && Array.isArray(savedCategories)) {
      this.visibleCategories = new Set(savedCategories);
    } else {
      // If no setting, default to ALL known types
      if (window.DeviceTypes && window.DeviceTypes.DEVICE_TYPES) {
        this.visibleCategories = new Set(Object.keys(window.DeviceTypes.DEVICE_TYPES));
      }
    }
    
    this.renderCategorySettings();
  }

  renderCategorySettings() {
    const container = document.getElementById('category-toggles');
    if (!container) return;
    
    container.innerHTML = '';
    
    // get all known types
    const types = window.DeviceTypes.DEVICE_TYPES;
    
    Object.values(types).forEach(typeDef => {
        const toggle = document.createElement('label');
        toggle.className = 'category-toggle';
        
        const isChecked = this.visibleCategories.has(typeDef.type);
        
        toggle.innerHTML = `
            <span class="category-toggle__label">
                ${typeDef.icon} ${typeDef.label}
            </span>
            <input type="checkbox" value="${typeDef.type}" ${isChecked ? 'checked' : ''}>
        `;
        
        const checkbox = toggle.querySelector('input');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.visibleCategories.add(typeDef.type);
            } else {
                this.visibleCategories.delete(typeDef.type);
            }
            this.saveCategorySettings();
        });
        
        container.appendChild(toggle);
    });
  }

  async saveCategorySettings() {
      const categories = Array.from(this.visibleCategories);
      await window.smartliving.setSetting('visibleCategories', categories);
  }

  async saveToken() {
    const token = this.tokenInput.value.trim();
    if (!token) {
      this.showError('Please enter a valid token');
      return;
    }
    
    await window.smartliving.setToken(token);
    
    // Also re-load settings to ensure defaults are set if needed
    await this.loadSettings();

    this.showScreen('devices');
    this.loadDevices();
    this.loadScenes();
  }

  async loadDevices() {
    try {
      if (this.devices.length === 0) {
        this.devicesList.innerHTML = '';
        this.devicesLoading.classList.remove('hidden');
        this.devicesEmpty.classList.add('hidden');
      }
      
      this.devices = await window.smartliving.getDevices();
      
      this.devicesLoading.classList.add('hidden');
      
      if (this.devices.length === 0) {
        this.devicesEmpty.classList.remove('hidden');
        return;
      }
      
      // Fetch statuses in parallel
      const statusPromises = this.devices.map(async (device) => {
        try {
          return await window.smartliving.getDeviceStatus(device.deviceId);
        } catch (e) {
          console.warn(`Failed to load status for ${device.deviceId}`, e);
          return null;
        }
      });

      const statuses = await Promise.all(statusPromises);
      
      // Assign statuses
      this.devices.forEach((device, index) => {
        device.status = statuses[index];
      });
      
      this.renderDevices();
    } catch (error) {
      console.error('Failed to load devices:', error);
      this.devicesLoading.classList.add('hidden');
      this.showError('Failed to load devices. Check your token.');
    }
  }

  renderDevices() {
    // If list is empty, start fresh
    if (this.devicesList.children.length === 0) {
        this.devicesList.innerHTML = '';
        this.createDeviceListStructure();
        return;
    }

    // Check if we need a full re-render (e.g. category change or device added/removed)
    // For simplicity, if the count makes sense, we try to update.
    // But since we have categories, it's safer to just re-render if structure changes.
    // Let's implement a hybrid approach:
    // 1. If we can find the card, update it.
    // 2. If we can't, re-render everything (fallback).
    
    // For now, let's keep the full render on "loadDevices" but use "updateDeviceCardStatus" for interactions.
    // The user's main pain point is interaction lag.
    
    this.devicesList.innerHTML = '';
    this.createDeviceListStructure();
  }

  createDeviceListStructure() {
    // Group devices by type
    const groupedDevices = {};
    
    for (const device of this.devices) {
        const typeDef = window.DeviceTypes.getDeviceType(device);
        const typeKey = typeDef.type || 'other';
        
        if (!groupedDevices[typeKey]) {
            groupedDevices[typeKey] = {
                def: typeDef,
                devices: []
            };
        }
        groupedDevices[typeKey].devices.push(device);
    }
    
    // Get sorted keys
    const sortedKeys = Object.keys(groupedDevices).sort();
    
    for (const key of sortedKeys) {
        // Init visible categories to ALL if empty (first run edge case protection)
        if (this.visibleCategories.size === 0 && window.DeviceTypes) {
           this.visibleCategories = new Set(Object.keys(window.DeviceTypes.DEVICE_TYPES));
        }

        // Check visibility
        if (this.visibleCategories.size > 0 && !this.visibleCategories.has(key)) {
            continue;
        }

        const group = groupedDevices[key];
        
        // Render Header
        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `${group.def.icon} ${group.def.label} (${group.devices.length})`;
        this.devicesList.appendChild(header);
        
        // Render Devices
        for (const device of group.devices) {
             const card = this.createDeviceCard(device);
             this.devicesList.appendChild(card);
        }
    }
  }

  updateDeviceCardStatus(deviceId, status) {
     const card = document.querySelector(`.device-card[data-device-id="${deviceId}"]`);
     if (!card) return;

     const device = this.devices.find(d => d.deviceId === deviceId);
     if (!device) return;
     
     // Update status object
     device.status = status;
     
     const deviceType = window.DeviceTypes.getDeviceType(device);
     const statusData = deviceType.getStatus(status);
     const statusText = this.formatStatusText(deviceType, statusData);
     const isOn = statusData.isOn;

     // Update Status Text
     const statusEl = card.querySelector('.device-card__status');
     if (statusEl) {
         statusEl.className = `device-card__status ${isOn ? 'device-card__status--on' : ''}`;
         statusEl.textContent = statusText;
     }

     // Update Toggle
     const toggle = card.querySelector('.toggle');
     if (toggle) {
         toggle.classList.toggle('toggle--on', isOn);
     }
     
     // Update Slider
     if (statusData.level !== undefined) {
         const sliderFill = card.querySelector('.brightness-slider__fill');
         if (sliderFill) {
             sliderFill.style.width = `${statusData.level}%`;
         }
     }
     
     // Update Power Stats if open
     if (document.getElementById(`power-${deviceId}`)) {
         const power = status?.components?.main?.powerMeter?.power?.value || 0;
         const energy = status?.components?.main?.energyMeter?.energy?.value || 0;
         
         const powerEl = document.getElementById(`power-${deviceId}`);
         const energyEl = document.getElementById(`energy-${deviceId}`);
         if (powerEl) powerEl.textContent = `${power} W`;
         if (energyEl) energyEl.textContent = `${energy} kWh`;
     }
  }

  createDeviceCard(device) {
    const card = document.createElement('div');
    card.className = 'device-card';
    card.dataset.deviceId = device.deviceId;
    
    // Get device type definition
    const deviceType = window.DeviceTypes.getDeviceType(device);
    const statusData = deviceType.getStatus(device.status);
    
    // Determine visuals
    const icon = deviceType.icon;
    const statusText = this.formatStatusText(deviceType, statusData);
    const isOn = statusData.isOn;
    
    card.innerHTML = `
      <div class="device-card__icon">${icon}</div>
      <div class="device-card__info">
        <div class="device-card__name">${device.label || device.name}</div>
        <div class="device-card__status ${isOn ? 'device-card__status--on' : ''}">
          ${statusText}
        </div>
      </div>
      ${deviceType.controls.includes('toggle') ? `
        <div class="toggle ${isOn ? 'toggle--on' : ''}" data-device-id="${device.deviceId}">
          <div class="toggle__knob"></div>
        </div>
      ` : ''}
    `;

    // Make card expandable if it has hidden controls
    card.addEventListener('click', (e) => {
      // Don't expand if clicking interactive elements
      if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select') || e.target.closest('.toggle')) {
        return;
      }
      
      const wrapper = card.querySelector('.device-controls-wrapper');
      if (wrapper) {
        wrapper.classList.toggle('hidden');
        // Add active state to card
        card.classList.toggle('device-card--expanded');
      }
    });

    // Add controls based on device type
    const infoContainer = card.querySelector('.device-card__info');

    // Thermostat & AC Controls
    if (deviceType.type === 'thermostat' || deviceType.type === 'airConditioner' || deviceType.controls.includes('mode')) {
      const controls = this.createThermostatControls(device, deviceType);
      if (controls) {
        infoContainer.appendChild(controls);
      }
    }
    
    // Brightness Slider
    if (deviceType.controls.includes('brightness') && statusData.level !== undefined) {
      const slider = document.createElement('div');
      slider.className = 'brightness-slider';
      slider.innerHTML = `<div class="brightness-slider__fill" style="width: ${statusData.level}%"></div>`;
      infoContainer.appendChild(slider);
    }
    
    // Power/Stats Button
    if (deviceType.controls.includes('power')) {
       const statsBtn = document.createElement('button');
       statsBtn.className = 'power-btn';
       statsBtn.innerHTML = '<span>📊</span> Live Power';
       statsBtn.onclick = (e) => {
         e.stopPropagation();
         this.toggleStats(device.deviceId, card);
       };
       infoContainer.appendChild(statsBtn);
       
       // Container for the graph
       const graphWrapper = document.createElement('div');
       graphWrapper.className = 'consumption-graph-wrapper hidden';
       graphWrapper.id = `graph-${device.deviceId}`;
       
       graphWrapper.innerHTML = `
         <div class="graph-stats">
            <div class="stat-item">
              <span class="stat-label">Current</span>
              <span class="stat-value" id="power-${device.deviceId}">-- W</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total</span>
              <span class="stat-value" id="energy-${device.deviceId}">${statusData.energy || 0} kWh</span>
            </div>
         </div>
         <canvas id="canvas-${device.deviceId}"></canvas>
       `;
       
       card.appendChild(graphWrapper);
    }
    
    // Toggle event
    const toggle = card.querySelector('.toggle');
    if (toggle) {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        // Fix: Read current state from DOM instead of closure to avoid stale state
        const isCurrentlyOn = toggle.classList.contains('toggle--on');
        this.toggleDevice(device.deviceId, !isCurrentlyOn);
      });
    }
    
    return card;
  }

  formatStatusText(deviceType, status) {
    if (status.temperature !== undefined) return `${status.temperature}°${status.unit || ''}`;
    if (status.humidity !== undefined) return `${status.humidity}%`;
    if (status.motion !== undefined) return status.motion ? 'Motion Detected' : 'No Motion';
    if (status.isOpen !== undefined) return status.isOpen ? 'Open' : 'Closed';
    if (status.isLocked !== undefined) return status.isLocked ? 'Locked' : 'Unlocked';
    if (status.level !== undefined && status.isOn) return `${status.level}%`;
    if (status.isOn !== undefined) return status.isOn ? 'On' : 'Off';
    return '';
  }

  createThermostatControls(device, deviceType) {
    const wrapper = document.createElement('div');
    wrapper.className = 'device-controls-wrapper hidden';
    
    const container = document.createElement('div');
    container.className = 'thermostat-controls';
    wrapper.appendChild(container);

    const mainComponent = device.status?.components?.main;
    
    // Determine Capabilities to use
    const isAC = deviceType.type === 'airConditioner';
    const modeCapability = isAC ? 'airConditionerMode' : 'thermostatMode';
    const modeAttribute = isAC ? 'airConditionerMode' : 'thermostatMode';
    const supportedModesAttribute = isAC ? 'supportedAcModes' : 'supportedThermostatModes';

    const mode = mainComponent?.[modeCapability]?.[modeAttribute]?.value;
    const supportedModes = mainComponent?.[modeCapability]?.[supportedModesAttribute]?.value || [];
    
    // 1. Mode Selector
    if (supportedModes.length > 0 || isAC) {
      const modeSelector = document.createElement('div');
      modeSelector.className = 'mode-selector';
      
      const commonModes = ['off', 'auto', 'cool', 'heat', 'dry', 'fan', 'eco'];
      
      const modesToShow = commonModes.filter(m => 
        supportedModes.some(sm => sm.toLowerCase() === m) || 
        (isAC && m === 'eco')
      );
      
      modesToShow.forEach(m => {
        const btn = document.createElement('button');
        btn.className = `mode-btn mode-btn--${m} ${mode === m ? 'mode-btn--active' : ''}`;
        btn.textContent = m.charAt(0).toUpperCase() + m.slice(1);
        btn.onclick = (e) => {
          e.stopPropagation();
          // Optimistic Update
          modeSelector.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('mode-btn--active'));
          btn.classList.add('mode-btn--active');
          
          const cmd = isAC ? 'setAirConditionerMode' : 'setThermostatMode';
          this.executeCommand(device.deviceId, modeCapability, cmd, [m]);
        };
        modeSelector.appendChild(btn);
      });
      container.appendChild(modeSelector);
    }

    // 2. Temperature Slider (if applicable)
    let targetSetpoint = null;
    let setpointCapability = null;
    let setpointCommand = null;

    if (mode === 'cool' || (isAC && mode !== 'off')) {
      targetSetpoint = mainComponent?.thermostatCoolingSetpoint?.coolingSetpoint?.value;
      setpointCapability = 'thermostatCoolingSetpoint';
      setpointCommand = 'setCoolingSetpoint';
    } else if (mode === 'heat') {
      targetSetpoint = mainComponent?.thermostatHeatingSetpoint?.heatingSetpoint?.value;
      setpointCapability = 'thermostatHeatingSetpoint';
      setpointCommand = 'setHeatingSetpoint';
    }

    if (targetSetpoint !== null && targetSetpoint !== undefined) {
      const sliderContainer = document.createElement('div');
      sliderContainer.className = 'temp-slider-container';
      
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.className = 'temp-slider';
      slider.min = 16;
      slider.max = 30;
      slider.step = 1;
      slider.value = targetSetpoint;
      
      const valueDisplay = document.createElement('span');
      valueDisplay.className = 'temp-value';
      valueDisplay.textContent = `${targetSetpoint}°`;
      
      slider.addEventListener('input', (e) => {
        valueDisplay.textContent = `${e.target.value}°`;
      });
      
      slider.addEventListener('change', (e) => {
         this.executeCommand(device.deviceId, setpointCapability, setpointCommand, [parseFloat(e.target.value)]);
      });
      
      slider.addEventListener('click', (e) => e.stopPropagation());

      sliderContainer.appendChild(slider);
      sliderContainer.appendChild(valueDisplay);
      container.appendChild(sliderContainer);
    }

    // 3. Fan Speed (AC Only)
    if (isAC && deviceType.controls.includes('fanSpeed')) {
      const fanSpeedFn = document.createElement('div');
      fanSpeedFn.className = 'fan-control';
      
      const currentFanMode = mainComponent?.fanSpeed?.fanSpeed?.value || 'auto'; 
      const speeds = ['auto', 'low', 'medium', 'high', 'turbo'];
      
      const select = document.createElement('select');
      select.className = 'fan-select';
      select.onclick = (e) => e.stopPropagation();
      select.onchange = (e) => {
         this.executeCommand(device.deviceId, 'fanSpeed', 'setFanSpeed', [e.target.value]);
      };

      speeds.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = `Fan: ${s.charAt(0).toUpperCase() + s.slice(1)}`;
        if (s === currentFanMode) opt.selected = true;
        select.appendChild(opt);
      });
      
      fanSpeedFn.appendChild(select);
      container.appendChild(fanSpeedFn);
    }

    // 4. Swing Mode (AC Only)
    if (isAC && deviceType.controls.includes('swing')) {
       const oscillationCap = mainComponent?.fanOscillationMode;
       const swingMode = oscillationCap?.fanOscillationMode?.value;
       const supportedSwing = oscillationCap?.supportedFanOscillationModes?.value || [];
       
       const isSwinging = swingMode !== 'fixed' && swingMode !== 'stop';
       
       const swingBtn = document.createElement('button');
       swingBtn.className = `swing-btn ${isSwinging ? 'swing-btn--active' : ''}`;
       swingBtn.textContent = isSwinging ? 'Swing On' : 'Swing Off';
       
       swingBtn.onclick = (e) => {
         e.stopPropagation();
         
         // Optimistic Update
         const likelyNewState = !swingBtn.classList.contains('swing-btn--active');
         swingBtn.classList.toggle('swing-btn--active', likelyNewState);
         swingBtn.textContent = likelyNewState ? 'Swing On' : 'Swing Off';
         
         // Determine best "ON" mode
         let targetOn = 'all';
         if (supportedSwing.length > 0) {
             if (supportedSwing.includes('all')) targetOn = 'all';
             else if (supportedSwing.includes('vertical')) targetOn = 'vertical';
             else if (supportedSwing.includes('horizontal')) targetOn = 'horizontal';
         }
         
         // Determine best "OFF" mode
         let targetOff = 'fixed';
         if (supportedSwing.length > 0) {
            if (supportedSwing.includes('fixed')) targetOff = 'fixed';
            else if (supportedSwing.includes('stop')) targetOff = 'stop';
            else if (supportedSwing.includes('off')) targetOff = 'off';
         }

         const newMode = isSwinging ? targetOff : targetOn;
         this.executeCommand(device.deviceId, 'fanOscillationMode', 'setFanOscillationMode', [newMode]);
       };
       container.appendChild(swingBtn);
    }

    // 5. WindFree Mode (AC Only)
    if (isAC) {
      let windFreeConfig = null;
      
      // Check custom optional mode (Preferred)
      const optionalModeCap = mainComponent?.['custom.airConditionerOptionalMode'];
      let windFreeOptional = null;
      
      if (optionalModeCap) {
        const supported = optionalModeCap.supportedAcOptionalModes?.value;
        if (supported) {
           windFreeOptional = supported.find(m => m.toLowerCase() === 'windfree');
        } else {
           windFreeOptional = 'windFree';
        }
      }
      
      // Check fan mode (Alternative)
      const fanModeCap = mainComponent?.airConditionerFanMode;
      const supportedFanModes = fanModeCap?.supportedAcFanModes?.value || [];
      const windFreeFan = supportedFanModes.find(m => m.toLowerCase() === 'windfree');

      if (windFreeOptional) {
        windFreeConfig = {
          type: 'optional',
          value: windFreeOptional,
          active: optionalModeCap?.acOptionalMode?.value === windFreeOptional
        };
      } else if (windFreeFan) {
        windFreeConfig = {
          type: 'fan',
          value: windFreeFan,
          active: fanModeCap?.fanMode?.value === windFreeFan
        };
      }

      if (windFreeConfig) {
        const windFreeBtn = document.createElement('button');
        windFreeBtn.className = `action-btn ${windFreeConfig.active ? 'action-btn--active' : ''}`;
        windFreeBtn.textContent = 'WindFree';
        windFreeBtn.onclick = async (e) => {
          e.stopPropagation();

          // Optimistic Update
          const likelyNewState = !windFreeBtn.classList.contains('action-btn--active');
          windFreeBtn.classList.toggle('action-btn--active', likelyNewState);
          
          // Try smart switching, but don't block WindFree toggle if it fails
          if (!windFreeConfig.active) {
             try {
                 const currentMode = mainComponent?.[modeCapability]?.[modeAttribute]?.value;
                 const isCompatibleMode = currentMode === 'cool' || currentMode === 'heat';
                 
                 if (!isCompatibleMode) {
                    const currentTemp = mainComponent?.temperatureMeasurement?.temperature?.value;
                    const setpoint = mainComponent?.thermostatCoolingSetpoint?.coolingSetpoint?.value || 24;
                    const hasHeat = supportedModes.includes('heat');
                    
                    let targetMode = 'cool';
                    if (hasHeat && currentTemp < setpoint) {
                       targetMode = 'heat';
                    }
    
                    const cmd = isAC ? 'setAirConditionerMode' : 'setThermostatMode';
                    await this.executeCommand(device.deviceId, modeCapability, cmd, [targetMode]);
                    // Short delay to ensure command registers
                    await new Promise(r => setTimeout(r, 500));
                 }
             } catch (err) {
                 console.warn("Smart Switch failed, proceeding to toggle WindFree anyway:", err);
             }
          }

          if (windFreeConfig.type === 'optional') {
            const newMode = windFreeConfig.active ? 'off' : windFreeConfig.value;
            this.executeCommand(device.deviceId, 'custom.airConditionerOptionalMode', 'setAcOptionalMode', [newMode]);
          } else {
            const newMode = windFreeConfig.active ? 'auto' : windFreeConfig.value;
            this.executeCommand(device.deviceId, 'airConditionerFanMode', 'setFanMode', [newMode]);
          }
        };
        container.appendChild(windFreeBtn);
      }
   }



    // 6. Advanced Settings (AC Only)
    // Check for "advanced" capabilities that we support explicitly
    const hasAdvanced = 
        mainComponent?.['samsungce.airConditionerLighting'] ||
        mainComponent?.['samsungce.autoCleaningMode'] ||
        mainComponent?.['custom.spiMode'];
        
    if (isAC && hasAdvanced) {
        const advancedSection = document.createElement('div');
        advancedSection.className = 'advanced-settings-section';
        
        const advancedHeader = document.createElement('div');
        advancedHeader.className = 'advanced-settings-header';
        advancedHeader.textContent = 'Advanced Options';
        advancedHeader.onclick = (e) => {
             e.stopPropagation();
             advancedSection.classList.toggle('expanded');
        };
        advancedSection.appendChild(advancedHeader);

        const advancedContent = document.createElement('div');
        advancedContent.className = 'advanced-settings-content';
        
        // Lighting
        if (mainComponent?.['samsungce.airConditionerLighting']) {
            const lightingOn = mainComponent['samsungce.airConditionerLighting'].lighting?.value === 'on';
            const item = this.createToggleRow('Display Light', lightingOn, (newState) => {
                 this.executeCommand(device.deviceId, 'samsungce.airConditionerLighting', 'setLighting', [newState ? 'on' : 'off']);
            });
            advancedContent.appendChild(item);
        }
        
        // Auto Clean
        if (mainComponent?.['samsungce.autoCleaningMode']) {
            const autoCleanOn = mainComponent['samsungce.autoCleaningMode'].autoCleaningMode?.value === 'on';
             const item = this.createToggleRow('Auto Clean', autoCleanOn, (newState) => {
                 this.executeCommand(device.deviceId, 'samsungce.autoCleaningMode', 'setAutoCleaningMode', [newState ? 'on' : 'off']);
            });
            advancedContent.appendChild(item);
        }
        
        // SPI Mode (Virus Doctor)
        if (mainComponent?.['custom.spiMode']) {
            const spiOn = mainComponent['custom.spiMode'].spiMode?.value === 'on';
             const item = this.createToggleRow('Virus Doctor (SPI)', spiOn, (newState) => {
                 this.executeCommand(device.deviceId, 'custom.spiMode', 'setSpiMode', [newState ? 'on' : 'off']);
            });
             advancedContent.appendChild(item);
        }

        advancedSection.appendChild(advancedContent);
        container.appendChild(advancedSection);
    }

    return wrapper;
  }
  
  createToggleRow(label, isOn, onChange) {
      const row = document.createElement('div');
      row.className = 'advanced-toggle-row';
      
      const labelEl = document.createElement('span');
      labelEl.textContent = label;
      
      const toggle = document.createElement('div');
      toggle.className = `toggle toggle--small ${isOn ? 'toggle--on' : ''}`;
      toggle.innerHTML = '<div class="toggle__knob"></div>';
      
      row.appendChild(labelEl);
      row.appendChild(toggle);
      
      // Make whole row clickable for better UX
      row.onclick = (e) => {
          e.stopPropagation();
          const newState = !toggle.classList.contains('toggle--on');
          toggle.classList.toggle('toggle--on', newState);
          onChange(newState);
      };

      return row;
  }

  async executeCommand(deviceId, capability, command, args) {
      try {
        await window.smartliving.executeCommand(deviceId, capability, command, args);
        
        // Short delay for propagation (reduced from 2000ms to 250ms for better UX)
        await new Promise(resolve => setTimeout(resolve, 250));
        
        // targeted refresh
        const status = await window.smartliving.getDeviceStatus(deviceId);
        this.updateDeviceCardStatus(deviceId, status);
        
        // Update internal state
        const device = this.devices.find(d => d.deviceId === deviceId);
        if (device) {
            device.status = status;
        }
      } catch (error) {
        console.error(`Failed to execute ${command}:`, error);
        this.showError(`Failed to set ${command}`);
        // If it failed, we should probably revert the UI state here by reloading the OLD status
        // But for now, simply re-fetching current status (which might still be old) is safer than doing nothing
        try {
             const status = await window.smartliving.getDeviceStatus(deviceId);
             this.updateDeviceCardStatus(deviceId, status);
        } catch (e) { console.error("Recovery fetch failed", e); }
      }
  }

  async setThermostatMode(deviceId, mode) {
      this.executeCommand(deviceId, 'thermostatMode', 'setThermostatMode', [mode]);
  }

  async toggleDevice(deviceId, state) {
    // Optimistic update
    const card = document.querySelector(`.device-card[data-device-id="${deviceId}"]`);
    if (card) {
      const toggle = card.querySelector('.toggle');
      if (toggle) toggle.classList.toggle('toggle--on', state);
      
      const status = card.querySelector('.device-card__status');
      if (status) {
          status.classList.toggle('device-card__status--on', state);
          status.textContent = state ? 'On' : 'Off';
      }
    }

    // Use centralized executeCommand which includes delay and refresh
    await this.executeCommand(deviceId, 'switch', state ? 'on' : 'off', []);
  }

  async toggleStats(deviceId, card) {
    const graphWrapper = document.getElementById(`graph-${deviceId}`);
    if (!graphWrapper) return;
    
    const isHidden = graphWrapper.classList.contains('hidden');
    
    if (isHidden) {
      graphWrapper.classList.remove('hidden');
      card.classList.add('device-card--expanded');
      this.initChart(deviceId);
    } else {
      graphWrapper.classList.add('hidden');
      this.cleanupChart(deviceId);
    }
  }

  initChart(deviceId) {
    if (this.activeCharts.has(deviceId)) return;

    const ctx = document.getElementById(`canvas-${deviceId}`).getContext('2d');
    
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Power (W)',
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          data: [],
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: { display: false },
          y: { 
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });

    const interval = setInterval(() => this.updateChart(deviceId, chart), 3000);
    this.activeCharts.set(deviceId, { chart, interval });
    
    this.updateChart(deviceId, chart);
  }
  
  async updateChart(deviceId, chart) {
    try {
      const status = await window.smartliving.getDeviceStatus(deviceId);
      
      const power = status?.components?.main?.powerMeter?.power?.value || 0;
      const energy = status?.components?.main?.energyMeter?.energy?.value || 0;
      
      const powerEl = document.getElementById(`power-${deviceId}`);
      const energyEl = document.getElementById(`energy-${deviceId}`);
      if (powerEl) powerEl.textContent = `${power} W`;
      if (energyEl) energyEl.textContent = `${energy} kWh`;

      const now = new Date();
      const timeLabel = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
      
      chart.data.labels.push(timeLabel);
      chart.data.datasets[0].data.push(power);
      
      if (chart.data.labels.length > 20) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
      }
      
      chart.update();
      
    } catch (e) {
      console.error('Failed to update chart', e);
    }
  }

  cleanupChart(deviceId) {
    if (this.activeCharts.has(deviceId)) {
      const { chart, interval } = this.activeCharts.get(deviceId);
      clearInterval(interval);
      chart.destroy();
      this.activeCharts.delete(deviceId);
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
      setTimeout(() => this.loadDevices(), 1000);
    } catch (error) {
      console.error('Failed to execute scene:', error);
      this.showError('Failed to run scene');
    }
  }

  showError(message) {
    console.error(message);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new SmartLivingApp();
});
